from decimal import Decimal, InvalidOperation

from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from categories.models import Category
from .models import Product
from .recommendations import (
    clamp_limit,
    customers_also_bought,
    parse_product_ids,
    ranked_recommendations,
    recommendation_payload,
    seller_best_products,
    similar_products,
    trending_in_category,
)
from .serializers import ProductListSerializer, ProductDetailSerializer
from .search import facets_for_products, ranked_products


def decimal_param(value):
    if value in (None, ""):
        return None
    try:
        return Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError):
        return None


def category_with_descendants(category):
    ids = []
    frontier = [category.id]
    while frontier:
        ids.extend(frontier)
        frontier = list(
            Category.objects.filter(is_published=True, parent_id__in=frontier)
            .values_list("id", flat=True)
        )
    return ids


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = (permissions.AllowAny,)
    lookup_field = "slug"
    filter_backends = (DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter)
    filterset_fields = ("category", "seller", "brand", "status", "is_featured", "is_deal",
                        "is_new_arrival", "is_bestseller", "is_free_delivery", "is_published")
    search_fields = ("name", "name_bn", "brand", "sku", "description", "description_bn",
                     "category__name", "category__name_bn", "seller__business_name")
    ordering_fields = ("price", "rating_avg", "created_at", "name", "sold_recently", "stock_quantity")

    def get_queryset(self):
        qs = Product.objects.select_related("category", "seller").prefetch_related("images").filter(
            is_published=True,
            status=Product.STATUS_APPROVED,
        )
        # Category filter
        cat_slug = self.request.query_params.get("category_slug")
        if cat_slug:
            category_filter = Q(slug=cat_slug)
            if str(cat_slug).isdigit():
                category_filter |= Q(pk=cat_slug)
            category = Category.objects.filter(is_published=True).filter(category_filter).first()
            if category:
                qs = qs.filter(category_id__in=category_with_descendants(category))
            else:
                qs = qs.none()
        # Price range
        min_price = decimal_param(self.request.query_params.get("min_price"))
        max_price = decimal_param(self.request.query_params.get("max_price"))
        if min_price is not None:
            qs = qs.filter(price__gte=min_price)
        if max_price is not None:
            qs = qs.filter(price__lte=max_price)
        # Rating threshold from storefront filters.
        rating = decimal_param(self.request.query_params.get("rating"))
        if rating is not None:
            qs = qs.filter(rating_avg__gte=rating)
        brand = self.request.query_params.get("brand")
        if brand:
            qs = qs.filter(brand__iexact=brand)
        seller_id = self.request.query_params.get("seller_id") or self.request.query_params.get("seller")
        if seller_id:
            qs = qs.filter(seller_id=seller_id)
        # Express means products that support express, including "both".
        delivery_type = self.request.query_params.get("delivery_type")
        if delivery_type == Product.DELIVERY_EXPRESS:
            qs = qs.filter(delivery_type__in=(Product.DELIVERY_EXPRESS, Product.DELIVERY_BOTH))
        elif delivery_type == Product.DELIVERY_NORMAL:
            qs = qs.filter(delivery_type__in=(Product.DELIVERY_NORMAL, Product.DELIVERY_BOTH))
        ordering = self.request.query_params.get("ordering")
        if ordering in (None, "", "smart", "ml"):
            qs = ranked_products(qs)
        return qs

    def get_object(self):
        lookup = self.kwargs.get(self.lookup_field)
        queryset = self.filter_queryset(self.get_queryset())
        obj = queryset.filter(slug=lookup).first()
        if obj is None and str(lookup).isdigit():
            obj = get_object_or_404(queryset, pk=lookup)
        elif obj is None:
            obj = get_object_or_404(queryset, slug=lookup)
        self.check_object_permissions(self.request, obj)
        return obj

    def get_serializer_class(self):
        if self.action == "retrieve":
            return ProductDetailSerializer
        return ProductListSerializer

    @action(detail=False, url_path="search")
    def advanced_search(self, request):
        query = request.query_params.get("q") or request.query_params.get("search") or ""
        results = ranked_products(self.get_queryset(), query=query)
        facets = facets_for_products(results)
        page = self.paginate_queryset(results)
        if page is not None:
            serializer = ProductListSerializer(page, many=True, context={"request": request})
            response = self.get_paginated_response(serializer.data)
            response.data["query"] = query
            response.data["facets"] = facets
            response.data["ranking"] = {
                "primary": "full_text_plus_typo_tolerance",
                "signals": ["sales", "rating", "stock", "freshness"],
            }
            return response
        serializer = ProductListSerializer(results, many=True, context={"request": request})
        return Response({
            "query": query,
            "count": len(results),
            "results": serializer.data,
            "facets": facets,
            "ranking": {
                "primary": "full_text_plus_typo_tolerance",
                "signals": ["sales", "rating", "stock", "freshness"],
            },
        })

    @action(detail=False, url_path="recommendations")
    def recommendations(self, request):
        limit = clamp_limit(request.query_params.get("limit"), default=12)
        cart_product_ids = parse_product_ids(request.query_params.get("cart_product_ids"))
        source_product_ids = parse_product_ids(request.query_params.get("product_ids"))
        products = ranked_recommendations(
            user=request.user,
            source_product_ids=source_product_ids,
            cart_product_ids=cart_product_ids,
            limit=limit,
        )
        serializer = ProductListSerializer(products, many=True, context={"request": request})
        return Response({
            "strategy": "hybrid_local_recommendations",
            "signals": [
                "purchase_history",
                "wishlist",
                "cart",
                "co_purchase",
                "content_similarity",
                "sales",
                "rating",
                "stock",
                "freshness",
            ],
            "count": len(products),
            "meta": recommendation_payload(products),
            "results": serializer.data,
        })

    @action(detail=True, url_path="similar")
    def similar(self, request, slug=None):
        product = self.get_object()
        limit = clamp_limit(request.query_params.get("limit"), default=12)
        products = similar_products(product, limit=limit)
        serializer = ProductListSerializer(products, many=True, context={"request": request})
        return Response({
            "strategy": "content_similarity_with_popularity",
            "source_product": product.id,
            "count": len(products),
            "meta": recommendation_payload(products),
            "results": serializer.data,
        })

    @action(detail=True, url_path="customers-also-bought")
    def customers_also_bought(self, request, slug=None):
        product = self.get_object()
        limit = clamp_limit(request.query_params.get("limit"), default=12)
        products = customers_also_bought(product, limit=limit)
        serializer = ProductListSerializer(products, many=True, context={"request": request})
        return Response({
            "strategy": "co_purchase_with_similarity_fallback",
            "source_product": product.id,
            "count": len(products),
            "meta": recommendation_payload(products),
            "results": serializer.data,
        })

    @action(detail=True, url_path="trending-in-category")
    def trending_in_category(self, request, slug=None):
        product = self.get_object()
        limit = clamp_limit(request.query_params.get("limit"), default=12)
        products = trending_in_category(product, limit=limit)
        serializer = ProductListSerializer(products, many=True, context={"request": request})
        return Response({
            "strategy": "category_trending_rank",
            "source_product": product.id,
            "category": product.category_id,
            "count": len(products),
            "meta": recommendation_payload(products),
            "results": serializer.data,
        })

    @action(detail=True, url_path="seller-best-products")
    def seller_best_products(self, request, slug=None):
        product = self.get_object()
        limit = clamp_limit(request.query_params.get("limit"), default=12)
        products = seller_best_products(product, limit=limit)
        serializer = ProductListSerializer(products, many=True, context={"request": request})
        return Response({
            "strategy": "seller_best_products",
            "source_product": product.id,
            "seller": product.seller_id,
            "count": len(products),
            "meta": recommendation_payload(products),
            "results": serializer.data,
        })

    @action(detail=False, url_path="featured")
    def featured(self, request):
        qs = self.get_queryset().filter(is_featured=True)[:24]
        return Response(ProductListSerializer(qs, many=True, context={"request": request}).data)

    @action(detail=False, url_path="deals")
    def deals(self, request):
        qs = self.get_queryset().filter(is_deal=True).order_by("-deal_discount_pct")[:24]
        return Response(ProductListSerializer(qs, many=True, context={"request": request}).data)

    @action(detail=False, url_path="new-arrivals")
    def new_arrivals(self, request):
        qs = self.get_queryset().filter(is_new_arrival=True).order_by("-created_at")[:24]
        return Response(ProductListSerializer(qs, many=True, context={"request": request}).data)

    @action(detail=False, url_path="bestsellers")
    def bestsellers(self, request):
        qs = self.get_queryset().filter(is_bestseller=True)[:24]
        return Response(ProductListSerializer(qs, many=True, context={"request": request}).data)

    @action(detail=False, url_path="free-delivery")
    def free_delivery(self, request):
        qs = self.get_queryset().filter(is_free_delivery=True)[:24]
        return Response(ProductListSerializer(qs, many=True, context={"request": request}).data)
