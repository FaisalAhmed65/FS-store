from collections import Counter, defaultdict
from decimal import Decimal
from math import log1p
from unicodedata import normalize

from django.db.models import Count, Sum
from django.utils import timezone

from orders.models import Order, OrderItem
from wishlists.models import WishlistItem
from .models import Product


PAID_ORDER_STATES = {
    Order.STATUS_PAID,
    Order.STATUS_PROCESSING,
    Order.STATUS_SHIPPED,
    Order.STATUS_DELIVERED,
}


def clamp_limit(value, default=12, maximum=48):
    try:
        value = int(value)
    except (TypeError, ValueError):
        value = default
    return max(1, min(value, maximum))


def parse_product_ids(value):
    if not value:
        return []
    ids = []
    for raw in str(value).split(","):
        raw = raw.strip()
        if raw.isdigit():
            ids.append(int(raw))
    return ids


def base_queryset():
    return (
        Product.objects.select_related("category", "seller")
        .prefetch_related("images")
        .filter(
            is_published=True,
            status=Product.STATUS_APPROVED,
            stock_quantity__gt=0,
        )
    )


def normalize_text(value):
    return normalize("NFKC", value or "").casefold()


def product_terms(product):
    category_name = product.category.name if product.category else ""
    seller_name = product.seller.business_name if product.seller else ""
    text = " ".join(
        [
            product.name,
            product.name_bn,
            product.brand,
            product.sku,
            category_name,
            seller_name,
        ]
    )
    return {token for token in normalize_text(text).split() if len(token) > 1}


def jaccard(left, right):
    if not left or not right:
        return 0
    return len(left & right) / len(left | right)


def price_similarity(left, right):
    left = Decimal(left or 0)
    right = Decimal(right or 0)
    if left <= 0 or right <= 0:
        return 0
    high = max(left, right)
    low = min(left, right)
    return float(low / high)


def category_chain(product):
    chain = []
    category = product.category
    while category:
        chain.append(category.id)
        category = category.parent
    return chain


def content_similarity(candidate, source):
    score = 0
    candidate_categories = category_chain(candidate)
    source_categories = category_chain(source)
    if candidate.category_id and candidate.category_id == source.category_id:
        score += 3
    elif set(candidate_categories) & set(source_categories):
        score += 1.5
    if candidate.brand and source.brand and candidate.brand.casefold() == source.brand.casefold():
        score += 2
    if candidate.seller_id and candidate.seller_id == source.seller_id:
        score += 1
    score += price_similarity(candidate.price, source.price)
    score += jaccard(product_terms(candidate), product_terms(source)) * 2
    return score


def freshness_score(product):
    if not product.created_at:
        return 0
    age_days = max(0, (timezone.now() - product.created_at).days)
    return max(0, 1 - (age_days / 90))


def popularity_score(product):
    stock_bonus = 1 if product.stock_quantity > 0 else -3
    rating = float(product.rating_avg or 0)
    return (
        log1p(product.sold_recently or 0) * 0.8
        + rating * 0.35
        + stock_bonus
        + freshness_score(product) * 0.6
    )


def popularity_reasons(product, *base_reasons):
    reasons = [reason for reason in base_reasons if reason]
    if product.sold_recently:
        reasons.append("trending")
    if product.rating_avg and product.rating_avg >= 4:
        reasons.append("highly_rated")
    if product.stock_quantity > 0:
        reasons.append("in_stock")
    if freshness_score(product) >= 0.6:
        reasons.append("fresh")
    return sorted(set(reasons))[:4]


def sort_scored_products(products):
    return sorted(
        products,
        key=lambda product: (
            getattr(product, "recommendation_score", 0),
            product.sold_recently,
            product.rating_avg,
            product.stock_quantity,
            product.created_at,
        ),
        reverse=True,
    )


def mark_product(product, score, reasons):
    product.recommendation_score = round(score, 4)
    product.recommendation_reasons = popularity_reasons(product, *reasons)
    return product


def fill_from_popular(existing, *, product=None, limit=12, reason="popular_fallback"):
    existing_ids = {item.id for item in existing}
    qs = base_queryset().exclude(id__in=existing_ids)
    if product:
        qs = qs.exclude(id=product.id)
    fillers = []
    for candidate in qs:
        fillers.append(mark_product(candidate, popularity_score(candidate), [reason]))
    return [*existing, *sort_scored_products(fillers)[: max(0, limit - len(existing))]]


def interaction_products_for_user(user, cart_product_ids=None):
    interactions = Counter()
    if user and getattr(user, "is_authenticated", False):
        paid_items = (
            OrderItem.objects.filter(
                order__customer=user,
                order__status__in=PAID_ORDER_STATES,
                product__isnull=False,
            )
            .values("product_id")
            .annotate(quantity=Sum("quantity"))
        )
        for row in paid_items:
            interactions[row["product_id"]] += row["quantity"] * 4

        wishlist_ids = WishlistItem.objects.filter(
            wishlist__customer=user,
        ).values_list("product_id", flat=True)
        for product_id in wishlist_ids:
            interactions[product_id] += 2

    for product_id in cart_product_ids or []:
        interactions[product_id] += 3

    return interactions


def copurchase_counts(source_product_ids):
    if not source_product_ids:
        return Counter()
    source_order_ids = (
        OrderItem.objects.filter(
            product_id__in=source_product_ids,
            order__status__in=PAID_ORDER_STATES,
        )
        .values_list("order_id", flat=True)
        .distinct()
    )
    counts = Counter()
    rows = (
        OrderItem.objects.filter(order_id__in=source_order_ids)
        .exclude(product_id__in=source_product_ids)
        .values("product_id")
        .annotate(count=Count("id"))
    )
    for row in rows:
        counts[row["product_id"]] = row["count"]
    return counts


def score_candidate(candidate, *, source_products, interaction_weights, copurchases):
    score = popularity_score(candidate)
    reasons = []

    if candidate.id in copurchases:
        score += copurchases[candidate.id] * 3
        reasons.append("customers_also_bought")

    for source in source_products:
        source_weight = interaction_weights.get(source.id, 1)
        similarity = content_similarity(candidate, source)
        if similarity > 0:
            score += similarity * source_weight
            if candidate.category_id and candidate.category_id == source.category_id:
                reasons.append("same_category")
            if candidate.brand and source.brand and candidate.brand.casefold() == source.brand.casefold():
                reasons.append("same_brand")
            if candidate.seller_id and candidate.seller_id == source.seller_id:
                reasons.append("same_seller")

    if candidate.sold_recently:
        reasons.append("trending")
    if candidate.rating_avg and candidate.rating_avg >= 4:
        reasons.append("highly_rated")
    if candidate.stock_quantity > 0:
        reasons.append("in_stock")

    return score, sorted(set(reasons))[:4]


def ranked_recommendations(*, user=None, source_product_ids=None, cart_product_ids=None, limit=12):
    source_product_ids = list(dict.fromkeys(source_product_ids or []))
    cart_product_ids = parse_product_ids(",".join(str(i) for i in cart_product_ids or []))
    interaction_weights = interaction_products_for_user(user, cart_product_ids=cart_product_ids)
    for product_id in source_product_ids:
        interaction_weights[product_id] += 1

    all_source_ids = list(dict.fromkeys([*interaction_weights.keys(), *source_product_ids]))
    source_products = list(base_queryset().filter(id__in=all_source_ids))
    source_by_id = {product.id: product for product in source_products}
    source_products = [source_by_id[product_id] for product_id in all_source_ids if product_id in source_by_id]

    candidates = base_queryset().exclude(id__in=all_source_ids)
    copurchases = copurchase_counts(all_source_ids)
    scored = []
    for candidate in candidates:
        score, reasons = score_candidate(
            candidate,
            source_products=source_products,
            interaction_weights=interaction_weights,
            copurchases=copurchases,
        )
        if not source_products:
            reasons = ["popular", *reasons]
        candidate.recommendation_score = round(score, 4)
        candidate.recommendation_reasons = reasons[:4]
        scored.append(candidate)

    return sort_scored_products(scored)[:limit]


def similar_products(product, *, limit=12):
    recommendations = ranked_recommendations(
        source_product_ids=[product.id],
        limit=limit,
    )
    return fill_from_popular(recommendations, product=product, limit=limit)


def customers_also_bought(product, *, limit=12):
    copurchases = copurchase_counts([product.id])
    candidates = base_queryset().filter(id__in=copurchases.keys()).exclude(id=product.id)
    scored = []
    for candidate in candidates:
        score = popularity_score(candidate) + (copurchases[candidate.id] * 3)
        scored.append(mark_product(candidate, score, ["customers_also_bought"]))

    recommendations = sort_scored_products(scored)[:limit]
    if len(recommendations) < limit:
        existing_ids = {item.id for item in recommendations}
        fallback = [
            item
            for item in similar_products(product, limit=limit * 2)
            if item.id not in existing_ids
        ]
        for item in fallback:
            item.recommendation_reasons = popularity_reasons(
                item,
                "similar_fallback",
                *getattr(item, "recommendation_reasons", []),
            )
        recommendations = [*recommendations, *fallback[: max(0, limit - len(recommendations))]]
    return recommendations[:limit]


def trending_in_category(product, *, limit=12):
    candidates = base_queryset().exclude(id=product.id)
    if product.category_id:
        candidates = candidates.filter(category_id=product.category_id)

    scored = []
    for candidate in candidates:
        score = (
            log1p(candidate.sold_recently or 0) * 1.6
            + float(candidate.rating_avg or 0) * 0.45
            + freshness_score(candidate) * 0.8
            + (0.5 if candidate.stock_quantity > 0 else -3)
        )
        scored.append(mark_product(candidate, score, ["trending_in_category"]))

    recommendations = sort_scored_products(scored)[:limit]
    return fill_from_popular(recommendations, product=product, limit=limit)


def seller_best_products(product, *, limit=12):
    if not product.seller_id:
        return []
    candidates = base_queryset().filter(seller_id=product.seller_id).exclude(id=product.id)
    scored = []
    for candidate in candidates:
        score = (
            log1p(candidate.sold_recently or 0) * 1.4
            + float(candidate.rating_avg or 0) * 0.5
            + freshness_score(candidate) * 0.4
            + (0.5 if candidate.stock_quantity > 0 else -3)
        )
        scored.append(mark_product(candidate, score, ["seller_best_product"]))
    return sort_scored_products(scored)[:limit]


def recommendation_payload(products):
    return [
        {
            "product_id": product.id,
            "score": getattr(product, "recommendation_score", None),
            "reasons": getattr(product, "recommendation_reasons", []),
        }
        for product in products
    ]
