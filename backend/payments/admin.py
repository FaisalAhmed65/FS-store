from django.contrib import admin
from .models import PaymentTransaction


@admin.register(PaymentTransaction)
class PaymentTransactionAdmin(admin.ModelAdmin):
    list_display  = ("tran_id", "order", "amount", "currency", "status", "card_type", "created_at")
    list_filter   = ("status", "currency", "gateway")
    search_fields = ("tran_id", "val_id", "bank_tran_id", "order__id")
    readonly_fields = ("tran_id", "raw_response", "created_at", "updated_at")
    ordering      = ("-created_at",)
