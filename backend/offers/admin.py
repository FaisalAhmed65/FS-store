from django.contrib import admin
from .models import PricelistOffer


@admin.register(PricelistOffer)
class PricelistOfferAdmin(admin.ModelAdmin):
    list_display  = ("name", "product", "category", "discount_type", "discount_value", "is_active", "valid_from", "valid_to")
    list_filter   = ("discount_type", "is_active")
    search_fields = ("name",)
    list_editable = ("is_active",)
