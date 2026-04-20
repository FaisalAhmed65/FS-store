/**
 * components/home/CategoryCarouselBar.js
 * Sticky horizontal category bar below header.
 * Full-width, zero gap below header, Bengali text support.
 */
import { useRef } from "react";
import Link from "next/link";
import useSWR from "swr";
import { categoriesApi } from "@/lib/api";
import { useLang } from "@/contexts/LanguageContext";
import { FALLBACK_CATEGORIES } from "@/lib/fallbackData";

export default function CategoryCarouselBar() {
  const { data } = useSWR("catbar", () => categoriesApi.list({ root_only: true }).then((r) => r.data?.results ?? r.data ?? []));
  const { lang } = useLang();
  const scrollRef = useRef(null);
  const isBn = lang === "bn";

  function scroll(dir) {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir * 300, behavior: "smooth" });
  }

  const cats = Array.isArray(data) && data.length ? data : FALLBACK_CATEGORIES;

  return (
    <div
      className="sticky z-50 border-b border-gray-200 w-full"
      style={{ top: "var(--trd-header-height, 72px)", background: "#fff" }}
    >
      <div className="flex items-stretch h-11 w-full">
        {/* Scroll wrapper */}
        <div className="flex items-center flex-1 min-w-0 relative px-1">
          <button
            onClick={() => scroll(-1)}
            className="flex-shrink-0 w-[30px] h-[30px] rounded-md border border-gray-200 bg-white flex items-center justify-center cursor-pointer text-sm text-gray-600 hover:bg-gray-100 hover:text-green-600 transition-all mx-0.5"
            aria-label="Scroll left"
          >
            <i className="fa fa-chevron-left" />
          </button>

          <div
            ref={scrollRef}
            className="catbar-track flex-1 overflow-x-auto overflow-y-hidden"
            style={{ scrollBehavior: "smooth" }}
          >
            <div className="flex whitespace-nowrap gap-0 items-center h-full min-w-max">
              {cats.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/shop?category_slug=${cat.slug || cat.id}`}
                  className="inline-flex items-center px-4 py-2 text-[13px] font-bold text-gray-700 no-underline whitespace-nowrap transition-all border-b-2 border-transparent h-full hover:text-green-600 hover:bg-green-50/50"
                >
                  {isBn && cat.name_bn ? cat.name_bn : cat.name}
                </Link>
              ))}
            </div>
          </div>

          <button
            onClick={() => scroll(1)}
            className="flex-shrink-0 w-[30px] h-[30px] rounded-md border border-gray-200 bg-white flex items-center justify-center cursor-pointer text-sm text-gray-600 hover:bg-gray-100 hover:text-green-600 transition-all mx-0.5"
            aria-label="Scroll right"
          >
            <i className="fa fa-chevron-right" />
          </button>
        </div>

        {/* Free Delivery Button */}
        <Link
          href="/shop?free_delivery=1"
          className="flex-shrink-0 flex items-center gap-1.5 px-5 text-[13px] font-semibold text-white no-underline whitespace-nowrap transition-all border-l border-green-600/20"
          style={{ background: "linear-gradient(135deg, #059669 0%, #10b981 100%)" }}
        >
          <i className="fa fa-truck" style={{ fontSize: 15 }} />
          <span className="t-en">Free Delivery</span>
          <span className="t-bn">ফ্রি ডেলিভারি</span>
        </Link>
      </div>
    </div>
  );
}
