from django.db import models


class PricelistOffer(models.Model):
    """Rule-based discount applied to catalog items or checkout carts."""

    FIXED = "fixed"
    PERCENT = "percent"
    DISCOUNT_CHOICES = [
        (FIXED, "Fixed Amount"),
        (PERCENT, "Percentage"),
    ]

    SCOPE_PRODUCT = "product"
    SCOPE_CATEGORY = "category"
    SCOPE_SELLER = "seller"
    SCOPE_CART = "cart"
    SCOPE_CHOICES = [
        (SCOPE_PRODUCT, "Product"),
        (SCOPE_CATEGORY, "Category"),
        (SCOPE_SELLER, "Seller"),
        (SCOPE_CART, "Cart"),
    ]

    name = models.CharField(max_length=200)
    campaign_name = models.CharField(max_length=200, blank=True)
    scope = models.CharField(max_length=20, choices=SCOPE_CHOICES, default=SCOPE_PRODUCT, db_index=True)
    product = models.ForeignKey(
        "products.Product",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="offers",
    )
    category = models.ForeignKey(
        "categories.Category",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="offers",
    )
    seller = models.ForeignKey(
        "sellers.Seller",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="offers",
    )
    coupon_code = models.CharField(max_length=64, blank=True, db_index=True)
    min_qty = models.IntegerField(default=1, help_text="Minimum quantity to activate")
    min_order_total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount_type = models.CharField(max_length=20, choices=DISCOUNT_CHOICES, default=PERCENT)
    discount_value = models.DecimalField(max_digits=8, decimal_places=2)
    max_discount_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    priority = models.IntegerField(default=100, help_text="Lower numbers win ties")
    is_active = models.BooleanField(default=True)
    valid_from = models.DateTimeField(null=True, blank=True)
    valid_to = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["priority", "-created_at"]
        indexes = [
            models.Index(fields=["scope", "is_active"]),
            models.Index(fields=["coupon_code", "is_active"]),
            models.Index(fields=["valid_from", "valid_to"]),
        ]

    def __str__(self):
        return self.name
