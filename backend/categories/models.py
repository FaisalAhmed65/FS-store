from django.db import models


class Category(models.Model):
    name = models.CharField(max_length=200)
    name_bn = models.CharField(max_length=200, blank=True, help_text="Bengali name (বাংলা নাম)")
    slug = models.SlugField(unique=True, max_length=220)
    description = models.TextField(blank=True)
    parent = models.ForeignKey(
        "self", null=True, blank=True,
        on_delete=models.SET_NULL, related_name="children"
    )
    image = models.ImageField(upload_to="categories/", blank=True, null=True)
    icon = models.ImageField(upload_to="categories/icons/", blank=True, null=True)
    show_in_showcase = models.BooleanField(default=False, db_index=True)
    showcase_priority = models.IntegerField(default=10)
    is_published = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Categories"
        ordering = ["showcase_priority", "name"]

    def __str__(self):
        return self.name
