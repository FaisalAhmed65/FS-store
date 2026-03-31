from django.urls import path
from .views import (
    InitiatePaymentView,
    PaymentSuccessView,
    PaymentFailView,
    PaymentCancelView,
    PaymentIPNView,
    PaymentStatusView,
)

urlpatterns = [
    path("initiate/",           InitiatePaymentView.as_view(), name="payment-initiate"),
    path("success/",            PaymentSuccessView.as_view(),  name="payment-success"),
    path("fail/",               PaymentFailView.as_view(),     name="payment-fail"),
    path("cancel/",             PaymentCancelView.as_view(),   name="payment-cancel"),
    path("ipn/",                PaymentIPNView.as_view(),      name="payment-ipn"),
    path("status/<str:tran_id>/", PaymentStatusView.as_view(), name="payment-status"),
]
