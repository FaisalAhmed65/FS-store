/**
 * pages/seller/products.js — List all seller's products with edit/delete
 */
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import useSWR from "swr";
import { sellerApi } from "@/lib/api";
import SellerLayout from "@/components/seller/SellerLayout";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { formatPrice, mediaUrl } from "@/lib/utils";
import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";

const STATUS_COLOR = {
  pending:  "bg-orange-100 text-orange-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  archived: "bg-gray-100 text-gray-700",
  draft:    "bg-blue-100 text-blue-700",
};

export default function SellerProductsPage() {
  const { data: products, isLoading, mutate } = useSWR(
    "seller-products",
    () => sellerApi.products.list().then((r) => r.data),
    { revalidateOnFocus: false }
  );
  const [deleting, setDeleting] = useState(null);

  async function handleDelete(id) {
    if (!confirm("Remove this product from your store?")) return;
    setDeleting(id);
    await sellerApi.products.delete(id).catch(() => {});
    mutate();
    setDeleting(null);
  }

  return (
    <>
      <Head><title>My Products – Seller Dashboard</title></Head>
      <SellerLayout title="My Products">
        <div className="flex justify-between items-center mb-6">
          <p className="text-sm text-muted">{products?.length ?? 0} products total</p>
          <Link href="/seller/product/add" className="btn-accent px-4 py-2 rounded font-semibold text-sm">
            + Add Product
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><LoadingSpinner /></div>
        ) : products?.length === 0 ? (
          <div className="text-center py-16 text-muted">
            <p>No products yet.</p>
            <Link href="/seller/product/add" className="mt-3 inline-block btn-accent px-6 py-2 rounded font-bold text-sm">
              Add Your First Product
            </Link>
          </div>
        ) : (
          <div className="bg-card rounded-xl shadow-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Product</th>
                  <th className="px-4 py-3 text-right">Price</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(products || []).map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 flex items-center gap-3">
                      <div className="relative w-10 h-10 shrink-0 bg-gray-100 rounded overflow-hidden">
                        <Image src={mediaUrl(p.image)} alt={p.name} fill className="object-contain p-0.5" unoptimized />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 line-clamp-1">{p.name}</p>
                        {p.sku && <p className="text-xs text-muted">{p.sku}</p>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-price-red">{formatPrice(p.price)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium capitalize ${STATUS_COLOR[p.status] || STATUS_COLOR.draft}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={`/seller/product/${p.id}/edit`}
                          className="p-1.5 rounded hover:bg-blue-50 text-blue-600"
                          title="Edit"
                        >
                          <PencilSquareIcon className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(p.id)}
                          disabled={deleting === p.id}
                          className="p-1.5 rounded hover:bg-red-50 text-red-500"
                          title="Remove"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SellerLayout>
    </>
  );
}

SellerProductsPage.getLayout = (page) => page;
