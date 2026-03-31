from rest_framework import serializers
from .models import PaymentTransaction


class PaymentTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model  = PaymentTransaction
        fields = ("id", "tran_id", "order", "amount", "currency",
                  "status", "card_type", "created_at")
        read_only_fields = fields
