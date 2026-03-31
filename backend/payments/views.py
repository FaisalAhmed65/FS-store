"""
payments/views.py
─────────────────
SSLCommerz payment gateway integration.

Flow:
  1. POST /api/v1/payments/initiate/   → returns { gateway_url }
  2. Customer redirected to SSLCommerz page (bKash, Nagad, Rocket, card…)
  3. SSLCommerz POSTs to one of:
     • /api/v1/payments/success/
     • /api/v1/payments/fail/
     • /api/v1/payments/cancel/
     • /api/v1/payments/ipn/   ← primary server-to-server notification

All monetary values are in BDT (Bangladeshi Taka).
"""
import uuid
import logging
import requests

from django.conf  import settings
from django.utils import timezone
from rest_framework             import permissions, status
from rest_framework.response    import Response
from rest_framework.views       import APIView

from orders.models  import Order
from .models        import PaymentTransaction
from .serializers   import PaymentTransactionSerializer

logger = logging.getLogger(__name__)

FRONTEND_URL = getattr(settings, "FRONTEND_URL", "http://localhost:3000")
BACKEND_URL  = getattr(settings, "BACKEND_URL",  "http://localhost:8000")


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
            order = Order.objects.get(id=order_id, customer=request.user)
        except Order.DoesNotExist:
            return Response({"error": "Order not found."}, status=404)

        if order.payments.filter(status=PaymentTransaction.STATUS_SUCCESS).exists():
            return Response({"error": "Order already paid."}, status=400)

        tran_id = str(uuid.uuid4()).replace("-", "")[:32]

        txn = PaymentTransaction.objects.create(
            order    = order,
            tran_id  = tran_id,
            amount   = order.total_price,
            currency = "BDT",
        )

        payload = {
            "store_id":      settings.SSLCZ_STORE_ID,
            "store_passwd":  settings.SSLCZ_STORE_PASSWD,
            "total_amount":  str(order.total_price),
            "currency":      "BDT",
            "tran_id":       tran_id,

            # Redirect URLs
            "success_url":   f"{BACKEND_URL}/api/v1/payments/success/",
            "fail_url":      f"{BACKEND_URL}/api/v1/payments/fail/",
            "cancel_url":    f"{BACKEND_URL}/api/v1/payments/cancel/",
            "ipn_url":       f"{BACKEND_URL}/api/v1/payments/ipn/",

            # Customer info (required by SSLCommerz)
            "cus_name":      order.customer_name or request.user.get_full_name() or "Customer",
            "cus_email":     order.customer_email or request.user.email,
            "cus_phone":     order.shipping_phone or "01700000000",
            "cus_add1":      order.shipping_street or "N/A",
            "cus_city":      order.shipping_city   or "Dhaka",
            "cus_country":   order.shipping_country or "Bangladesh",
            "cus_postcode":  order.shipping_zip    or "1000",

            # Shipping (same as billing)
            "shipping_method": "Courier",
            "ship_name":       order.shipping_name   or order.customer_name,
            "ship_add1":       order.shipping_street or "N/A",
            "ship_city":       order.shipping_city   or "Dhaka",
            "ship_country":    order.shipping_country or "Bangladesh",
            "ship_postcode":   order.shipping_zip    or "1000",

            # Product info (required)
            "num_of_item":     order.items.count(),
            "product_name":    f"TRD Store Order #{order.id}",
            "product_category": "Mixed",
            "product_profile":  "general",
        }

        try:
            res = requests.post(settings.SSLCZ_INIT_URL, data=payload, timeout=20)
            res.raise_for_status()
            data = res.json()
        except Exception as exc:
            logger.error("SSLCommerz initiate error: %s", exc)
            txn.status = PaymentTransaction.STATUS_FAILED
            txn.save(update_fields=["status"])
            return Response({"error": "Payment gateway unavailable. Please try again."}, status=502)

        if data.get("status") != "SUCCESS":
            txn.status = PaymentTransaction.STATUS_FAILED
            txn.raw_response = data
            txn.save(update_fields=["status", "raw_response"])
            return Response(
                {"error": data.get("failedReason", "Gateway error.")},
                status=502
            )

        return Response({
            "gateway_url": data["GatewayPageURL"],
            "tran_id":     tran_id,
        })


class _SSLCommerzCallbackBase(APIView):
    """Shared logic for success / fail / cancel POST callbacks."""
    permission_classes = (permissions.AllowAny,)
    csrf_exempt = True

    expected_status = PaymentTransaction.STATUS_PENDING  # override in subclass

    def post(self, request):
        tran_id = request.data.get("tran_id") or request.POST.get("tran_id", "")
        try:
            txn = PaymentTransaction.objects.get(tran_id=tran_id)
        except PaymentTransaction.DoesNotExist:
            return Response({"error": "Unknown transaction."}, status=400)

        self._update_txn(txn, request.data or request.POST)
        self._post_update(txn)

        # Redirect the customer to the frontend
        redirect_url = self._frontend_redirect(txn)
        from django.shortcuts import redirect
        return redirect(redirect_url)

    def _update_txn(self, txn, data):
        txn.status       = self.expected_status
        txn.val_id       = data.get("val_id", "")
        txn.bank_tran_id = data.get("bank_tran_id", "")
        txn.card_type    = data.get("card_type", "")
        try:
            txn.store_amount = float(data.get("store_amount", 0))
        except (ValueError, TypeError):
            pass
        txn.risk_level   = data.get("risk_level", "")
        txn.raw_response = dict(data)
        txn.save()

    def _post_update(self, txn):
        pass  # override for side effects (e.g. mark order paid)

    def _frontend_redirect(self, txn):
        return f"{FRONTEND_URL}/checkout/result?tran_id={txn.tran_id}&status={txn.status}"


class PaymentSuccessView(_SSLCommerzCallbackBase):
    expected_status = PaymentTransaction.STATUS_SUCCESS

    def _post_update(self, txn):
        """Validate with SSLCommerz, then mark order paid."""
        # Server-side validation (prevents tampering)
        try:
            vres = requests.get(
                settings.SSLCZ_VALIDATION_URL,
                params={
                    "val_id":     txn.val_id,
                    "store_id":   settings.SSLCZ_STORE_ID,
                    "store_passwd": settings.SSLCZ_STORE_PASSWD,
                    "v":          1,
                    "format":     "json",
                },
                timeout=15,
            ).json()
        except Exception as exc:
            logger.error("SSLCommerz validation error for %s: %s", txn.tran_id, exc)
            return

        if vres.get("status") != "VALID" and vres.get("status") != "VALIDATED":
            logger.warning("SSLCommerz validation FAILED for tran_id=%s: %s", txn.tran_id, vres)
            txn.status = PaymentTransaction.STATUS_FAILED
            txn.save(update_fields=["status"])
            return

        # Mark order as confirmed
        order = txn.order
        order.status = "confirmed"
        order.save(update_fields=["status"])
        logger.info("Order #%s paid via SSLCommerz (%s)", order.id, txn.card_type)


class PaymentFailView(_SSLCommerzCallbackBase):
    expected_status = PaymentTransaction.STATUS_FAILED


class PaymentCancelView(_SSLCommerzCallbackBase):
    expected_status = PaymentTransaction.STATUS_CANCELLED


class PaymentIPNView(APIView):
    """
    Server-to-server Instant Payment Notification from SSLCommerz.
    This is the most reliable callback — process it even if the browser redirect fails.
    """
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        data    = request.data or request.POST
        tran_id = data.get("tran_id", "")
        try:
            txn = PaymentTransaction.objects.get(tran_id=tran_id)
        except PaymentTransaction.DoesNotExist:
            logger.warning("IPN for unknown tran_id=%s", tran_id)
            return Response(status=200)  # Always 200 to stop SSLCommerz retries

        if txn.status == PaymentTransaction.STATUS_SUCCESS:
            return Response(status=200)  # Already processed

        sslcz_status = data.get("status", "")
        if sslcz_status == "VALID" or sslcz_status == "VALIDATED":
            txn.status       = PaymentTransaction.STATUS_SUCCESS
            txn.val_id       = data.get("val_id", "")
            txn.bank_tran_id = data.get("bank_tran_id", "")
            txn.card_type    = data.get("card_type", "")
            txn.raw_response = dict(data)
            txn.save()
            order = txn.order
            order.status = "confirmed"
            order.save(update_fields=["status"])
            logger.info("IPN: Order #%s paid (tran_id=%s)", order.id, tran_id)

        return Response(status=200)


class PaymentStatusView(APIView):
    """GET /api/v1/payments/status/<tran_id>/ — check payment status."""
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request, tran_id):
        try:
            txn = PaymentTransaction.objects.get(
                tran_id=tran_id,
                order__customer=request.user
            )
        except PaymentTransaction.DoesNotExist:
            return Response({"error": "Not found."}, status=404)
        return Response(PaymentTransactionSerializer(txn).data)
