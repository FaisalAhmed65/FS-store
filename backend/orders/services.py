from collections import defaultdict
from datetime import timedelta

from django.conf import settings
from django.db import transaction
from django.db.models import F
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from offers.pricing import price_cart
from products.models import Product
from .models import Order, OrderItem, SellerDelivery, StockReservation


def reservation_window():
    minutes = getattr(settings, "INVENTORY_RESERVATION_MINUTES", 15)
    return timezone.now() + timedelta(minutes=minutes)


def product_image_snapshot(product):
    if product.image:
        return product.image.url
    image = product.images.filter(is_main=True).first() or product.images.first()
    return image.image.url if image else ""


@transaction.atomic
def release_expired_reservations(*, now=None, product_ids=None):
    now = now or timezone.now()
    reservations = StockReservation.objects.select_for_update().filter(
        status=StockReservation.STATUS_ACTIVE,
        expires_at__lte=now,
    )
    if product_ids:
        reservations = reservations.filter(product_id__in=product_ids)

    reservations = list(reservations.select_related("order", "product"))
    if not reservations:
        return 0

    locked_product_ids = {reservation.product_id for reservation in reservations}
    list(Product.objects.select_for_update().filter(id__in=locked_product_ids))
    order_ids = {reservation.order_id for reservation in reservations}
    orders = {
        order.id: order
        for order in Order.objects.select_for_update().filter(id__in=order_ids)
    }

    released_count = 0
    for reservation in reservations:
        Product.objects.filter(id=reservation.product_id).update(
            stock_quantity=F("stock_quantity") + reservation.quantity
        )
        reservation.status = StockReservation.STATUS_RELEASED
        reservation.reason = "expired"
        reservation.released_at = now
        reservation.save(update_fields=["status", "reason", "released_at", "updated_at"])
        released_count += 1

    for order in orders.values():
        if order.status == Order.STATUS_PENDING_PAYMENT:
            order.transition_to(Order.STATUS_CANCELLED)

    return released_count


@transaction.atomic
def release_order_reservations(order, *, reason="payment_failed"):
    now = timezone.now()
    locked_order = Order.objects.select_for_update().get(id=order.id)
    reservations = list(
        StockReservation.objects.select_for_update().filter(
            order=locked_order,
            status=StockReservation.STATUS_ACTIVE,
        )
    )
    if not reservations:
        return 0

    list(Product.objects.select_for_update().filter(id__in={r.product_id for r in reservations}))
    released_count = 0
    for reservation in reservations:
        Product.objects.filter(id=reservation.product_id).update(
            stock_quantity=F("stock_quantity") + reservation.quantity
        )
        reservation.status = StockReservation.STATUS_RELEASED
        reservation.reason = reason
        reservation.released_at = now
        reservation.save(update_fields=["status", "reason", "released_at", "updated_at"])
        released_count += 1
    return released_count


@transaction.atomic
def convert_order_reservations(order):
    now = timezone.now()
    locked_order = Order.objects.select_for_update().get(id=order.id)
    reservations = list(
        StockReservation.objects.select_for_update().filter(
            order=locked_order,
            status=StockReservation.STATUS_ACTIVE,
        )
    )
    if not reservations:
        return StockReservation.objects.filter(
            order=locked_order,
            status=StockReservation.STATUS_CONVERTED,
        ).exists()

    list(Product.objects.select_for_update().filter(id__in={r.product_id for r in reservations}))
    for reservation in reservations:
        reservation.status = StockReservation.STATUS_CONVERTED
        reservation.converted_at = now
        reservation.save(update_fields=["status", "converted_at", "updated_at"])
        Product.objects.filter(id=reservation.product_id).update(
            sold_recently=F("sold_recently") + reservation.quantity
        )
    return True


def normalize_items(raw_items):
    quantities = defaultdict(int)
    for item in raw_items:
        product_id = item.get("product")
        quantity = int(item.get("quantity") or 1)
        if quantity < 1:
            raise ValidationError({"items": "Quantity must be at least 1."})
        quantities[product_id] += quantity
    if not quantities:
        raise ValidationError({"items": "At least one cart item is required."})
    return quantities


@transaction.atomic
def create_reserved_order(*, order_data, raw_items, coupon_code=""):
    quantities = normalize_items(raw_items)
    product_ids = list(quantities.keys())
    release_expired_reservations(product_ids=product_ids)

    products = {
        product.id: product
        for product in Product.objects.select_for_update()
        .select_related("category", "seller")
        .prefetch_related("images")
        .filter(id__in=product_ids)
    }
    missing_ids = [product_id for product_id in product_ids if product_id not in products]
    if missing_ids:
        raise ValidationError({"items": f"Unknown product id(s): {missing_ids}"})

    cart_items = []
    stock_errors = []
    for product_id, quantity in quantities.items():
        product = products[product_id]
        if not product.is_published or product.status != Product.STATUS_APPROVED:
            stock_errors.append(f"{product.name} is not available.")
            continue
        if product.stock_quantity < quantity:
            stock_errors.append(
                f"{product.name} has only {product.stock_quantity} item(s) available."
            )
            continue
        cart_items.append({"product": product, "quantity": quantity})
    if stock_errors:
        raise ValidationError({"items": stock_errors})

    pricing = price_cart(cart_items, coupon_code=coupon_code)
    expires_at = reservation_window()
    order = Order.objects.create(
        **order_data,
        status=Order.STATUS_PENDING_PAYMENT,
        subtotal_price=pricing["subtotal"],
        discount_total=pricing["discount_total"],
        total_price=pricing["total"],
        coupon_code=pricing["coupon_code"],
        reservation_expires_at=expires_at,
    )

    seller_ids = set()
    for priced_item in pricing["items"]:
        product = priced_item["product"]
        quantity = priced_item["quantity"]
        product.stock_quantity -= quantity
        product.save(update_fields=["stock_quantity", "updated_at"])
        OrderItem.objects.create(
            order=order,
            product=product,
            seller=product.seller,
            product_name=product.name,
            product_image=product_image_snapshot(product),
            quantity=quantity,
            unit_price=priced_item["unit_price"],
            original_unit_price=priced_item["original_unit_price"],
            discount_amount=priced_item["discount_amount"],
            subtotal=priced_item["subtotal"],
        )
        StockReservation.objects.create(
            order=order,
            product=product,
            quantity=quantity,
            expires_at=expires_at,
        )
        if product.seller_id:
            seller_ids.add(product.seller_id)

    for seller_id in seller_ids:
        SellerDelivery.objects.get_or_create(order=order, seller_id=seller_id)

    order.pricing_summary = {
        "subtotal": str(pricing["subtotal"]),
        "discount_total": str(pricing["discount_total"]),
        "total": str(pricing["total"]),
        "coupon_applied": pricing["coupon_applied"],
        "applied_discounts": pricing["applied_discounts"],
    }
    return order


def order_has_active_reservation(order):
    return StockReservation.objects.filter(
        order=order,
        status=StockReservation.STATUS_ACTIVE,
        expires_at__gt=timezone.now(),
    ).exists()
