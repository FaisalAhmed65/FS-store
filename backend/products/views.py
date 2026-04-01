from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Product
from .serializers import ProductListSerializer, ProductDetailSerializer, ProductWriteSerializer


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = (permissions.AllowAny,)
    lookup_field = "slug"
    filter_backends = (DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter)
    filterset_fields = ("category", "seller", "status", "is_featured", "is_deal",
                        "is_new_arrival", "is_bestseller", "is_published")
    search_fields = ("name", "name_bn", "sku", "description")
    ordering_fields = ("price", "rating_avg", "created_at", "name")

    def get_queryset(self):
        qs = Product.objects.filter(is_published=True, status=Product.STATUS_APPROVED)
        # Category filter
        cat_slug = self.request.query_params.get("category_slug")
        if cat_slug:
            qs = qs.filter(category__slug=cat_slug)
        # Price range
        min_price = self.request.query_params.get("min_price")
        max_price = self.request.query_params.get("max_price")
        if min_price:
            qs = qs.filter(price__gte=min_price)
        if max_price:
            qs = qs.filter(price__lte=max_price)
        return qs

    def get_serializer_class(self):
        if self.action == "retrieve":
            return ProductDetailSerializer
        return ProductListSerializer

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
