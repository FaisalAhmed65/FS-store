import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { productsApi } from "@/lib/api";
import { discountPct, formatPrice, mediaUrl, productHref } from "@/lib/utils";
import { FALLBACK_CATEGORIES, FALLBACK_PRODUCTS } from "@/lib/fallbackData";

function useCountdown(hours = 12) {
  const target = useMemo(() => Date.now() + hours * 3600_000, [hours]);
  const [left, setLeft] = useState(hours * 3600);

  useEffect(() => {
    const id = setInterval(() => {
      const seconds = Math.max(0, Math.floor((target - Date.now()) / 1000));
      setLeft(seconds);
      if (seconds <= 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [target]);

  return {
    h: String(Math.floor(left / 3600)).padStart(2, "0"),
    m: String(Math.floor((left % 3600) / 60)).padStart(2, "0"),
    s: String(left % 60).padStart(2, "0"),
  };
}

function ReasonsColumn() {
  const tiles = [
    { category: FALLBACK_CATEGORIES[0], title: "Deals in tech", href: "/shop?category_slug=electronics" },
    { category: FALLBACK_CATEGORIES[1], title: "Fresh fashion", href: "/shop?category_slug=fashion" },
    { category: FALLBACK_CATEGORIES[2], title: "Home upgrades", href: "/shop?category_slug=home-living" },
    { category: FALLBACK_CATEGORIES[3], title: "Beauty picks", href: "/shop?category_slug=beauty" },
  ];

  return (
    <div className="h-full">
      <h3 className="combined-heading text-lg font-extrabold mb-3">More reasons to shop</h3>
      <div className="grid grid-cols-2 gap-3">
        {tiles.map((tile) => (
          <Link key={tile.title} href={tile.href} className="reason-card-compact block overflow-hidden no-underline">
            <div className="aspect-[4/3] overflow-hidden bg-gray-100">
              <img src={mediaUrl(tile.category.image)} alt={tile.title} className="w-full h-full object-cover" loading="lazy" />
            </div>
            <div className="p-3">
              <h4 className="m-0 text-sm font-extrabold text-gray-900">{tile.title}</h4>
              <p className="m-0 mt-1 text-xs text-gray-500">Shop {tile.category.name}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function DealMiniCard({ product }) {
  const discount = discountPct(product.compare_price, product.price);
  const href = productHref(product);

  return (
    <Link href={href} className="deal-mini-card">
      <span className="deal-mini-image">
        <img src={mediaUrl(product.image)} alt={product.name || "Product"} loading="lazy" />
      </span>
      <span className="deal-mini-info">
        <span className="deal-mini-title">{product.name}</span>
        <span className="deal-mini-price">{formatPrice(product.price)}</span>
        {discount > 0 && <span className="deal-mini-save">Save {discount}%</span>}
      </span>
    </Link>
  );
}

function MegaDealsColumn() {
  const { h, m, s } = useCountdown(12);
  const { data, isLoading } = useSWR("mega-deals", () =>
    productsApi.deals().then((r) => r.data?.results ?? r.data ?? [])
  );
  const apiDeals = Array.isArray(data) ? data : [];
  const deals = (apiDeals.length ? apiDeals : FALLBACK_PRODUCTS).filter((product) => product.is_deal || product.compare_price).slice(0, 4);

  return (
    <div className="h-full">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h3 className="combined-heading text-lg font-extrabold">
          <i className="fa fa-bolt mr-2" />
          Mega Deals
        </h3>
        <div className="countdown-timer flex items-center gap-1.5">
          <span className="text-xs font-semibold text-gray-600">Ends in</span>
          {[h, m, s].map((value, index) => (
            <span key={`${value}-${index}`} className="flex items-center gap-1">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-md text-sm font-bold bg-red-700 text-white">
                {value}
              </span>
              {index < 2 && <span className="font-bold text-gray-500">:</span>}
            </span>
          ))}
        </div>
      </div>

      {isLoading && !deals.length ? (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="deal-mini-card animate-pulse">
              <span className="deal-mini-image bg-gray-100" />
              <span className="deal-mini-info">
                <span className="h-3 w-24 bg-gray-100 rounded" />
                <span className="h-4 w-16 bg-gray-100 rounded" />
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {deals.map((product) => (
            <DealMiniCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

function InFocusColumn() {
  const promos = [
    {
      href: "/shop?search=gaming",
      image: "https://images.unsplash.com/photo-1598550476439-6847785fcea6?auto=format&fit=crop&w=900&q=80",
      title: "Gaming gear",
      copy: "Consoles, keyboards, audio, and desk upgrades",
    },
    {
      href: "/shop?search=electronics",
      image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=900&q=80",
      title: "Work smarter",
      copy: "Tech picks for office, study, and travel",
    },
  ];

  return (
    <div className="h-full">
      <h3 className="combined-heading text-lg font-extrabold mb-3">
        <i className="fa fa-eye mr-2" />
        In Focus
      </h3>
      <div className="grid grid-cols-1 gap-3">
        {promos.map((promo) => (
          <Link key={promo.href} href={promo.href} className="focus-promo">
            <img src={promo.image} alt={promo.title} className="focus-promo-image" loading="lazy" />
            <span className="focus-promo-scrim" />
            <span className="focus-promo-copy">
              <span>{promo.title}</span>
              <small>{promo.copy}</small>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function CombinedSection() {
  return (
    <section className="combined-section py-6 w-full">
      <div className="homepage-shell">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-3">
            <ReasonsColumn />
          </div>
          <div className="lg:col-span-5">
            <MegaDealsColumn />
          </div>
          <div className="lg:col-span-4">
            <InFocusColumn />
          </div>
        </div>
      </div>
    </section>
  );
}
