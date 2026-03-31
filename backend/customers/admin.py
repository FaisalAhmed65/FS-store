from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Customer


@admin.register(Customer)
class CustomerAdmin(UserAdmin):
    list_display  = ("username", "email", "phone", "date_joined", "is_active")
    list_filter   = ("is_active", "is_staff", "date_joined")
    search_fields = ("username", "email", "phone")
    fieldsets     = UserAdmin.fieldsets + (
        ("TRD Profile", {"fields": ("phone", "address", "avatar")}),
    )
