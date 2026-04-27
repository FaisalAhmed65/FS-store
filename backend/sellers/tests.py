from datetime import timedelta

from django.test import TestCase
from django.utils import timezone

from categories.models import Category
from customers.models import Customer
from orders.models import Order, OrderItem
from payments.models import PaymentTransaction
from products.models import Product
from .ml_insights import (
    demand_forecast_for_seller,
    fraud_flags_for_seller,
    low_stock_predictions_for_seller,
    promotion_suggestions_for_seller,
)
from .models import Seller


class SellerMlInsightTests(TestCase):
    def setUp(self):
        self.seller = Seller.objects.create(
            business_name="Insight Seller",
            email="insight@example.com",
            password="x",
            status=Seller.STATUS_APPROVED,
        )
        category = Category.objects.create(name="Gadgets", slug="gadgets")
        self.fast_product = Product.objects.create(
            name="Fast Charger",
            slug="fast-charger",
            category=category,
            seller=self.seller,
            price="900.00",
            stock_quantity=2,
            status=Product.STATUS_APPROVED,
            is_published=True,
            rating_avg="4.5",
        )
        self.slow_product = Product.objects.create(
            name="Old Cable",
            slug="old-cable",
            category=category,
            seller=self.seller,
            price="300.00",
            stock_quantity=40,
            status=Product.STATUS_APPROVED,
            is_published=True,
        )
        Product.objects.filter(id=self.slow_product.id).update(
            created_at=timezone.now() - timedelta(days=20)
        )
        customer = Customer.objects.create_user(
            username="insight_user",
            email="insight-user@example.com",
            password="StrongPass123!",
        )
        self.order = Order.objects.create(
            customer=customer,
            customer_name="Insight User",
            customer_email="insight-user@example.com",
            shipping_name="Insight User",
            shipping_street="Road 1",
            shipping_city="Dhaka",
            total_price="3600.00",
            status=Order.STATUS_PAID,
        )
        OrderItem.objects.create(
            order=self.order,
            product=self.fast_product,
            seller=self.seller,
            product_name=self.fast_product.name,
            quantity=4,
            unit_price=self.fast_product.price,
            subtotal="3600.00",
        )
        PaymentTransaction.objects.create(
            order=self.order,
            amount="4000.00",
            status=PaymentTransaction.STATUS_SUCCESS,
            callback_count=3,
            risk_level="1",
        )

    def test_seller_ml_insights_surface_forecasts_warnings_promos_and_fraud(self):
        demand = demand_forecast_for_seller(self.seller)
        stockouts = low_stock_predictions_for_seller(self.seller)
        promotions = promotion_suggestions_for_seller(self.seller)
        fraud = fraud_flags_for_seller(self.seller)

        self.assertEqual(demand[0]["product_id"], self.fast_product.id)
        self.assertEqual(stockouts[0]["product_id"], self.fast_product.id)
        self.assertEqual(promotions[0]["product_id"], self.slow_product.id)
        self.assertTrue(any(item["title"] == "Gateway risk warning" for item in fraud))
        self.assertTrue(any(item["title"] == "Repeated payment callback" for item in fraud))
