from datetime import timedelta

from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from products.models import Product
from products.serializers import ProductDetailSerializer, ProductListSerializer, ProductWriteSerializer
from .models import Seller, SellerPayout
from .ml_insights import (
    demand_forecast_for_seller,
    fraud_flags_for_seller,
    low_stock_predictions_for_seller,
    promotion_suggestions_for_seller,
)
from .serializers import (
    SellerLoginSerializer,
    SellerPayoutSerializer,
    SellerProfileSerializer,
    SellerRegisterSerializer,
)


def get_seller_from_request(request):
    from django.conf import settings
    from jose import JWTError, jwt as jose_jwt

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


class SellerRegisterView(generics.CreateAPIView):
    queryset = Seller.objects.all()
    serializer_class = SellerRegisterSerializer
    permission_classes = (permissions.AllowAny,)


class SellerLoginView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        ser = SellerLoginSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        email = ser.validated_data["email"]
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

        from django.conf import settings
        from jose import jwt as jose_jwt

        payload = {
            "sub": str(seller.id),
            "email": seller.email,
            "type": "seller",
            "status": seller.status,
            "exp": (timezone.now() + timedelta(hours=8)).timestamp(),
        }
        token = jose_jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")
        return Response({
            "access": token,
            "seller": SellerProfileSerializer(seller).data,
        })


class SellerProfileView(APIView):
    """Return authenticated seller's profile from the seller JWT."""

    permission_classes = (permissions.AllowAny,)
    authentication_classes = []

    def get(self, request):
        seller = get_seller_from_request(request)
        if not seller:
            return Response({"error": "Unauthorized."}, status=401)
        return Response(SellerProfileSerializer(seller).data)

    def patch(self, request):
        seller = get_seller_from_request(request)
        if not seller:
            return Response({"error": "Unauthorized."}, status=401)
        ser = SellerProfileSerializer(seller, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(ser.data)


class SellerDashboardView(APIView):
    permission_classes = (permissions.AllowAny,)
    authentication_classes = []

    def get(self, request):
        seller = get_seller_from_request(request)
        if not seller:
            return Response({"error": "Unauthorized."}, status=401)

        from django.db.models import Count, Sum
        from django.db.models.functions import TruncDate
        from orders.models import Order, OrderItem

        products = seller.products.all()
        product_ids = list(products.values_list("id", flat=True))
        order_items = OrderItem.objects.filter(product_id__in=product_ids).select_related("order", "product")
        order_ids = list(order_items.values_list("order_id", flat=True).distinct())
        orders = Order.objects.filter(id__in=order_ids).order_by("-created_at")
        revenue_statuses = [
            Order.STATUS_PAID,
            Order.STATUS_PROCESSING,
            Order.STATUS_SHIPPED,
            Order.STATUS_DELIVERED,
        ]
        revenue_items = order_items.filter(order__status__in=revenue_statuses)
        total_revenue = revenue_items.aggregate(total=Sum("subtotal"))["total"] or 0
        paid_order_count = revenue_items.values("order_id").distinct().count()
        total_order_count = orders.count()
        conversion_rate = round((paid_order_count / total_order_count) * 100, 2) if total_order_count else 0
        pending_order_count = order_items.filter(
            order__status__in=[Order.STATUS_PAID, Order.STATUS_PROCESSING]
        ).values("order_id").distinct().count()
        chart_rows = list(
            revenue_items.annotate(day=TruncDate("order__created_at"))
            .values("day")
            .annotate(revenue=Sum("subtotal"), orders=Count("order_id", distinct=True))
            .order_by("day")
        )[-14:]
        revenue_chart = [
            {
                "date": row["day"].isoformat(),
                "revenue": str(row["revenue"] or 0),
                "orders": row["orders"],
            }
            for row in chart_rows
        ]
        product_performance = [
            {
                "product_id": row["product_id"],
                "product_name": row["product_name"],
                "units_sold": row["units_sold"] or 0,
                "revenue": str(row["revenue"] or 0),
                "orders": row["orders"],
            }
            for row in revenue_items.values("product_id", "product_name")
            .annotate(
                units_sold=Sum("quantity"),
                revenue=Sum("subtotal"),
                orders=Count("order_id", distinct=True),
            )
            .order_by("-revenue")[:10]
        ]
        low_stock = [
            {
                "id": product.id,
                "name": product.name,
                "stock_quantity": product.stock_quantity,
                "sku": product.sku,
            }
            for product in products.filter(stock_quantity__lte=5).order_by("stock_quantity", "name")[:10]
        ]
        recent_payouts = seller.payouts.all()[:5]
        paid_or_processing_payouts = seller.payouts.filter(
            status__in=[SellerPayout.STATUS_PAID, SellerPayout.STATUS_PROCESSING]
        ).aggregate(total=Sum("net_amount"))["total"] or 0
        payout_balance = total_revenue - paid_or_processing_payouts
        demand_forecast = demand_forecast_for_seller(seller)
        stockout_predictions = low_stock_predictions_for_seller(seller)
        promotion_suggestions = promotion_suggestions_for_seller(seller)
        fraud_alerts = fraud_flags_for_seller(seller)

        return Response({
            "seller": SellerProfileSerializer(seller).data,
            "total_products": products.count(),
            "published": products.filter(is_published=True).count(),
            "pending": products.filter(status=Product.STATUS_PENDING).count(),
            "total_orders": orders.count(),
            "analytics": {
                "total_revenue": str(total_revenue),
                "conversion_rate": conversion_rate,
                "paid_orders": paid_order_count,
                "pending_orders": pending_order_count,
                "low_stock_count": len(low_stock),
                "payout_balance": str(payout_balance),
                "revenue_chart": revenue_chart,
                "product_performance": product_performance,
                "low_stock": low_stock,
                "demand_forecast": demand_forecast,
                "stockout_predictions": stockout_predictions,
                "promotion_suggestions": promotion_suggestions,
                "fraud_alerts": fraud_alerts,
                "recent_payouts": SellerPayoutSerializer(recent_payouts, many=True).data,
            },
            "recent_products": ProductListSerializer(
                products.order_by("-created_at")[:5],
                many=True,
                context={"request": request},
            ).data,
        })


class SellerProductListCreateView(APIView):
    permission_classes = (permissions.AllowAny,)
    authentication_classes = []

    def get(self, request):
        seller = get_seller_from_request(request)
        if not seller:
            return Response({"error": "Unauthorized."}, status=401)
        products = seller.products.all().order_by("-created_at")
        return Response(ProductListSerializer(products, many=True, context={"request": request}).data)

    def post(self, request):
        seller = get_seller_from_request(request)
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
    authentication_classes = []

    def _get_product(self, seller, product_id):
        try:
            return seller.products.get(id=product_id)
        except Product.DoesNotExist:
            return None

    def get(self, request, pk):
        seller = get_seller_from_request(request)
        if not seller:
            return Response({"error": "Unauthorized."}, status=401)
        product = self._get_product(seller, pk)
        if not product:
            return Response({"error": "Not found."}, status=404)
        return Response(ProductDetailSerializer(product, context={"request": request}).data)

    def patch(self, request, pk):
        seller = get_seller_from_request(request)
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
        seller = get_seller_from_request(request)
        if not seller:
            return Response({"error": "Unauthorized."}, status=401)
        product = self._get_product(seller, pk)
        if not product:
            return Response({"error": "Not found."}, status=404)
        product.seller = None
        product.save(update_fields=["seller", "updated_at"])
        return Response(status=204)


class SellerOrderListView(APIView):
    permission_classes = (permissions.AllowAny,)
    authentication_classes = []

    def get(self, request):
        seller = get_seller_from_request(request)
        if not seller:
            return Response({"error": "Unauthorized."}, status=401)
        from orders.models import OrderItem

        items = (
            OrderItem.objects
            .filter(seller=seller)
            .select_related("order")
            .order_by("-order__created_at")
        )
        result = []
        for item in items:
            order = item.order
            result.append({
                "order_id": order.id,
                "status": order.status,
                "customer": order.customer_name,
                "product_name": item.product_name,
                "product_image": item.product_image,
                "quantity": item.quantity,
                "unit_price": str(item.unit_price),
                "subtotal": str(item.subtotal),
                "created_at": order.created_at.isoformat(),
            })
        return Response(result)
