from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from products.models import Product
from .models import WishlistList, WishlistItem
from .serializers import WishlistSerializer, WishlistItemSerializer, WishlistListSerializer


class WishlistListView(generics.ListCreateAPIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get_serializer_class(self):
        return WishlistListSerializer if self.request.method == "POST" else WishlistSerializer

    def get_queryset(self):
        qs = WishlistList.objects.filter(customer=self.request.user)
        if not qs.exists():
            WishlistList.objects.create(customer=self.request.user, name="Default")
            qs = WishlistList.objects.filter(customer=self.request.user)
        return qs

    def perform_create(self, serializer):
        serializer.save(customer=self.request.user)


class WishlistAddRemoveView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get_product(self, request, *, require_visible=True):
        product_id = request.data.get("product_id")
        try:
            product_id = int(product_id)
        except (TypeError, ValueError):
            return None, Response({"product_id": "A valid product_id is required."}, status=400)

        products = Product.objects.filter(id=product_id)
        if require_visible:
            products = products.filter(is_published=True, status=Product.STATUS_APPROVED)
        product = products.first()
        if not product:
            return None, Response({"product_id": "Product was not found."}, status=404)
        return product, None

    def get_wishlist(self, request):
        wishlist_id = request.data.get("wishlist_id")
        if wishlist_id:
            wishlist = WishlistList.objects.filter(id=wishlist_id, customer=request.user).first()
            if wishlist:
                return wishlist
        wishlist, _ = WishlistList.objects.get_or_create(customer=request.user, name="Default")
        return wishlist

    def post(self, request):
        product, error_response = self.get_product(request)
        if error_response:
            return error_response

        wishlist = self.get_wishlist(request)
        item, created = WishlistItem.objects.get_or_create(wishlist=wishlist, product=product)
        return Response({
            "added": created,
            "product_id": product.id,
            "item": WishlistItemSerializer(item, context={"request": request}).data,
        })

    def delete(self, request):
        product, error_response = self.get_product(request, require_visible=False)
        if error_response:
            return error_response

        deleted, _ = WishlistItem.objects.filter(
            wishlist__customer=request.user, product=product
        ).delete()
        return Response({"removed": bool(deleted), "product_id": product.id}, status=status.HTTP_200_OK)
