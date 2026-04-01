/**
 * lib/api.js
 * Axios instance with base URL, auth header injection, and auto-refresh.
 */
import axios from "axios";
import Cookies from "js-cookie";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

// --- Attach access token to every request ---
api.interceptors.request.use((config) => {
  const token = Cookies.get("trd_access");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Seller token takes precedence when present
  const sellerToken = Cookies.get("trd_seller_access");
  if (sellerToken && config.url?.startsWith("/sellers")) {
    config.headers.Authorization = `Bearer ${sellerToken}`;
  }
  return config;
});

// --- Auto-refresh on 401 ---
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => (error ? prom.reject(error) : prom.resolve(token)));
  failedQueue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            return api(original);
          })
          .catch((e) => Promise.reject(e));
      }

      original._retry = true;
      isRefreshing = true;

      const refresh = Cookies.get("trd_refresh");
      if (!refresh) {
        isRefreshing = false;
        return Promise.reject(err);
      }

      try {
        const { data } = await axios.post(`${BASE_URL}/auth/token/refresh/`, {
          refresh,
        });
        Cookies.set("trd_access", data.access, { expires: 1 / 24 }); // 1 hour
        api.defaults.headers.common.Authorization = `Bearer ${data.access}`;
        processQueue(null, data.access);
        original.headers.Authorization = `Bearer ${data.access}`;
        return api(original);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        // Clear auth cookies on refresh failure
        Cookies.remove("trd_access");
        Cookies.remove("trd_refresh");
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(err);
  }
);

// ------------- Convenience helpers ---------------------------------

export const authApi = {
  register:      (data) => api.post("/auth/register/", data),
  login:         (data) => api.post("/auth/login/", data),
  refreshToken:  (refresh) => api.post("/auth/token/refresh/", { refresh }),
  me:            () => api.get("/auth/me/"),
  updateMe:      (data) => api.patch("/auth/me/", data),
};

export const productsApi = {
  list:         (params) => api.get("/products/", { params }),
  detail:       (slug) => api.get(`/products/${slug}/`),
  featured:     () => api.get("/products/featured/"),
  deals:        () => api.get("/products/deals/"),
  newArrivals:   () => api.get("/products/new-arrivals/"),
  bestsellers:   () => api.get("/products/bestsellers/"),
  freeDelivery:  () => api.get("/products/free-delivery/"),
};

export const categoriesApi = {
  list:      (params) => api.get("/categories/", { params }),
  detail:    (slug) => api.get(`/categories/${slug}/`),
  showcase:  () => api.get("/categories/", { params: { showcase: "1" } }),
  tree:      () => api.get("/categories/tree/"),
};

export const sellerApi = {
  register:  (data) => api.post("/sellers/register/", data),
  login:     (data) => api.post("/sellers/login/", data),
  profile:   () => {
    const token = Cookies.get("trd_seller_access");
    return api.get("/sellers/profile/", {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  updateProfile: (data) => {
    const token = Cookies.get("trd_seller_access");
    return api.patch("/sellers/profile/", data, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  dashboard: () => {
    const token = Cookies.get("trd_seller_access");
    return api.get("/sellers/dashboard/", {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  products: {
    list:   () => {
      const token = Cookies.get("trd_seller_access");
      return api.get("/sellers/products/", {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    create: (data) => {
      const token = Cookies.get("trd_seller_access");
      return api.post("/sellers/products/", data, {
        headers: {
          Authorization:  `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
    },
    update: (id, data) => {
      const token = Cookies.get("trd_seller_access");
      return api.patch(`/sellers/products/${id}/`, data, {
        headers: {
          Authorization:  `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
    },
    delete: (id) => {
      const token = Cookies.get("trd_seller_access");
      return api.delete(`/sellers/products/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
  },
};

export const ordersApi = {
  list:   () => api.get("/orders/"),
  detail: (id) => api.get(`/orders/${id}/`),
  create: (data) => api.post("/orders/", data),
};

export const reviewsApi = {
  list:   (productId) => api.get(`/reviews/${productId}/`),
  create: (productId, data) => api.post(`/reviews/${productId}/`, data),
};

export const wishlistApi = {
  list:   () => api.get("/wishlists/"),
  toggle: (productId) => api.post("/wishlists/toggle/", { product_id: productId }),
  remove: (productId) => api.delete("/wishlists/toggle/", { data: { product_id: productId } }),
};

export const offersApi = {
  list:           () => api.get("/offers/"),
  forProduct: (id) => api.get("/offers/", { params: { product_id: id } }),
};

export default api;
