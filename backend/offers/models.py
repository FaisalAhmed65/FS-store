from django.db import models


class PricelistOffer(models.Model):
    """Discount rules applied at checkout or shown on product cards."""
    FIXED   = "fixed"
    PERCENT = "percent"
    DISCOUNT_CHOICES = [
        (FIXED,   "Fixed Amount (SAR)"),
        (PERCENT, "Percentage (%)"),
    ]

    name           = models.CharField(max_length=200)
    # Applies to a specific product OR a whole category (one of these)
    product        = models.ForeignKey(
        "products.Product", on_delete=models.CASCADE,
        null=True, blank=True, related_name="offers"
    )
    category       = models.ForeignKey(
        "categories.Category", on_delete=models.CASCADE,
        null=True, blank=True, related_name="offers"
    )
    min_qty        = models.IntegerField(default=1, help_text="Minimum cart quantity to activate")
    discount_type  = models.CharField(max_length=20, choices=DISCOUNT_CHOICES, default=PERCENT)
    discount_value = models.DecimalField(max_digits=8, decimal_places=2)
    is_active      = models.BooleanField(default=True)
    valid_from     = models.DateTimeField(null=True, blank=True)
    valid_to       = models.DateTimeField(null=True, blank=True)
    created_at     = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name
