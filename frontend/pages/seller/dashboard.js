/**
 * pages/seller/dashboard.js
 * TRD feature flags:
 *   NEXT_PUBLIC_SELLER_SHOW_ORDERS  — shows/hides My Orders section
 */
import Head from "next/head";
import Link from "next/link";
import useSWR from "swr";
import { sellerApi } from "@/lib/api";
import SellerLayout from "@/components/seller/SellerLayout";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ProductCard from "@/components/products/ProductCard";
import { formatPrice } from "@/lib/utils";

const SHOW_ORDERS = process.env.NEXT_PUBLIC_SELLER_SHOW_ORDERS === "true";

const fetcher = () => sellerApi.dashboard().then((r) => r.data);

export default function SellerDashboardPage() {
  const { data, isLoading, error } = useSWR("seller-dashboard", fetcher, {
    revalidateOnFocus: false,
  });

  if (isLoading) {
    return (
      <SellerLayout title="Dashboard">
        <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
      </SellerLayout>
    );
  }

  if (error) {
    return (
      <SellerLayout title="Dashboard">
        <p className="text-red-600">Failed to load dashboard. Please refresh.</p>
      </SellerLayout>
    );
  }

  const { seller, total_products, published, pending, total_orders, recent_products } = data || {};

  return (
    <>
      <Head><title>Seller Dashboard – TRD Store</title></Head>
      <SellerLayout title="Dashboard">
        {/* Greeting */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-primary">
            Welcome, {seller?.business_name}
          </h2>
          {seller?.status === "pending" && (
            <p className="mt-1 text-sm text-orange-600 bg-orange-50 rounded p-2 inline-block">
              ⏳ Your account is pending admin approval. You can add products, but they won't be visible until approved.
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Products", value: total_products ?? 0, color: "bg-blue-50 text-blue-700" },
            { label: "Published",      value: published ?? 0,      color: "bg-green-50 text-green-700" },
            { label: "Pending Review", value: pending   ?? 0,      color: "bg-orange-50 text-orange-700" },
            // TRD_HOLD: orders stat — hidden via NEXT_PUBLIC_SELLER_SHOW_ORDERS
            ...(SHOW_ORDERS
              ? [{ label: "Orders", value: total_orders ?? 0, color: "bg-purple-50 text-purple-700" }]
              : []),
          ].map(({ label, value, color }) => (
            <div key={label} className={`rounded-xl p-5 ${color}`}>
              <p className="text-2xl font-black">{value}</p>
              <p className="text-xs mt-0.5 opacity-80">{label}</p>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="flex gap-3 mb-8">
          <Link href="/seller/product/add" className="btn-accent px-5 py-2 rounded font-semibold text-sm">
            + Add Product
          </Link>
          <Link href="/seller/products" className="btn-primary px-5 py-2 rounded font-semibold text-sm">
            View All Products
          </Link>
        </div>

        {/* Recent products */}
        {recent_products?.length > 0 && (
          <div>
            <h3 className="font-bold text-primary section-title mb-4">Recent Products</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {recent_products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </SellerLayout>
    </>
  );
}

SellerDashboardPage.getLayout = (page) => page;
