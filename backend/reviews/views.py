from rest_framework import generics, permissions
from rest_framework.response import Response
from .models import ProductReview
from .serializers import ReviewSerializer, ReviewCreateSerializer
from products.models import Product


class ReviewListCreateView(generics.ListCreateAPIView):
    """
    TRD_HOLD: Review endpoints are active server-side.
    Toggle visibility on frontend via NEXT_PUBLIC_ENABLE_RATINGS=true/false.
    """
    permission_classes = (permissions.AllowAny,)

    def get_serializer_class(self):
        return ReviewCreateSerializer if self.request.method == "POST" else ReviewSerializer

    def get_queryset(self):
        product_id = self.kwargs.get("product_id")
        return ProductReview.objects.filter(product_id=product_id, is_approved=True)

    def perform_create(self, serializer):
        product_id = self.kwargs.get("product_id")
        product    = Product.objects.get(id=product_id)
        partner_name = serializer.validated_data.get("partner_name", "Guest")
        if self.request.user and not self.request.user.is_anonymous:
            partner_name = self.request.user.get_full_name() or self.request.user.username
        review = serializer.save(product=product, partner_name=partner_name)

        # Recalculate rating_avg
        reviews = ProductReview.objects.filter(product=product, is_approved=True)
        avg = sum(r.rating for r in reviews) / reviews.count()
        product.rating_avg   = round(avg, 1)
        product.rating_count = reviews.count()
        product.save(update_fields=["rating_avg", "rating_count"])
