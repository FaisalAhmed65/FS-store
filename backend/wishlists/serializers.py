from rest_framework import serializers
from .models import WishlistList, WishlistItem
from products.serializers import ProductListSerializer


class WishlistItemSerializer(serializers.ModelSerializer):
    product_detail = ProductListSerializer(source="product", read_only=True)

    class Meta:
        model  = WishlistItem
        fields = ("id", "product", "product_detail", "created_at")
        read_only_fields = ("id", "created_at")


class WishlistSerializer(serializers.ModelSerializer):
    items = WishlistItemSerializer(many=True, read_only=True)

    class Meta:
        model  = WishlistList
        fields = ("id", "name", "items", "created_at")


class WishlistListSerializer(serializers.ModelSerializer):
    class Meta:
        model  = WishlistList
        fields = ("id", "name", "created_at")
