from django.contrib import admin
from .models import PaymentTransaction, PaymentWebhookEvent


@admin.register(PaymentTransaction)
class PaymentTransactionAdmin(admin.ModelAdmin):
    list_display  = ("tran_id", "order", "amount", "currency", "status", "gateway_transaction_id", "card_type", "callback_count", "created_at")
    list_filter   = ("status", "currency", "gateway")
    search_fields = ("tran_id", "val_id", "bank_tran_id", "gateway_transaction_id", "order__id")
    readonly_fields = ("tran_id", "raw_response", "callback_count", "paid_at", "processed_at", "last_callback_at", "created_at", "updated_at")
    ordering      = ("-created_at",)


@admin.register(PaymentWebhookEvent)
class PaymentWebhookEventAdmin(admin.ModelAdmin):
    list_display = ("event_type", "tran_id", "gateway_status", "processed", "duplicate", "created_at")
    list_filter = ("event_type", "processed", "duplicate", "gateway")
    search_fields = ("tran_id", "event_key", "payment__tran_id")
    readonly_fields = ("event_key", "raw_payload", "created_at", "processed_at")
