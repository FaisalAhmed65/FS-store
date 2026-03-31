from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path("admin/", admin.site.urls),
    # API docs
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    # Auth
    path("api/v1/auth/", include("customers.urls")),
    # Store
    path("api/v1/categories/", include("categories.urls")),
    path("api/v1/products/", include("products.urls")),
    path("api/v1/sellers/", include("sellers.urls")),
    path("api/v1/orders/", include("orders.urls")),
    path("api/v1/reviews/", include("reviews.urls")),
    path("api/v1/wishlists/", include("wishlists.urls")),
    path("api/v1/offers/",    include("offers.urls")),
    path("api/v1/payments/",  include("payments.urls")),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
