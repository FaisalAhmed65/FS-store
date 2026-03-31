from django.db import models


class ProductReview(models.Model):
    """
    TRD_HOLD: Review system — data model is complete.
    Hidden on storefront via NEXT_PUBLIC_ENABLE_RATINGS=false.
    Re-enable by setting that env var to true.
    """
    product      = models.ForeignKey("products.Product", on_delete=models.CASCADE, related_name="reviews")
    customer     = models.ForeignKey(
        "customers.Customer", on_delete=models.SET_NULL,
        null=True, blank=True
    )
    partner_name = models.CharField(max_length=100)
    rating       = models.IntegerField(choices=[(i, str(i)) for i in range(1, 6)])
    title        = models.CharField(max_length=200, blank=True)
    body         = models.TextField(blank=True)
    is_approved  = models.BooleanField(default=True)
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.partner_name} — {self.product.name} ({self.rating}★)"
