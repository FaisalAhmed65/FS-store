"""
SSLCommerz payment gateway integration.

Flow:
  1. POST /api/v1/payments/initiate/ returns { gateway_url }
  2. Customer pays on SSLCommerz.
  3. Browser callbacks and IPN are processed idempotently.
"""
import logging
import uuid

import requests
from django.conf import settings
from django.shortcuts import redirect
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from orders.models import Order
from orders.services import release_expired_reservations, release_order_reservations
from .models import PaymentTransaction
from .serializers import PaymentTransactionSerializer
from .services import process_gateway_callback

logger = logging.getLogger(__name__)

FRONTEND_URL = getattr(settings, "FRONTEND_URL", "http://localhost:3000")
BACKEND_URL = getattr(settings, "BACKEND_URL", "http://localhost:8000")


class InitiatePaymentView(APIView):
    """
    POST /api/v1/payments/initiate/
    Body: { "order_id": 123 }
    Returns: { "gateway_url": "https://sandbox.sslcommerz.com/..." }
    """

    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        order_id = request.data.get("order_id")
        try:
            order = (
                Order.objects.prefetch_related("items")
                .get(id=order_id, customer=request.user)
            )
        except Order.DoesNotExist:
            return Response({"error": "Order not found."}, status=404)

        if order.payments.filter(status=PaymentTransaction.STATUS_SUCCESS).exists():
            return Response({"error": "Order already paid."}, status=400)

        release_expired_reservations(
            product_ids=list(order.items.values_list("product_id", flat=True))
        )
        order.refresh_from_db()
        if order.status != Order.STATUS_PENDING_PAYMENT:
            return Response({"error": "Order is not awaiting payment."}, status=400)
        if order.reservation_expires_at and order.reservation_expires_at <= timezone.now():
            return Response({"error": "Stock reservation expired. Please checkout again."}, status=400)

        tran_id = str(uuid.uuid4()).replace("-", "")[:32]
        txn = PaymentTransaction.objects.create(
            order=order,
            tran_id=tran_id,
            amount=order.total_price,
            currency="BDT",
        )

        payload = {
            "store_id": settings.SSLCZ_STORE_ID,
            "store_passwd": settings.SSLCZ_STORE_PASSWD,
            "total_amount": str(order.total_price),
            "currency": "BDT",
            "tran_id": tran_id,
            "success_url": f"{BACKEND_URL}/api/v1/payments/success/",
            "fail_url": f"{BACKEND_URL}/api/v1/payments/fail/",
            "cancel_url": f"{BACKEND_URL}/api/v1/payments/cancel/",
            "ipn_url": f"{BACKEND_URL}/api/v1/payments/ipn/",
            "cus_name": order.customer_name or request.user.get_full_name() or "Customer",
            "cus_email": order.customer_email or request.user.email,
            "cus_phone": order.shipping_phone or "01700000000",
            "cus_add1": order.shipping_street or "N/A",
            "cus_city": order.shipping_city or "Dhaka",
            "cus_country": order.shipping_country or "Bangladesh",
            "cus_postcode": order.shipping_zip or "1000",
            "shipping_method": "Courier",
            "ship_name": order.shipping_name or order.customer_name,
            "ship_add1": order.shipping_street or "N/A",
            "ship_city": order.shipping_city or "Dhaka",
            "ship_country": order.shipping_country or "Bangladesh",
            "ship_postcode": order.shipping_zip or "1000",
            "num_of_item": order.items.count(),
            "product_name": f"TRD Store Order #{order.id}",
            "product_category": "Mixed",
            "product_profile": "general",
        }

        try:
            res = requests.post(settings.SSLCZ_INIT_URL, data=payload, timeout=20)
            res.raise_for_status()
            data = res.json()
        except Exception as exc:
            logger.error("SSLCommerz initiate error: %s", exc)
            txn.status = PaymentTransaction.STATUS_FAILED
            txn.save(update_fields=["status", "updated_at"])
            release_order_reservations(order, reason="gateway_unavailable")
            order.refresh_from_db()
            if order.status == Order.STATUS_PENDING_PAYMENT:
                order.transition_to(Order.STATUS_CANCELLED)
            return Response({"error": "Payment gateway unavailable. Please try again."}, status=502)

        if data.get("status") != "SUCCESS":
            txn.status = PaymentTransaction.STATUS_FAILED
            txn.raw_response = data
            txn.save(update_fields=["status", "raw_response", "updated_at"])
            release_order_reservations(order, reason="gateway_rejected")
            order.refresh_from_db()
            if order.status == Order.STATUS_PENDING_PAYMENT:
                order.transition_to(Order.STATUS_CANCELLED)
            return Response(
                {"error": data.get("failedReason", "Gateway error.")},
                status=502,
            )

        return Response({"gateway_url": data["GatewayPageURL"], "tran_id": tran_id})


@method_decorator(csrf_exempt, name="dispatch")
class _SSLCommerzCallbackBase(APIView):
    """Shared browser callback logic for success, fail and cancel endpoints."""

    permission_classes = (permissions.AllowAny,)
    expected_status = PaymentTransaction.STATUS_PENDING
    event_type = "callback"

    def post(self, request):
        payload = request.data or request.POST
        tran_id = payload.get("tran_id", "")
        try:
            result = self.process_callback(tran_id, payload)
        except PaymentTransaction.DoesNotExist:
            return Response({"error": "Unknown transaction."}, status=400)
        return redirect(self.frontend_redirect(result.transaction))

    def process_callback(self, tran_id, payload):
        return process_gateway_callback(
            tran_id=tran_id,
            payload=payload,
            target_status=self.expected_status,
            event_type=self.event_type,
        )

    def frontend_redirect(self, txn):
        return f"{FRONTEND_URL}/checkout/result?tran_id={txn.tran_id}&status={txn.status}"


class PaymentSuccessView(_SSLCommerzCallbackBase):
    expected_status = PaymentTransaction.STATUS_SUCCESS
    event_type = "success"

    def process_callback(self, tran_id, payload):
        val_id = payload.get("val_id", "")
        try:
            validation = requests.get(
                settings.SSLCZ_VALIDATION_URL,
                params={
                    "val_id": val_id,
                    "store_id": settings.SSLCZ_STORE_ID,
                    "store_passwd": settings.SSLCZ_STORE_PASSWD,
                    "v": 1,
                    "format": "json",
                },
                timeout=15,
            ).json()
        except Exception as exc:
            logger.error("SSLCommerz validation error for %s: %s", tran_id, exc)
            txn = PaymentTransaction.objects.get(tran_id=tran_id)
            txn.raw_response = {"callback": dict(payload), "validation_error": str(exc)}
            txn.save(update_fields=["raw_response", "updated_at"])
            return type("Result", (), {"transaction": txn})()

        if validation.get("status") not in {"VALID", "VALIDATED"}:
            logger.warning("SSLCommerz validation failed for tran_id=%s: %s", tran_id, validation)
            txn = PaymentTransaction.objects.get(tran_id=tran_id)
            txn.status = PaymentTransaction.STATUS_FAILED
            txn.raw_response = {"callback": dict(payload), "validation": validation}
            txn.save(update_fields=["status", "raw_response", "updated_at"])
            return type("Result", (), {"transaction": txn})()

        merged_payload = dict(payload)
        merged_payload.update({k: v for k, v in validation.items() if v not in (None, "")})
        return process_gateway_callback(
            tran_id=tran_id,
            payload=merged_payload,
            target_status=PaymentTransaction.STATUS_SUCCESS,
            event_type=self.event_type,
        )


class PaymentFailView(_SSLCommerzCallbackBase):
    expected_status = PaymentTransaction.STATUS_FAILED
    event_type = "fail"


class PaymentCancelView(_SSLCommerzCallbackBase):
    expected_status = PaymentTransaction.STATUS_CANCELLED
    event_type = "cancel"


@method_decorator(csrf_exempt, name="dispatch")
class PaymentIPNView(APIView):
    """Server-to-server Instant Payment Notification from SSLCommerz."""

    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        payload = request.data or request.POST
        tran_id = payload.get("tran_id", "")
        if not tran_id:
            return Response(status=200)

        sslcz_status = (payload.get("status") or "").upper()
        if sslcz_status in {"VALID", "VALIDATED"}:
            target_status = PaymentTransaction.STATUS_SUCCESS
            event_type = "ipn_success"
        elif sslcz_status in {"FAILED", "FAIL"}:
            target_status = PaymentTransaction.STATUS_FAILED
            event_type = "ipn_fail"
        elif sslcz_status in {"CANCELLED", "CANCEL"}:
            target_status = PaymentTransaction.STATUS_CANCELLED
            event_type = "ipn_cancel"
        else:
            logger.info("Ignoring SSLCommerz IPN with status=%s tran_id=%s", sslcz_status, tran_id)
            return Response(status=200)

        try:
            process_gateway_callback(
                tran_id=tran_id,
                payload=payload,
                target_status=target_status,
                event_type=event_type,
            )
        except PaymentTransaction.DoesNotExist:
            logger.warning("IPN for unknown tran_id=%s", tran_id)

        return Response(status=200)


class PaymentStatusView(APIView):
    """GET /api/v1/payments/status/<tran_id>/ - check payment status."""

    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request, tran_id):
        try:
            txn = PaymentTransaction.objects.get(
                tran_id=tran_id,
                order__customer=request.user,
            )
        except PaymentTransaction.DoesNotExist:
            return Response({"error": "Not found."}, status=404)
        return Response(PaymentTransactionSerializer(txn).data)
