from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.password_validation import validate_password
from .models import Customer


class CustomerRegisterSerializer(serializers.ModelSerializer):
    password  = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model  = Customer
        fields = ("id", "username", "email", "first_name", "last_name", "password", "password2", "phone")

    def validate(self, data):
        if data["password"] != data["password2"]:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        return data

    def create(self, validated_data):
        validated_data.pop("password2")
        user = Customer.objects.create_user(**validated_data)
        return user


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Customer
        fields = ("id", "username", "email", "phone", "address", "avatar", "date_joined")
        read_only_fields = ("id", "date_joined")


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        identifier = attrs.get(self.username_field) or attrs.get("email") or attrs.get("username")
        if identifier:
            identifier = str(identifier).strip()
            user = Customer.objects.filter(email__iexact=identifier).only("username").first()
            attrs[self.username_field] = user.username if user else identifier
        return super().validate(attrs)

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["username"] = user.username
        token["email"]    = user.email
        token["type"]     = "customer"
        return token
