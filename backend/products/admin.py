from django.contrib import admin
from django.utils.html import format_html
from .models import Product, ProductImage, ProductAttribute


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1
    fields = ("preview", "image", "sort_order", "is_main")
    readonly_fields = ("preview",)

    def preview(self, obj):
        if not obj.pk or not obj.image:
            return "No image yet"
        return format_html(
            '<img src="{}" style="height:72px;width:72px;object-fit:cover;border-radius:8px;" />',
            obj.image.url,
        )

    preview.short_description = "Preview"


class ProductAttributeInline(admin.TabularInline):
    model = ProductAttribute
    extra = 1


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display   = ("name", "brand", "seller", "category", "price", "status", "is_published",
                      "is_featured", "is_deal", "is_new_arrival", "is_bestseller", "stock_quantity")
    list_filter    = ("status", "is_published", "is_featured", "is_deal",
                      "is_new_arrival", "is_bestseller", "category")
    search_fields  = ("name", "name_bn", "brand", "sku", "slug")
    prepopulated_fields = {"slug": ("name",)}
    list_editable  = ("status", "is_published", "is_featured", "is_deal")
    inlines        = (ProductImageInline, ProductAttributeInline)
    readonly_fields = ("rating_avg", "rating_count", "created_at", "updated_at")
    fieldsets = (
        ("Core", {"fields": ("name", "name_bn", "slug", "brand", "description", "description_bn",
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

    def formfield_for_dbfield(self, db_field, request, **kwargs):
        formfield = super().formfield_for_dbfield(db_field, request, **kwargs)
        if db_field.name == "get_in":
            formfield.label = "GET IN"
            formfield.help_text = ""
        elif db_field.name == "get_in_bn":
            formfield.label = "GET IN BN"
            formfield.help_text = ""
        return formfield


@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = ("product", "preview", "sort_order", "is_main", "created_at")
    list_filter = ("is_main", "created_at")
    search_fields = ("product__name", "product__slug")
    list_editable = ("sort_order", "is_main")
    autocomplete_fields = ("product",)

    def preview(self, obj):
        if not obj.image:
            return "No image"
        return format_html(
            '<img src="{}" style="height:56px;width:56px;object-fit:cover;border-radius:8px;" />',
            obj.image.url,
        )

    preview.short_description = "Preview"


@admin.register(ProductAttribute)
class ProductAttributeAdmin(admin.ModelAdmin):
    list_display = ("product", "name", "value")
    search_fields = ("product__name", "product__slug", "name", "value")
    autocomplete_fields = ("product",)
