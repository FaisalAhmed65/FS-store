/**
 * pages/wishlist.js
 * Shows the customer's saved wishlist items.
 * Requires login; server-synced via WishlistContext.
 */
import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useLang } from "@/contexts/LanguageContext";
import { wishlistApi } from "@/lib/api";
import NoonProductCard from "@/components/home/NoonProductCard";

export default function WishlistPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { wishlistIds, synced } = useWishlist();
  const { lang } = useLang();
  const isBn = lang === "bn";

  const [products, setProducts] = useState([]);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState(null);

  // Redirect to login if not signed in
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login?next=/wishlist");
    }
  }, [authLoading, user, router]);

  // Fetch full product details from wishlist API
  useEffect(() => {
    if (!user || !synced) return;
    if (wishlistIds.length === 0) { setProducts([]); return; }
    setFetching(true);
    wishlistApi.list()
      .then(({ data }) => {
        // data is [{id, name, items: [{id, product, product_detail, ...}]}]
        const lists = Array.isArray(data) ? data : [];
        const allProducts = lists.flatMap((l) =>
          (l.items || []).map((item) => item.product_detail).filter(Boolean)
        );
        // Deduplicate by product id
        const seen = new Set();
        const unique = allProducts.filter((p) => {
          if (seen.has(p.id)) return false;
          seen.add(p.id);
          return true;
        });
        setProducts(unique);
      })
      .catch(() => setError(isBn ? "উইশলিস্ট লোড করতে ব্যর্থ।" : "Failed to load wishlist."))
      .finally(() => setFetching(false));
  }, [user, synced, wishlistIds.length]);

  // Show nothing while auth is loading or redirect is happening
  if (authLoading || !user) return null;

  return (
    <>
      <Head>
        <title>{isBn ? "উইশলিস্ট – TRD Store" : "Wishlist – TRD Store"}</title>
      </Head>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold" style={{ color: "#1a1a2e" }}>
            <i className="fa fa-heart text-red-500 mr-2" />
            {isBn ? "আমার উইশলিস্ট" : "My Wishlist"}
            {products.length > 0 && (
              <span className="ml-2 text-base font-normal text-gray-400">
                ({products.length})
              </span>
            )}
          </h1>
          <Link href="/shop" className="text-sm text-blue-600 hover:underline no-underline">
            {isBn ? "কেনাকাটা চালিয়ে যান" : "Continue Shopping"}
          </Link>
        </div>

        {/* States */}
        {fetching && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!fetching && error && (
          <div className="text-center py-20 text-red-500">{error}</div>
        )}

        {!fetching && !error && products.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <i className="fa fa-heart-o text-6xl text-gray-300" />
            <p className="text-lg text-gray-400">
              {isBn ? "আপনার উইশলিস্ট খালি।" : "Your wishlist is empty."}
            </p>
            <Link
              href="/shop"
              className="px-6 py-2.5 rounded-lg font-semibold text-white no-underline"
              style={{ background: "#2563eb" }}
            >
              {isBn ? "পণ্য ব্রাউজ করুন" : "Browse Products"}
            </Link>
          </div>
        )}

        {!fetching && !error && products.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {products.map((product) => (
              <NoonProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
