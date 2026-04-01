/**
 * components/ui/QuickViewModal.js
 * Odoo-style quick view modal for product cards.
 * Shows image, name, price, discount, short description, stock and CTA buttons.
 */
import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatPrice, discountPct, mediaUrl } from "@/lib/utils";
import { useLang } from "@/contexts/LanguageContext";

export default function QuickViewModal({ product, onClose }) {
  const { lang } = useLang();
  const isBn = lang === "bn";

  // Close on Escape key
  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  if (!product) return null;

  const {
    slug, name, name_bn, image, price, compare_price,
    description, description_bn,
    is_free_delivery, delivery_type, stock_quantity,
    is_deal, is_featured, is_new_arrival, is_bestseller,
    rating_avg, rating_count,
  } = product;

  const displayName = isBn && name_bn ? name_bn : name;
  const displayDesc = isBn && description_bn ? description_bn : description;
  const discount = discountPct(compare_price, price);
  const is_express = delivery_type === "express";
  const href = `/shop/product/${slug || product.id}`;

  // Star rating helper
  const stars = Math.round(Number(rating_avg) || 0);

  return (
    <div
      className="qv-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label={displayName}
    >
      <div className="qv-modal">
        {/* Close button */}
        <button
          className="qv-close"
          onClick={onClose}
          aria-label="Close quick view"
        >
          <i className="fa fa-times" />
        </button>

        <div className="qv-body">
          {/* Left — Image */}
          <div className="qv-image-col">
            <div className="qv-image-wrap">
              <Image
                src={mediaUrl(image)}
                alt={displayName || "Product"}
                fill
                className="object-contain p-4"
                sizes="320px"
                unoptimized
              />
              {discount > 0 && (
                <span className="qv-discount-badge">-{discount}%</span>
              )}
            </div>
          </div>

          {/* Right — Info */}
          <div className="qv-info-col">
            {/* Badges row */}
            <div className="flex gap-1.5 flex-wrap mb-2">
              {is_bestseller && <span className="qv-label" style={{ background: "#006c4f" }}>Best Seller</span>}
              {is_deal       && <span className="qv-label" style={{ background: "#e62e04" }}>Deal</span>}
              {is_new_arrival && <span className="qv-label" style={{ background: "#4263eb" }}>New</span>}
              {is_featured   && <span className="qv-label" style={{ background: "#fccc04", color: "#000" }}>Featured</span>}
            </div>

            {/* Name */}
            <h2 className="qv-name">{displayName}</h2>

            {/* Rating */}
            {rating_avg && Number(rating_avg) > 0 && (
              <div className="flex items-center gap-1.5 mb-2">
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map((s) => (
                    <i
                      key={s}
                      className={`fa fa-star${s <= stars ? "" : "-o"} text-[13px]`}
                      style={{ color: "#fccc04" }}
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-500">
                  {Number(rating_avg).toFixed(1)}
                  {rating_count ? ` (${rating_count})` : ""}
                </span>
              </div>
            )}

            {/* Price */}
            <div className="qv-price-row">
              <span className="qv-price">৳{formatPrice(price).replace("৳", "")}</span>
              {discount > 0 && (
                <>
                  <span className="qv-compare">৳{formatPrice(compare_price).replace("৳", "")}</span>
                  <span className="qv-save">{discount}% OFF</span>
                </>
              )}
            </div>

            {/* Stock */}
            {stock_quantity != null && stock_quantity <= 5 && stock_quantity > 0 && (
              <p className="qv-low-stock">
                <i className="fa fa-exclamation-circle mr-1" />
                {isBn ? `মাত্র ${stock_quantity}টি বাকি` : `Only ${stock_quantity} left in stock`}
              </p>
            )}
            {stock_quantity === 0 && (
              <p className="qv-out-of-stock">
                {isBn ? "স্টক শেষ" : "Out of stock"}
              </p>
            )}

            {/* Delivery badges */}
            <div className="flex gap-2 flex-wrap mt-2 mb-3">
              {is_free_delivery && (
                <span className="qv-delivery-badge">
                  <i className="fa fa-truck mr-1" />
                  {isBn ? "ফ্রি ডেলিভারি" : "Free Delivery"}
                </span>
              )}
              {is_express && (
                <span className="qv-express-badge">
                  <i className="fa fa-bolt mr-1" />Express
                </span>
              )}
            </div>

            {/* Description */}
            {displayDesc && (
              <p className="qv-desc">{displayDesc}</p>
            )}

            {/* CTA Buttons */}
            <div className="qv-cta">
              <Link href={href} className="qv-btn-primary" onClick={onClose}>
                <i className="fa fa-eye mr-1.5" />
                {isBn ? "পণ্য দেখুন" : "View Product"}
              </Link>
              <button
                className="qv-btn-secondary"
                disabled={stock_quantity === 0}
                onClick={() => { /* TODO: add to cart */ onClose(); }}
              >
                <i className="fa fa-shopping-cart mr-1.5" />
                {isBn ? "কার্টে যোগ করুন" : "Add to Cart"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
