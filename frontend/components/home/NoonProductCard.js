/**
 * components/home/NoonProductCard.js
 * Noon-style product card — matches Odoo noon_product_card template exactly.
 */
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatPrice, discountPct, mediaUrl } from "@/lib/utils";
import { useLang } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
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
  const { addItem, isInCart, updateQty, items } = useCart();
  const { toggle, isWishlisted } = useWishlist();
  const [quickViewOpen, setQuickViewOpen] = useState(false);

  const {
    id, slug, name, name_bn, image, price, compare_price,
    is_featured, is_deal, is_new_arrival, is_bestseller,
    is_free_delivery, stock_quantity, delivery_type,
    get_in, get_in_bn, sold_recently, category_rank, brand,
    rating_avg, rating_count,
  } = product;

  const discount = discountPct(compare_price, price);
  const href = `/shop/product/${slug || id}`;
  const is_express = delivery_type === "express";
  const displayName = isBn && name_bn ? name_bn : name;
  const wishlisted = isWishlisted(id);
  const inCart = isInCart(id);
  const cartItem = items.find((i) => i.product.id === id);

  // Determine top badge
  let badge = null;
  if (is_bestseller) badge = BADGE_COLORS.bestseller;
  else if (is_deal) badge = BADGE_COLORS.deals;
  else if (is_new_arrival) badge = BADGE_COLORS.new;
  else if (is_featured) badge = BADGE_COLORS.featured;

  function handleAddToCart(e) {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, 1);
  }
  function handleQtyChange(e, delta) {
    e.preventDefault();
    e.stopPropagation();
    const newQty = (cartItem?.quantity || 0) + delta;
    if (newQty < 1) updateQty(id, 0); // removes
    else updateQty(id, newQty);
  }
  function handleWishlist(e) {
    e.preventDefault();
    e.stopPropagation();
    toggle(product);
  }

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
        aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
        onClick={handleWishlist}
      >
        <i className={`fa ${wishlisted ? "fa-heart text-red-500" : "fa-heart-o text-gray-500"} text-base`} />
      </button>

      {/* Product link wraps image + info */}
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
          {/* Quick View — search icon */}
          <button
            className="noon-quick-add"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setQuickViewOpen(true); }}
            aria-label="Quick view product"
            title="Quick View"
          >
            <i className="fa fa-search text-gray-600 text-base" />
          </button>
        </div>

        {/* Info */}
        <div className="flex flex-col gap-1 flex-1">
          {/* Brand */}
          {brand && (
            <p className="text-[11px] font-semibold m-0" style={{ color: "#2563eb" }}>{brand}</p>
          )}

          {/* Product name */}
          <h3 className="text-[13px] leading-[1.4] font-medium m-0 line-clamp-2 min-h-[36px]" style={{ color: "#1a1a2e" }}>
            {displayName}
          </h3>

          {/* Rating */}
          {rating_avg && Number(rating_avg) > 0 && (
            <div className="flex items-center gap-1">
              <i className="fa fa-star text-[11px]" style={{ color: "#fccc04" }} />
              <span className="text-[12px] font-bold" style={{ color: "#1a1a2e" }}>{Number(rating_avg).toFixed(1)}</span>
              {rating_count > 0 && <span className="text-[11px] text-gray-400">({rating_count})</span>}
            </div>
          )}

          {/* Price */}
          <div className="mt-1">
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-xs font-semibold text-gray-600 mt-0.5">৳</span>
              <span className="text-[19px] font-extrabold tracking-tight leading-none" style={{ color: "#1a1a2e" }}>
                {formatPrice(price).replace("৳", "")}
              </span>
              {discount > 0 && (
                <span className="text-xs text-gray-400 line-through ml-1">{formatPrice(compare_price).replace("৳", "")}</span>
              )}
              {discount > 0 && (
                <span className="text-[12px] font-bold text-green-700">{discount}%</span>
              )}
            </div>
          </div>

          {/* Category rank */}
          {category_rank > 0 && (
            <p className="text-[11px] font-semibold m-0" style={{ color: "#7c3aed" }}>
              <i className="fa fa-star text-[10px] mr-0.5" />
              {product.category_rank_text || `#${category_rank}`}
            </p>
          )}

          {/* Stock indicator */}
          {stock_quantity != null && stock_quantity > 0 && stock_quantity <= 5 && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 rounded-full px-1.5 py-px w-fit animate-pulse">
              <i className="fa fa-exclamation-circle text-[10px]" />
              {isBn ? `মাত্র ${stock_quantity}টি বাকি` : `Only ${stock_quantity} left`}
            </span>
          )}

          {/* Sliding badges: free delivery, sold_recently */}
          <div className="noon-badge-slide">
            {is_free_delivery && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-green-700">
                <i className="fa fa-truck text-xs" />
                <span className="t-en">Free Delivery</span>
                <span className="t-bn">ফ্রি ডেলিভারি</span>
              </span>
            )}
            {!is_free_delivery && sold_recently > 0 && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-orange-600">
                <i className="fa fa-fire text-xs" />
                <span className="t-en">{sold_recently}+ sold recently</span>
                <span className="t-bn">{sold_recently}+ সম্প্রতি বিক্রি</span>
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Add to cart / Qty controls — bottom of card, OUTSIDE Link */}
      <div className="mt-2">
        {inCart ? (
          <div className="noon-qty-ctrl">
            <button
              className="noon-qty-btn"
              onClick={(e) => handleQtyChange(e, -1)}
              aria-label="Remove one"
            >
              {cartItem?.quantity === 1
                ? <i className="fa fa-trash text-red-500 text-xs" />
                : <span className="text-lg leading-none">−</span>}
            </button>
            <span className="noon-qty-num">{cartItem?.quantity}</span>
            <button
              className="noon-qty-btn"
              onClick={(e) => handleQtyChange(e, 1)}
              aria-label="Add one"
            >
              <span className="text-lg leading-none">+</span>
            </button>
          </div>
        ) : (
          <button
            className="noon-add-cart-btn"
            onClick={handleAddToCart}
            disabled={stock_quantity === 0}
            aria-label="Add to cart"
          >
            {stock_quantity === 0
              ? (isBn ? "স্টক নেই" : "Out of stock")
              : (
                <>
                  <i className="fa fa-plus text-xs" />
                  <span className="t-en">Add</span>
                  <span className="t-bn">যোগ করুন</span>
                </>
              )}
          </button>
        )}
      </div>

      {/* GET IN badge — bottom strip */}
      {get_in && (
        <div className="noon-get-in-badge">
          <i className="fa fa-bolt text-[11px] text-yellow-400" />
          <span>GET IN</span>
          <span className="noon-get-in-text">
            <span className="t-en">{get_in}</span>
            {get_in_bn && <span className="t-bn">{get_in_bn}</span>}
          </span>
          <i className="fa fa-angle-right text-[11px]" />
        </div>
      )}

      {/* Quick View Modal */}
      {quickViewOpen && (
        <QuickViewModal
          product={product}
          onClose={() => setQuickViewOpen(false)}
          onAddToCart={(p) => addItem(p, 1)}
        />
      )}
    </div>
  );
}
