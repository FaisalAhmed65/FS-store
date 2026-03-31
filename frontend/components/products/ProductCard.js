/**
 * components/products/ProductCard.js
 * Noon-style product card matching the TRD Odoo storefront design.
 */
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { HeartIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";
import { useCart }     from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { formatPrice, mediaUrl, discountPct } from "@/lib/utils";

export default function ProductCard({ product }) {
  const { addItem, isInCart }   = useCart();
  const { toggle, isWishlisted } = useWishlist();
  const [added, setAdded]        = useState(false);

  if (!product) return null;

  const pct      = discountPct(product.compare_price, product.price);
  const imgSrc   = mediaUrl(product.image);
  const wishlisted = isWishlisted(product.id);

  function handleAddToCart(e) {
    e.preventDefault();
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  function handleWishlist(e) {
    e.preventDefault();
    toggle(product);
  }

  return (
    <Link
      href={`/shop/product/${product.slug}`}
      className="card-product group flex flex-col relative overflow-hidden block"
    >
      {/* Discount badge */}
      {pct > 0 && (
        <span className="badge-discount absolute top-2 left-2 z-10">{pct}% OFF</span>
      )}

      {/* Wishlist button */}
      <button
        onClick={handleWishlist}
        className="absolute top-2 right-2 z-10 p-1 bg-white rounded-full shadow"
        aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
      >
        {wishlisted ? (
          <HeartSolid className="w-5 h-5 text-red-500" />
        ) : (
          <HeartIcon className="w-5 h-5 text-gray-400 group-hover:text-red-400" />
        )}
      </button>

      {/* Image */}
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        <Image
          src={imgSrc}
          alt={product.name}
          fill
          className="object-contain p-3 transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          unoptimized
        />
      </div>

      {/* Body */}
      <div className="p-3 flex flex-col flex-1">
        <p className="text-xs text-muted mb-1 truncate">
          {product.category_name || ""}
        </p>
        <h3 className="text-sm font-medium text-gray-800 line-clamp-2 flex-1">
          {product.name}
        </h3>

        {/* Price row */}
        <div className="mt-2 flex items-baseline gap-2 flex-wrap">
          <span className="price text-base">{formatPrice(product.price)}</span>
          {product.compare_price && Number(product.compare_price) > Number(product.price) && (
            <span className="text-xs text-gray-400 line-through">
              {formatPrice(product.compare_price)}
            </span>
          )}
        </div>

        {/* Delivery */}
        {product.is_free_delivery && (
          <span className="text-xs text-green-600 font-medium mt-1">Free Delivery</span>
        )}

        {/* Add to cart */}
        <button
          onClick={handleAddToCart}
          className={`mt-3 w-full py-1.5 rounded text-sm font-semibold transition-colors ${
            added
              ? "bg-green-500 text-white"
              : isInCart(product.id)
              ? "bg-gray-700 text-white"
              : "btn-accent"
          }`}
        >
          {added ? "Added!" : isInCart(product.id) ? "In Cart" : "Add to Cart"}
        </button>
      </div>
    </Link>
  );
}
