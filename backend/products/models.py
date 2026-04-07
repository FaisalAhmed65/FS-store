from django.db import models
from django.utils.text import slugify


class Product(models.Model):
    STATUS_PENDING  = "pending"
    STATUS_APPROVED = "approved"
    STATUS_REJECTED = "rejected"
    STATUS_ARCHIVED = "archived"
    STATUS_CHOICES = [
        (STATUS_PENDING,  "Pending Approval"),
        (STATUS_APPROVED, "Approved"),
        (STATUS_REJECTED, "Rejected"),
        (STATUS_ARCHIVED, "Archived"),
    ]

    DELIVERY_NORMAL  = "normal"
    DELIVERY_EXPRESS = "express"
    DELIVERY_BOTH    = "both"
    DELIVERY_CHOICES = [
        (DELIVERY_NORMAL,  "Normal"),
        (DELIVERY_EXPRESS, "Express"),
        (DELIVERY_BOTH,    "Normal + Express"),
    ]

    # Core
    name           = models.CharField(max_length=300)
    name_bn        = models.CharField(max_length=300, blank=True, help_text="Bengali name (বাংলা নাম)")
    slug           = models.SlugField(unique=True, max_length=320)
    description    = models.TextField(blank=True)
    description_bn = models.TextField(blank=True, help_text="Bengali description (বাংলা বিবরণ)")
    get_in         = models.CharField(max_length=300, blank=True, help_text="What's in the box")
    get_in_bn      = models.CharField(max_length=300, blank=True, help_text="Bengali: বাক্সে কী আছে")

    # Pricing
    price         = models.DecimalField(max_digits=10, decimal_places=2)
    compare_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    # Relations
    category = models.ForeignKey(
        "categories.Category", on_delete=models.SET_NULL,
        null=True, blank=True, related_name="products"
    )
    seller = models.ForeignKey(
        "sellers.Seller", on_delete=models.SET_NULL,
        null=True, blank=True, related_name="products"
    )

    # Flags
    status        = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING, db_index=True)
    is_published  = models.BooleanField(default=False, db_index=True)
    is_featured   = models.BooleanField(default=False, db_index=True)
    is_deal       = models.BooleanField(default=False, db_index=True)
    is_new_arrival = models.BooleanField(default=False, db_index=True)
    is_bestseller = models.BooleanField(default=False, db_index=True)

    # Delivery
    # TRD_HOLD: is_free_delivery — feature disabled on frontend via NEXT_PUBLIC_SELLER_FREE_DELIVERY=false
    is_free_delivery         = models.BooleanField(default=False)
    delivery_type            = models.CharField(max_length=20, choices=DELIVERY_CHOICES, default=DELIVERY_NORMAL)
    normal_delivery_charge   = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    express_delivery_charge  = models.DecimalField(max_digits=8, decimal_places=2, default=0)

    # Stock
    stock_quantity = models.IntegerField(default=0)
    sku            = models.CharField(max_length=100, blank=True)

    # Media
    image = models.ImageField(upload_to="products/", blank=True, null=True)

    # Ratings — TRD_HOLD: hidden on frontend via NEXT_PUBLIC_ENABLE_RATINGS=false
    rating_avg   = models.DecimalField(max_digits=3, decimal_places=1, default=0)
    rating_count = models.IntegerField(default=0)

    # Deal
    deal_discount_pct = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    deal_end_date     = models.DateTimeField(null=True, blank=True)

    # Sales & Ranking
    sold_recently         = models.IntegerField(default=0, help_text="Number of units sold recently (shown on card)")
    category_rank         = models.IntegerField(default=0, help_text="Rank within the product's category (0 = unranked)")
    category_rank_display = models.CharField(max_length=100, blank=True, help_text="Human-readable rank label, e.g. '#2 in Gaming'")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.name)
            slug = base
            n = 1
            while Product.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base}-{n}"
                n += 1
            self.slug = slug
        super().save(*args, **kwargs)

    @property
    def discount_pct(self):
        if self.compare_price and self.compare_price > self.price:
            return int((self.compare_price - self.price) / self.compare_price * 100)
        return 0


class ProductImage(models.Model):
    product    = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="images")
    image      = models.ImageField(upload_to="products/gallery/")
    sort_order = models.IntegerField(default=0)
    is_main    = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["sort_order"]

    def __str__(self):
        return f"{self.product.name} image #{self.sort_order}"


class ProductAttribute(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="attributes")
    name    = models.CharField(max_length=100)   # e.g. "Color"
    value   = models.CharField(max_length=200)   # e.g. "Red"

    def __str__(self):
        return f"{self.product.name} — {self.name}: {self.value}"
