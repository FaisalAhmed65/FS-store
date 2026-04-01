from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Category
from .serializers import CategorySerializer, CategoryTreeSerializer


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.filter(is_published=True)
    permission_classes = (permissions.AllowAny,)
    lookup_field = "slug"
    filter_backends = (DjangoFilterBackend,)
    filterset_fields = ("parent", "show_in_showcase")

    def get_serializer_class(self):
        if self.action == "retrieve":
            return CategoryTreeSerializer
        return CategorySerializer

    def get_queryset(self):
        qs = super().get_queryset()
        showcase = self.request.query_params.get("showcase")
        if showcase == "1":
            qs = qs.filter(show_in_showcase=True).order_by("showcase_priority")
        root_only = self.request.query_params.get("root_only")
        if root_only == "1":
            qs = qs.filter(parent__isnull=True)
        return qs

    @action(detail=False, url_path="tree")
    def tree(self, request):
        """Return full category tree (root categories with nested children)."""
        roots = Category.objects.filter(is_published=True, parent__isnull=True).order_by("showcase_priority", "name")
        return Response(CategoryTreeSerializer(roots, many=True).data)
