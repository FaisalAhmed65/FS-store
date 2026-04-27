/**
 * components/home/SubcategoryBadges.js
 * Circular category/subcategory badges backed only by the API.
 */
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

  const { data, isLoading } = useSWR(
    propParentId ? `subcats-${propParentId}` : "root-category-badges",
    () => categoriesApi.list(
      propParentId ? { parent: propParentId } : { root_only: true }
    ).then((r) => r.data?.results ?? r.data ?? [])
  );
  const scrollRef = useRef(null);

  function scroll(dir) {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir * 250, behavior: "smooth" });
  }

  const subcats = Array.isArray(data) ? data : [];

  if (isLoading && subcats.length === 0) {
    return (
      <section className="relative py-4" style={{ background: "#f5f6f8" }}>
        <div className="flex justify-center">
          <i className="fa fa-spinner fa-spin fa-lg text-gray-400" />
        </div>
      </section>
    );
  }

  if (subcats.length === 0) return null;

  return (
    <section className="relative py-3 w-full" style={{ background: "#f5f6f8" }}>
      <div className="px-3">
        <div className="relative">
          {/* Prev */}
          <button
            onClick={() => scroll(-1)}
            className="absolute left-1.5 top-1/2 -translate-y-1/2 z-10 w-[30px] h-[30px] rounded-md bg-white/90 border border-gray-300 flex items-center justify-center cursor-pointer text-gray-600 shadow-sm hover:bg-white"
            aria-label="Previous"
          >
            <i className="fa fa-chevron-left text-sm" />
          </button>

          <div
            ref={scrollRef}
            className="subcat-scroll overflow-x-auto py-1.5"
            style={{ scrollBehavior: "smooth" }}
          >
            <div className="flex gap-2.5 px-10 min-w-max">
              {subcats.map((cat) => {
                const image = cat.icon || cat.image;
                return (
                <Link
                  key={cat.id}
                  href={`/shop?category_slug=${cat.slug || cat.id}`}
                  className="flex flex-col items-center no-underline min-w-[82px] max-w-[90px] hover:-translate-y-1 transition-transform"
                >
                  <div className="w-[60px] h-[60px] rounded-full overflow-hidden border-2 border-gray-200 bg-white flex items-center justify-center mb-1.5">
                    {image ? (
                      <Image
                        src={mediaUrl(image)}
                        alt={isBn && cat.name_bn ? cat.name_bn : cat.name}
                        width={60}
                        height={60}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <span className="text-gray-500 font-bold text-xl">
                          {(cat.name || "?").charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  <span className="text-[11px] font-extrabold text-gray-600 text-center leading-tight max-w-[80px] break-words">
                    {isBn && cat.name_bn ? cat.name_bn : cat.name}
                  </span>
                </Link>
                );
              })}
            </div>
          </div>

          {/* Next */}
          <button
            onClick={() => scroll(1)}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 z-10 w-[30px] h-[30px] rounded-md bg-white/90 border border-gray-300 flex items-center justify-center cursor-pointer text-gray-600 shadow-sm hover:bg-white"
            aria-label="Next"
          >
            <i className="fa fa-chevron-right text-sm" />
          </button>
        </div>
      </div>
    </section>
  );
}
