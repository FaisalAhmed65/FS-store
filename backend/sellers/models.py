from django.db import models
from django.contrib.auth.hashers import make_password, check_password as _check_password


class Seller(models.Model):
    STATUS_PENDING   = "pending"
    STATUS_APPROVED  = "approved"
    STATUS_REJECTED  = "rejected"
    STATUS_SUSPENDED = "suspended"
    STATUS_CHOICES = [
        (STATUS_PENDING,   "Pending"),
        (STATUS_APPROVED,  "Approved"),
        (STATUS_REJECTED,  "Rejected"),
        (STATUS_SUSPENDED, "Suspended"),
    ]

    business_name = models.CharField(max_length=200)
    email         = models.EmailField(unique=True)
    password      = models.CharField(max_length=200)   # bcrypt hash
    phone         = models.CharField(max_length=20, blank=True)
    address       = models.TextField(blank=True)
    status        = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING, db_index=True)
    logo          = models.ImageField(upload_to="sellers/logos/", blank=True, null=True)
    description   = models.TextField(blank=True)
    admin_notes   = models.TextField(blank=True, help_text="Internal notes — not shown to seller")
    created_at    = models.DateTimeField(auto_now_add=True)
    updated_at    = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.business_name

    def set_password(self, raw_password: str):
        self.password = make_password(raw_password)

    def check_password(self, raw_password: str) -> bool:
        return _check_password(raw_password, self.password)


class SellerPayout(models.Model):
    STATUS_PENDING = "pending"
    STATUS_PROCESSING = "processing"
    STATUS_PAID = "paid"
    STATUS_ON_HOLD = "on_hold"
    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_PROCESSING, "Processing"),
        (STATUS_PAID, "Paid"),
        (STATUS_ON_HOLD, "On Hold"),
    ]

    seller = models.ForeignKey(Seller, on_delete=models.CASCADE, related_name="payouts")
    period_start = models.DateField()
    period_end = models.DateField()
    gross_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    platform_fee = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    net_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING, db_index=True)
    reference = models.CharField(max_length=120, blank=True)
    notes = models.TextField(blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-period_end", "-created_at"]
        indexes = [
            models.Index(fields=["seller", "status"]),
            models.Index(fields=["period_start", "period_end"]),
        ]

    def __str__(self):
        return f"{self.seller.business_name} payout {self.period_start} - {self.period_end}"
