from rest_framework import serializers
from .models import Product, ProductImage, ProductAttribute
from categories.serializers import CategorySerializer
from sellers.serializers import SellerPublicSerializer


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ProductImage
        fields = ("id", "image", "sort_order", "is_main")


class ProductAttributeSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ProductAttribute
        fields = ("id", "name", "value")


class ProductListSerializer(serializers.ModelSerializer):
    discount_pct = serializers.ReadOnlyField()
    image = serializers.SerializerMethodField()
    category_name = serializers.CharField(source="category.name", read_only=True)
    category_slug = serializers.CharField(source="category.slug", read_only=True)

    def get_image(self, obj):
        image = obj.image or obj.images.filter(is_main=True).first() or obj.images.first()
        if not image:
            return None
        image_file = image if obj.image else image.image
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(image_file.url)
        return image_file.url

    class Meta:
        model  = Product
        fields = ("id", "name", "name_bn", "slug", "image", "price", "compare_price",
                  "category_name", "category_slug",
                  "discount_pct", "get_in", "get_in_bn",
                  "is_free_delivery", "delivery_type",
                  "rating_avg", "rating_count", "stock_quantity",
                  "is_deal", "is_featured", "is_new_arrival", "is_bestseller",
                  "deal_discount_pct", "deal_end_date",
                  "sold_recently", "category_rank", "category_rank_display")


class ProductDetailSerializer(serializers.ModelSerializer):
    images     = ProductImageSerializer(many=True, read_only=True)
    attributes = ProductAttributeSerializer(many=True, read_only=True)
    category   = CategorySerializer(read_only=True)
    seller     = SellerPublicSerializer(read_only=True)
    discount_pct = serializers.ReadOnlyField()
    image = serializers.SerializerMethodField()
    category_name = serializers.CharField(source="category.name", read_only=True)
    category_slug = serializers.CharField(source="category.slug", read_only=True)

    def get_image(self, obj):
        image = obj.image or obj.images.filter(is_main=True).first() or obj.images.first()
        if not image:
            return None
        image_file = image if obj.image else image.image
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(image_file.url)
        return image_file.url

    class Meta:
        model  = Product
        fields = ("id", "name", "name_bn", "slug", "description", "description_bn",
                  "get_in", "get_in_bn", "image", "images", "attributes",
                  "price", "compare_price", "discount_pct",
                  "category", "category_name", "category_slug", "seller", "status", "is_published",
                  "is_free_delivery", "delivery_type",
                  "normal_delivery_charge", "express_delivery_charge",
                  "stock_quantity", "sku",
                  "rating_avg", "rating_count",
                  "is_deal", "is_featured", "is_new_arrival", "is_bestseller",
                  "deal_discount_pct", "deal_end_date",
                  "sold_recently", "category_rank", "category_rank_display",
                  "created_at", "updated_at")


class ProductWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Product
        fields = ("name", "name_bn", "description", "description_bn",
                  "get_in", "get_in_bn", "image",
                  "price", "compare_price",
                  "category", "delivery_type",
                  "normal_delivery_charge", "express_delivery_charge",
                  "stock_quantity", "sku",
                  "deal_discount_pct", "deal_end_date",
                  "is_deal", "is_new_arrival", "is_bestseller")
