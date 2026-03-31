/**
 * pages/shop/product/[slug].js  — Product Detail Page
 */
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import useSWR from "swr";
import { useRouter } from "next/router";
import { productsApi, reviewsApi } from "@/lib/api";
import { useCart }     from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { formatPrice, mediaUrl, discountPct } from "@/lib/utils";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { HeartIcon }      from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";

// TRD feature flags
const ENABLE_RATINGS = process.env.NEXT_PUBLIC_ENABLE_RATINGS === "true";

export default function ProductDetailPage() {
  const router  = useRouter();
  const { slug } = router.query;
  const [qty, setQty]             = useState(1);
  const [activeImage, setActive]  = useState(null);
  const [reviewForm, setReview]   = useState({ rating: 5, title: "", body: "", partner_name: "" });
  const [reviewSubmitting, setRS] = useState(false);
  const [reviewMsg, setRM]        = useState(null);

  const { data: product, isLoading, mutate } = useSWR(
    slug ? `product/${slug}` : null,
    () => productsApi.detail(slug).then((r) => r.data)
  );

  const { data: reviews, mutate: mutateReviews } = useSWR(
    product && ENABLE_RATINGS ? `reviews/${product.id}` : null,
    () => reviewsApi.list(product.id).then((r) => r.data)
  );

  const { addItem, isInCart } = useCart();
  const { toggle, isWishlisted } = useWishlist();

  if (isLoading) return (
    <div className="flex justify-center py-24"><LoadingSpinner size="lg" /></div>
  );
  if (!product) return (
    <div className="text-center py-24 text-muted">Product not found.</div>
  );

  const images = product.images?.length
    ? product.images
    : [{ image: product.image, id: 0 }];
  const mainImg = mediaUrl(activeImage ?? images[0]?.image ?? product.image);
  const pct = discountPct(product.compare_price, product.price);

  async function handleReviewSubmit(e) {
    e.preventDefault();
    setRS(true);
    try {
      await reviewsApi.create(product.id, reviewForm);
      setRM({ type: "success", text: "Review submitted! Thank you." });
      setReview({ rating: 5, title: "", body: "", partner_name: "" });
      mutateReviews();
    } catch {
      setRM({ type: "error", text: "Failed to submit review. Please try again." });
    } finally {
      setRS(false);
    }
  }

  return (
    <>
      <Head>
        <title>{product.name} – TRD Store</title>
        <meta name="description" content={product.description?.slice(0, 155)} />
      </Head>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <nav className="text-sm text-muted mb-4 flex gap-1">
          <Link href="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-primary">Shop</Link>
          {product.category_name && (
            <>
              <span>/</span>
              <Link href={`/shop?category_slug=${product.category_slug}`} className="hover:text-primary capitalize">
                {product.category_name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="truncate max-w-xs">{product.name}</span>
        </nav>

        <div className="bg-card rounded-xl shadow-card overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            {/* Images */}
            <div className="p-6">
              <div className="relative aspect-square bg-gray-50 rounded-lg overflow-hidden mb-3">
                <Image
                  src={mainImg}
                  alt={product.name}
                  fill
                  className="object-contain p-4"
                  priority
                  unoptimized
                />
                {pct > 0 && (
                  <span className="badge-discount absolute top-3 left-3">{pct}% OFF</span>
                )}
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {images.map((img, i) => (
                    <button
                      key={img.id ?? i}
                      onClick={() => setActive(img.image)}
                      className={`relative w-16 h-16 shrink-0 rounded border-2 overflow-hidden ${
                        (activeImage ?? images[0]?.image) === img.image
                          ? "border-primary"
                          : "border-gray-200"
                      }`}
                    >
                      <Image src={mediaUrl(img.image)} alt="" fill className="object-contain p-1" unoptimized />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="p-6 flex flex-col">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">{product.name}</h1>
              {product.sku && <p className="text-xs text-muted mb-2">SKU: {product.sku}</p>}

              {/* Rating — TRD_HOLD: shown only when NEXT_PUBLIC_ENABLE_RATINGS=true */}
              {ENABLE_RATINGS && product.rating_count > 0 && (
                <div className="flex items-center gap-2 mb-3">
                  <Stars rating={product.rating_avg} />
                  <span className="text-sm text-muted">({product.rating_count} reviews)</span>
                </div>
              )}

              {/* Price */}
              <div className="flex items-baseline gap-3 mb-4">
                <span className="text-3xl font-black text-price-red">{formatPrice(product.price)}</span>
                {product.compare_price && Number(product.compare_price) > Number(product.price) && (
                  <span className="text-gray-400 line-through text-lg">{formatPrice(product.compare_price)}</span>
                )}
                {pct > 0 && <span className="badge-discount">{pct}% OFF</span>}
              </div>

              {/* Delivery */}
              <div className="mb-4 space-y-1 text-sm">
                {product.is_free_delivery && (
                  <p className="text-green-600 font-medium">✓ Free Delivery</p>
                )}
                {product.delivery_type === "express" || product.delivery_type === "both" ? (
                  <p className="text-gray-600">⚡ Express delivery available</p>
                ) : null}
              </div>

              {/* Attributes */}
              {product.attributes?.length > 0 && (
                <div className="mb-4 grid grid-cols-2 gap-2 text-sm">
                  {product.attributes.map((a) => (
                    <div key={a.id} className="flex gap-1">
                      <span className="text-muted">{a.name}:</span>
                      <span className="font-medium">{a.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Qty + cart */}
              <div className="flex items-center gap-3 mt-auto">
                <div className="flex items-center border rounded overflow-hidden">
                  <button
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="px-3 py-2 text-gray-600 hover:bg-gray-100"
                  >−</button>
                  <span className="px-4 py-2 text-sm font-medium">{qty}</span>
                  <button
                    onClick={() => setQty(qty + 1)}
                    className="px-3 py-2 text-gray-600 hover:bg-gray-100"
                  >+</button>
                </div>
                <button
                  onClick={() => addItem(product, qty)}
                  className="flex-1 btn-accent py-2.5 rounded font-bold"
                >
                  {isInCart(product.id) ? "Update Cart" : "Add to Cart"}
                </button>
                <button
                  onClick={() => toggle(product)}
                  className="p-2.5 border rounded"
                  aria-label="Wishlist"
                >
                  {isWishlisted(product.id)
                    ? <HeartSolid className="w-5 h-5 text-red-500" />
                    : <HeartIcon  className="w-5 h-5 text-gray-500" />}
                </button>
              </div>

              {/* Stock */}
              {product.stock_quantity <= 5 && product.stock_quantity > 0 && (
                <p className="text-orange-500 text-xs mt-2">Only {product.stock_quantity} left in stock!</p>
              )}
              {product.stock_quantity === 0 && (
                <p className="text-red-500 text-xs mt-2">Out of stock</p>
              )}
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div className="border-t border-gray-100 px-6 py-6">
              <h2 className="font-bold text-lg mb-3 text-primary">Description</h2>
              <p className="text-gray-700 text-sm whitespace-pre-line leading-relaxed">
                {product.description}
              </p>
            </div>
          )}

          {/* What's in the box */}
          {product.get_in && (
            <div className="border-t border-gray-100 px-6 py-4">
              <h2 className="font-bold mb-2 text-primary">What's in the Box</h2>
              <p className="text-sm text-gray-600">{product.get_in}</p>
            </div>
          )}

          {/* Reviews — TRD_HOLD: hidden when NEXT_PUBLIC_ENABLE_RATINGS=false */}
          {ENABLE_RATINGS && (
            <div className="border-t border-gray-100 px-6 py-6">
              <h2 className="font-bold text-lg mb-4 text-primary">Customer Reviews</h2>

              {/* Submit form */}
              <form onSubmit={handleReviewSubmit} className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold mb-3">Write a Review</h3>
                {reviewMsg && (
                  <p className={`text-sm mb-2 ${reviewMsg.type === "error" ? "text-red-600" : "text-green-600"}`}>
                    {reviewMsg.text}
                  </p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <input
                    placeholder="Your name"
                    value={reviewForm.partner_name}
                    onChange={(e) => setReview((p) => ({ ...p, partner_name: e.target.value }))}
                    className="border rounded px-3 py-2 text-sm"
                    required
                  />
                  <select
                    value={reviewForm.rating}
                    onChange={(e) => setReview((p) => ({ ...p, rating: Number(e.target.value) }))}
                    className="border rounded px-3 py-2 text-sm"
                  >
                    {[5, 4, 3, 2, 1].map((r) => (
                      <option key={r} value={r}>{r} Star{r > 1 && "s"}</option>
                    ))}
                  </select>
                </div>
                <textarea
                  placeholder="Share your experience…"
                  value={reviewForm.body}
                  onChange={(e) => setReview((p) => ({ ...p, body: e.target.value }))}
                  className="border rounded px-3 py-2 text-sm w-full mb-3"
                  rows={3}
                  required
                />
                <button type="submit" disabled={reviewSubmitting} className="btn-accent px-6 py-2 rounded font-semibold">
                  {reviewSubmitting ? "Submitting…" : "Submit Review"}
                </button>
              </form>

              {/* List */}
              {reviews?.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((r) => (
                    <div key={r.id} className="border-b pb-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Stars rating={r.rating} />
                        <span className="font-medium text-sm">{r.partner_name}</span>
                        <span className="text-xs text-muted ml-auto">
                          {new Date(r.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {r.title && <p className="font-semibold text-sm">{r.title}</p>}
                      <p className="text-sm text-gray-700">{r.body}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted text-sm">No reviews yet. Be the first!</p>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function Stars({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={`text-sm ${i <= Math.round(rating) ? "text-amber-400" : "text-gray-300"}`}
        >
          ★
        </span>
      ))}
    </div>
  );
}
