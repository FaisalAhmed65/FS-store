/**
 * pages/seller/orders.js — Seller's order history (items sold through TRD)
 */
import Head from "next/head";
import Image from "next/image";
import useSWR from "swr";
import { sellerApi } from "@/lib/api";
import SellerLayout from "@/components/seller/SellerLayout";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { formatPrice, mediaUrl } from "@/lib/utils";

const STATUS_COLOR = {
  cart: "bg-gray-100 text-gray-700",
  pending_payment: "bg-orange-100 text-orange-700",
  paid: "bg-blue-100 text-blue-700",
  processing: "bg-purple-100 text-purple-700",
  shipped: "bg-cyan-100 text-cyan-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  refunded: "bg-slate-100 text-slate-700",
};

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

export default function SellerOrdersPage() {
  const { data: orders, isLoading, error } = useSWR(
    "seller-orders",
    () => sellerApi.orders.list().then((r) => r.data),
    { revalidateOnFocus: false }
  );

  return (
    <>
      <Head><title>My Orders – Seller Dashboard</title></Head>
      <SellerLayout title="My Orders">
        {isLoading ? (
          <div className="flex justify-center py-16"><LoadingSpinner /></div>
        ) : error ? (
          <p className="text-red-600 text-sm">Failed to load orders. Please refresh.</p>
        ) : !orders || orders.length === 0 ? (
          <div className="text-center py-16 text-muted">
            <p className="text-lg font-medium mb-1">No orders yet.</p>
            <p className="text-sm">Orders will appear here once customers purchase your products.</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted mb-4">{orders.length} order item{orders.length !== 1 ? "s" : ""}</p>
            <div className="bg-card rounded-xl shadow-card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">Order #</th>
                    <th className="px-4 py-3 text-left">Product</th>
                    <th className="px-4 py-3 text-left">Customer</th>
                    <th className="px-4 py-3 text-right">Qty</th>
                    <th className="px-4 py-3 text-right">Subtotal</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map((item, idx) => (
                    <tr key={`${item.order_id}-${idx}`} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs text-muted">
                        #{item.order_id}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {item.product_image && (
                            <div className="relative w-9 h-9 shrink-0 bg-gray-100 rounded overflow-hidden">
                              <Image
                                src={mediaUrl(item.product_image)}
                                alt={item.product_name}
                                fill
                                className="object-contain p-0.5"
                                unoptimized
                              />
                            </div>
                          )}
                          <span className="font-medium text-gray-800 line-clamp-1 max-w-[180px]">
                            {item.product_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{item.customer}</td>
                      <td className="px-4 py-3 text-right">{item.quantity}</td>
                      <td className="px-4 py-3 text-right font-bold text-price-red">
                        {formatPrice(item.subtotal)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium capitalize ${STATUS_COLOR[item.status] || "bg-gray-100 text-gray-700"}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-muted whitespace-nowrap">
                        {formatDate(item.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </SellerLayout>
    </>
  );
}
