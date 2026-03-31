from django.db import models


class WishlistList(models.Model):
    customer   = models.ForeignKey("customers.Customer", on_delete=models.CASCADE, related_name="wishlists")
    name       = models.CharField(max_length=100, default="Default")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.customer.username} — {self.name}"


class WishlistItem(models.Model):
    wishlist   = models.ForeignKey(WishlistList, on_delete=models.CASCADE, related_name="items")
    product    = models.ForeignKey("products.Product", on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [["wishlist", "product"]]

    def __str__(self):
        return f"{self.wishlist.name} — {self.product.name}"
