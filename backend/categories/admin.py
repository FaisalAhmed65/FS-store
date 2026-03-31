from django.contrib import admin
from .models import Category


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display   = ("name", "parent", "show_in_showcase", "showcase_priority", "is_published")
    list_filter    = ("show_in_showcase", "is_published")
    search_fields  = ("name", "name_bn", "slug")
    prepopulated_fields = {"slug": ("name",)}
    list_editable  = ("show_in_showcase", "showcase_priority", "is_published")
    ordering       = ("showcase_priority", "name")
