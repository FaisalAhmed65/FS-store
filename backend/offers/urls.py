from django.urls import path
from .views import OfferListView, PriceCartPreviewView

urlpatterns = [
    path("", OfferListView.as_view(), name="offer-list"),
    path("price-cart/", PriceCartPreviewView.as_view(), name="offer-price-cart"),
]
