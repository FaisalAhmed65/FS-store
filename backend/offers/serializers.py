from rest_framework import serializers
from .models import PricelistOffer


class OfferSerializer(serializers.ModelSerializer):
    class Meta:
        model  = PricelistOffer
        fields = ("id", "name", "product", "category", "min_qty",
                  "discount_type", "discount_value", "is_active",
                  "valid_from", "valid_to")
