/**
 * components/home/CategoryShowcase.js
 * Category blocks with subcategory image grids and carousel navigation.
 * Matches Odoo category_showcase_section template.
 */
import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import useSWR from "swr";
import { categoriesApi } from "@/lib/api";
import { mediaUrl } from "@/lib/utils";
import { useLang } from "@/contexts/LanguageContext";

function CategoryBlock({ category }) {
  const { lang } = useLang();
  const isBn = lang === "bn";
  const children = category.children ?? category.subcategories ?? [];
  const scrollRef = useRef(null);

  function scroll(dir) {
    scrollRef.current?.scrollBy({ left: dir * 300, behavior: "smooth" });
  }

  return (
    <div className="mb-8">
      {/* heading */}
      <div className="flex items-center justify-between mb-4">
        <h3
          className="text-xl font-extrabold"
          style={{ color: "#1a1a2e" }}
        >
          {isBn && category.name_bn ? category.name_bn : category.name}
        </h3>
        <Link
          href={`/shop?category=${category.slug || category.id}`}
          className="text-sm font-semibold no-underline hover:underline"
          style={{ color: "#3b82f6" }}
        >
          <span className="t-en">View All →</span>
          <span className="t-bn">সব দেখুন →</span>
        </Link>
      </div>

      {/* subcategory grid as a horizontal carousel */}
      <div className="relative">
        {children.length > 5 && (
          <>
            <button
              onClick={() => scroll(-1)}
              className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-md border flex items-center justify-center hover:bg-gray-50 transition-all"
              aria-label="Scroll left"
            >
              <i className="fa fa-chevron-left text-gray-600" />
            </button>
            <button
              onClick={() => scroll(1)}
              className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-md border flex items-center justify-center hover:bg-gray-50 transition-all"
              aria-label="Scroll right"
            >
              <i className="fa fa-chevron-right text-gray-600" />
            </button>
          </>
        )}

        <div
          ref={scrollRef}
          className="overflow-x-auto"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <style jsx>{`div::-webkit-scrollbar { display: none; }`}</style>
          <div className="flex gap-4 py-1">
            {children.length > 0 ? (
              children.map((sub) => (
                <Link
                  key={sub.id}
                  href={`/shop?category=${sub.slug || sub.id}`}
                  className="flex-shrink-0 w-36 no-underline text-center group"
                >
                  <div className="w-36 h-36 rounded-xl overflow-hidden bg-gray-50 border border-gray-200 transition-all group-hover:border-blue-300 group-hover:shadow-md">
                    {sub.image ? (
                      <Image
                        src={mediaUrl(sub.image)}
                        alt={isBn && sub.name_bn ? sub.name_bn : sub.name}
                        width={144}
                        height={144}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <i className="fa fa-th-large text-3xl text-gray-300" />
                      </div>
                    )}
                  </div>
                  <span
                    className="block mt-2 text-xs font-semibold leading-tight line-clamp-2"
                    style={{ color: "#374151" }}
                  >
                    {isBn && sub.name_bn ? sub.name_bn : sub.name}
                  </span>
                </Link>
              ))
            ) : (
              /* placeholders when no subcategories */
              [1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex-shrink-0 w-36 text-center">
                  <div className="w-36 h-36 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center">
                    <i className="fa fa-image text-3xl text-gray-300" />
                  </div>
                  <span className="block mt-2 h-3 w-20 mx-auto rounded bg-gray-200" />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CategoryShowcase() {
  const { data, isLoading } = useSWR("cat-showcase", () =>
    categoriesApi.showcase().then((r) => r.data?.results ?? r.data ?? [])
  );

  const categories = Array.isArray(data) ? data : [];

  if (isLoading) {
    return (
      <section className="py-6 px-4 text-center">
        <i className="fa fa-spinner fa-spin fa-2x text-gray-400" />
      </section>
    );
  }

  if (categories.length === 0) return null;

  return (
    <section className="py-6 w-full" style={{ background: "#fff" }}>
      <div className="px-4">
        <h2 className="text-2xl font-extrabold mb-6" style={{ color: "#1a1a2e" }}>
          <i className="fa fa-th-large mr-2 text-blue-500" />
          <span className="t-en">Shop by Category</span>
          <span className="t-bn">ক্যাটাগরি অনুযায়ী কেনাকাটা</span>
        </h2>
        {categories.map((cat) => (
          <CategoryBlock key={cat.id} category={cat} />
        ))}
      </div>
    </section>
  );
}
