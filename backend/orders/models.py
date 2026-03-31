from django.db import models


class Order(models.Model):
    STATUS_PENDING    = "pending"
    STATUS_CONFIRMED  = "confirmed"
    STATUS_PROCESSING = "processing"
    STATUS_SHIPPED    = "shipped"
    STATUS_DELIVERED  = "delivered"
    STATUS_CANCELLED  = "cancelled"
    STATUS_CHOICES = [
        (STATUS_PENDING,    "Pending"),
        (STATUS_CONFIRMED,  "Confirmed"),
        (STATUS_PROCESSING, "Processing"),
        (STATUS_SHIPPED,    "Shipped"),
        (STATUS_DELIVERED,  "Delivered"),
        (STATUS_CANCELLED,  "Cancelled"),
    ]

    customer       = models.ForeignKey(
        "customers.Customer", on_delete=models.SET_NULL,
        null=True, blank=True, related_name="orders"
    )
    # Snapshot fields so order stays intact if customer deleted
    customer_name  = models.CharField(max_length=200)
    customer_email = models.EmailField()
    customer_phone = models.CharField(max_length=20, blank=True)

    # Shipping address snapshot
    shipping_name    = models.CharField(max_length=200)
    shipping_street  = models.CharField(max_length=300)
    shipping_city    = models.CharField(max_length=100)
    shipping_country = models.CharField(max_length=100, default="Saudi Arabia")
    shipping_zip     = models.CharField(max_length=20, blank=True)
    shipping_phone   = models.CharField(max_length=20, blank=True)

    status      = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING, db_index=True)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    notes       = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Order #{self.id} — {self.customer_name}"


class OrderItem(models.Model):
    order   = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey("products.Product", on_delete=models.SET_NULL, null=True)
    seller  = models.ForeignKey("sellers.Seller", on_delete=models.SET_NULL, null=True, blank=True)
    # Snapshots
    product_name  = models.CharField(max_length=300)
    product_image = models.CharField(max_length=500, blank=True)
    quantity      = models.PositiveIntegerField(default=1)
    unit_price    = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal      = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.quantity}× {self.product_name}"


class SellerDelivery(models.Model):
    """Per-seller delivery tracking for a given order."""
    STATUS_CHOICES = [
        ("pending",    "Pending"),
        ("processing", "Processing"),
        ("shipped",    "Shipped"),
        ("delivered",  "Delivered"),
    ]
    order            = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="seller_deliveries")
    seller           = models.ForeignKey("sellers.Seller", on_delete=models.CASCADE)
    delivery_status  = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    tracking_number  = models.CharField(max_length=100, blank=True)
    notes            = models.TextField(blank=True)
    updated_at       = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [["order", "seller"]]

    def __str__(self):
        return f"Delivery for Order #{self.order_id} by {self.seller.business_name}"
