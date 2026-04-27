from rest_framework import serializers

from .models import Order, OrderItem, SellerDelivery, StockReservation
from .services import create_reserved_order


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = (
            "id",
            "product",
            "product_name",
            "product_image",
            "quantity",
            "unit_price",
            "original_unit_price",
            "discount_amount",
            "subtotal",
        )
        read_only_fields = fields


class StockReservationSerializer(serializers.ModelSerializer):
    class Meta:
        model = StockReservation
        fields = ("id", "product", "quantity", "status", "expires_at", "reason")
        read_only_fields = fields


class OrderCreateItemSerializer(serializers.Serializer):
    product = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)
    price = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)


class OrderCreateSerializer(serializers.ModelSerializer):
    items = OrderCreateItemSerializer(many=True)
    coupon_code = serializers.CharField(required=False, allow_blank=True, max_length=64)

    class Meta:
        model = Order
        fields = (
            "customer_name",
            "customer_email",
            "customer_phone",
            "shipping_name",
            "shipping_street",
            "shipping_city",
            "shipping_country",
            "shipping_zip",
            "shipping_phone",
            "coupon_code",
            "notes",
            "items",
        )
        extra_kwargs = {
            "customer_name": {"required": False, "allow_blank": True},
            "customer_email": {"required": False, "allow_blank": True},
            "customer_phone": {"required": False, "allow_blank": True},
            "shipping_country": {"required": False},
            "shipping_zip": {"required": False, "allow_blank": True},
            "shipping_phone": {"required": False, "allow_blank": True},
            "notes": {"required": False, "allow_blank": True},
        }

    def create(self, validated_data):
        items_data = validated_data.pop("items")
        coupon_code = validated_data.pop("coupon_code", "")
        return create_reserved_order(
            order_data=validated_data,
            raw_items=items_data,
            coupon_code=coupon_code,
        )


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    stock_reservations = StockReservationSerializer(many=True, read_only=True)
    pricing_summary = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = (
            "id",
            "customer_name",
            "customer_email",
            "customer_phone",
            "shipping_name",
            "shipping_street",
            "shipping_city",
            "shipping_country",
            "shipping_zip",
            "shipping_phone",
            "status",
            "subtotal_price",
            "discount_total",
            "total_price",
            "coupon_code",
            "reservation_expires_at",
            "paid_at",
            "cancelled_at",
            "refunded_at",
            "notes",
            "items",
            "stock_reservations",
            "pricing_summary",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields

    def get_pricing_summary(self, obj):
        if hasattr(obj, "pricing_summary"):
            return obj.pricing_summary
        return {
            "subtotal": str(obj.subtotal_price),
            "discount_total": str(obj.discount_total),
            "total": str(obj.total_price),
            "coupon_code": obj.coupon_code,
        }


class SellerDeliverySerializer(serializers.ModelSerializer):
    class Meta:
        model = SellerDelivery
        fields = ("id", "order", "seller", "delivery_status", "tracking_number", "notes", "updated_at")
        read_only_fields = ("id", "order", "seller", "updated_at")
