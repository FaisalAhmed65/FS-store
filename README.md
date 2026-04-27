# TRD Store

Complete project documentation for TRD Store (backend API + frontend storefront + deployment).

## 1. Project Overview

TRD Store is a full-stack multi-vendor e-commerce platform built with:

- Django + Django REST Framework backend
- Next.js frontend
- PostgreSQL and Redis support
- SSLCommerz payment gateway integration
- Seller dashboard with analytics and ML-style insight functions

Core capabilities:

- Customer auth with JWT and OTP email verification
- Category tree and product catalog
- Search with ranking and faceted results
- Recommendation endpoints (similar, co-purchase, trending)
- Cart-to-order checkout with inventory reservation
- Offer and coupon pricing engine
- Payment initiation and callback/IPN handling
- Reviews and wishlists
- Seller account, seller product management, seller dashboard

## 2. Repository Layout

- backend/: Django project and API apps
- frontend/: Next.js storefront and seller UI
- docker-compose.yml: local multi-service development stack
- docker-compose.prod.yml: production container stack
- render.yaml: Render blueprint deployment
- deploy.sh: Linux service management and ops script
- DEPLOYMENT_GUIDE.md: detailed deployment instructions
- DEPLOYMENT_CHECKLIST.md: production readiness checklist
- QuickStart.txt: minimal local startup steps
- seller.txt: demo seller accounts

## 3. Backend Documentation

### 3.1 Backend Core

- backend/manage.py: Django command entry point
- backend/trd_backend/settings.py: environment config, app registration, DB/cache/auth/CORS/Swagger/Jazzmin
- backend/trd_backend/urls.py: global routing for admin, docs, and api/v1 modules
- backend/trd_backend/asgi.py and backend/trd_backend/wsgi.py: runtime entry points

### 3.2 Backend Apps and Responsibilities

#### customers/

Purpose: customer identity and authentication.

Key files:

- models.py: Customer model (custom user)
- serializers.py: registration, profile, JWT serializer customization
- views.py:
  - RegisterView: create customer account
  - CustomTokenObtainPairView: customer login token pair
  - MeView: get/update authenticated customer profile
  - RequestOTPView: generate and email OTP
  - VerifyOTPView: validate OTP and activate account
- urls.py: /register, /login, /token/refresh, /me, /otp/request, /otp/verify

#### categories/

Purpose: category hierarchy and showcase filtering.

Key files:

- models.py: Category with parent-child relation
- serializers.py: flat and tree serializers
- views.py:
  - CategoryViewSet: list/retrieve categories with filters
  - tree action: nested category tree endpoint
- urls.py: router-based category endpoints

#### products/

Purpose: core product catalog, discovery, and recommendation.

Key files:

- models.py: Product, ProductImage, ProductAttribute
- serializers.py: list/detail/write serializers
- views.py:
  - ProductViewSet with list/retrieve and custom actions
  - advanced_search: ranked search + facets
  - recommendations: hybrid recommendation endpoint
  - similar, customers_also_bought, trending_in_category, seller_best_products
  - featured, deals, new_arrivals, bestsellers, free_delivery
- search.py:
  - normalize_query
  - fuzzy_score
  - apply_postgres_search
  - ranked_products
  - facets_for_products
- recommendations.py:
  - ranked_recommendations
  - similar_products
  - customers_also_bought
  - trending_in_category
  - seller_best_products
  - recommendation_payload
- management/commands/seed_ml_demo_data.py: demo data seeding command
- urls.py: router-based product endpoints and action routes

#### sellers/

Purpose: seller account lifecycle and seller workspace APIs.

Key files:

- models.py: Seller, SellerPayout
- serializers.py: seller register/login/profile/payout serializers
- views.py:
  - SellerRegisterView and SellerLoginView
  - SellerProfileView
  - SellerDashboardView (aggregated metrics)
  - SellerProductListCreateView
  - SellerProductDetailView
  - SellerOrderListView
- ml_insights.py:
  - demand_forecast_for_seller
  - low_stock_predictions_for_seller
  - promotion_suggestions_for_seller
  - fraud_flags_for_seller
- urls.py: seller auth/profile/dashboard/products/orders routes

#### orders/

Purpose: order lifecycle and inventory reservation-safe checkout.

Key files:

- models.py: Order, OrderItem, StockReservation, SellerDelivery
- serializers.py: create/list/detail serializers
- views.py:
  - OrderListCreateView
  - OrderDetailView
- services.py:
  - reservation_window
  - create_reserved_order
  - release_expired_reservations
  - release_order_reservations
  - convert_order_reservations
  - order_has_active_reservation
- management/commands/release_expired_reservations.py: cleanup command
- urls.py: order list/create/detail routes

#### payments/

Purpose: payment processing and callback/webhook orchestration.

Key files:

- models.py: PaymentTransaction, PaymentWebhookEvent
- serializers.py: payment transaction serializer
- views.py:
  - InitiatePaymentView
  - PaymentSuccessView
  - PaymentFailView
  - PaymentCancelView
  - PaymentIPNView
  - PaymentStatusView
- services.py:
  - process_gateway_callback (idempotent callback processing)
  - mark_order_paid
  - cancel_unpaid_order
  - update_transaction_from_payload
- urls.py: payment initiation, callback, ipn, status routes

#### offers/

Purpose: dynamic pricing, discount rules, and coupon handling.

Key files:

- models.py: PricelistOffer
- serializers.py: offer and price-preview payload serializers
- views.py:
  - OfferListView
  - PriceCartPreviewView
- pricing.py:
  - active_offer_queryset
  - discount_amount
  - rule_applies_to_line
  - rule_applies_to_cart
  - price_cart
- urls.py: offers list and price-cart endpoint

#### reviews/

Purpose: product reviews and ratings.

Key files:

- models.py: ProductReview
- serializers.py: read/write review serializers
- views.py: ReviewListCreateView
- urls.py: per-product review route

#### wishlists/

Purpose: customer wishlist management.

Key files:

- models.py: WishlistList, WishlistItem
- serializers.py: wishlist item/list serializers
- views.py:
  - WishlistListView
  - WishlistAddRemoveView
- urls.py: list and toggle endpoints

### 3.3 Backend API Root Paths

Configured in backend/trd_backend/urls.py:

- /api/v1/auth/
- /api/v1/categories/
- /api/v1/products/
- /api/v1/sellers/
- /api/v1/orders/
- /api/v1/reviews/
- /api/v1/wishlists/
- /api/v1/offers/
- /api/v1/payments/

Docs and admin:

- /api/schema/
- /api/docs/
- /admin/

## 4. Frontend Documentation

### 4.1 Frontend Core

- frontend/pages/_app.js: global provider composition and layout wrapping
- frontend/pages/_document.js: custom document
- frontend/package.json: scripts and dependencies
- frontend/next.config.js: Next.js runtime config
- frontend/tailwind.config.js and frontend/postcss.config.js: styling pipeline

### 4.2 Frontend Folders

- pages/: route-level pages (customer and seller)
- components/: reusable UI and domain components
  - cart/: cart widgets
  - home/: home-page blocks
  - layout/: shell/header/footer
  - products/: product card/grid/snippet and related UI
  - seller/: seller layout and seller widgets
  - ui/: shared primitives (button, pagination, spinner, modal)
- contexts/: global client state
  - AuthContext.js
  - CartContext.js
  - WishlistContext.js
  - LanguageContext.js
  - ThemeContext.js
- lib/: API client and utility layer
  - api.js
  - auth.js
  - translations.js
  - fallbackData.js
  - utils.js
- styles/: global style files

### 4.3 Important Frontend Pages

- pages/index.js: storefront home
- pages/shop/index.js: search/filter/sort listing page
- pages/shop/product/[slug].js: product detail page
- pages/cart.js: cart page
- pages/checkout/result.js: post-payment result page
- pages/login.js and pages/signup.js: customer auth
- pages/wishlist.js and pages/shop/wishlist.js: wishlist views
- pages/seller/login.js and pages/seller/register.js: seller auth
- pages/seller/dashboard.js: seller analytics dashboard
- pages/seller/products.js: seller product list
- pages/seller/product/add.js: seller add product
- pages/seller/product/[id]/edit.js: seller edit product
- pages/seller/orders.js: seller order list

### 4.4 API Integration Layer

frontend/lib/api.js provides:

- Axios instance with normalized base URL
- Customer token injection from cookies
- Seller token routing for seller endpoints
- Automatic customer token refresh on 401
- Module wrappers: authApi, productsApi, categoriesApi, sellerApi, ordersApi, reviewsApi, wishlistApi, offersApi

## 5. End-to-End Functional Flow

### 5.1 Customer Purchase Flow

1. Customer logs in (JWT set in cookies).
2. Customer browses/searches products.
3. Cart is built in frontend state.
4. Order creation triggers reserved checkout in orders service.
5. Payment initiation creates transaction and returns gateway URL.
6. SSLCommerz callback/IPN updates payment state.
7. On success, order moves to paid state and reservations convert.
8. On fail/cancel/expiry, reservations release and order cancels.

### 5.2 Seller Workflow

1. Seller registers and logs in.
2. Seller manages profile and products.
3. Newly edited seller products go to pending review.
4. Seller dashboard aggregates revenue/orders/stock and insight signals.
5. Seller reviews order line items relevant to their products.

## 6. Local Development Setup

## 6.1 Manual Setup

Backend:

1. cd backend
2. pip install -r requirements.txt
3. python manage.py migrate
4. python manage.py createsuperuser
5. python manage.py runserver

Frontend (new terminal):

1. cd frontend
2. npm install
3. copy .env.local.example to .env.local
4. npm run dev

## 6.2 Docker Local Setup

1. docker compose up --build
2. Backend: http://localhost:8000
3. Frontend: http://localhost:3000

## 7. Environment Variables

### 7.1 Backend (examples)

- SECRET_KEY
- DEBUG
- ALLOWED_HOSTS
- DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT
- REDIS_URL
- FRONTEND_URL
- BACKEND_URL
- SENDGRID_API_KEY
- DEFAULT_FROM_EMAIL
- OTP_EXPIRY_MINUTES
- INVENTORY_RESERVATION_MINUTES
- SSLCZ_STORE_ID
- SSLCZ_STORE_PASSWD
- SSLCZ_IS_SANDBOX

### 7.2 Frontend (examples)

- NEXT_PUBLIC_API_URL
- NEXT_PUBLIC_SITE_NAME
- Optional feature flags used by UI pages

## 8. Testing and Useful Commands

Backend tests:

- cd backend
- python manage.py test

Seed demo ML/shop data:

- cd backend
- python manage.py seed_ml_demo_data

Release expired reservations manually:

- cd backend
- python manage.py release_expired_reservations

Frontend lint:

- cd frontend
- npm run lint

## 9. Deployment Documentation

Primary deployment files:

- DEPLOYMENT_GUIDE.md
- DEPLOYMENT_CHECKLIST.md
- docker-compose.prod.yml
- render.yaml
- deploy.sh

Use these with this README:

- README.md explains the whole codebase and feature ownership.
- DEPLOYMENT_GUIDE.md gives platform-specific deployment steps.
- DEPLOYMENT_CHECKLIST.md is the go-live quality gate.

## 10. Demo Accounts

Seller demo users are listed in seller.txt.

The file includes demo seller emails and a shared demo password for testing.

## 11. Troubleshooting

- If frontend cannot reach backend, check NEXT_PUBLIC_API_URL and backend CORS settings.
- If payment callbacks fail, verify BACKEND_URL, FRONTEND_URL, and SSLCommerz credentials.
- If OTP email fails, verify SENDGRID_API_KEY and email host settings.
- If stock seems inconsistent, run reservation cleanup command and inspect order/payment state transitions.
- If using PostgreSQL search ranking features, ensure PostgreSQL is enabled and migration support is applied.

