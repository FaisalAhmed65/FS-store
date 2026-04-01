/**
 * components/home/CombinedSection.js
 * 3-column layout: Reasons to Shop | Mega Deals (countdown) | In Focus
 * Matches Odoo homepage_combined_section template.
 */
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import useSWR from "swr";
import { productsApi, categoriesApi } from "@/lib/api";
import NoonProductCard from "./NoonProductCard";
import { useLang } from "@/contexts/LanguageContext";

/* ─── countdown ─── */
function useCountdown(hours = 24) {
  const target = useMemo(() => Date.now() + hours * 3600_000, []);
  const [left, setLeft] = useState(hours * 3600);

  useEffect(() => {
    const id = setInterval(() => {
      const s = Math.max(0, Math.floor((target - Date.now()) / 1000));
      setLeft(s);
      if (s <= 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [target]);

  const h = String(Math.floor(left / 3600)).padStart(2, "0");
  const m = String(Math.floor((left % 3600) / 60)).padStart(2, "0");
  const s = String(left % 60).padStart(2, "0");
  return { h, m, s };
}

/* ─── Reasons to Shop (4 Image Cards — matches Odoo reasons_shop_wrapper) ─── */
function ReasonsColumn() {
  const { lang } = useLang();
  const isBn = lang === "bn";
  const reasons = [
    {
      title: "GAMING PCs",
      titleBn: "গেমিং পিসি",
      desc: "Top deals, wide selection",
      descBn: "সেরা ডিল, বিশাল সিলেকশন",
      href: "/shop?filter=deals",
      bg: "#D4EFDF",
      placeholder: "Gaming+PCs",
    },
    {
      title: "MOST PLAYED",
      titleBn: "সবচেয়ে জনপ্রিয়",
      desc: "Shop our top picks",
      descBn: "আমাদের টপ পিক শপ করুন",
      href: "/shop?filter=bestsellers",
      bg: "#FFF5E6",
      placeholder: "Most+Played",
    },
    {
      title: "NEW DROPS",
      titleBn: "নতুন এসেছে",
      desc: "The latest, curated for you",
      descBn: "সর্বশেষ, আপনার জন্য কিউরেটেড",
      href: "/shop?filter=new-arrivals",
      bg: "#E8D5F2",
      placeholder: "New+Drops",
    },
    {
      title: "GAMING BRANDS",
      titleBn: "গেমিং ব্র্যান্ড",
      desc: "Top Gaming Brands",
      descBn: "টপ গেমিং ব্র্যান্ড",
      href: "/shop",
      bg: "#DBEAFE",
      placeholder: "Gaming+Brands",
    },
  ];

  return (
    <div className="h-full flex flex-col">
      <h3 className="combined-heading text-lg font-extrabold mb-3">
        <span className="t-en">More reasons to shop</span>
        <span className="t-bn">আরও কেনার কারণ</span>
      </h3>
      <div className="grid grid-cols-2 gap-3 flex-1">
        {reasons.map((r) => (
          <Link
            key={r.title}
            href={r.href}
            className="reason-card-compact rounded-2xl overflow-hidden block no-underline transition-all hover:-translate-y-1 hover:shadow-lg"
            style={{ background: "#fff", border: "1px solid #eee" }}
          >
            <div
              className="w-full aspect-[4/3] flex items-center justify-center overflow-hidden"
              style={{ background: r.bg }}
            >
              <img
                src={`https://placehold.co/200x150/${r.bg.replace("#", "")}333?text=${r.placeholder}`}
                alt={r.title}
                className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
              />
            </div>
            <div className="p-2.5">
              <h4 className="text-xs font-bold m-0" style={{ color: "#232f3e" }}>
                {isBn ? r.titleBn : r.title}
              </h4>
              <p className="text-[10px] m-0 mt-0.5" style={{ color: "#6b7280" }}>
                {isBn ? r.descBn : r.desc}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ─── Mega Deals ─── */
function MegaDealsColumn() {
  const { lang } = useLang();
  const isBn = lang === "bn";
  const { h, m, s } = useCountdown(12);
  const { data, isLoading } = useSWR("mega-deals", () =>
    productsApi.deals().then((r) => r.data?.results ?? r.data ?? [])
  );
  const deals = (Array.isArray(data) ? data : []).slice(0, 4);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h3 className="combined-heading text-lg font-extrabold">
          <i className="fa fa-bolt mr-2" />
          <span className="t-en">Mega Deals</span>
          <span className="t-bn">মেগা ডিলস</span>
        </h3>
        <div className="countdown-timer flex items-center gap-1.5">
          <span className="text-xs font-semibold text-gray-600">
            <span className="t-en">Ends in</span>
            <span className="t-bn">শেষ হবে</span>
          </span>
          {[h, m, s].map((v, i) => (
            <span key={i} className="flex items-center gap-1.5">
              <span
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold"
                style={{ background: "#cc0c39", color: "#fff" }}
              >
                {v}
              </span>
              {i < 2 && <span className="font-bold text-gray-500">:</span>}
            </span>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <i className="fa fa-spinner fa-spin fa-2x text-gray-400" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 flex-1">
          {deals.map((product) => (
            <div key={product.id} className="mega-compact-card">
              <NoonProductCard product={product} compact />
            </div>
          ))}
          {deals.length === 0 &&
            [1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="rounded-xl bg-gray-50 flex items-center justify-center min-h-[140px]"
              >
                <i className="fa fa-image text-3xl text-gray-300" />
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

/* ─── In Focus ─── */
function InFocusColumn() {
  return (
    <div className="h-full flex flex-col">
      <h3 className="combined-heading text-lg font-extrabold mb-3">
        <i className="fa fa-eye mr-2" />
        <span className="t-en">In Focus</span>
        <span className="t-bn">ইন ফোকাস</span>
      </h3>
      <div className="flex flex-col gap-3 flex-1">
        <Link
          href="/shop?q=gaming"
          className="relative flex-1 rounded-2xl overflow-hidden block min-h-[140px] group"
        >
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(135deg, #1e3a5f 0%, #0d1b2a 100%)",
            }}
          />
          <div className="relative z-10 p-5 h-full flex flex-col justify-end">
            <span className="text-white font-extrabold text-base">
              <span className="t-en">Gaming Zone</span>
              <span className="t-bn">গেমিং জোন</span>
            </span>
            <span className="text-white/70 text-xs mt-1">
              <span className="t-en">Explore latest gaming gear →</span>
              <span className="t-bn">সর্বশেষ গেমিং গিয়ার দেখুন →</span>
            </span>
          </div>
        </Link>
        <Link
          href="/shop?q=electronics"
          className="relative flex-1 rounded-2xl overflow-hidden block min-h-[140px] group"
        >
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(135deg, #5b21b6 0%, #1e1b4b 100%)",
            }}
          />
          <div className="relative z-10 p-5 h-full flex flex-col justify-end">
            <span className="text-white font-extrabold text-base">
              <span className="t-en">Electronics</span>
              <span className="t-bn">ইলেকট্রনিক্স</span>
            </span>
            <span className="text-white/70 text-xs mt-1">
              <span className="t-en">Trending tech deals →</span>
              <span className="t-bn">ট্রেন্ডিং টেক ডিলস →</span>
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
}

/* ─── Combined Section wrapper ─── */
export default function CombinedSection() {
  return (
    <section
      className="combined-section py-6 w-full"
      style={{
        background: "linear-gradient(160deg, #f0f4ff 0%, #fdf2f8 45%, #eff6ff 100%)",
      }}
    >
      <div className="px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left — Reasons */}
          <div className="lg:col-span-3">
            <ReasonsColumn />
          </div>
          {/* Center — Mega Deals */}
          <div className="lg:col-span-5">
            <MegaDealsColumn />
          </div>
          {/* Right — In Focus */}
          <div className="lg:col-span-4">
            <InFocusColumn />
          </div>
        </div>
      </div>
    </section>
  );
}
