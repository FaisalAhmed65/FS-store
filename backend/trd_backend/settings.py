from pathlib import Path
from datetime import timedelta
from decouple import config

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = config("SECRET_KEY", default="django-insecure-dev-key-change-me")
DEBUG = config("DEBUG", default=True, cast=bool)
ALLOWED_HOSTS = config("ALLOWED_HOSTS", default="localhost,127.0.0.1").split(",")

INSTALLED_APPS = [
    # Jazzmin must be FIRST — before django.contrib.admin
    "jazzmin",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.postgres",
    # Third-party
    "rest_framework",
    "rest_framework_simplejwt",
    "corsheaders",
    "django_filters",
    "drf_spectacular",
    # Local apps
    "customers",
    "categories",
    "products",
    "sellers",
    "orders",
    "reviews",
    "wishlists",
    "offers",
    "payments",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "trd_backend.urls"
AUTH_USER_MODEL = "customers.Customer"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "trd_backend.wsgi.application"

# ─── Database ──────────────────────────────────────────────────────────────────
# Use SQLite by default (local dev), PostgreSQL if DB_HOST is set
if config("DB_HOST", default=""):
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": config("DB_NAME", default="trd_store"),
            "USER": config("DB_USER", default="trd_user"),
            "PASSWORD": config("DB_PASSWORD", default="trd_pass"),
            "HOST": config("DB_HOST"),
            "PORT": config("DB_PORT", default="5432"),
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }

# ─── Cache (Redis or Local Memory) ────────────────────────────────────────────
# Try Redis first, fall back to local memory cache for development
if config("REDIS_URL", default=""):
    CACHES = {
        "default": {
            "BACKEND": "django_redis.cache.RedisCache",
            "LOCATION": config("REDIS_URL", default="redis://localhost:6379/0"),
            "OPTIONS": {"CLIENT_CLASS": "django_redis.client.DefaultClient"},
        }
    }
else:
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
            "LOCATION": "trd-cache",
        }
    }

# ─── Auth / Password ───────────────────────────────────────────────────────────
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# ─── Localisation ──────────────────────────────────────────────────────────────
LANGUAGE_CODE = "en-us"       # English (admin + API messages in English)
TIME_ZONE     = "Asia/Dhaka"  # Bangladesh Standard Time (UTC+6)
USE_I18N = True
USE_TZ   = True

# ─── Email (SendGrid) ──────────────────────────────────────────────────────
EMAIL_BACKEND        = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST           = config("EMAIL_HOST",     default="smtp.sendgrid.net")
EMAIL_PORT           = config("EMAIL_PORT",     default=587, cast=int)
EMAIL_USE_TLS        = True
EMAIL_HOST_USER      = "apikey"  # SendGrid always uses 'apikey' as username
EMAIL_HOST_PASSWORD  = config("SENDGRID_API_KEY", default="")
DEFAULT_FROM_EMAIL   = config("DEFAULT_FROM_EMAIL", default="noreply@trdstore.com.bd")

# OTP settings
OTP_EXPIRY_MINUTES   = config("OTP_EXPIRY_MINUTES", default=10, cast=int)
INVENTORY_RESERVATION_MINUTES = config("INVENTORY_RESERVATION_MINUTES", default=15, cast=int)

# ─── SSLCommerz (Bangladesh payment gateway) ───────────────────────────────────
SSLCZ_STORE_ID       = config("SSLCZ_STORE_ID",      default="")
SSLCZ_STORE_PASSWD   = config("SSLCZ_STORE_PASSWD",   default="")
SSLCZ_IS_SANDBOX     = config("SSLCZ_IS_SANDBOX",     default=True, cast=bool)
SSLCZ_INIT_URL       = (
    "https://sandbox.sslcommerz.com/gwprocess/v4/api.php"
    if config("SSLCZ_IS_SANDBOX", default=True, cast=bool)
    else "https://securepay.sslcommerz.com/gwprocess/v4/api.php"
)
SSLCZ_VALIDATION_URL = (
    "https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php"
    if config("SSLCZ_IS_SANDBOX", default=True, cast=bool)
    else "https://securepay.sslcommerz.com/validator/api/validationserverAPI.php"
)
BACKEND_URL          = config("BACKEND_URL", default="http://localhost:8000")
FRONTEND_URL         = config("FRONTEND_URL", default="http://localhost:3000")

# ─── Static / Media ────────────────────────────────────────────────────────────
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_DIRS = [BASE_DIR / "static"]
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

if DEBUG:
    STORAGES = {
        "staticfiles": {
            "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
        },
    }
else:
    STORAGES = {
        "staticfiles": {
            "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
        },
    }

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ─── DRF ──────────────────────────────────────────────────────────────────────
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticatedOrReadOnly",),
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ),
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 24,
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
}

# ─── JWT ──────────────────────────────────────────────────────────────────────
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=config("ACCESS_TOKEN_LIFETIME_MINUTES", default=60, cast=int)),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=config("REFRESH_TOKEN_LIFETIME_DAYS", default=7, cast=int)),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": False,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "TOKEN_OBTAIN_SERIALIZER": "customers.serializers.CustomTokenObtainPairSerializer",
}

# ─── CORS ─────────────────────────────────────────────────────────────────────
CORS_ALLOW_ALL_ORIGINS = DEBUG
CORS_ALLOWED_ORIGINS = [
    FRONTEND_URL,
]
CORS_ALLOW_CREDENTIALS = True

# ─── Spectacular (API docs) ───────────────────────────────────────────────────
SPECTACULAR_SETTINGS = {
    "TITLE": "TRD Store API",
    "DESCRIPTION": "TRD Store — Django + Next.js eCommerce platform",
    "VERSION": "1.0.0",
}

# ─── Jazzmin Admin UI ─────────────────────────────────────────────────────────
JAZZMIN_SETTINGS = {
    # Window title & brand
    "site_title": "TRD Store Admin",
    "site_header": "TRD Store",
    "site_brand": "TRD Store",
    "site_logo": None,  # set to "img/logo.png" if you add a logo in static
    "welcome_sign": "Welcome to TRD Store Admin",
    "copyright": "TRD Store © 2026",

    # Search bar — searches across these models
    "search_model": ["customers.Customer", "products.Product", "orders.Order"],

    # Top navigation links
    "topmenu_links": [
        {"name": "Home", "url": "admin:index", "permissions": ["auth.view_user"]},
        {"name": "Store", "url": "/", "new_window": True},
        {"name": "API Docs", "url": "/api/docs/", "new_window": True},
    ],

    # User menu links (top right)
    "usermenu_links": [
        {"name": "API Docs", "url": "/api/docs/", "new_window": True, "icon": "fas fa-book"},
        {"model": "customers.customer"},
    ],

    # Side menu icons per app/model
    "icons": {
        "auth":                    "fas fa-shield-alt",
        "customers.customer":      "fas fa-users",
        "categories.category":     "fas fa-layer-group",
        "products.product":        "fas fa-cube",
        "products.productimage":   "fas fa-images",
        "products.productattribute": "fas fa-list",
        "sellers.seller":          "fas fa-store",
        "orders.order":            "fas fa-shopping-bag",
        "orders.orderline":        "fas fa-list",
        "reviews.review":          "fas fa-star",
        "wishlists.wishlist":      "fas fa-heart",
        "offers.pricelist":        "fas fa-percentage",
        "payments.payment":        "fas fa-wallet",
    },
    "default_icon_parents": "fas fa-chevron-right",
    "default_icon_children": "fas fa-circle",

    # Side menu ordering
    "order_with_respect_to": [
        "customers", "products", "categories", "orders",
        "sellers", "reviews", "wishlists", "offers", "payments",
    ],

    # UI tweaks
    "show_sidebar": True,
    "navigation_expanded": True,
    "hide_apps": [],
    "hide_models": [],
    "related_modal_active": True,

    # Theme: use a clean, modern look
    "custom_css": "admin/css/custom_admin.css",
    "custom_js": "admin/js/custom_admin.js",
    "use_google_fonts_cdn": True,
    "show_ui_builder": False, # Disable default builder as we have our own toggle
    "changeform_format": "horizontal_tabs",
    "changeform_format_overrides": {
        "auth.user": "collapsible",
        "customers.customer": "horizontal_tabs",
    },
    "language_chooser": False,
}

JAZZMIN_UI_TWEAKS = {
    "navbar_small_text": False,
    "footer_small_text": False,
    "body_small_text": False,
    "brand_small_text": False,
    "brand_colour": "navbar-white",
    "accent": "accent-primary",         # yellow accent
    "navbar": "navbar-white navbar-light",
    "no_navbar_border": True,
    "navbar_fixed": True,
    "layout_boxed": False,
    "footer_fixed": False,
    "sidebar_fixed": True,
    "sidebar": "sidebar-light-primary",
    "sidebar_nav_small_text": False,
    "sidebar_disable_expand": False,
    "sidebar_nav_child_indent": True,
    "sidebar_nav_compact_style": False,
    "sidebar_nav_legacy_style": False,
    "sidebar_nav_flat_style": False,
    "theme": "flatly",
    "default_theme_mode": "light",
    "button_classes": {
        "primary": "btn-primary",
        "secondary": "btn-secondary",
        "info": "btn-info",
        "warning": "btn-warning",
        "danger": "btn-danger",
        "success": "btn-success",
    },
}
