from django.contrib import admin
from .models import Product, ProductImage, ProductAttribute


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display   = ("name", "seller", "category", "price", "status", "is_published",
                      "is_featured", "is_deal", "is_new_arrival", "is_bestseller", "stock_quantity")
    list_filter    = ("status", "is_published", "is_featured", "is_deal",
                      "is_new_arrival", "is_bestseller", "category")
    search_fields  = ("name", "name_bn", "sku", "slug")
    prepopulated_fields = {"slug": ("name",)}
    list_editable  = ("status", "is_published", "is_featured", "is_deal")
    inlines        = []
    readonly_fields = ("rating_avg", "rating_count", "created_at", "updated_at")
    fieldsets = (
        ("Core", {"fields": ("name", "name_bn", "slug", "description", "description_bn",
                              "get_in", "get_in_bn", "image")}),
        ("Pricing", {"fields": ("price", "compare_price")}),
        ("Relations", {"fields": ("category", "seller")}),
        ("Status & Flags", {"fields": ("status", "is_published", "is_featured",
                                       "is_deal", "is_new_arrival", "is_bestseller")}),
        ("Delivery", {"fields": ("is_free_delivery", "delivery_type",
                                  "normal_delivery_charge", "express_delivery_charge")}),
        ("Stock", {"fields": ("stock_quantity", "sku")}),
        ("Deal Settings", {"fields": ("deal_discount_pct", "deal_end_date")}),
        ("Sales & Ranking", {"fields": ("sold_recently", "category_rank", "category_rank_display")}),
        ("Ratings (auto)", {"fields": ("rating_avg", "rating_count")}),
        ("Timestamps", {"fields": ("created_at", "updated_at")}),
    )
