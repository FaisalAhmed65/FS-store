from django.contrib import admin
from .models import ProductReview


@admin.register(ProductReview)
class ProductReviewAdmin(admin.ModelAdmin):
    list_display  = ("partner_name", "product", "rating", "is_approved", "created_at")
    list_filter   = ("rating", "is_approved", "created_at")
    search_fields = ("partner_name", "product__name", "title")
    list_editable = ("is_approved",)
