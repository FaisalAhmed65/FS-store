import uuid
from django.db import models


class PaymentTransaction(models.Model):
    STATUS_PENDING   = "pending"
    STATUS_SUCCESS   = "success"
    STATUS_FAILED    = "failed"
    STATUS_CANCELLED = "cancelled"
    STATUS_CHOICES = [
        (STATUS_PENDING,   "Pending"),
        (STATUS_SUCCESS,   "Success"),
        (STATUS_FAILED,    "Failed"),
        (STATUS_CANCELLED, "Cancelled"),
    ]

    # Linked to one order (order can have one payment attempt at a time;
    # on retry the old record is replaced via tran_id uniqueness)
    order       = models.ForeignKey(
        "orders.Order", on_delete=models.CASCADE, related_name="payments"
    )
    tran_id     = models.CharField(
        max_length=128, unique=True,
        default=uuid.uuid4,
        help_text="Our unique transaction ID sent to SSLCommerz"
    )
    amount      = models.DecimalField(max_digits=10, decimal_places=2)
    currency    = models.CharField(max_length=10, default="BDT")
    status      = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    gateway     = models.CharField(max_length=50, default="sslcommerz")

    # SSLCommerz response fields (populated after payment)
    val_id       = models.CharField(max_length=128, blank=True, help_text="SSLCommerz validation ID")
    bank_tran_id = models.CharField(max_length=128, blank=True)
    gateway_transaction_id = models.CharField(max_length=128, blank=True, db_index=True)
    card_type    = models.CharField(max_length=64, blank=True, help_text="bKash / Nagad / VISA / etc.")
    store_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    risk_level   = models.CharField(max_length=10, blank=True)
    raw_response = models.JSONField(default=dict, blank=True, help_text="Full IPN payload for audit")
    callback_count = models.PositiveIntegerField(default=0)
    paid_at = models.DateTimeField(null=True, blank=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    last_callback_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.tran_id} | {self.order_id} | {self.status}"


class PaymentWebhookEvent(models.Model):
    gateway = models.CharField(max_length=50, default="sslcommerz")
    payment = models.ForeignKey(
        PaymentTransaction,
        on_delete=models.CASCADE,
        related_name="webhook_events",
        null=True,
        blank=True,
    )
    tran_id = models.CharField(max_length=128, db_index=True)
    event_key = models.CharField(max_length=255, unique=True)
    event_type = models.CharField(max_length=40)
    gateway_status = models.CharField(max_length=40, blank=True)
    raw_payload = models.JSONField(default=dict, blank=True)
    processed = models.BooleanField(default=False)
    duplicate = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["tran_id", "event_type"]),
            models.Index(fields=["processed", "created_at"]),
        ]

    def __str__(self):
        return f"{self.gateway}:{self.event_type}:{self.tran_id}"
