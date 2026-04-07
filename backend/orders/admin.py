from django.contrib import admin
from .models import Order, OrderItem, SellerDelivery, StockReservation


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ("product", "product_name", "seller", "quantity", "unit_price", "subtotal")


class SellerDeliveryInline(admin.TabularInline):
    model = SellerDelivery
    extra = 0


class StockReservationInline(admin.TabularInline):
    model = StockReservation
    extra = 0
    readonly_fields = (
        "product",
        "quantity",
        "status",
        "expires_at",
        "reason",
        "created_at",
        "converted_at",
        "released_at",
    )


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display   = ("id", "customer_name", "customer_email", "status", "total_price", "reservation_expires_at", "created_at")
    list_filter    = ("status", "created_at")
    search_fields  = ("customer_name", "customer_email", "id")
    readonly_fields = ("created_at", "updated_at", "paid_at", "cancelled_at", "refunded_at")
    inlines        = [OrderItemInline, StockReservationInline, SellerDeliveryInline]


@admin.register(StockReservation)
class StockReservationAdmin(admin.ModelAdmin):
    list_display = ("order", "product", "quantity", "status", "expires_at", "reason")
    list_filter = ("status", "expires_at")
    search_fields = ("order__id", "product__name", "product__sku")
    readonly_fields = ("created_at", "updated_at", "converted_at", "released_at")
