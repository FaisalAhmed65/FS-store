import random
import string
import logging

from django.core.cache import cache
from django.core.mail import send_mail
from django.conf import settings
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .models import Customer
from .serializers import CustomerRegisterSerializer, CustomerSerializer, CustomTokenObtainPairSerializer

logger = logging.getLogger(__name__)


class RegisterView(generics.CreateAPIView):
    queryset = Customer.objects.all()
    serializer_class = CustomerRegisterSerializer
    permission_classes = (permissions.AllowAny,)


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class   = CustomerSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self):
        return self.request.user


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class RequestOTPView(APIView):
    """
    POST /api/v1/customers/otp/request/
    Body: { "email": "user@example.com" }
    Generates a 6-digit OTP, stores it in Redis for OTP_EXPIRY_MINUTES,
    and sends it via email (SendGrid SMTP).
    """
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        email = request.data.get("email", "").strip().lower()
        if not email:
            return Response({"error": "Email is required."}, status=400)

        # Security: do not reveal whether the email is registered
        try:
            customer = Customer.objects.get(email__iexact=email)
        except Customer.DoesNotExist:
            return Response({"message": "If that email is registered, an OTP has been sent."})

        otp = "".join(random.choices(string.digits, k=6))
        ttl_seconds = getattr(settings, "OTP_EXPIRY_MINUTES", 10) * 60
        cache.set(f"otp:{email}", otp, timeout=ttl_seconds)

        try:
            send_mail(
                subject="TRD Store – ইমেইল যাচাই OTP",
                message=(
                    f"আপনার OTP কোড: {otp}\n\n"
                    f"এই কোডটি {ttl_seconds // 60} মিনিটের মধ্যে ব্যবহার করুন।\n\n"
                    f"Your OTP is: {otp}\nExpires in {ttl_seconds // 60} minutes."
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
            )
        except Exception as exc:
            logger.error("OTP email send failed for %s: %s", email, exc)
            return Response({"error": "Failed to send OTP email. Please try again."}, status=502)

        return Response({"message": "OTP sent to your email."})


class VerifyOTPView(APIView):
    """
    POST /api/v1/customers/otp/verify/
    Body: { "email": "user@example.com", "otp": "123456" }
    Validates the OTP, marks the customer account active.
    """
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        email = request.data.get("email", "").strip().lower()
        otp   = request.data.get("otp", "").strip()

        if not email or not otp:
            return Response({"error": "Email and OTP are required."}, status=400)

        cache_key  = f"otp:{email}"
        stored_otp = cache.get(cache_key)

        if not stored_otp or stored_otp != otp:
            return Response({"error": "Invalid or expired OTP."}, status=400)

        cache.delete(cache_key)

        try:
            customer = Customer.objects.get(email__iexact=email)
            if not customer.is_active:
                customer.is_active = True
                customer.save(update_fields=["is_active"])
        except Customer.DoesNotExist:
            pass  # already deleted or never existed; OTP consumed

        return Response({"message": "Email verified. You can now log in."})
