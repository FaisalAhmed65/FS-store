from rest_framework import serializers
from .models import ProductReview


class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ProductReview
        fields = ("id", "product", "partner_name", "rating", "title", "body",
                  "is_approved", "created_at")
        read_only_fields = ("id", "is_approved", "created_at")


class ReviewCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ProductReview
        fields = ("product", "partner_name", "rating", "title", "body")
