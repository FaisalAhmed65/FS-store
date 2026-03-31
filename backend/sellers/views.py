from datetime import timedelta
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Seller
from .serializers import (
    SellerRegisterSerializer, SellerProfileSerializer,
    SellerLoginSerializer, SellerPublicSerializer,
)
from products.models import Product
from products.serializers import ProductListSerializer, ProductDetailSerializer, ProductWriteSerializer


class SellerRegisterView(generics.CreateAPIView):
    queryset           = Seller.objects.all()
    serializer_class   = SellerRegisterSerializer
    permission_classes = (permissions.AllowAny,)


class SellerLoginView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        ser = SellerLoginSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        email    = ser.validated_data["email"]
        password = ser.validated_data["password"]
        try:
            seller = Seller.objects.get(email=email)
        except Seller.DoesNotExist:
            return Response({"error": "No seller account found for this email."}, status=400)
        if not seller.check_password(password):
            return Response({"error": "Incorrect password."}, status=400)
        if seller.status == Seller.STATUS_REJECTED:
            return Response({"error": "Your account has been rejected."}, status=403)
        if seller.status == Seller.STATUS_SUSPENDED:
            return Response({"error": "Your account is suspended."}, status=403)

        # Issue a simple JWT manually (seller is not a Django User)
        from jose import jwt as jose_jwt
        from django.conf import settings
        payload = {
            "sub":     str(seller.id),
            "email":   seller.email,
            "type":    "seller",
            "status":  seller.status,
            "exp":     (timezone.now() + timedelta(hours=8)).timestamp(),
        }
        token = jose_jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")
        return Response({
            "access":  token,
            "seller":  SellerProfileSerializer(seller).data,
        })


class SellerProfileView(APIView):
    """Return authenticated seller's profile. Pass seller_id via header X-Seller-Id or JWT."""
    permission_classes = (permissions.AllowAny,)

    def _get_seller(self, request):
        from jose import jwt as jose_jwt, JWTError
        from django.conf import settings
        auth = request.headers.get("Authorization", "")
        if not auth.startswith("Bearer "):
            return None
        token = auth.split(" ", 1)[1]
        try:
            payload = jose_jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
            if payload.get("type") != "seller":
                return None
            return Seller.objects.get(id=payload["sub"])
        except (JWTError, Seller.DoesNotExist):
            return None

    def get(self, request):
        seller = self._get_seller(request)
        if not seller:
            return Response({"error": "Unauthorized."}, status=401)
        return Response(SellerProfileSerializer(seller).data)

    def patch(self, request):
        seller = self._get_seller(request)
        if not seller:
            return Response({"error": "Unauthorized."}, status=401)
        ser = SellerProfileSerializer(seller, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(ser.data)


class SellerDashboardView(APIView):
    permission_classes = (permissions.AllowAny,)

    def _get_seller(self, request):
        from jose import jwt as jose_jwt, JWTError
        from django.conf import settings
        auth = request.headers.get("Authorization", "")
        if not auth.startswith("Bearer "):
            return None
        token = auth.split(" ", 1)[1]
        try:
            payload = jose_jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
            if payload.get("type") != "seller":
                return None
            return Seller.objects.get(id=payload["sub"])
        except (JWTError, Seller.DoesNotExist):
            return None

    def get(self, request):
        seller = self._get_seller(request)
        if not seller:
            return Response({"error": "Unauthorized."}, status=401)

        products = seller.products.all()
        # TRD_HOLD: orders — disabled on frontend via NEXT_PUBLIC_SELLER_SHOW_ORDERS=false
        from orders.models import Order, OrderItem
        product_ids = list(products.values_list("id", flat=True))
        order_items = OrderItem.objects.filter(product_id__in=product_ids)
        order_ids   = list(order_items.values_list("order_id", flat=True).distinct())
        orders = Order.objects.filter(id__in=order_ids).order_by("-created_at")

        return Response({
            "seller":         SellerProfileSerializer(seller).data,
            "total_products": products.count(),
            "published":      products.filter(is_published=True).count(),
            "pending":        products.filter(status=Product.STATUS_PENDING).count(),
            "total_orders":   orders.count(),
            "recent_products": ProductListSerializer(
                products.order_by("-created_at")[:5], many=True, context={"request": request}
            ).data,
        })


class SellerProductListCreateView(APIView):
    permission_classes = (permissions.AllowAny,)

    def _get_seller(self, request):
        from jose import jwt as jose_jwt, JWTError
        from django.conf import settings
        auth = request.headers.get("Authorization", "")
        if not auth.startswith("Bearer "):
            return None
        token = auth.split(" ", 1)[1]
        try:
            payload = jose_jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
            return Seller.objects.get(id=payload["sub"]) if payload.get("type") == "seller" else None
        except (JWTError, Seller.DoesNotExist):
            return None

    def get(self, request):
        seller = self._get_seller(request)
        if not seller:
            return Response({"error": "Unauthorized."}, status=401)
        products = seller.products.all().order_by("-created_at")
        return Response(ProductListSerializer(products, many=True, context={"request": request}).data)

    def post(self, request):
        seller = self._get_seller(request)
        if not seller:
            return Response({"error": "Unauthorized."}, status=401)
        if seller.status != Seller.STATUS_APPROVED:
            return Response({"error": "Your account must be approved to add products."}, status=403)
        ser = ProductWriteSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        product = ser.save(seller=seller, status=Product.STATUS_PENDING, is_published=False)
        return Response(ProductDetailSerializer(product, context={"request": request}).data, status=201)


class SellerProductDetailView(APIView):
    permission_classes = (permissions.AllowAny,)

    def _get_seller(self, request):
        from jose import jwt as jose_jwt, JWTError
        from django.conf import settings
        auth = request.headers.get("Authorization", "")
        if not auth.startswith("Bearer "):
            return None
        token = auth.split(" ", 1)[1]
        try:
            payload = jose_jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
            return Seller.objects.get(id=payload["sub"]) if payload.get("type") == "seller" else None
        except (JWTError, Seller.DoesNotExist):
            return None

    def _get_product(self, seller, product_id):
        try:
            return seller.products.get(id=product_id)
        except Product.DoesNotExist:
            return None

    def get(self, request, pk):
        seller = self._get_seller(request)
        if not seller:
            return Response({"error": "Unauthorized."}, status=401)
        product = self._get_product(seller, pk)
        if not product:
            return Response({"error": "Not found."}, status=404)
        return Response(ProductDetailSerializer(product, context={"request": request}).data)

    def patch(self, request, pk):
        seller = self._get_seller(request)
        if not seller:
            return Response({"error": "Unauthorized."}, status=401)
        product = self._get_product(seller, pk)
        if not product:
            return Response({"error": "Not found."}, status=404)
        ser = ProductWriteSerializer(product, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        updated = ser.save(status=Product.STATUS_PENDING, is_published=False)
        return Response(ProductDetailSerializer(updated, context={"request": request}).data)

    def delete(self, request, pk):
        seller = self._get_seller(request)
        if not seller:
            return Response({"error": "Unauthorized."}, status=401)
        product = self._get_product(seller, pk)
        if not product:
            return Response({"error": "Not found."}, status=404)
        product.seller = None
        product.save()
        return Response(status=204)
