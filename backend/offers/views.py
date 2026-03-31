from rest_framework import generics, permissions
from django.utils import timezone
from .models import PricelistOffer
from .serializers import OfferSerializer


class OfferListView(generics.ListAPIView):
    serializer_class   = OfferSerializer
    permission_classes = (permissions.AllowAny,)

    def get_queryset(self):
        now = timezone.now()
        qs  = PricelistOffer.objects.filter(is_active=True)
        qs  = qs.filter(valid_from__lte=now) | PricelistOffer.objects.filter(is_active=True, valid_from__isnull=True)
        qs  = qs.filter(valid_to__gte=now)   | PricelistOffer.objects.filter(is_active=True, valid_to__isnull=True)
        product_id = self.request.query_params.get("product_id")
        if product_id:
            qs = qs.filter(product_id=product_id) | qs.filter(product__isnull=True)
        return qs.distinct()
