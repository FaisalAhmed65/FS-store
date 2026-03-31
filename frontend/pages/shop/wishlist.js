/**
 * pages/shop/wishlist.js
 * TRD: All /wishlist paths redirect here via next.config.js
 */
import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import { wishlistApi } from "@/lib/api";
import { isCustomerLoggedIn } from "@/lib/auth";
import ProductCard from "@/components/products/ProductCard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function WishlistPage() {
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (isCustomerLoggedIn()) {
      wishlistApi.list().then(({ data }) => {
        const lists = Array.isArray(data) ? data : [];
        // Flatten all items' product_detail objects
        const prods = lists.flatMap((l) => l.items.map((i) => i.product_detail).filter(Boolean));
        setProducts(prods);
      }).finally(() => setLoading(false));
    } else {
      // Guest: try localStorage IDs — we can't load product details without login
      setLoading(false);
    }
  }, []);

  return (
    <>
      <Head><title>My Wishlist – TRD Store</title></Head>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="section-title text-2xl mb-6">My Wishlist</h1>

        {loading ? (
          <div className="flex justify-center py-16"><LoadingSpinner /></div>
        ) : !isCustomerLoggedIn() ? (
          <div className="text-center py-16">
            <p className="text-muted mb-4">Sign in to view your saved items.</p>
            <Link href="/login" className="btn-accent px-8 py-2 rounded font-bold">Sign In</Link>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted mb-4">Your wishlist is empty.</p>
            <Link href="/shop" className="btn-accent px-8 py-2 rounded font-bold">Browse Products</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </>
  );
}
