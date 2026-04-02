from rest_framework import serializers
from .models import Seller, SellerPayout


class SellerPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Seller
        fields = ("id", "business_name", "logo", "description", "status")


class SellerRegisterSerializer(serializers.ModelSerializer):
    password  = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model  = Seller
        fields = ("id", "business_name", "email", "phone", "address", "password", "password2")

    def validate(self, data):
        if data["password"] != data["password2"]:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        if Seller.objects.filter(email=data["email"]).exists():
            raise serializers.ValidationError({"email": "A seller with this email already exists."})
        return data

    def create(self, validated_data):
        validated_data.pop("password2")
        raw_password = validated_data.pop("password")
        seller = Seller(**validated_data)
        seller.set_password(raw_password)
        seller.save()
        return seller


class SellerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Seller
        fields = ("id", "business_name", "email", "phone", "address",
                  "logo", "description", "status", "created_at")
        read_only_fields = ("id", "email", "status", "created_at")


class SellerLoginSerializer(serializers.Serializer):
    email    = serializers.EmailField()
    password = serializers.CharField()


class SellerPayoutSerializer(serializers.ModelSerializer):
    class Meta:
        model = SellerPayout
        fields = (
            "id",
            "period_start",
            "period_end",
            "gross_amount",
            "platform_fee",
            "net_amount",
            "status",
            "reference",
            "paid_at",
            "created_at",
        )
        read_only_fields = fields
