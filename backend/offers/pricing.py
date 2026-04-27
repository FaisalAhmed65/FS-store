from decimal import Decimal, ROUND_HALF_UP

from django.db.models import Q
from django.utils import timezone

from .models import PricelistOffer


MONEY = Decimal("0.01")


def as_money(value):
    return Decimal(value or 0).quantize(MONEY, rounding=ROUND_HALF_UP)


def active_offer_queryset(*, coupon_code=None, now=None):
    now = now or timezone.now()
    qs = (
        PricelistOffer.objects.filter(is_active=True)
        .filter(Q(valid_from__isnull=True) | Q(valid_from__lte=now))
        .filter(Q(valid_to__isnull=True) | Q(valid_to__gte=now))
        .select_related("product", "category", "seller")
    )
    if coupon_code:
        return qs.filter(Q(coupon_code="") | Q(coupon_code__iexact=coupon_code.strip()))
    return qs.filter(coupon_code="")


def product_matches_category(product, category_id):
    category = product.category
    while category:
        if category.id == category_id:
            return True
        category = category.parent
    return False


def discount_amount(rule, base_amount):
    base_amount = as_money(base_amount)
    if base_amount <= 0:
        return Decimal("0.00")
    if rule.discount_type == PricelistOffer.PERCENT:
        discount = base_amount * as_money(rule.discount_value) / Decimal("100")
    else:
        discount = as_money(rule.discount_value)
    if rule.max_discount_amount:
        discount = min(discount, as_money(rule.max_discount_amount))
    return min(as_money(discount), base_amount)


def rule_applies_to_line(rule, product, quantity, cart_subtotal):
    if quantity < rule.min_qty or as_money(cart_subtotal) < as_money(rule.min_order_total):
        return False
    if rule.scope == PricelistOffer.SCOPE_PRODUCT:
        return rule.product_id == product.id
    if rule.scope == PricelistOffer.SCOPE_CATEGORY:
        return bool(rule.category_id and product_matches_category(product, rule.category_id))
    if rule.scope == PricelistOffer.SCOPE_SELLER:
        return bool(rule.seller_id and product.seller_id == rule.seller_id)
    return False


def rule_applies_to_cart(rule, total_quantity, cart_subtotal):
    return (
        rule.scope == PricelistOffer.SCOPE_CART
        and total_quantity >= rule.min_qty
        and as_money(cart_subtotal) >= as_money(rule.min_order_total)
    )


def serialize_rule(rule, amount):
    return {
        "id": rule.id,
        "name": rule.name,
        "campaign_name": rule.campaign_name,
        "scope": rule.scope,
        "coupon_code": rule.coupon_code,
        "discount_type": rule.discount_type,
        "discount_value": str(rule.discount_value),
        "amount": str(as_money(amount)),
    }


def price_cart(cart_items, *, coupon_code=None, now=None):
    """
    Price a cart from trusted Product objects.

    cart_items format:
      [{"product": Product, "quantity": 2}, ...]
    """
    now = now or timezone.now()
    normalized_items = []
    subtotal = Decimal("0.00")
    total_quantity = 0

    for item in cart_items:
        product = item["product"]
        quantity = int(item.get("quantity") or 1)
        line_total = as_money(product.price) * quantity
        subtotal += line_total
        total_quantity += quantity
        normalized_items.append(
            {
                "product": product,
                "quantity": quantity,
                "original_unit_price": as_money(product.price),
                "line_total": as_money(line_total),
            }
        )

    rules = list(active_offer_queryset(coupon_code=coupon_code, now=now))
    line_discount_total = Decimal("0.00")
    priced_items = []
    applied_discounts = []

    for item in normalized_items:
        product = item["product"]
        quantity = item["quantity"]
        candidates = []
        for rule in rules:
            if rule_applies_to_line(rule, product, quantity, subtotal):
                amount = discount_amount(rule, item["line_total"])
                if amount > 0:
                    candidates.append((amount, rule.priority, rule))
        candidates.sort(key=lambda entry: (-entry[0], entry[1], entry[2].id))
        best_amount, _, best_rule = candidates[0] if candidates else (Decimal("0.00"), 0, None)
        final_line_total = as_money(item["line_total"] - best_amount)
        final_unit_price = as_money(final_line_total / quantity)
        if best_rule:
            discount = serialize_rule(best_rule, best_amount)
            applied_discounts.append(discount)
        else:
            discount = None
        line_discount_total += best_amount
        priced_items.append(
            {
                "product": product,
                "quantity": quantity,
                "original_unit_price": item["original_unit_price"],
                "unit_price": final_unit_price,
                "subtotal": final_line_total,
                "discount_amount": as_money(best_amount),
                "applied_discount": discount,
            }
        )

    after_line_discounts = as_money(subtotal - line_discount_total)
    cart_candidates = []
    for rule in rules:
        if rule_applies_to_cart(rule, total_quantity, subtotal):
            amount = discount_amount(rule, after_line_discounts)
            if amount > 0:
                cart_candidates.append((amount, rule.priority, rule))
    cart_candidates.sort(key=lambda entry: (-entry[0], entry[1], entry[2].id))
    cart_discount = Decimal("0.00")
    if cart_candidates:
        cart_discount, _, cart_rule = cart_candidates[0]
        applied_discounts.append(serialize_rule(cart_rule, cart_discount))

    discount_total = as_money(line_discount_total + cart_discount)
    total = as_money(subtotal - discount_total)
    requested_coupon = (coupon_code or "").strip()
    coupon_applied = bool(
        requested_coupon
        and any(d["coupon_code"].lower() == requested_coupon.lower() for d in applied_discounts if d["coupon_code"])
    )

    return {
        "items": priced_items,
        "subtotal": as_money(subtotal),
        "line_discount_total": as_money(line_discount_total),
        "cart_discount_total": as_money(cart_discount),
        "discount_total": discount_total,
        "total": total,
        "coupon_code": requested_coupon,
        "coupon_applied": coupon_applied,
        "applied_discounts": applied_discounts,
    }
