from django.contrib import admin
from .models import WishlistList, WishlistItem


class WishlistItemInline(admin.TabularInline):
    model = WishlistItem
    extra = 0


@admin.register(WishlistList)
class WishlistListAdmin(admin.ModelAdmin):
    list_display = ("name", "customer", "created_at")
    inlines = [WishlistItemInline]
