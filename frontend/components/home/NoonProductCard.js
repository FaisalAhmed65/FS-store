/**
 * components/home/NoonProductCard.js
 * Storefront product card.
 */
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatPrice, discountPct, mediaUrl, productHref } from "@/lib/utils";
import { useLang } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import QuickViewModal from "@/components/ui/QuickViewModal";
import { HeartIcon, MagnifyingGlassIcon, MinusIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";

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
    id, name, name_bn, image, price, compare_price,
    is_featured, is_deal, is_new_arrival, is_bestseller,
    is_free_delivery, stock_quantity, delivery_type,
    get_in, get_in_bn, sold_recently, category_rank, brand,
    rating_avg, rating_count,
  } = product;

  const discount = discountPct(compare_price, price);
  const href = productHref(product);
  const displayName = isBn && name_bn ? name_bn : name;
  const wishlisted = isWishlisted(id);
  const inCart = isInCart(id);
  const cartItem = items.find((i) => Number(i.product.id) === Number(id));

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
  async function handleWishlist(e) {
    e.preventDefault();
    e.stopPropagation();
    try {
      await toggle(product);
    } catch {
      // Keep the card responsive; WishlistContext rolls back failed optimistic updates.
    }
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
        type="button"
        className="absolute top-2 right-2 bg-white rounded-md w-8 h-8 flex items-center justify-center z-10 shadow-sm hover:scale-110 transition-transform border-none cursor-pointer"
        aria-label={
          wishlisted
            ? (isBn ? "উইশলিস্ট থেকে সরান" : "Remove from wishlist")
            : (isBn ? "উইশলিস্টে যোগ করুন" : "Add to wishlist")
        }
        aria-pressed={wishlisted}
        onClick={handleWishlist}
      >
        {wishlisted ? (
          <HeartSolid className="w-5 h-5 text-red-500" />
        ) : (
          <HeartIcon className="w-5 h-5 text-gray-500 group-hover:text-red-500" />
        )}
      </button>

      <div className="noon-image-wrap">
        <Link href={href} className="absolute inset-0 block" aria-label={displayName || "View product"}>
          <Image
            src={mediaUrl(image)}
            alt={name || "Product"}
            fill
            className="object-contain p-1"
            sizes="(max-width: 768px) 50vw, 200px"
            unoptimized
          />
        </Link>
        <button
          type="button"
          className="noon-image-quick-overlay"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setQuickViewOpen(true); }}
          aria-label={isBn ? "পণ্যের কুইক ভিউ" : "Quick view product"}
          title={isBn ? "কুইক ভিউ" : "Quick View"}
        >
          <span className="noon-image-quick-icon">
            <MagnifyingGlassIcon className="w-8 h-8" />
          </span>
        </button>

        {inCart ? (
          <div className="noon-image-qty-ctrl" aria-label="Cart quantity controls">
            <button
              type="button"
              className="noon-image-qty-btn noon-image-qty-remove"
              onClick={(e) => handleQtyChange(e, -1)}
              aria-label={
                cartItem?.quantity === 1
                  ? (isBn ? "কার্ট থেকে সরান" : "Remove from cart")
                  : (isBn ? "একটি কমান" : "Remove one")
              }
            >
              {cartItem?.quantity === 1 ? (
                <TrashIcon className="w-4 h-4" />
              ) : (
                <MinusIcon className="w-4 h-4" />
              )}
            </button>
            <span className="noon-image-qty-num">{cartItem?.quantity}</span>
            <button
              type="button"
              className="noon-image-qty-btn noon-image-qty-add"
              onClick={(e) => handleQtyChange(e, 1)}
              aria-label={isBn ? "একটি বাড়ান" : "Add one"}
            >
              <PlusIcon className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="noon-image-add-btn"
            onClick={handleAddToCart}
            disabled={stock_quantity === 0}
            aria-label={isBn ? "কার্টে যোগ করুন" : "Add to cart"}
            title={isBn ? "কার্টে যোগ করুন" : "Add to cart"}
          >
            <PlusIcon className="w-6 h-6" />
          </button>
        )}
      </div>

      <Link href={href} className="no-underline text-inherit flex flex-col flex-1">
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
              <span className="text-[19px] font-extrabold leading-none" style={{ color: "#1a1a2e" }}>
                {formatPrice(price)}
              </span>
              {discount > 0 && (
                <span className="text-xs text-gray-400 line-through ml-1">{formatPrice(compare_price)}</span>
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
            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 rounded-md px-1.5 py-px w-fit animate-pulse">
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

      {/* Add to cart / qty controls */}
      <div className="hidden">
        {inCart ? (
          <div className="noon-qty-ctrl">
            <button
              className="noon-qty-btn"
              onClick={(e) => handleQtyChange(e, -1)}
              aria-label="Remove one"
            >
              {cartItem?.quantity === 1
                ? <i className="fa fa-trash text-red-500 text-xs" />
                : <span className="text-lg leading-none">-</span>}
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

      {/* Delivery promise strip */}
      {get_in && (
        <div className="noon-get-in-badge">
          <i className="fa fa-bolt text-[11px] text-yellow-400" />
          <span>{isBn ? "পেতে সময়" : "GET IN"}</span>
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
