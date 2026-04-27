from rest_framework import serializers
from .models import PricelistOffer


class OfferSerializer(serializers.ModelSerializer):
    class Meta:
        model  = PricelistOffer
        fields = ("id", "name", "campaign_name", "scope", "product", "category",
                  "seller", "coupon_code", "min_qty", "min_order_total",
                  "discount_type", "discount_value", "max_discount_amount",
                  "priority", "is_active", "valid_from", "valid_to")


class PriceCartItemSerializer(serializers.Serializer):
    product = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)


class PriceCartPreviewSerializer(serializers.Serializer):
    items = PriceCartItemSerializer(many=True)
    coupon_code = serializers.CharField(required=False, allow_blank=True, max_length=64)
