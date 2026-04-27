from django.db.models import Q
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from products.models import Product
from .models import PricelistOffer
from .pricing import price_cart
from .serializers import OfferSerializer, PriceCartPreviewSerializer


class OfferListView(generics.ListAPIView):
    serializer_class = OfferSerializer
    permission_classes = (permissions.AllowAny,)

    def get_queryset(self):
        from .pricing import active_offer_queryset

        qs = active_offer_queryset(coupon_code=self.request.query_params.get("coupon_code"))
        product_id = self.request.query_params.get("product_id")
        seller_id = self.request.query_params.get("seller_id")
        category_id = self.request.query_params.get("category_id")
        if product_id:
            qs = qs.filter(Q(product_id=product_id) | Q(scope=PricelistOffer.SCOPE_CART))
        if seller_id:
            qs = qs.filter(Q(seller_id=seller_id) | Q(scope=PricelistOffer.SCOPE_CART))
        if category_id:
            qs = qs.filter(Q(category_id=category_id) | Q(scope=PricelistOffer.SCOPE_CART))
        return qs.distinct()


class PriceCartPreviewView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        serializer = PriceCartPreviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        items = serializer.validated_data["items"]
        coupon_code = serializer.validated_data.get("coupon_code", "")
        product_ids = [item["product"] for item in items]
        products = {
            product.id: product
            for product in Product.objects.select_related("category", "seller").filter(id__in=product_ids)
        }
        missing = [product_id for product_id in product_ids if product_id not in products]
        if missing:
            return Response({"error": f"Unknown product id(s): {missing}"}, status=status.HTTP_400_BAD_REQUEST)

        pricing = price_cart(
            [{"product": products[item["product"]], "quantity": item["quantity"]} for item in items],
            coupon_code=coupon_code,
        )
        response_items = []
        for item in pricing["items"]:
            product = item["product"]
            response_items.append(
                {
                    "product": product.id,
                    "product_name": product.name,
                    "quantity": item["quantity"],
                    "original_unit_price": str(item["original_unit_price"]),
                    "unit_price": str(item["unit_price"]),
                    "discount_amount": str(item["discount_amount"]),
                    "subtotal": str(item["subtotal"]),
                    "applied_discount": item["applied_discount"],
                }
            )
        return Response(
            {
                "items": response_items,
                "subtotal": str(pricing["subtotal"]),
                "line_discount_total": str(pricing["line_discount_total"]),
                "cart_discount_total": str(pricing["cart_discount_total"]),
                "discount_total": str(pricing["discount_total"]),
                "total": str(pricing["total"]),
                "coupon_code": pricing["coupon_code"],
                "coupon_applied": pricing["coupon_applied"],
                "applied_discounts": pricing["applied_discounts"],
            }
        )
