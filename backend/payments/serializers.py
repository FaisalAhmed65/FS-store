from rest_framework import serializers
from .models import PaymentTransaction


class PaymentTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model  = PaymentTransaction
        fields = ("id", "tran_id", "order", "amount", "currency",
                  "status", "gateway_transaction_id", "val_id", "bank_tran_id",
                  "card_type", "callback_count", "paid_at", "created_at")
        read_only_fields = fields
