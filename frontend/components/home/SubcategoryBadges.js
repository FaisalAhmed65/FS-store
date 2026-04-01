/**
 * components/home/SubcategoryBadges.js
 * Circular subcategory badges â€” matches Odoo snippet_subcategory_badges.
 * Auto-fetches first root category when no parentId is passed (homepage use).
 */
import { useState, useEffect } from "react";
import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import useSWR from "swr";
import { categoriesApi } from "@/lib/api";
import { mediaUrl } from "@/lib/utils";
import { useLang } from "@/contexts/LanguageContext";

export default function SubcategoryBadges({ parentId: propParentId }) {
  const { lang } = useLang();
  const isBn = lang === "bn";

  // Auto-detect first root category when parentId not provided (homepage)
  const [autoParentId, setAutoParentId] = useState(null);
  useEffect(() => {
    if (!propParentId) {
      categoriesApi.list({ root_only: true })
        .then((r) => {
          const cats = r.data?.results ?? r.data ?? [];
          if (cats.length > 0) setAutoParentId(cats[0].id);
        })
        .catch(() => {});
    }
  }, [propParentId]);

  const parentId = propParentId || autoParentId;

  const { data, isLoading } = useSWR(
    parentId ? `subcats-${parentId}` : null,
    () => categoriesApi.list({ parent: parentId }).then((r) => r.data?.results ?? r.data ?? [])
  );
  const scrollRef = useRef(null);

  function scroll(dir) {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir * 250, behavior: "smooth" });
  }

  const subcats = Array.isArray(data) ? data : [];

  // Show loading state while auto-detecting category
  if (!parentId && !propParentId) {
    return (
      <section className="relative py-4" style={{ background: "#f5f6f8" }}>
        <div className="flex justify-center">
          <i className="fa fa-spinner fa-spin fa-lg text-gray-400" />
        </div>
      </section>
    );
  }

  return (
    <section className="relative py-3 w-full" style={{ background: "#f5f6f8" }}>
      <div className="px-3">
        <div className="relative">
          {/* Prev */}
          <button
            onClick={() => scroll(-1)}
            className="absolute left-1.5 top-1/2 -translate-y-1/2 z-10 w-[30px] h-[30px] rounded-full bg-white/90 border border-gray-300 flex items-center justify-center cursor-pointer text-gray-600 shadow-sm hover:bg-white"
            aria-label="Previous"
          >
            <i className="fa fa-chevron-left text-sm" />
          </button>

          {isLoading ? (
            <div className="text-center py-4">
              <i className="fa fa-spinner fa-spin fa-lg text-gray-400" />
            </div>
          ) : (
            <div
              ref={scrollRef}
              className="subcat-scroll overflow-x-auto py-1.5"
              style={{ scrollBehavior: "smooth" }}
            >
              <div className="flex gap-2.5 px-10 min-w-max">
                {subcats.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/shop?category=${cat.slug || cat.id}`}
                    className="flex flex-col items-center no-underline min-w-[82px] max-w-[90px] hover:-translate-y-1 transition-transform"
                  >
                    <div className="w-[60px] h-[60px] rounded-full overflow-hidden border-2 border-gray-200 bg-white flex items-center justify-center mb-1.5">
                      {cat.image ? (
                        <Image
                          src={mediaUrl(cat.image)}
                          alt={isBn && cat.name_bn ? cat.name_bn : cat.name}
                          width={60}
                          height={60}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #00D4FF 0%, #7D38FF 100%)" }}>
                          <span className="text-white font-bold text-xl">
                            {(cat.name || "?").charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>
                    <span className="text-[11px] font-extrabold text-gray-600 text-center leading-tight max-w-[80px] break-words">
                      {isBn && cat.name_bn ? cat.name_bn : cat.name}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Next */}
          <button
            onClick={() => scroll(1)}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 z-10 w-[30px] h-[30px] rounded-full bg-white/90 border border-gray-300 flex items-center justify-center cursor-pointer text-gray-600 shadow-sm hover:bg-white"
            aria-label="Next"
          >
            <i className="fa fa-chevron-right text-sm" />
          </button>
        </div>
      </div>
    </section>
  );
}
