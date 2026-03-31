from rest_framework import serializers
from .models import Category


class CategorySerializer(serializers.ModelSerializer):
    children_count = serializers.SerializerMethodField()

    class Meta:
        model  = Category
        fields = ("id", "name", "name_bn", "slug", "description", "parent",
                  "image", "icon", "show_in_showcase", "showcase_priority",
                  "is_published", "children_count")

    def get_children_count(self, obj):
        return obj.children.filter(is_published=True).count()


class CategoryTreeSerializer(CategorySerializer):
    children = serializers.SerializerMethodField()

    class Meta(CategorySerializer.Meta):
        fields = CategorySerializer.Meta.fields + ("children",)  # type: ignore

    def get_children(self, obj):
        return CategoryTreeSerializer(obj.children.filter(is_published=True), many=True).data
