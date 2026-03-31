from rest_framework import generics, permissions, status
from rest_framework.response import Response
from .models import Order
from .serializers import OrderSerializer, OrderCreateSerializer


class OrderListCreateView(generics.ListCreateAPIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get_serializer_class(self):
        return OrderCreateSerializer if self.request.method == "POST" else OrderSerializer

    def get_queryset(self):
        return Order.objects.filter(customer=self.request.user).order_by("-created_at")

    def perform_create(self, serializer):
        user = self.request.user
        serializer.save(
            customer=user,
            customer_name=user.get_full_name() or user.username,
            customer_email=user.email,
        )


class OrderDetailView(generics.RetrieveAPIView):
    serializer_class   = OrderSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return Order.objects.filter(customer=self.request.user)
