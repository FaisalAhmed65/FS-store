from django.urls import path
from .views import WishlistListView, WishlistAddRemoveView

urlpatterns = [
    path("",            WishlistListView.as_view(),       name="wishlist-list"),
    path("toggle/",     WishlistAddRemoveView.as_view(),  name="wishlist-toggle"),
]
