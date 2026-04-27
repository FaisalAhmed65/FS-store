from datetime import timedelta
from decimal import Decimal, ROUND_HALF_UP

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone
from django.utils.text import slugify

from categories.models import Category
from customers.models import Customer
from orders.models import Order, OrderItem, SellerDelivery
from products.models import Product, ProductAttribute
from sellers.models import Seller
from wishlists.models import WishlistItem, WishlistList


DEMO_TAG = "TRD_DEMO_SEED"
TARGET_EMAIL = "faisal833194@gmail.com"
SELLER_PASSWORD = "DemoSeller@2026!"
PRODUCTS_PER_CATEGORY = 40
CATEGORY_SKU_CODES = {
    "mouse": "MOU",
    "laptop": "LAP",
    "keyboard": "KEY",
    "monitor": "MON",
    "headphones": "HED",
    "smartphone": "PHN",
    "tablet": "TAB",
    "printer": "PRT",
    "router": "ROU",
    "smartwatch": "SWT",
}


CATEGORY_DATA = [
    {
        "name": "Mouse",
        "slug": "mouse",
        "description": "Wireless, wired, gaming, office, and ergonomic mice.",
        "brands": ["Logitech", "Razer", "A4Tech", "Microsoft", "HP"],
        "types": ["Silent Wireless Mouse", "RGB Gaming Mouse", "Ergo Bluetooth Mouse", "Compact Office Mouse"],
        "price_min": 650,
        "price_step": 145,
        "attributes": [
            ("Connectivity", ["2.4GHz wireless", "Bluetooth", "USB wired", "Dual mode"]),
            ("DPI", ["1200 DPI", "2400 DPI", "6400 DPI", "16000 DPI"]),
            ("Color", ["Black", "White", "Graphite", "Blue"]),
        ],
    },
    {
        "name": "Laptop",
        "slug": "laptop",
        "description": "Student, business, creator, and gaming laptops.",
        "brands": ["HP", "Dell", "Lenovo", "Asus", "Acer"],
        "types": ["Core i5 Laptop", "Ryzen 5 Laptop", "Creator Notebook", "Gaming Laptop"],
        "price_min": 42000,
        "price_step": 3100,
        "attributes": [
            ("Processor", ["Intel Core i5", "Intel Core i7", "AMD Ryzen 5", "AMD Ryzen 7"]),
            ("Memory", ["8GB RAM", "16GB RAM", "24GB RAM", "32GB RAM"]),
            ("Storage", ["512GB SSD", "1TB SSD", "512GB SSD + 1TB HDD", "2TB SSD"]),
        ],
    },
    {
        "name": "Keyboard",
        "slug": "keyboard",
        "description": "Mechanical, wireless, compact, and office keyboards.",
        "brands": ["Logitech", "Keychron", "A4Tech", "Redragon", "Microsoft"],
        "types": ["Mechanical Keyboard", "Wireless Keyboard", "Compact Keyboard", "Creator Keyboard"],
        "price_min": 1200,
        "price_step": 260,
        "attributes": [
            ("Layout", ["Full size", "TKL", "75 percent", "65 percent"]),
            ("Switch", ["Red switch", "Brown switch", "Membrane", "Low profile"]),
            ("Connectivity", ["USB-C wired", "Bluetooth", "2.4GHz wireless", "Tri-mode"]),
        ],
    },
    {
        "name": "Monitor",
        "slug": "monitor",
        "description": "Productivity, creator, and gaming monitors.",
        "brands": ["Samsung", "LG", "Dell", "Acer", "Asus"],
        "types": ["FHD Monitor", "QHD Gaming Monitor", "4K Creator Monitor", "Curved Monitor"],
        "price_min": 10500,
        "price_step": 1250,
        "attributes": [
            ("Size", ["22 inch", "24 inch", "27 inch", "32 inch"]),
            ("Resolution", ["FHD", "QHD", "4K UHD", "WQHD"]),
            ("Refresh Rate", ["75Hz", "100Hz", "144Hz", "165Hz"]),
        ],
    },
    {
        "name": "Headphones",
        "slug": "headphones",
        "description": "Wired, wireless, ANC, gaming, and studio headphones.",
        "brands": ["Sony", "JBL", "Anker", "Logitech", "Razer"],
        "types": ["Wireless Headphones", "ANC Headphones", "Gaming Headset", "Studio Headphones"],
        "price_min": 1600,
        "price_step": 420,
        "attributes": [
            ("Type", ["Over-ear", "On-ear", "In-ear", "Gaming headset"]),
            ("Battery", ["20 hours", "30 hours", "40 hours", "Wired"]),
            ("Noise Control", ["Passive isolation", "ANC", "ENC mic", "Transparency mode"]),
        ],
    },
    {
        "name": "Smartphone",
        "slug": "smartphone",
        "description": "Android smartphones for everyday, gaming, and camera use.",
        "brands": ["Samsung", "Xiaomi", "Realme", "OnePlus", "Motorola"],
        "types": ["5G Smartphone", "Camera Phone", "Gaming Phone", "All-day Smartphone"],
        "price_min": 12500,
        "price_step": 1800,
        "attributes": [
            ("Memory", ["6GB RAM", "8GB RAM", "12GB RAM", "16GB RAM"]),
            ("Storage", ["128GB", "256GB", "512GB", "1TB"]),
            ("Main Camera", ["50MP", "64MP", "108MP", "Triple camera"]),
        ],
    },
    {
        "name": "Tablet",
        "slug": "tablet",
        "description": "Tablets for study, entertainment, design, and work.",
        "brands": ["Samsung", "Lenovo", "Xiaomi", "Apple", "Huawei"],
        "types": ["Study Tablet", "Entertainment Tablet", "Drawing Tablet", "Productivity Tablet"],
        "price_min": 16000,
        "price_step": 2100,
        "attributes": [
            ("Display", ["8 inch", "10.5 inch", "11 inch", "12.4 inch"]),
            ("Storage", ["64GB", "128GB", "256GB", "512GB"]),
            ("Pen Support", ["No pen", "Optional pen", "Pen included", "Magnetic pen support"]),
        ],
    },
    {
        "name": "Printer",
        "slug": "printer",
        "description": "Ink tank, laser, photo, and office printers.",
        "brands": ["Canon", "Epson", "HP", "Brother", "Pantum"],
        "types": ["Ink Tank Printer", "Laser Printer", "All-in-One Printer", "Photo Printer"],
        "price_min": 8500,
        "price_step": 980,
        "attributes": [
            ("Function", ["Print only", "Print scan copy", "Duplex print", "Photo print"]),
            ("Connectivity", ["USB", "Wi-Fi", "Ethernet", "Wi-Fi Direct"]),
            ("Yield", ["Low volume", "Home office", "High yield", "Business duty"]),
        ],
    },
    {
        "name": "Router",
        "slug": "router",
        "description": "Wi-Fi routers and mesh-ready networking devices.",
        "brands": ["TP-Link", "Netgear", "D-Link", "Asus", "Tenda"],
        "types": ["Dual Band Router", "Wi-Fi 6 Router", "Mesh Router", "Gaming Router"],
        "price_min": 1500,
        "price_step": 390,
        "attributes": [
            ("Wi-Fi Standard", ["Wi-Fi 5", "Wi-Fi 6", "Wi-Fi 6E", "Mesh ready"]),
            ("Speed", ["AC1200", "AX1800", "AX3000", "AX5400"]),
            ("Coverage", ["Small home", "Apartment", "Large home", "Office"]),
        ],
    },
    {
        "name": "Smartwatch",
        "slug": "smartwatch",
        "description": "Fitness, lifestyle, and productivity smartwatches.",
        "brands": ["Samsung", "Amazfit", "Huawei", "Xiaomi", "Noise"],
        "types": ["Fitness Smartwatch", "AMOLED Smartwatch", "GPS Smartwatch", "Calling Smartwatch"],
        "price_min": 2200,
        "price_step": 520,
        "attributes": [
            ("Case Size", ["40mm", "42mm", "44mm", "46mm"]),
            ("Battery", ["5 days", "7 days", "10 days", "14 days"]),
            ("Sensors", ["Heart rate", "SpO2", "GPS", "Sleep tracking"]),
        ],
    },
]


SELLER_NAMES = [
    "TRD Demo Seller 01 - Tech Bazaar",
    "TRD Demo Seller 02 - Gadget Point",
    "TRD Demo Seller 03 - Digital Zone",
    "TRD Demo Seller 04 - Byte House",
    "TRD Demo Seller 05 - Smart Hub",
    "TRD Demo Seller 06 - Device Mart",
    "TRD Demo Seller 07 - Electro Nest",
    "TRD Demo Seller 08 - Gear Gallery",
    "TRD Demo Seller 09 - Future Store",
    "TRD Demo Seller 10 - Accessory Lab",
]


ORDER_BUNDLES = [
    ["laptop", "mouse", "keyboard", "monitor"],
    ["laptop", "headphones", "mouse", "router"],
    ["smartphone", "smartwatch", "headphones", "router"],
    ["tablet", "keyboard", "headphones", "printer"],
    ["monitor", "keyboard", "mouse", "headphones"],
    ["smartphone", "tablet", "smartwatch", "headphones"],
    ["printer", "router", "laptop", "mouse"],
    ["keyboard", "mouse", "monitor", "router"],
]


def money(value):
    return Decimal(value).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def unique_slug(base, model, current_pk=None):
    candidate = slugify(base)[:300] or "demo-item"
    slug = candidate
    suffix = 1
    while True:
        queryset = model.objects.filter(slug=slug)
        if current_pk:
            queryset = queryset.exclude(pk=current_pk)
        if not queryset.exists():
            return slug
        trimmed = candidate[: 300 - len(str(suffix)) - 1]
        slug = f"{trimmed}-{suffix}"
        suffix += 1


class Command(BaseCommand):
    help = "Seed a realistic demo catalog, approved sellers, and ML recommendation history."

    def handle(self, *args, **options):
        with transaction.atomic():
            user = Customer.objects.filter(email__iexact=TARGET_EMAIL).first()
            if not user:
                raise CommandError(
                    f"Customer {TARGET_EMAIL} was not found. Create that customer first, then rerun this command."
                )

            self.cleanup_existing_demo_data(user)
            sellers = self.create_sellers()
            categories = self.create_categories()
            products_by_category = self.create_products(categories, sellers)
            orders_created, items_created = self.create_purchase_history(user, products_by_category)
            wishlist_count = self.seed_wishlist(user, products_by_category)

        total_products = sum(len(items) for items in products_by_category.values())
        self.stdout.write(self.style.SUCCESS("Demo ML/storefront data is ready."))
        self.stdout.write(f"Categories ready: {len(categories)}")
        self.stdout.write(f"Demo products ready: {total_products}")
        self.stdout.write(f"Approved demo sellers ready: {len(sellers)}")
        self.stdout.write(f"Purchase orders for {TARGET_EMAIL}: {orders_created}")
        self.stdout.write(f"Purchase order items for {TARGET_EMAIL}: {items_created}")
        self.stdout.write(f"Wishlist seed items for {TARGET_EMAIL}: {wishlist_count}")
        self.stdout.write("")
        self.stdout.write("Demo seller login credentials:")
        for index, seller in enumerate(sellers, start=1):
            self.stdout.write(
                f"{index:02d}. username/business: {seller.business_name} | "
                f"email: {seller.email} | password: {SELLER_PASSWORD}"
            )
        self.stdout.write("")
        self.stdout.write(
            "Data reference: synthetic demo catalog generated by this command; no live product listings were scraped."
        )

    def cleanup_existing_demo_data(self, user):
        Order.objects.filter(customer=user, notes__startswith=DEMO_TAG).delete()
        Product.objects.filter(description__contains="synthetic TRD Store demo data").delete()

    def create_sellers(self):
        sellers = []
        for index, business_name in enumerate(SELLER_NAMES, start=1):
            email = f"demo.seller{index:02d}@trdstore.test"
            seller, created = Seller.objects.get_or_create(
                email=email,
                defaults={
                    "business_name": business_name,
                    "phone": f"0170000{index:04d}",
                    "address": f"Demo Market Level {index}, Dhaka",
                    "description": "Approved demo seller for TRD Store ML and dashboard testing.",
                    "status": Seller.STATUS_APPROVED,
                },
            )
            seller.business_name = business_name
            seller.phone = f"0170000{index:04d}"
            seller.address = f"Demo Market Level {index}, Dhaka"
            seller.description = "Approved demo seller for TRD Store ML and dashboard testing."
            seller.status = Seller.STATUS_APPROVED
            if created or not seller.password or not seller.check_password(SELLER_PASSWORD):
                seller.set_password(SELLER_PASSWORD)
            seller.save()
            sellers.append(seller)
        return sellers

    def create_categories(self):
        categories = {}
        for priority, data in enumerate(CATEGORY_DATA, start=1):
            category = Category.objects.filter(slug=data["slug"]).first() or Category(slug=data["slug"])
            category.name = data["name"]
            category.description = data["description"]
            category.show_in_showcase = True
            category.showcase_priority = priority
            category.is_published = True
            category.slug = unique_slug(data["slug"], Category, category.pk)
            category.save()
            categories[data["slug"]] = category
        return categories

    def create_products(self, categories, sellers):
        products_by_category = {}
        for category_index, data in enumerate(CATEGORY_DATA, start=1):
            category = categories[data["slug"]]
            category_products = []
            for product_index in range(1, PRODUCTS_PER_CATEGORY + 1):
                product = self.upsert_product(category, sellers, data, category_index, product_index)
                self.replace_attributes(product, data, product_index)
                category_products.append(product)
            products_by_category[data["slug"]] = category_products
        return products_by_category

    def upsert_product(self, category, sellers, data, category_index, product_index):
        sku = f"TRD-{CATEGORY_SKU_CODES[data['slug']]}-{product_index:03d}"
        brand = data["brands"][(product_index - 1) % len(data["brands"])]
        product_type = data["types"][(product_index - 1) % len(data["types"])]
        model_code = f"{chr(65 + ((product_index - 1) % 26))}{category_index}{product_index:02d}"
        name = f"{brand} {model_code} {product_type}"
        seller = sellers[(product_index - 1) % len(sellers)]
        price = money(data["price_min"] + (product_index * data["price_step"]) + (category_index * 37))
        compare_multiplier = Decimal("1.10") + Decimal((product_index % 5) * 2) / Decimal("100")
        delivery_type = [
            Product.DELIVERY_NORMAL,
            Product.DELIVERY_EXPRESS,
            Product.DELIVERY_BOTH,
        ][product_index % 3]
        rating = Decimal("3.6") + (Decimal((product_index * 7 + category_index) % 14) / Decimal("10"))
        rating = min(rating, Decimal("4.9")).quantize(Decimal("0.1"))

        product = Product.objects.filter(sku=sku).first() or Product(sku=sku)
        product.name = name
        product.slug = unique_slug(f"trd-demo-{data['slug']}-{product_index:02d}-{slugify(name)}", Product, product.pk)
        product.brand = brand
        product.description = (
            f"{name} is synthetic TRD Store demo data for testing search, recommendations, "
            f"seller analytics, wishlist, cart, and checkout flows. Category: {category.name}. "
            f"Seller: {seller.business_name}."
        )
        product.get_in = f"{2 + (product_index % 4)} days"
        product.price = price
        product.compare_price = money(price * compare_multiplier)
        product.category = category
        product.seller = seller
        product.status = Product.STATUS_APPROVED
        product.is_published = True
        product.is_featured = product_index <= 3 or product_index % 13 == 0
        product.is_deal = product_index % 5 == 0
        product.is_new_arrival = product_index % 6 == 0
        product.is_bestseller = product_index <= 5 or product_index % 8 == 0
        product.is_free_delivery = product_index % 4 in (0, 1)
        product.delivery_type = delivery_type
        product.normal_delivery_charge = money(80 + (product_index % 4) * 20)
        product.express_delivery_charge = money(140 + (product_index % 5) * 30)
        product.stock_quantity = 3 + ((product_index * 11 + category_index) % 85)
        product.rating_avg = rating
        product.rating_count = 8 + ((product_index * 9 + category_index) % 240)
        product.deal_discount_pct = Decimal("12.00") if product_index % 5 == 0 else None
        product.deal_end_date = timezone.now() + timedelta(days=7 + product_index) if product_index % 5 == 0 else None
        product.sold_recently = 5 + ((product_index * 7 + category_index * 11) % 150)
        product.category_rank = product_index
        product.category_rank_display = f"#{product_index} in {category.name}"
        product.save()
        return product

    def replace_attributes(self, product, category_data, product_index):
        ProductAttribute.objects.filter(product=product).delete()
        ProductAttribute.objects.bulk_create(
            [
                ProductAttribute(
                    product=product,
                    name=name,
                    value=values[(product_index - 1) % len(values)],
                )
                for name, values in category_data["attributes"]
            ]
        )

    def create_purchase_history(self, user, products_by_category):
        statuses = [Order.STATUS_DELIVERED, Order.STATUS_SHIPPED, Order.STATUS_PROCESSING, Order.STATUS_PAID]
        orders_created = 0
        items_created = 0
        now = timezone.now()

        for order_index in range(1, 25):
            bundle = ORDER_BUNDLES[(order_index - 1) % len(ORDER_BUNDLES)]
            products = [
                products_by_category[category_slug][(order_index * 3 + offset * 5) % PRODUCTS_PER_CATEGORY]
                for offset, category_slug in enumerate(bundle)
            ]
            item_rows = []
            subtotal = Decimal("0.00")
            for offset, product in enumerate(products):
                quantity = 1 + ((order_index + offset) % 2)
                line_total = money(product.price * quantity)
                subtotal += line_total
                item_rows.append((product, quantity, line_total))

            status_value = statuses[(order_index - 1) % len(statuses)]
            created_at = now - timedelta(days=order_index * 2)
            order = Order.objects.create(
                customer=user,
                customer_name=user.get_full_name() or user.username or "Faisal Ahmed",
                customer_email=user.email,
                customer_phone=getattr(user, "phone", "") or "01700000000",
                shipping_name=user.get_full_name() or user.username or "Faisal Ahmed",
                shipping_street=f"Demo Shipping Road {order_index}",
                shipping_city="Dhaka",
                shipping_country="Bangladesh",
                shipping_zip="1207",
                shipping_phone=getattr(user, "phone", "") or "01700000000",
                status=status_value,
                subtotal_price=money(subtotal),
                discount_total=Decimal("0.00"),
                total_price=money(subtotal),
                paid_at=created_at + timedelta(minutes=12),
                notes=f"{DEMO_TAG}:faisal_ml_order_{order_index:02d}",
            )
            Order.objects.filter(pk=order.pk).update(
                created_at=created_at,
                updated_at=created_at + timedelta(minutes=30),
                paid_at=created_at + timedelta(minutes=12),
            )
            orders_created += 1

            seller_ids = set()
            for product, quantity, line_total in item_rows:
                original_unit_price = product.compare_price or product.price
                discount_amount = money((original_unit_price - product.price) * quantity)
                OrderItem.objects.create(
                    order=order,
                    product=product,
                    seller=product.seller,
                    product_name=product.name,
                    product_image=product.image.url if product.image else "",
                    quantity=quantity,
                    unit_price=product.price,
                    original_unit_price=original_unit_price,
                    discount_amount=max(discount_amount, Decimal("0.00")),
                    subtotal=line_total,
                )
                product.sold_recently += quantity
                product.save(update_fields=["sold_recently", "updated_at"])
                if product.seller_id:
                    seller_ids.add(product.seller_id)
                items_created += 1

            for seller_id in seller_ids:
                SellerDelivery.objects.get_or_create(
                    order=order,
                    seller_id=seller_id,
                    defaults={
                        "delivery_status": "delivered" if status_value == Order.STATUS_DELIVERED else "processing",
                        "tracking_number": f"TRD-DEMO-{order_index:03d}-{seller_id}",
                    },
                )

        return orders_created, items_created

    def seed_wishlist(self, user, products_by_category):
        wishlist, _ = WishlistList.objects.get_or_create(customer=user, name="Default")
        selected = []
        for category_slug in ["laptop", "mouse", "keyboard", "monitor", "headphones", "smartphone", "smartwatch"]:
            selected.extend(products_by_category[category_slug][5:8])
        for product in selected[:20]:
            WishlistItem.objects.get_or_create(wishlist=wishlist, product=product)
        return min(len(selected), 20)
