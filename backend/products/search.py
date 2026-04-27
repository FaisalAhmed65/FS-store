from collections import Counter, defaultdict
from decimal import Decimal
from difflib import SequenceMatcher
from unicodedata import normalize

from django.db import connection
from django.db.models import Case, F, IntegerField, Q, Value, When


PRICE_BUCKETS = [
    ("0-500", Decimal("0"), Decimal("500")),
    ("500-1000", Decimal("500"), Decimal("1000")),
    ("1000-5000", Decimal("1000"), Decimal("5000")),
    ("5000+", Decimal("5000"), None),
]


def normalize_query(value):
    return normalize("NFKC", (value or "").strip()).casefold()


def product_haystacks(product):
    seller_name = product.seller.business_name if product.seller else ""
    category_name = product.category.name if product.category else ""
    category_name_bn = product.category.name_bn if product.category else ""
    return [
        product.name,
        product.name_bn,
        product.brand,
        product.sku,
        product.description,
        product.description_bn,
        seller_name,
        category_name,
        category_name_bn,
    ]


def fuzzy_score(product, query):
    normalized_query = normalize_query(query)
    if not normalized_query:
        return 0
    best = 0
    for value in product_haystacks(product):
        text = normalize_query(value)
        if not text:
            continue
        if normalized_query in text:
            best = max(best, 0.95)
        for token in text.split():
            best = max(best, SequenceMatcher(None, normalized_query, token).ratio())
        best = max(best, SequenceMatcher(None, normalized_query, text).ratio())
    return best


def apply_postgres_search(qs, query):
    from django.contrib.postgres.search import SearchQuery, SearchRank, SearchVector, TrigramSimilarity
    from django.db.models.functions import Greatest

    vector = (
        SearchVector("name", weight="A", config="simple")
        + SearchVector("name_bn", weight="A", config="simple")
        + SearchVector("brand", weight="B", config="simple")
        + SearchVector("sku", weight="B", config="simple")
        + SearchVector("description", weight="C", config="simple")
        + SearchVector("description_bn", weight="C", config="simple")
        + SearchVector("category__name", weight="B", config="simple")
        + SearchVector("category__name_bn", weight="B", config="simple")
        + SearchVector("seller__business_name", weight="B", config="simple")
    )
    search_query = SearchQuery(query, config="simple", search_type="websearch")
    trigram = Greatest(
        TrigramSimilarity("name", query),
        TrigramSimilarity("name_bn", query),
        TrigramSimilarity("brand", query),
        TrigramSimilarity("sku", query),
    )
    return (
        qs.annotate(search_rank=SearchRank(vector, search_query), typo_rank=trigram)
        .filter(
            Q(search_rank__gte=0.01)
            | Q(typo_rank__gte=0.12)
            | Q(name__icontains=query)
            | Q(name_bn__icontains=query)
            | Q(brand__icontains=query)
            | Q(sku__icontains=query)
        )
        .annotate(combined_search_score=F("search_rank") + F("typo_rank"))
        .order_by(
            "-combined_search_score",
            "-sold_recently",
            "-rating_avg",
            "-stock_quantity",
            "-created_at",
        )
    )


def ranked_products(qs, query=None):
    query = (query or "").strip()
    if query and connection.vendor == "postgresql":
        return apply_postgres_search(qs, query)

    qs = qs.annotate(
        in_stock_rank=Case(
            When(stock_quantity__gt=0, then=Value(1)),
            default=Value(0),
            output_field=IntegerField(),
        )
    )
    if not query:
        return qs.order_by("-sold_recently", "-rating_avg", "-in_stock_rank", "-created_at")

    products = list(qs)
    scored = []
    for product in products:
        score = fuzzy_score(product, query)
        if score >= 0.45:
            product.search_score = round(score, 4)
            scored.append(product)
    scored.sort(
        key=lambda product: (
            getattr(product, "search_score", 0),
            product.sold_recently,
            product.rating_avg,
            product.stock_quantity,
            product.created_at,
        ),
        reverse=True,
    )
    return scored


def price_bucket_for(price):
    price = Decimal(price)
    for label, minimum, maximum in PRICE_BUCKETS:
        if price >= minimum and (maximum is None or price < maximum):
            return label
    return PRICE_BUCKETS[-1][0]


def facets_for_products(products):
    if not isinstance(products, list):
        category_rows = (
            products.exclude(category__isnull=True)
            .values("category_id", "category__name", "category__slug")
            .order_by()
        )
        seller_rows = (
            products.exclude(seller__isnull=True)
            .values("seller_id", "seller__business_name")
            .order_by()
        )
        brand_rows = products.exclude(brand="").values("brand").order_by()
        category_counts = Counter(
            (row["category_id"], row["category__name"], row["category__slug"])
            for row in category_rows
        )
        seller_counts = Counter(
            (row["seller_id"], row["seller__business_name"]) for row in seller_rows
        )
        brand_counts = Counter(row["brand"] for row in brand_rows)
        price_counts = Counter(price_bucket_for(row["price"]) for row in products.values("price"))
    else:
        category_counts = Counter(
            (p.category_id, p.category.name, p.category.slug)
            for p in products
            if p.category_id and p.category
        )
        seller_counts = Counter(
            (p.seller_id, p.seller.business_name) for p in products if p.seller_id and p.seller
        )
        brand_counts = Counter(p.brand for p in products if p.brand)
        price_counts = Counter(price_bucket_for(p.price) for p in products)

    price_lookup = defaultdict(int, price_counts)
    return {
        "categories": [
            {"id": key[0], "name": key[1], "slug": key[2], "count": count}
            for key, count in category_counts.most_common(20)
        ],
        "brands": [
            {"brand": brand, "count": count}
            for brand, count in brand_counts.most_common(20)
        ],
        "sellers": [
            {"id": key[0], "business_name": key[1], "count": count}
            for key, count in seller_counts.most_common(20)
        ],
        "prices": [
            {"label": label, "min": str(minimum), "max": str(maximum) if maximum else None, "count": price_lookup[label]}
            for label, minimum, maximum in PRICE_BUCKETS
        ],
    }
