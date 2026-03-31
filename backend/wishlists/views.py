from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
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

    def post(self, request):
        product_id  = request.data.get("product_id")
        wishlist_id = request.data.get("wishlist_id")
        wl = WishlistList.objects.filter(customer=request.user).first()
        if wishlist_id:
            wl = WishlistList.objects.filter(id=wishlist_id, customer=request.user).first()
        if not wl:
            wl = WishlistList.objects.create(customer=request.user, name="Default")
        item, created = WishlistItem.objects.get_or_create(wishlist=wl, product_id=product_id)
        return Response({"added": created, "item": WishlistItemSerializer(item).data})

    def delete(self, request):
        product_id = request.data.get("product_id")
        WishlistItem.objects.filter(
            wishlist__customer=request.user, product_id=product_id
        ).delete()
        return Response(status=204)
