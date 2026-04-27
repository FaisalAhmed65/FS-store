from django.contrib import admin
from .models import PricelistOffer


@admin.register(PricelistOffer)
class PricelistOfferAdmin(admin.ModelAdmin):
    list_display  = ("name", "campaign_name", "scope", "coupon_code", "discount_type", "discount_value", "min_order_total", "is_active", "valid_from", "valid_to")
    list_filter   = ("scope", "discount_type", "is_active")
    search_fields = ("name", "campaign_name", "coupon_code")
    list_editable = ("is_active",)
    autocomplete_fields = ("product", "category", "seller")
