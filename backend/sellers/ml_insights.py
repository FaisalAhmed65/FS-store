from collections import defaultdict
from datetime import timedelta
from decimal import Decimal
from math import ceil

from django.db.models import Count, Sum
from django.utils import timezone

from orders.models import Order, OrderItem
from payments.models import PaymentTransaction, PaymentWebhookEvent


SALES_STATUSES = [
    Order.STATUS_PAID,
    Order.STATUS_PROCESSING,
    Order.STATUS_SHIPPED,
    Order.STATUS_DELIVERED,
]


def _seller_products(seller):
    return list(seller.products.all())


def _units_between(product_ids, start, end=None):
    if not product_ids:
        return {}
    qs = OrderItem.objects.filter(
        product_id__in=product_ids,
        order__status__in=SALES_STATUSES,
        order__created_at__gte=start,
    )
    if end:
        qs = qs.filter(order__created_at__lt=end)
    rows = qs.values("product_id").annotate(units=Sum("quantity"))
    return {row["product_id"]: int(row["units"] or 0) for row in rows}


def _trend_label(current_units, previous_units):
    if current_units > previous_units * 1.2:
        return "rising"
    if previous_units and current_units < previous_units * 0.8:
        return "cooling"
    return "steady"


def demand_forecast_for_seller(seller, *, limit=8):
    """Predict next-week demand with local sales velocity and trend signals."""
    now = timezone.now()
    products = _seller_products(seller)
    product_ids = [product.id for product in products]
    last_7 = _units_between(product_ids, now - timedelta(days=7))
    previous_7 = _units_between(
        product_ids,
        now - timedelta(days=14),
        now - timedelta(days=7),
    )
    last_28 = _units_between(product_ids, now - timedelta(days=28))

    forecasts = []
    for product in products:
        current_units = last_7.get(product.id, 0)
        previous_units = previous_7.get(product.id, 0)
        month_units = last_28.get(product.id, 0)

        if not month_units and product.sold_recently:
            month_units = int(product.sold_recently or 0)
            current_units = max(current_units, round(month_units / 4))

        baseline = (current_units * Decimal("0.70")) + ((Decimal(month_units) / 4) * Decimal("0.30"))
        growth = Decimal(current_units + 1) / Decimal(previous_units + 1)
        growth = max(Decimal("0.65"), min(growth, Decimal("1.75")))
        forecast_units = int(round(baseline * growth))
        if forecast_units <= 0:
            continue

        confidence = min(
            Decimal("0.95"),
            Decimal("0.35")
            + min(Decimal(month_units) / Decimal("40"), Decimal("0.35"))
            + min(Decimal(current_units) / Decimal("15"), Decimal("0.20")),
        )
        forecasts.append({
            "product_id": product.id,
            "product_name": product.name,
            "sku": product.sku,
            "stock_quantity": product.stock_quantity,
            "forecast_units_next_7_days": forecast_units,
            "last_7_days_units": current_units,
            "previous_7_days_units": previous_units,
            "trend": _trend_label(current_units, previous_units),
            "confidence": float(round(confidence, 2)),
        })

    forecasts.sort(
        key=lambda row: (
            row["forecast_units_next_7_days"],
            row["last_7_days_units"],
            row["stock_quantity"],
        ),
        reverse=True,
    )
    return forecasts[:limit]


def low_stock_predictions_for_seller(seller, *, limit=10):
    """Warn before stock runs out by combining inventory with sales velocity."""
    now = timezone.now()
    products = _seller_products(seller)
    product_ids = [product.id for product in products]
    last_14 = _units_between(product_ids, now - timedelta(days=14))
    last_30 = _units_between(product_ids, now - timedelta(days=30))

    warnings = []
    for product in products:
        velocity = Decimal(last_14.get(product.id, 0)) / Decimal("14")
        if velocity <= 0:
            velocity = Decimal(last_30.get(product.id, 0)) / Decimal("30")
        if velocity <= 0 and product.sold_recently:
            velocity = Decimal(product.sold_recently or 0) / Decimal("30")

        days_left = None
        stockout_date = None
        if product.stock_quantity <= 0:
            days_left = Decimal("0")
        elif velocity > 0:
            days_left = Decimal(product.stock_quantity) / velocity

        should_warn = product.stock_quantity <= 5 or (days_left is not None and days_left <= 14)
        if not should_warn:
            continue

        if days_left is not None:
            stockout_date = (now + timedelta(days=float(days_left))).date().isoformat()
        if days_left is None or days_left > 14:
            risk_level = "medium"
        elif days_left <= 3 or product.stock_quantity <= 0:
            risk_level = "critical"
        elif days_left <= 7:
            risk_level = "high"
        else:
            risk_level = "medium"

        target_quantity = ceil(float(velocity * Decimal("21"))) if velocity > 0 else 10
        warnings.append({
            "product_id": product.id,
            "product_name": product.name,
            "sku": product.sku,
            "stock_quantity": product.stock_quantity,
            "daily_sales_velocity": float(round(velocity, 2)),
            "days_until_stockout": float(round(days_left, 1)) if days_left is not None else None,
            "predicted_stockout_date": stockout_date,
            "recommended_reorder_quantity": max(0, target_quantity - product.stock_quantity),
            "risk_level": risk_level,
        })

    warnings.sort(key=lambda row: (row["days_until_stockout"] is None, row["days_until_stockout"] or 999, row["stock_quantity"]))
    return warnings[:limit]


def promotion_suggestions_for_seller(seller, *, limit=8):
    """Suggest discount rules for slow-moving, overstocked products."""
    now = timezone.now()
    products = _seller_products(seller)
    product_ids = [product.id for product in products]
    last_30 = _units_between(product_ids, now - timedelta(days=30))
    last_60 = _units_between(product_ids, now - timedelta(days=60))

    suggestions = []
    for product in products:
        if product.stock_quantity <= 0 or not product.is_published:
            continue
        age_days = max(1, (now - product.created_at).days)
        units_30 = last_30.get(product.id, 0)
        units_60 = last_60.get(product.id, 0)

        discount = 0
        reason = ""
        if units_30 == 0 and age_days >= 14:
            discount = 15
            reason = "No sales in the last 30 days."
        elif product.stock_quantity >= 20 and units_30 <= max(1, product.stock_quantity // 20):
            discount = 10
            reason = "High stock with low recent sell-through."
        elif units_60 > 0 and units_30 < max(1, units_60 // 4):
            discount = 7
            reason = "Demand is cooling compared with the previous month."

        if not discount:
            continue

        min_order_total = product.price * Decimal("1.5")
        suggestions.append({
            "product_id": product.id,
            "product_name": product.name,
            "stock_quantity": product.stock_quantity,
            "last_30_days_units": units_30,
            "suggested_discount_percent": discount,
            "suggested_rule": "product_discount",
            "minimum_order_total": str(round(min_order_total, 2)),
            "valid_days": 7,
            "reason": reason,
        })

    suggestions.sort(
        key=lambda row: (
            row["suggested_discount_percent"],
            row["stock_quantity"],
            -row["last_30_days_units"],
        ),
        reverse=True,
    )
    return suggestions[:limit]


def fraud_flags_for_seller(seller, *, limit=8):
    """Flag suspicious seller-side order/payment patterns without external APIs."""
    products = _seller_products(seller)
    product_ids = [product.id for product in products]
    if not product_ids:
        return []

    order_items = OrderItem.objects.filter(product_id__in=product_ids).select_related("order")
    order_ids = list(order_items.values_list("order_id", flat=True).distinct())
    if not order_ids:
        return []

    flags = []
    seen = set()

    def add_flag(key, severity, title, detail, order_id=None, payment_id=None):
        if key in seen:
            return
        seen.add(key)
        flags.append({
            "severity": severity,
            "title": title,
            "detail": detail,
            "order_id": order_id,
            "payment_id": payment_id,
        })

    seller_order_totals = defaultdict(Decimal)
    for item in order_items:
        seller_order_totals[item.order_id] += item.subtotal or Decimal("0")
    totals = [total for total in seller_order_totals.values() if total > 0]
    average_total = sum(totals, Decimal("0")) / len(totals) if totals else Decimal("0")
    if average_total:
        for order_id, total in seller_order_totals.items():
            if total >= Decimal("5000") and total > average_total * Decimal("3"):
                add_flag(
                    f"high-value-{order_id}",
                    "high",
                    "Unusually high seller order value",
                    f"Seller item total {total} is much higher than the normal order average.",
                    order_id=order_id,
                )

    payments = PaymentTransaction.objects.filter(order_id__in=order_ids).select_related("order")
    for payment in payments:
        risk = str(payment.risk_level or "").strip().lower()
        if risk and risk not in {"0", "00", "low"}:
            add_flag(
                f"risk-{payment.id}",
                "high",
                "Gateway risk warning",
                f"Payment gateway returned risk level {payment.risk_level}.",
                order_id=payment.order_id,
                payment_id=payment.id,
            )
        if payment.callback_count > 1:
            add_flag(
                f"callback-{payment.id}",
                "medium",
                "Repeated payment callback",
                f"Gateway callback arrived {payment.callback_count} times for this transaction.",
                order_id=payment.order_id,
                payment_id=payment.id,
            )
        if payment.status in {PaymentTransaction.STATUS_FAILED, PaymentTransaction.STATUS_CANCELLED}:
            add_flag(
                f"failed-payment-{payment.id}",
                "medium",
                "Failed or cancelled payment attempt",
                "Order has a payment attempt that did not complete successfully.",
                order_id=payment.order_id,
                payment_id=payment.id,
            )
        if payment.order and payment.amount and abs(payment.amount - payment.order.total_price) > Decimal("1"):
            add_flag(
                f"amount-mismatch-{payment.id}",
                "critical",
                "Payment amount mismatch",
                "Payment amount does not match the order total.",
                order_id=payment.order_id,
                payment_id=payment.id,
            )

    duplicate_events = (
        PaymentWebhookEvent.objects.filter(payment__order_id__in=order_ids, duplicate=True)
        .values("payment_id", "payment__order_id")
        .annotate(count=Count("id"))
    )
    for row in duplicate_events:
        add_flag(
            f"duplicate-webhook-{row['payment_id']}",
            "medium",
            "Duplicate webhook ignored",
            f"{row['count']} duplicate gateway event(s) were safely ignored.",
            order_id=row["payment__order_id"],
            payment_id=row["payment_id"],
        )

    repeated_failures = (
        Order.objects.filter(
            id__in=order_ids,
            status__in=[Order.STATUS_CANCELLED, Order.STATUS_REFUNDED],
            created_at__gte=timezone.now() - timedelta(days=7),
        )
        .exclude(customer_email="")
        .values("customer_email")
        .annotate(count=Count("id"))
        .filter(count__gte=3)
    )
    for row in repeated_failures:
        add_flag(
            f"repeat-failure-{row['customer_email']}",
            "high",
            "Repeated failed orders from same customer",
            f"{row['count']} cancelled/refunded orders in the last 7 days.",
        )

    severity_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    flags.sort(key=lambda row: severity_order.get(row["severity"], 9))
    return flags[:limit]
