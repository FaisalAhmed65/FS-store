from django.urls import path
from .views import (
    SellerRegisterView, SellerLoginView,
    SellerProfileView, SellerDashboardView,
    SellerProductListCreateView, SellerProductDetailView,
    SellerOrderListView,
)

urlpatterns = [
    path("register/",          SellerRegisterView.as_view(),        name="seller-register"),
    path("login/",             SellerLoginView.as_view(),            name="seller-login"),
    path("profile/",           SellerProfileView.as_view(),          name="seller-profile"),
    path("dashboard/",         SellerDashboardView.as_view(),        name="seller-dashboard"),
    path("products/",          SellerProductListCreateView.as_view(), name="seller-products"),
    path("products/<int:pk>/", SellerProductDetailView.as_view(),    name="seller-product-detail"),
    path("orders/",            SellerOrderListView.as_view(),        name="seller-orders"),
]
