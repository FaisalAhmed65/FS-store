/**
 * pages/shop/index.js  — Shop / Product Listing Page
 * Sidebar (categories) + product grid + filters.
 */
import Head from "next/head";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
import { productsApi, categoriesApi } from "@/lib/api";
import ProductGrid  from "@/components/products/ProductGrid";
import Pagination   from "@/components/ui/Pagination";

const FILTER_MAP = {
  featured:    productsApi.featured,
  deals:       productsApi.deals,
  "new-arrivals": productsApi.newArrivals,
  bestsellers: productsApi.bestsellers,
};

function buildFetcher(filter, params) {
  if (filter && FILTER_MAP[filter]) {
    return () => FILTER_MAP[filter]().then((r) => r.data);
  }
  return () => productsApi.list(params).then((r) => r.data);
}

export default function ShopPage() {
  const router   = useRouter();
  const { filter, category_slug, search, page = 1, min_price, max_price } = router.query;

  const params = {
    ...(category_slug && { category__slug: category_slug }),
    ...(search        && { search }),
    ...(min_price     && { min_price }),
    ...(max_price     && { max_price }),
    page,
  };

  const fetcherKey = JSON.stringify({ filter, params });
  const { data, isLoading } = useSWR(fetcherKey, buildFetcher(filter, params));

  const products   = data?.results ?? (Array.isArray(data) ? data : []);
  const totalPages = data?.count ? Math.ceil(data.count / 24) : 1;

  const { data: categories } = useSWR("categories-sidebar",
    () => categoriesApi.list({ root_only: "1" }).then((r) => r.data?.results ?? r.data));

  function applyFilter(key, val) {
    router.push({ pathname: "/shop", query: { ...router.query, [key]: val, page: 1 } });
  }

  function clearFilter(key) {
    const q = { ...router.query };
    delete q[key];
    q.page = 1;
    router.push({ pathname: "/shop", query: q });
  }

  const pageTitle = filter
    ? { featured: "Featured Products", deals: "Hot Deals", "new-arrivals": "New Arrivals", bestsellers: "Best Sellers" }[filter] || "Shop"
    : category_slug
    ? category_slug.replace(/-/g, " ")
    : search
    ? `Results for "${search}"`
    : "All Products";

  return (
    <>
      <Head>
        <title>{pageTitle} – TRD Store</title>
      </Head>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <nav className="text-sm text-muted mb-4">
          <Link href="/" className="hover:text-primary">Home</Link>
          <span className="mx-1">/</span>
          <span className="text-gray-700 capitalize">{pageTitle}</span>
        </nav>

        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="w-56 shrink-0 hidden md:block">
            <div className="bg-card rounded-lg shadow-card p-4">
              <h3 className="font-bold text-primary mb-3">Categories</h3>
              <ul className="space-y-1">
                <li>
                  <button
                    onClick={() => clearFilter("category_slug")}
                    className={`text-sm w-full text-left px-2 py-1 rounded hover:bg-gray-100 ${!category_slug ? "font-semibold text-primary" : ""}`}
                  >
                    All Categories
                  </button>
                </li>
                {categories?.map((c) => (
                  <li key={c.id}>
                    <button
                      onClick={() => applyFilter("category_slug", c.slug)}
                      className={`text-sm w-full text-left px-2 py-1 rounded hover:bg-gray-100 ${category_slug === c.slug ? "font-semibold text-primary" : ""}`}
                    >
                      {c.name}
                    </button>
                  </li>
                ))}
              </ul>

              {/* Price range */}
              <h3 className="font-bold text-primary mt-5 mb-3">Price (SAR)</h3>
              <PriceFilter
                min={min_price}
                max={max_price}
                onApply={(mn, mx) => {
                  const q = { ...router.query, page: 1 };
                  mn ? (q.min_price = mn) : delete q.min_price;
                  mx ? (q.max_price = mx) : delete q.max_price;
                  router.push({ pathname: "/shop", query: q });
                }}
              />

              {/* Quick filters */}
              <h3 className="font-bold text-primary mt-5 mb-3">Quick Filters</h3>
              {["featured", "deals", "new-arrivals", "bestsellers"].map((f) => (
                <button
                  key={f}
                  onClick={() => applyFilter("filter", f)}
                  className={`block text-sm w-full text-left px-2 py-1 rounded hover:bg-gray-100 capitalize ${filter === f ? "font-semibold text-primary" : ""}`}
                >
                  {f.replace(/-/g, " ")}
                </button>
              ))}
            </div>
          </aside>

          {/* Main */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <h1 className="font-bold text-xl text-primary capitalize">{pageTitle}</h1>
              {!isLoading && data?.count != null && (
                <span className="text-sm text-muted">{data.count} products</span>
              )}
            </div>

            <ProductGrid products={products} loading={isLoading} />

            <Pagination
              currentPage={Number(page)}
              totalPages={totalPages}
              onPageChange={(p) => applyFilter("page", p)}
            />
          </div>
        </div>
      </div>
    </>
  );
}

function PriceFilter({ min, max, onApply }) {
  const [mn, setMn] = useState(min || "");
  const [mx, setMx] = useState(max || "");
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="number"
          placeholder="Min"
          value={mn}
          onChange={(e) => setMn(e.target.value)}
          className="border rounded px-2 py-1 text-sm w-full"
          min={0}
        />
        <input
          type="number"
          placeholder="Max"
          value={mx}
          onChange={(e) => setMx(e.target.value)}
          className="border rounded px-2 py-1 text-sm w-full"
          min={0}
        />
      </div>
      <button
        onClick={() => onApply(mn, mx)}
        className="w-full btn-accent text-xs py-1.5 rounded"
      >
        Apply
      </button>
    </div>
  );
}
