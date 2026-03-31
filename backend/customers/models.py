from django.contrib.auth.models import AbstractUser
from django.db import models


class Customer(AbstractUser):
    """Extends Django User — handles customer auth via JWT."""
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    avatar = models.ImageField(upload_to="customers/avatars/", blank=True, null=True)

    class Meta:
        verbose_name = "Customer"
        verbose_name_plural = "Customers"

    def __str__(self):
        return self.email or self.username
