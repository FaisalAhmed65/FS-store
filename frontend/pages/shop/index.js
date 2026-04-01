/**
 * pages/shop/index.js — Noon-style Shop Page
 * Matches the Odoo TRD Store custom shop layout:
 *   • Left sidebar: category tree, price range, express/free delivery, deals filters
 *   • Top filter bar: Deals dropdown, Rating dropdown, Sort By dropdown
 *   • Promo strip: Featured / EID / Mega Deals / Best Sellers banners
 *   • Product grid: noon-style cards
 */
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
import { productsApi, categoriesApi } from "@/lib/api";
import NoonProductCard from "@/components/home/NoonProductCard";
import Pagination from "@/components/ui/Pagination";
import { mediaUrl } from "@/lib/utils";

/* ─── helpers ─── */
function useClickOutside(ref, handler) {
  useEffect(() => {
    function listener(e) {
      if (!ref.current || ref.current.contains(e.target)) return;
      handler();
    }
    document.addEventListener("mousedown", listener);
    return () => document.removeEventListener("mousedown", listener);
  }, [ref, handler]);
}

/* ─── Page ─── */
export default function ShopPage() {
  const router = useRouter();
  const {
    category_slug, search, page = 1,
    min_price, max_price,
    deal_type, rating, ordering, express, free_delivery,
  } = router.query;

  /* --- Data fetching --- */
  const params = {
    ...(category_slug  && { category_slug }),
    ...(search         && { search }),
    ...(min_price      && { min_price }),
    ...(max_price      && { max_price }),
    ...(deal_type === "featured"    && { is_featured: true }),
    ...(deal_type === "deals"       && { is_deal: true }),
    ...(deal_type === "bestseller"  && { is_bestseller: true }),
    ...(deal_type === "new_arrivals" && { is_new_arrival: true }),
    ...(deal_type === "eid"         && { is_deal: true }),
    ...(express === "1"             && { delivery_type: "express" }),
    ...(free_delivery === "1"       && { is_free_delivery: true }),
    ...(ordering       && { ordering }),
    page,
  };
  const fetchKey = JSON.stringify(params);
  const { data, isLoading } = useSWR(fetchKey, () => productsApi.list(params).then(r => r.data));
  const products = data?.results ?? (Array.isArray(data) ? data : []);
  const totalCount = data?.count ?? products.length;
  const totalPages = data?.count ? Math.ceil(data.count / 24) : 1;

  // Category tree
  const { data: categoryTree } = useSWR("cat-tree", () =>
    categoriesApi.tree().then(r => {
      const d = r.data?.results ?? r.data;
      return Array.isArray(d) ? d : [];
    })
  );

  /* --- URL param helpers --- */
  function setParam(key, val) {
    const q = { ...router.query, [key]: val, page: 1 };
    if (!val) delete q[key];
    router.push({ pathname: "/shop", query: q }, undefined, { shallow: false });
  }
  function clearParam(key) {
    const q = { ...router.query };
    delete q[key];
    q.page = 1;
    router.push({ pathname: "/shop", query: q }, undefined, { shallow: false });
  }

  /* --- Mobile sidebar --- */
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /* --- Build page title --- */
  const pageTitle = deal_type
    ? { featured: "Featured", deals: "Mega Deals", bestseller: "Best Sellers", new_arrivals: "New Arrivals", eid: "EID Offers" }[deal_type] || "Shop"
    : category_slug
    ? category_slug.replace(/-/g, " ")
    : search
    ? `"${search}"`
    : "All Products";

  return (
    <>
      <Head><title>{pageTitle} – TRD Store</title></Head>

      <div className="noon-shop-wrapper">
        {/* Mobile filter toggle */}
        <div className="lg:hidden px-3 py-2">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-full py-2.5 px-4 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 bg-white flex items-center justify-center gap-2"
          >
            <i className="fa fa-sliders" /> Filters
          </button>
        </div>

        <div className="noon-shop-row">
          {/* ======= LEFT SIDEBAR ======= */}
          <Sidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            categoryTree={categoryTree || []}
            activeSlug={category_slug}
            onCategoryClick={(slug) => {
              if (slug) setParam("category_slug", slug);
              else clearParam("category_slug");
              setSidebarOpen(false);
            }}
            minPrice={min_price}
            maxPrice={max_price}
            onPriceApply={(mn, mx) => {
              const q = { ...router.query, page: 1 };
              mn ? (q.min_price = mn) : delete q.min_price;
              mx ? (q.max_price = mx) : delete q.max_price;
              router.push({ pathname: "/shop", query: q });
            }}
            express={express}
            onExpressToggle={() => express === "1" ? clearParam("express") : setParam("express", "1")}
            freeDelivery={free_delivery}
            onFreeDeliveryToggle={() => free_delivery === "1" ? clearParam("free_delivery") : setParam("free_delivery", "1")}
            dealType={deal_type}
            onDealChange={(val) => val ? setParam("deal_type", val) : clearParam("deal_type")}
            ratingVal={rating}
            onRatingChange={(val) => val ? setParam("rating", val) : clearParam("rating")}
          />

          {/* Backdrop */}
          {sidebarOpen && (
            <div className="fixed inset-0 bg-black/35 z-[1040] lg:hidden" onClick={() => setSidebarOpen(false)} />
          )}

          {/* ======= MAIN CONTENT ======= */}
          <main className="noon-shop-main">
            {/* Top filter bar */}
            <TopFilterBar
              dealType={deal_type}
              onDealChange={(val) => val ? setParam("deal_type", val) : clearParam("deal_type")}
              ratingVal={rating}
              onRatingChange={(val) => val ? setParam("rating", val) : clearParam("rating")}
              sortVal={ordering}
              onSortChange={(val) => val ? setParam("ordering", val) : clearParam("ordering")}
            />

            {/* Promo strip */}
            <PromoStrip />

            {/* Product count */}
            <div className="noon-product-count">
              Showing <strong>{totalCount}</strong> products
            </div>

            {/* Grid */}
            {isLoading ? (
              <div className="noon-shop-grid">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="noon-card animate-pulse">
                    <div className="noon-image-wrap bg-gray-100" />
                    <div className="h-3 bg-gray-100 rounded mt-2 w-3/4" />
                    <div className="h-5 bg-gray-100 rounded mt-2 w-1/2" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20">
                <i className="fa fa-search text-4xl text-gray-300 mb-4 block" />
                <p className="text-gray-500 font-medium">No products found</p>
                <Link href="/shop" className="text-blue-600 text-sm mt-2 inline-block hover:underline">Clear all filters</Link>
              </div>
            ) : (
              <div className="noon-shop-grid">
                {products.map((p) => (
                  <NoonProductCard key={p.id} product={p} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6">
                <Pagination
                  currentPage={Number(page)}
                  totalPages={totalPages}
                  onPageChange={(p) => setParam("page", p)}
                />
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}

/* ================================================================
   SIDEBAR
   ================================================================ */
function Sidebar({
  isOpen, onClose, categoryTree, activeSlug, onCategoryClick,
  minPrice, maxPrice, onPriceApply,
  express, onExpressToggle,
  freeDelivery, onFreeDeliveryToggle,
  dealType, onDealChange,
  ratingVal, onRatingChange,
}) {
  const [priceMin, setPriceMin] = useState(minPrice || 0);
  const [priceMax, setPriceMax] = useState(maxPrice || 10000);

  // Collapsed sections
  const [collapsed, setCollapsed] = useState({});
  const toggle = (key) => setCollapsed(p => ({ ...p, [key]: !p[key] }));

  return (
    <aside className={`noon-shop-sidebar ${isOpen ? "noon-sidebar-open" : ""}`}>
      <div className="noon-sidebar-inner">
        {/* Close (mobile) */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 lg:hidden">
          <span className="font-bold text-base">Filters</span>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
            <i className="fa fa-times" />
          </button>
        </div>

        {/* ── CATEGORIES ── */}
        <FilterSection title="Categories" sectionKey="cat" collapsed={collapsed} toggle={toggle}>
          <div className="noon-cat-tree">
            <div className="noon-cat-item">
              <button
                onClick={() => onCategoryClick(null)}
                className={`noon-cat-link ${!activeSlug ? "active" : ""}`}
              >
                <span className="w-[26px] h-[26px] rounded-full bg-blue-100 flex items-center justify-center text-[11px] font-bold text-blue-600 shrink-0">
                  <i className="fa fa-th text-[10px]" />
                </span>
                <span className="noon-cat-label">All Categories</span>
              </button>
            </div>
            {categoryTree.map(cat => (
              <CategoryNode key={cat.id} cat={cat} activeSlug={activeSlug} onClick={onCategoryClick} />
            ))}
          </div>
        </FilterSection>

        {/* ── PRICE RANGE ── */}
        <FilterSection title="Price Range" sectionKey="price" collapsed={collapsed} toggle={toggle}>
          <div className="trd-price-slider">
            <div className="flex justify-between items-center text-xs font-semibold text-gray-500 mb-2.5">
              <span>৳{priceMin}</span>
              <span className="text-[10px] text-gray-400">BDT</span>
              <span>৳{priceMax}</span>
            </div>
            <div className="trd-range-track">
              <div
                className="trd-range-fill"
                style={{ left: `${(priceMin / 10000) * 100}%`, right: `${100 - (priceMax / 10000) * 100}%` }}
              />
            </div>
            <div className="trd-range-inputs">
              <input type="range" min={0} max={10000} step={100} value={priceMin}
                onChange={e => setPriceMin(Math.min(Number(e.target.value), priceMax - 100))}
                className="trd-range-input" />
              <input type="range" min={0} max={10000} step={100} value={priceMax}
                onChange={e => setPriceMax(Math.max(Number(e.target.value), Number(priceMin) + 100))}
                className="trd-range-input" />
            </div>
            <button
              onClick={() => onPriceApply(priceMin, priceMax)}
              className="noon-apply-btn"
            >
              Apply
            </button>
          </div>
        </FilterSection>

        {/* ── EXPRESS ── */}
        <FilterSection title="Express" icon="fa-rocket" sectionKey="express" collapsed={collapsed} toggle={toggle}>
          <label className="noon-filter-check">
            <input type="checkbox" checked={express === "1"} onChange={onExpressToggle} className="noon-checkbox" />
            <span className="noon-express-badge">express</span>
            <span className="text-gray-400 text-xs ml-auto">Get it fast</span>
          </label>
        </FilterSection>

        {/* ── FREE DELIVERY ── */}
        <FilterSection title="Free Delivery" icon="fa-truck" sectionKey="fd" collapsed={collapsed} toggle={toggle}>
          <label className="noon-filter-check">
            <input type="checkbox" checked={freeDelivery === "1"} onChange={onFreeDeliveryToggle} className="noon-checkbox" />
            <span className="text-green-700 font-semibold text-xs">🚚 Free Delivery</span>
            <span className="text-gray-400 text-xs ml-auto">Free shipping</span>
          </label>
        </FilterSection>

        {/* ── DEALS ── */}
        <FilterSection title="Deals" sectionKey="deals" collapsed={collapsed} toggle={toggle}>
          {[
            { val: "eid",          label: "EID Offers" },
            { val: "deals",        label: "Mega Deals" },
            { val: "bestseller",   label: "Bestsellers" },
            { val: "new_arrivals", label: "New Arrivals" },
          ].map(d => (
            <label key={d.val} className="noon-filter-check">
              <input
                type="checkbox"
                checked={dealType === d.val}
                onChange={() => onDealChange(dealType === d.val ? "" : d.val)}
                className="noon-checkbox"
              />
              <span>{d.label}</span>
            </label>
          ))}
        </FilterSection>

        {/* ── RATING ── */}
        <FilterSection title="Rating" sectionKey="rating" collapsed={collapsed} toggle={toggle}>
          {[4, 3, 2, 1].map(s => (
            <label key={s} className="noon-filter-check">
              <input
                type="radio"
                name="sidebar_rating"
                checked={ratingVal === String(s)}
                onChange={() => onRatingChange(String(s))}
                className="noon-radio"
              />
              <span className="flex items-center gap-px">
                {Array.from({ length: s }).map((_, i) => <i key={i} className="fa fa-star text-yellow-400 text-xs" />)}
                {Array.from({ length: 5 - s }).map((_, i) => <i key={i} className="fa fa-star-o text-gray-300 text-xs" />)}
              </span>
              <span className="text-xs text-gray-500">&amp; Up</span>
            </label>
          ))}
        </FilterSection>
      </div>
    </aside>
  );
}

/* ── Category Node (recursive) ── */
function CategoryNode({ cat, activeSlug, onClick, depth = 0 }) {
  const [open, setOpen] = useState(false);
  const hasChildren = cat.children?.length > 0;
  const isActive = activeSlug === cat.slug;

  // Auto-expand if active category is nested child
  useEffect(() => {
    if (hasChildren) {
      const hasActiveChild = (node) =>
        node.slug === activeSlug || (node.children || []).some(hasActiveChild);
      if (cat.children.some(hasActiveChild)) setOpen(true);
    }
  }, [activeSlug, hasChildren, cat.children, cat.slug]);

  return (
    <div className="noon-cat-item">
      <div className="noon-cat-row">
        {hasChildren ? (
          <button onClick={() => setOpen(!open)} className="noon-cat-toggle">
            <i className={`fa ${open ? "fa-minus-square-o" : "fa-plus-square-o"} text-gray-400 text-xs`} />
          </button>
        ) : (
          <span className="noon-cat-spacer" />
        )}
        <button
          onClick={() => onClick(cat.slug)}
          className={`noon-cat-link ${isActive ? "active" : ""}`}
        >
          {cat.icon ? (
            <Image src={mediaUrl(cat.icon)} alt="" width={26} height={26} className="rounded-full object-cover border border-gray-200" unoptimized />
          ) : cat.image ? (
            <Image src={mediaUrl(cat.image)} alt="" width={26} height={26} className="rounded-full object-cover border border-gray-200" unoptimized />
          ) : (
            <span className="w-[26px] h-[26px] rounded-full bg-gray-100 flex items-center justify-center text-[11px] font-bold text-gray-500 shrink-0">
              {cat.name?.[0]?.toUpperCase()}
            </span>
          )}
          <span className="noon-cat-label">{cat.name}</span>
        </button>
      </div>
      {hasChildren && open && (
        <div className="noon-cat-children">
          {cat.children.map(sub => (
            <CategoryNode key={sub.id} cat={sub} activeSlug={activeSlug} onClick={onClick} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Filter Section wrapper ── */
function FilterSection({ title, icon, sectionKey, collapsed, toggle, children }) {
  const isCollapsed = collapsed[sectionKey];
  return (
    <div className="noon-filter-section">
      <button onClick={() => toggle(sectionKey)} className="noon-filter-title">
        <span className="flex items-center gap-1.5">
          {icon && <i className={`fa ${icon} text-xs text-blue-500`} />}
          {title}
        </span>
        <i className={`fa fa-chevron-up text-[10px] text-gray-400 transition-transform duration-200 ${isCollapsed ? "rotate-180" : ""}`} />
      </button>
      {!isCollapsed && <div className="noon-filter-body">{children}</div>}
    </div>
  );
}

/* ================================================================
   TOP FILTER BAR (Deals / Rating / Sort By dropdowns)
   ================================================================ */
function TopFilterBar({ dealType, onDealChange, ratingVal, onRatingChange, sortVal, onSortChange }) {
  return (
    <div className="noon-top-filter-bar">
      <div className="flex flex-wrap items-center gap-2">
        <FilterDropdown
          label="Deals"
          value={dealType}
          options={[
            { val: "", label: "All Products" },
            { val: "eid", label: "EID Offers" },
            { val: "deals", label: "Mega Deals" },
            { val: "bestseller", label: "Bestseller" },
            { val: "new_arrivals", label: "New Arrivals" },
          ]}
          onChange={onDealChange}
        />
        <FilterDropdown
          label="Rating"
          value={ratingVal}
          options={[
            { val: "", label: "All Ratings" },
            { val: "4", label: "★★★★ & Up" },
            { val: "3", label: "★★★ & Up" },
            { val: "2", label: "★★ & Up" },
            { val: "1", label: "★ & Up" },
          ]}
          onChange={onRatingChange}
        />
        <div className="ml-auto">
          <FilterDropdown
            label="Sort By"
            value={sortVal}
            align="right"
            options={[
              { val: "", label: "Featured" },
              { val: "name", label: "Name (A → Z)" },
              { val: "price", label: "Price: Low to High" },
              { val: "-price", label: "Price: High to Low" },
              { val: "-created_at", label: "Newest Arrivals" },
            ]}
            onChange={onSortChange}
          />
        </div>
      </div>
    </div>
  );
}

/* ── Filter Dropdown ── */
function FilterDropdown({ label, value, options, onChange, align }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(ref, close);

  const isActive = value && value !== "";

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className={`noon-dd-btn ${isActive ? "noon-dd-active" : ""}`}
      >
        <span>{label}</span>
        <i className={`fa fa-chevron-down text-[10px] transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className={`noon-dd-menu ${align === "right" ? "right-0" : "left-0"}`}>
          {options.map(o => (
            <button
              key={o.val}
              onClick={() => { onChange(o.val); setOpen(false); }}
              className={`noon-dd-item ${value === o.val ? "noon-dd-selected" : ""}`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ================================================================
   PROMO STRIP — 4 colored cards matching Odoo
   ================================================================ */
const PROMOS = [
  {
    href: "/shop?deal_type=featured",
    gradient: "linear-gradient(135deg, #fccc04 0%, #f59e0b 100%)",
    color: "#000",
    icon: "fa-star",
    title: "Featured",
    sub: "Top Picks",
  },
  {
    href: "/shop?deal_type=eid",
    gradient: "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)",
    color: "#fff",
    icon: "fa-moon-o",
    title: "EID Offers",
    sub: "Special Deals",
  },
  {
    href: "/shop?deal_type=deals",
    gradient: "linear-gradient(135deg, #e62e04 0%, #ff6b35 100%)",
    color: "#fff",
    icon: "fa-tag",
    title: "Mega Deals",
    sub: "Best Prices",
  },
  {
    href: "/shop?deal_type=bestseller",
    gradient: "linear-gradient(135deg, #006c4f 0%, #059669 100%)",
    color: "#fff",
    icon: "fa-trophy",
    title: "Best Sellers",
    sub: "Most Loved",
  },
];

function PromoStrip() {
  return (
    <div className="trd-promo-strip">
      {PROMOS.map((p, i) => (
        <Link
          key={i}
          href={p.href}
          className="trd-promo-card"
          style={{ background: p.gradient, color: p.color }}
        >
          <div className="trd-promo-icon">
            <i className={`fa ${p.icon}`} />
          </div>
          <div className="trd-promo-text">
            <span className="trd-promo-title">{p.title}</span>
            <span className="trd-promo-sub">{p.sub}</span>
            <span className="trd-promo-cta">Shop Now →</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
