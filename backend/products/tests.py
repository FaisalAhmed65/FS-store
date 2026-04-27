from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from categories.models import Category
from customers.models import Customer
from orders.models import Order, OrderItem
from sellers.models import Seller
from wishlists.models import WishlistItem, WishlistList
from .models import Product


@override_settings(ALLOWED_HOSTS=["testserver", "localhost"])
class ProductRecommendationTests(TestCase):
    def setUp(self):
        self.user = Customer.objects.create_user(
            username="reco_user",
            email="reco@example.com",
            password="StrongPass123!",
        )
        self.category = Category.objects.create(name="Audio", slug="audio")
        self.other_category = Category.objects.create(name="Shoes", slug="shoes")
        self.seller = Seller.objects.create(
            business_name="Sound House",
            email="seller@example.com",
            password="x",
            status=Seller.STATUS_APPROVED,
        )
        self.source = Product.objects.create(
            name="Studio Headphones",
            slug="studio-headphones",
            brand="SoundMax",
            category=self.category,
            seller=self.seller,
            price="1200.00",
            stock_quantity=10,
            status=Product.STATUS_APPROVED,
            is_published=True,
            rating_avg="4.8",
        )
        self.match = Product.objects.create(
            name="Wireless Headphones",
            slug="wireless-headphones",
            brand="SoundMax",
            category=self.category,
            seller=self.seller,
            price="1300.00",
            stock_quantity=10,
            status=Product.STATUS_APPROVED,
            is_published=True,
            rating_avg="4.6",
            sold_recently=9,
        )
        self.unrelated = Product.objects.create(
            name="Running Shoes",
            slug="running-shoes",
            brand="Stride",
            category=self.other_category,
            price="1300.00",
            stock_quantity=10,
            status=Product.STATUS_APPROVED,
            is_published=True,
            rating_avg="3.5",
        )
        self.api_client = APIClient()

    def test_personalized_recommendations_use_wishlist_signal(self):
        wishlist = WishlistList.objects.create(customer=self.user, name="Default")
        WishlistItem.objects.create(wishlist=wishlist, product=self.source)
        self.api_client.force_authenticate(user=self.user)

        response = self.api_client.get("/api/v1/products/recommendations/?limit=2")

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["strategy"], "hybrid_local_recommendations")
        self.assertEqual(payload["results"][0]["slug"], self.match.slug)
        self.assertIn("same_category", payload["results"][0]["recommendation_reasons"])

    def test_similar_endpoint_ranks_content_match_first(self):
        response = self.client.get(f"/api/v1/products/{self.source.slug}/similar/?limit=2")

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["source_product"], self.source.id)
        self.assertEqual(payload["results"][0]["slug"], self.match.slug)
        self.assertIn("same_brand", payload["results"][0]["recommendation_reasons"])

    def test_customers_also_bought_uses_copurchase_signal(self):
        order = Order.objects.create(
            customer=self.user,
            customer_name="Reco User",
            customer_email="reco@example.com",
            shipping_name="Reco User",
            shipping_street="Road 1",
            shipping_city="Dhaka",
            total_price="2500.00",
            status=Order.STATUS_PAID,
        )
        OrderItem.objects.create(
            order=order,
            product=self.source,
            seller=self.seller,
            product_name=self.source.name,
            quantity=1,
            unit_price=self.source.price,
            subtotal=self.source.price,
        )
        OrderItem.objects.create(
            order=order,
            product=self.match,
            seller=self.seller,
            product_name=self.match.name,
            quantity=1,
            unit_price=self.match.price,
            subtotal=self.match.price,
        )

        response = self.client.get(f"/api/v1/products/{self.source.slug}/customers-also-bought/?limit=2")

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["results"][0]["slug"], self.match.slug)
        self.assertIn("customers_also_bought", payload["results"][0]["recommendation_reasons"])

    def test_category_and_seller_recommendation_endpoints_return_ranked_products(self):
        category_response = self.client.get(f"/api/v1/products/{self.source.slug}/trending-in-category/?limit=2")
        seller_response = self.client.get(f"/api/v1/products/{self.source.slug}/seller-best-products/?limit=2")

        self.assertEqual(category_response.status_code, 200)
        self.assertEqual(seller_response.status_code, 200)
        self.assertEqual(category_response.json()["results"][0]["slug"], self.match.slug)
        self.assertEqual(seller_response.json()["results"][0]["slug"], self.match.slug)
