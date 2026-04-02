from django.contrib import admin
from .models import Seller, SellerPayout


@admin.register(Seller)
class SellerAdmin(admin.ModelAdmin):
    list_display   = ("business_name", "email", "phone", "status", "created_at")
    list_filter    = ("status",)
    search_fields  = ("business_name", "email", "phone")
    list_editable  = ("status",)
    readonly_fields = ("created_at", "updated_at")
    fieldsets = (
        ("Business Info", {"fields": ("business_name", "email", "phone", "address", "logo", "description")}),
        ("Status", {"fields": ("status", "admin_notes")}),
        ("Timestamps", {"fields": ("created_at", "updated_at")}),
    )

    def save_model(self, request, obj, form, change):
        """Hash password only when it's been changed via admin."""
        if "password" in form.changed_data:
            obj.set_password(form.cleaned_data["password"])
        super().save_model(request, obj, form, change)


@admin.register(SellerPayout)
class SellerPayoutAdmin(admin.ModelAdmin):
    list_display = ("seller", "period_start", "period_end", "gross_amount", "net_amount", "status", "paid_at")
    list_filter = ("status", "period_start", "period_end")
    search_fields = ("seller__business_name", "seller__email", "reference")
    autocomplete_fields = ("seller",)
    readonly_fields = ("created_at", "updated_at")
