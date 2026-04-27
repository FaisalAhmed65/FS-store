from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone


class Order(models.Model):
    STATUS_CART = "cart"
    STATUS_PENDING_PAYMENT = "pending_payment"
    STATUS_PAID = "paid"
    STATUS_PROCESSING = "processing"
    STATUS_SHIPPED = "shipped"
    STATUS_DELIVERED = "delivered"
    STATUS_CANCELLED = "cancelled"
    STATUS_REFUNDED = "refunded"
    STATUS_CHOICES = [
        (STATUS_CART, "Cart"),
        (STATUS_PENDING_PAYMENT, "Pending Payment"),
        (STATUS_PAID, "Paid"),
        (STATUS_PROCESSING, "Processing"),
        (STATUS_SHIPPED, "Shipped"),
        (STATUS_DELIVERED, "Delivered"),
        (STATUS_CANCELLED, "Cancelled"),
        (STATUS_REFUNDED, "Refunded"),
    ]
    VALID_TRANSITIONS = {
        STATUS_CART: {STATUS_PENDING_PAYMENT, STATUS_CANCELLED},
        STATUS_PENDING_PAYMENT: {STATUS_PAID, STATUS_CANCELLED},
        STATUS_PAID: {STATUS_PROCESSING, STATUS_CANCELLED, STATUS_REFUNDED},
        STATUS_PROCESSING: {STATUS_SHIPPED, STATUS_CANCELLED, STATUS_REFUNDED},
        STATUS_SHIPPED: {STATUS_DELIVERED, STATUS_REFUNDED},
        STATUS_DELIVERED: {STATUS_REFUNDED},
        STATUS_CANCELLED: set(),
        STATUS_REFUNDED: set(),
    }

    customer = models.ForeignKey(
        "customers.Customer",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="orders",
    )
    # Snapshot fields so order stays intact if customer deleted.
    customer_name = models.CharField(max_length=200)
    customer_email = models.EmailField()
    customer_phone = models.CharField(max_length=20, blank=True)

    # Shipping address snapshot.
    shipping_name = models.CharField(max_length=200)
    shipping_street = models.CharField(max_length=300)
    shipping_city = models.CharField(max_length=100)
    shipping_country = models.CharField(max_length=100, default="Bangladesh")
    shipping_zip = models.CharField(max_length=20, blank=True)
    shipping_phone = models.CharField(max_length=20, blank=True)

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_CART,
        db_index=True,
    )
    subtotal_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount_total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    coupon_code = models.CharField(max_length=64, blank=True, db_index=True)
    reservation_expires_at = models.DateTimeField(null=True, blank=True, db_index=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    refunded_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Order #{self.id} - {self.customer_name}"

    @classmethod
    def from_db(cls, db, field_names, values):
        instance = super().from_db(db, field_names, values)
        instance._loaded_status = instance.status
        return instance

    def clean(self):
        super().clean()
        old_status = getattr(self, "_loaded_status", None)
        if self.pk and old_status and old_status != self.status:
            self.validate_transition(old_status, self.status)

    def save(self, *args, **kwargs):
        old_status = getattr(self, "_loaded_status", None)
        checked = getattr(self, "_status_transition_checked", False)
        if self.pk and old_status and old_status != self.status and not checked:
            self.validate_transition(old_status, self.status)
        super().save(*args, **kwargs)
        self._loaded_status = self.status
        self._status_transition_checked = False

    def validate_transition(self, source, target):
        if source == target:
            return
        allowed = self.VALID_TRANSITIONS.get(source, set())
        if target not in allowed:
            raise ValidationError(f"Invalid order status transition: {source} -> {target}")

    def transition_to(self, target_status, *, save=True):
        if self.status == target_status:
            return False
        self.validate_transition(self.status, target_status)
        self.status = target_status
        now = timezone.now()
        update_fields = ["status", "updated_at"]
        if target_status == self.STATUS_PAID and not self.paid_at:
            self.paid_at = now
            update_fields.append("paid_at")
        elif target_status == self.STATUS_CANCELLED and not self.cancelled_at:
            self.cancelled_at = now
            update_fields.append("cancelled_at")
        elif target_status == self.STATUS_REFUNDED and not self.refunded_at:
            self.refunded_at = now
            update_fields.append("refunded_at")
        if save:
            self._status_transition_checked = True
            self.save(update_fields=update_fields)
        return True


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey("products.Product", on_delete=models.SET_NULL, null=True)
    seller = models.ForeignKey("sellers.Seller", on_delete=models.SET_NULL, null=True, blank=True)
    # Snapshots.
    product_name = models.CharField(max_length=300)
    product_image = models.CharField(max_length=500, blank=True)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    original_unit_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    def __str__(self):
        return f"{self.quantity} x {self.product_name}"


class StockReservation(models.Model):
    STATUS_ACTIVE = "active"
    STATUS_CONVERTED = "converted"
    STATUS_RELEASED = "released"
    STATUS_CHOICES = [
        (STATUS_ACTIVE, "Active"),
        (STATUS_CONVERTED, "Converted to Sale"),
        (STATUS_RELEASED, "Released"),
    ]

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="stock_reservations")
    product = models.ForeignKey(
        "products.Product",
        on_delete=models.CASCADE,
        related_name="stock_reservations",
    )
    quantity = models.PositiveIntegerField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_ACTIVE, db_index=True)
    expires_at = models.DateTimeField(db_index=True)
    reason = models.CharField(max_length=80, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    converted_at = models.DateTimeField(null=True, blank=True)
    released_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["status", "expires_at"]),
            models.Index(fields=["order", "status"]),
        ]

    def __str__(self):
        return f"{self.quantity} reserved for Order #{self.order_id}"


class SellerDelivery(models.Model):
    """Per-seller delivery tracking for a given order."""

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("processing", "Processing"),
        ("shipped", "Shipped"),
        ("delivered", "Delivered"),
    ]
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="seller_deliveries")
    seller = models.ForeignKey("sellers.Seller", on_delete=models.CASCADE)
    delivery_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    tracking_number = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [["order", "seller"]]

    def __str__(self):
        return f"Delivery for Order #{self.order_id} by {self.seller.business_name}"
