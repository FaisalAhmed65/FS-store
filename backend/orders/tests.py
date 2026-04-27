from django.test import TestCase

from payments.models import PaymentTransaction, PaymentWebhookEvent
from payments.services import process_gateway_callback
from products.models import Product
from .models import Order, StockReservation
from .services import create_reserved_order, release_order_reservations


def order_payload():
    return {
        "customer_name": "Test Customer",
        "customer_email": "test@example.com",
        "customer_phone": "01700000000",
        "shipping_name": "Test Customer",
        "shipping_street": "Road 1",
        "shipping_city": "Dhaka",
        "shipping_country": "Bangladesh",
        "shipping_zip": "1000",
        "shipping_phone": "01700000000",
        "notes": "",
    }


class InventoryReservationTests(TestCase):
    def setUp(self):
        self.product = Product.objects.create(
            name="Keyboard",
            slug="keyboard",
            price="1000.00",
            stock_quantity=5,
            status=Product.STATUS_APPROVED,
            is_published=True,
        )

    def test_checkout_reserves_and_release_restores_stock(self):
        order = create_reserved_order(
            order_data=order_payload(),
            raw_items=[{"product": self.product.id, "quantity": 2}],
        )

        self.product.refresh_from_db()
        reservation = StockReservation.objects.get(order=order, product=self.product)

        self.assertEqual(order.status, Order.STATUS_PENDING_PAYMENT)
        self.assertEqual(self.product.stock_quantity, 3)
        self.assertEqual(reservation.status, StockReservation.STATUS_ACTIVE)

        release_order_reservations(order, reason="test_release")
        self.product.refresh_from_db()
        reservation.refresh_from_db()

        self.assertEqual(self.product.stock_quantity, 5)
        self.assertEqual(reservation.status, StockReservation.STATUS_RELEASED)
        self.assertEqual(reservation.reason, "test_release")

    def test_duplicate_success_callback_does_not_double_convert_sale(self):
        order = create_reserved_order(
            order_data=order_payload(),
            raw_items=[{"product": self.product.id, "quantity": 2}],
        )
        txn = PaymentTransaction.objects.create(
            order=order,
            tran_id="txn-123",
            amount=order.total_price,
            currency="BDT",
        )
        payload = {
            "tran_id": txn.tran_id,
            "status": "VALID",
            "val_id": "ssl-val-1",
            "bank_tran_id": "bank-1",
            "card_type": "VISA",
        }

        first = process_gateway_callback(
            tran_id=txn.tran_id,
            payload=payload,
            target_status=PaymentTransaction.STATUS_SUCCESS,
            event_type="ipn_success",
        )
        second = process_gateway_callback(
            tran_id=txn.tran_id,
            payload=payload,
            target_status=PaymentTransaction.STATUS_SUCCESS,
            event_type="ipn_success",
        )

        order.refresh_from_db()
        self.product.refresh_from_db()
        reservation = StockReservation.objects.get(order=order, product=self.product)

        self.assertTrue(first.processed)
        self.assertTrue(second.duplicate)
        self.assertEqual(order.status, Order.STATUS_PAID)
        self.assertEqual(reservation.status, StockReservation.STATUS_CONVERTED)
        self.assertEqual(self.product.stock_quantity, 3)
        self.assertEqual(self.product.sold_recently, 2)
        self.assertEqual(PaymentWebhookEvent.objects.count(), 1)
