from django.urls import path
from .views import ReviewListCreateView

urlpatterns = [
    path("<int:product_id>/", ReviewListCreateView.as_view(), name="review-list-create"),
]
