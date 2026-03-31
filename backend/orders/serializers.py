from rest_framework import serializers
from .models import Order, OrderItem, SellerDelivery


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model  = OrderItem
        fields = ("id", "product", "product_name", "product_image",
                  "quantity", "unit_price", "subtotal")


class OrderCreateSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)

    class Meta:
        model  = Order
        fields = ("customer_name", "customer_email", "customer_phone",
                  "shipping_name", "shipping_street", "shipping_city",
                  "shipping_country", "shipping_zip", "shipping_phone",
                  "notes", "items")

    def create(self, validated_data):
        items_data = validated_data.pop("items")
        order = Order.objects.create(**validated_data)
        total = 0
        for item_data in items_data:
            item = OrderItem.objects.create(order=order, **item_data)
            total += item.subtotal
        order.total_price = total
        order.save()
        return order


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model  = Order
        fields = ("id", "customer_name", "customer_email", "customer_phone",
                  "shipping_name", "shipping_street", "shipping_city",
                  "shipping_country", "status", "total_price",
                  "notes", "items", "created_at")


class SellerDeliverySerializer(serializers.ModelSerializer):
    class Meta:
        model  = SellerDelivery
        fields = ("id", "order", "seller", "delivery_status", "tracking_number", "notes", "updated_at")
        read_only_fields = ("id", "order", "seller", "updated_at")
