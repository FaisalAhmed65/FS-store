/**
 * components/home/CategoryBadges.js
 * Horizontal scrollable category badges â€” matches Odoo category_badges_horizontal.
 * Shows all parent categories with images in rounded-rect cards. Dynamic + Bengali.
 */
import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import useSWR from "swr";
import { categoriesApi } from "@/lib/api";
import { mediaUrl } from "@/lib/utils";
import { useLang } from "@/contexts/LanguageContext";

export default function CategoryBadges() {
  const { data, isLoading } = useSWR("cat-badges", () =>
    categoriesApi.list({ root_only: true }).then((r) => r.data?.results ?? r.data ?? [])
  );
  const scrollRef = useRef(null);
  const { lang } = useLang();
  const isBn = lang === "bn";

  function scroll(dir) {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir * 400, behavior: "smooth" });
  }

  const cats = Array.isArray(data) ? data : [];
  // Use first 5 dynamic categories for quick links, fallback to none if loading
  const quickLinks = cats.slice(0, 5);

  return (
    <section className="py-6 w-full" style={{ background: "#fff" }}>
      <div className="px-4">
        <h2 className="text-xl font-extrabold mb-4" style={{ color: "#232f3e" }}>
          <span className="t-en">Shop by Category</span>
          <span className="t-bn">à¦•à§à¦¯à¦¾à¦Ÿà¦¾à¦—à¦°à¦¿ à¦…à¦¨à§à¦¯à¦¾à¦¯à¦¼à§€ à¦•à§‡à¦¨à¦¾à¦•à¦¾à¦Ÿà¦¾</span>
        </h2>

        {/* Dynamic quick links from top categories */}
        {quickLinks.length > 0 && (
          <div className="flex gap-2 mb-4 flex-wrap">
            {quickLinks.map((cat) => (
              <Link
                key={cat.id}
                href={`/shop?category=${cat.slug || cat.id}`}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold no-underline whitespace-nowrap transition-all hover:-translate-y-0.5"
                style={{ background: "#f8f9fa", color: "#374151", border: "1px solid #e5e7eb" }}
              >
                <i className="fa fa-tag text-sm text-blue-600" />
                {isBn && cat.name_bn ? cat.name_bn : cat.name}
              </Link>
            ))}
          </div>
        )}

        {/* Scrollable badges */}
        <div className="relative">
          <button
            onClick={() => scroll(-1)}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 z-[15] w-12 h-12 rounded-full bg-white border border-gray-300 flex items-center justify-center cursor-pointer shadow-lg hover:bg-gray-50 hover:border-gray-500 transition-all"
            style={{ opacity: 0.85 }}
            aria-label="Scroll left"
          >
            <i className="fa fa-chevron-left text-lg text-gray-700" />
          </button>

          {isLoading ? (
            <div className="text-center py-8">
              <i className="fa fa-spinner fa-spin fa-2x text-gray-400" />
            </div>
          ) : (
            <div
              ref={scrollRef}
              className="overflow-x-auto overflow-y-hidden px-[70px]"
              style={{ scrollBehavior: "smooth", scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              <style jsx>{`div::-webkit-scrollbar { display: none; }`}</style>
              <div className="flex gap-5 py-2.5">
                {cats.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/shop?category=${cat.slug || cat.id}`}
                    className="cat-badge-item no-underline"
                  >
                    <div className="cat-badge-img-wrap">
                      {cat.image ? (
                        <Image
                          src={mediaUrl(cat.image)}
                          alt={isBn && cat.name_bn ? cat.name_bn : cat.name}
                          width={160}
                          height={120}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          <i className="fa fa-th-large text-4xl text-gray-400" />
                        </div>
                      )}
                    </div>
                    <span className="text-sm font-extrabold text-center leading-tight line-clamp-2" style={{ color: "#232f3e" }}>
                      {isBn && cat.name_bn ? cat.name_bn : cat.name}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => scroll(1)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 z-[15] w-12 h-12 rounded-full bg-white border border-gray-300 flex items-center justify-center cursor-pointer shadow-lg hover:bg-gray-50 hover:border-gray-500 transition-all"
            style={{ opacity: 0.85 }}
            aria-label="Scroll right"
          >
            <i className="fa fa-chevron-right text-lg text-gray-700" />
          </button>
        </div>
      </div>
    </section>
  );
}
