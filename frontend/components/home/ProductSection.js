/**
 * components/home/ProductSection.js
 * Reusable storefront product section.
 */
import { useRef, useState } from "react";
import Link from "next/link";
import NoonProductCard from "./NoonProductCard";
import { useLang } from "@/contexts/LanguageContext";

const PAGE_SIZE = 6;

export default function ProductSection({
  title,
  titleBn,
  icon,
  iconColor,
  products = [],
  loading,
  viewAllHref = "/shop",
  viewAllLabel = "View All",
  viewAllLabelBn = "সব দেখুন",
  emptyMessage,
  emptyMessageBn,
}) {
  const [page, setPage] = useState(0);
  const containerRef = useRef(null);
  const { lang } = useLang();
  const isBn = lang === "bn";

  const totalPages = Math.ceil(products.length / PAGE_SIZE);
  const visible = products.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function prevPage() { setPage((p) => Math.max(0, p - 1)); }
  function nextPage() { setPage((p) => Math.min(totalPages - 1, p + 1)); }

  // Skeleton loading
  if (loading) {
    return (
      <section className="py-6 w-full">
        <div className="homepage-shell">
          <div className="flex items-center justify-between mb-4">
            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="noon-card animate-pulse">
                <div className="noon-image-wrap bg-gray-200" />
                <div className="h-3 bg-gray-200 rounded mt-2 w-3/4" />
                <div className="h-3 bg-gray-200 rounded mt-1 w-1/2" />
                <div className="h-5 bg-gray-200 rounded mt-2 w-1/3" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!products.length) {
    if (!emptyMessage) return null;
    return (
      <section className="py-6 w-full">
        <div className="homepage-shell">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-extrabold flex items-center gap-2" style={{ color: "#17201b" }}>
              {icon && <i className={`fa ${icon}`} style={iconColor ? { color: iconColor } : undefined} />}
              {isBn && titleBn ? titleBn : title}
            </h2>
            <Link
              href={viewAllHref}
              className="text-sm font-semibold no-underline transition-colors hover:opacity-80"
              style={{ color: "#2563eb" }}
            >
              <span className="t-en">{viewAllLabel}</span>
              <span className="t-bn">{viewAllLabelBn}</span>
            </Link>
          </div>
          <div className="rounded-xl border border-dashed border-gray-200 bg-white/70 p-5 text-sm text-muted">
            {isBn && emptyMessageBn ? emptyMessageBn : emptyMessage}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-6 w-full">
      <div className="homepage-shell">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-extrabold flex items-center gap-2" style={{ color: "#17201b" }}>
            {icon && <i className={`fa ${icon}`} style={iconColor ? { color: iconColor } : undefined} />}
            {isBn && titleBn ? titleBn : title}
          </h2>
          <Link
            href={viewAllHref}
            className="text-sm font-semibold no-underline transition-colors hover:opacity-80"
            style={{ color: "#2563eb" }}
          >
            <span className="t-en">{viewAllLabel}</span>
            <span className="t-bn">{viewAllLabelBn}</span>
          </Link>
        </div>

        {/* Grid with nav */}
        <div className="relative" ref={containerRef}>
          {/* Previous */}
          {page > 0 && (
            <button
            onClick={prevPage}
            className="section-nav-btn absolute -left-3 top-1/2 -translate-y-1/2"
              aria-label={isBn ? "আগের পেজ" : "Previous page"}
            >
              <i className="fa fa-chevron-left" />
            </button>
          )}

          {/* Products grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {visible.map((product) => (
              <NoonProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Next */}
          {page < totalPages - 1 && (
            <button
            onClick={nextPage}
            className="section-nav-btn absolute -right-3 top-1/2 -translate-y-1/2"
              aria-label={isBn ? "পরের পেজ" : "Next page"}
            >
              <i className="fa fa-chevron-right" />
            </button>
          )}
        </div>

        {/* Page indicators */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-1.5 mt-4">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`w-2 h-2 rounded-sm border-none cursor-pointer transition-all ${
                  i === page ? "bg-blue-600 w-4" : "bg-gray-300"
                }`}
                aria-label={isBn ? `পেজ ${i + 1}` : `Page ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
