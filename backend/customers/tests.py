from django.test import TestCase, override_settings

from .models import Customer


@override_settings(ALLOWED_HOSTS=["testserver", "localhost"])
class CustomerLoginTests(TestCase):
    def setUp(self):
        self.password = "StrongPass123!"
        self.user = Customer.objects.create_user(
            username="login_probe",
            email="login_probe@example.com",
            password=self.password,
        )

    def test_login_accepts_username(self):
        response = self.client.post(
            "/api/v1/auth/login/",
            {"username": self.user.username, "password": self.password},
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("access", response.json())

    def test_login_accepts_email(self):
        response = self.client.post(
            "/api/v1/auth/login/",
            {"username": self.user.email, "password": self.password},
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("access", response.json())
