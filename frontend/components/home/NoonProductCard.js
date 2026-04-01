/**
 * components/home/NoonProductCard.js
 * Noon-style product card — matches Odoo noon_product_card template exactly.
 */
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatPrice, discountPct, mediaUrl } from "@/lib/utils";
import { useLang } from "@/contexts/LanguageContext";
import QuickViewModal from "@/components/ui/QuickViewModal";

const BADGE_COLORS = {
  bestseller: { bg: "#006c4f", label: "Best Seller", labelBn: "বেস্ট সেলার" },
  deals:      { bg: "#e62e04", label: "Deal", labelBn: "ডিল" },
  new:        { bg: "#4263eb", label: "New", labelBn: "নতুন" },
  featured:   { bg: "#fccc04", label: "Featured", labelBn: "ফিচার্ড", textColor: "#000" },
  eid:        { bg: "#8b5cf6", label: "EID", labelBn: "ইদ" },
};

export default function NoonProductCard({ product }) {
  if (!product) return null;
  const { lang } = useLang();
  const isBn = lang === "bn";
  const [quickViewOpen, setQuickViewOpen] = useState(false);

  const {
    slug, name, name_bn, image, price, compare_price,
    is_featured, is_deal, is_new_arrival, is_bestseller,
    is_free_delivery, stock_quantity, delivery_type,
    get_in, get_in_bn,
  } = product;

  const discount = discountPct(compare_price, price);
  const href = `/shop/${slug || product.id}`;
  const is_express = delivery_type === "express";
  const displayName = isBn && name_bn ? name_bn : name;

  // Determine top badge
  let badge = null;
  if (is_bestseller) badge = BADGE_COLORS.bestseller;
  else if (is_deal) badge = BADGE_COLORS.deals;
  else if (is_new_arrival) badge = BADGE_COLORS.new;
  else if (is_featured) badge = BADGE_COLORS.featured;

  return (
    <div className="noon-card group">
      {/* Top-left badge */}
      {badge && (
        <span
          className="absolute top-2 left-2 px-2 py-0.5 rounded text-[11px] font-semibold z-[2] capitalize"
          style={{ backgroundColor: badge.bg, color: badge.textColor || "#fff" }}
        >
          {isBn && badge.labelBn ? badge.labelBn : badge.label}
        </span>
      )}

      {/* Wishlist heart */}
      <button
        className="absolute top-2 right-2 bg-white rounded-full w-8 h-8 flex items-center justify-center z-10 shadow-sm hover:scale-110 transition-transform border-none cursor-pointer"
        aria-label="Add to wishlist"
      >
        <i className="fa fa-heart-o text-gray-500 text-base hover:text-red-500" />
      </button>

      {/* Product link */}
      <Link href={href} className="no-underline text-inherit flex flex-col flex-1">
        {/* Image */}
        <div className="noon-image-wrap">
          <Image
            src={mediaUrl(image)}
            alt={name || "Product"}
            fill
            className="object-contain p-1"
            sizes="(max-width: 768px) 50vw, 200px"
            unoptimized
          />
          {/* Quick View */}
          <button
            className="noon-quick-add"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setQuickViewOpen(true); }}
            aria-label="Quick view product"
            title="Quick View"
          >
            <i className="fa fa-eye text-gray-600 text-base" />
          </button>
        </div>

        {/* Info */}
        <div className="flex flex-col gap-1.5 flex-1">
          {/* Product name */}
          <h3 className="text-[13px] leading-[1.4] font-medium m-0 line-clamp-2 min-h-[36px]" style={{ color: "#1a1a2e" }}>
            {displayName}
          </h3>

          {/* Get In (e.g., packaging) */}
          {(get_in || get_in_bn) && (
            <p className="text-[11px] text-gray-600 m-0 line-clamp-1">
              {isBn && get_in_bn ? get_in_bn : get_in}
            </p>
          )}

          {/* Stock indicator */}
          {stock_quantity != null && stock_quantity > 0 && stock_quantity <= 5 && (
            <div className="mt-0.5">
              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 rounded-full px-1.5 py-px animate-pulse">
                <i className="fa fa-exclamation-circle text-[10px]" />
                <span>{isBn ? `মাত্র ${stock_quantity}টি বাকি` : `Only ${stock_quantity} left`}</span>
              </span>
            </div>
          )}

          {/* Price */}
          <div className="mt-1">
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-xs font-semibold text-gray-600 mt-0.5">৳</span>
              <span className="text-[19px] font-extrabold tracking-tight leading-none" style={{ color: "#1a1a2e" }}>
                {formatPrice(price).replace("৳", "")}
              </span>
            </div>
            {discount > 0 && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xs text-gray-400 line-through">
                  ৳{formatPrice(compare_price).replace("৳", "")}
                </span>
                <span className="text-[13px] font-bold text-green-700">
                  {discount}% OFF
                </span>
              </div>
            )}
          </div>

          {/* Sliding badge area */}
          <div className="noon-badge-slide">
            {is_free_delivery && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-green-700">
                <i className="fa fa-truck text-xs" />
                <span className="t-en">Free Delivery</span>
                <span className="t-bn">ফ্রি ডেলিভারি</span>
              </span>
            )}
          </div>

          {/* Express badge */}
          {is_express && (
            <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold w-fit mt-1.5"
              style={{ backgroundColor: "#fccc04", color: "#000" }}
            >
              <i className="fa fa-bolt mr-1" />express
            </span>
          )}
        </div>
      </Link>

      {/* Quick View Modal */}
      {quickViewOpen && (
        <QuickViewModal product={product} onClose={() => setQuickViewOpen(false)} />
      )}
    </div>
  );
}
