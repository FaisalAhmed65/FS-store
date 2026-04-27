from dataclasses import dataclass
from decimal import Decimal, InvalidOperation

from django.db import transaction
from django.utils import timezone

from orders.models import Order
from orders.services import convert_order_reservations, release_order_reservations
from .models import PaymentTransaction, PaymentWebhookEvent


PAID_ORDER_STATES = {
    Order.STATUS_PAID,
    Order.STATUS_PROCESSING,
    Order.STATUS_SHIPPED,
    Order.STATUS_DELIVERED,
    Order.STATUS_REFUNDED,
}


@dataclass
class CallbackResult:
    transaction: PaymentTransaction
    event: PaymentWebhookEvent | None
    duplicate: bool = False
    processed: bool = False


def normalize_payload(data):
    if hasattr(data, "dict"):
        data = data.dict()
    normalized = {}
    for key, value in dict(data).items():
        if isinstance(value, (list, tuple)):
            normalized[key] = value[0] if value else ""
        else:
            normalized[key] = value
    return normalized


def parse_decimal(value):
    try:
        return Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError):
        return None


def webhook_event_key(gateway, tran_id, payload, event_type):
    val_id = payload.get("val_id") or ""
    bank_tran_id = payload.get("bank_tran_id") or payload.get("card_issuer") or ""
    gateway_status = payload.get("status") or ""
    if val_id:
        source = f"val:{val_id}"
    elif bank_tran_id:
        source = f"bank:{bank_tran_id}"
    else:
        source = f"{tran_id}:{event_type}:{gateway_status}"
    return f"{gateway}:{source}"


def update_transaction_from_payload(txn, payload, status_value):
    now = timezone.now()
    txn.status = status_value
    txn.val_id = payload.get("val_id", "") or txn.val_id
    txn.bank_tran_id = payload.get("bank_tran_id", "") or txn.bank_tran_id
    txn.gateway_transaction_id = (
        payload.get("bank_tran_id")
        or payload.get("val_id")
        or payload.get("tran_id")
        or txn.gateway_transaction_id
    )
    txn.card_type = payload.get("card_type", "") or txn.card_type
    store_amount = parse_decimal(payload.get("store_amount"))
    if store_amount is not None:
        txn.store_amount = store_amount
    txn.risk_level = payload.get("risk_level", "") or txn.risk_level
    txn.raw_response = payload
    txn.callback_count = (txn.callback_count or 0) + 1
    txn.last_callback_at = now
    txn.processed_at = now
    if status_value == PaymentTransaction.STATUS_SUCCESS and not txn.paid_at:
        txn.paid_at = now
    txn.save(
        update_fields=[
            "status",
            "val_id",
            "bank_tran_id",
            "gateway_transaction_id",
            "card_type",
            "store_amount",
            "risk_level",
            "raw_response",
            "callback_count",
            "last_callback_at",
            "processed_at",
            "paid_at",
            "updated_at",
        ]
    )


def mark_order_paid(order):
    converted = convert_order_reservations(order)
    if order.status == Order.STATUS_CART:
        order.transition_to(Order.STATUS_PENDING_PAYMENT)
    if order.status == Order.STATUS_PENDING_PAYMENT:
        order.transition_to(Order.STATUS_PAID)
    return converted


def cancel_unpaid_order(order, reason):
    release_order_reservations(order, reason=reason)
    if order.status in {Order.STATUS_CART, Order.STATUS_PENDING_PAYMENT}:
        order.transition_to(Order.STATUS_CANCELLED)


@transaction.atomic
def process_gateway_callback(*, tran_id, payload, target_status, event_type, gateway="sslcommerz"):
    payload = normalize_payload(payload)
    txn = (
        PaymentTransaction.objects.select_for_update()
        .select_related("order")
        .get(tran_id=tran_id)
    )
    order = Order.objects.select_for_update().get(id=txn.order_id)
    event_key = webhook_event_key(gateway, tran_id, payload, event_type)
    event, created = PaymentWebhookEvent.objects.get_or_create(
        event_key=event_key,
        defaults={
            "gateway": gateway,
            "payment": txn,
            "tran_id": tran_id,
            "event_type": event_type,
            "gateway_status": payload.get("status", ""),
            "raw_payload": payload,
        },
    )

    if not created:
        txn.callback_count = (txn.callback_count or 0) + 1
        txn.last_callback_at = timezone.now()
        txn.save(update_fields=["callback_count", "last_callback_at", "updated_at"])
        return CallbackResult(transaction=txn, event=event, duplicate=True)

    if txn.status == PaymentTransaction.STATUS_SUCCESS or order.status in PAID_ORDER_STATES:
        event.duplicate = True
        event.processed = False
        event.processed_at = timezone.now()
        event.save(update_fields=["duplicate", "processed", "processed_at"])
        return CallbackResult(transaction=txn, event=event, duplicate=True)

    update_transaction_from_payload(txn, payload, target_status)

    if target_status == PaymentTransaction.STATUS_SUCCESS:
        if order.status == Order.STATUS_CANCELLED:
            processed = False
        else:
            mark_order_paid(order)
            processed = True
    elif target_status in {PaymentTransaction.STATUS_FAILED, PaymentTransaction.STATUS_CANCELLED}:
        cancel_unpaid_order(order, reason=f"payment_{target_status}")
        processed = True
    else:
        processed = False

    event.processed = processed
    event.processed_at = timezone.now()
    event.save(update_fields=["processed", "processed_at"])
    return CallbackResult(transaction=txn, event=event, processed=processed)
