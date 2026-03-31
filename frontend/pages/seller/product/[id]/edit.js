/**
 * pages/seller/product/[id]/edit.js — Edit existing seller product
 */
import Head from "next/head";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { sellerApi, categoriesApi } from "@/lib/api";
import SellerLayout from "@/components/seller/SellerLayout";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

const SHOW_FREE_DELIVERY = process.env.NEXT_PUBLIC_SELLER_SHOW_FREE_DELIVERY === "true";

export default function EditProductPage() {
  const router = useRouter();
  const { id } = router.query;

  const [form, setForm]         = useState(null);
  const [categories, setCategories] = useState([]);
  const [image, setImage]       = useState(null);
  const [error, setError]       = useState(null);
  const [busy,  setBusy]        = useState(false);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      sellerApi.products.list(),
      categoriesApi.list(),
    ]).then(([{ data: products }, { data: cats }]) => {
      const product = Array.isArray(products)
        ? products.find((p) => String(p.id) === String(id))
        : null;
      if (product) {
        setForm({
          name:           product.name || "",
          name_ar:        product.name_ar || "",
          description:    product.description || "",
          price:          product.price || "",
          compare_price:  product.compare_price || "",
          category:       product.category || "",
          sku:            product.sku || "",
          stock_quantity: product.stock_quantity || "",
          delivery_type:  product.delivery_type || "normal",
          normal_delivery_charge:  product.normal_delivery_charge || "0",
          express_delivery_charge: product.express_delivery_charge || "0",
          is_free_delivery: product.is_free_delivery || false,
          get_in:         product.get_in || "",
        });
      } else {
        setError("Product not found.");
      }
      setCategories(cats?.results ?? cats ?? []);
    }).catch(() => setError("Failed to load product.")).finally(() => setLoading(false));
  }, [id]);

  function update(k, v) { setForm((p) => ({ ...p, [k]: v })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v !== "" && v !== null && v !== undefined) fd.append(k, v);
      });
      if (image) fd.append("image", image);
      await sellerApi.products.update(id, fd);
      router.push("/seller/dashboard");
    } catch (err) {
      const data = err.response?.data;
      setError(typeof data === "object" ? Object.values(data).flat().join(" ") : "Failed to update.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return (
    <SellerLayout title="Edit Product">
      <div className="flex justify-center py-20"><LoadingSpinner /></div>
    </SellerLayout>
  );

  return (
    <>
      <Head><title>Edit Product – Seller Dashboard</title></Head>
      <SellerLayout title="Edit Product">
        <div className="max-w-2xl">
          {error && <p className="text-red-600 text-sm bg-red-50 p-3 rounded mb-4">{error}</p>}
          {form && (
            <form onSubmit={handleSubmit} className="space-y-5 bg-card rounded-xl shadow-card p-6">
              {/* Reuse same field layout as add page */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { key: "name",          label: "Product Name (EN)", required: true },
                  { key: "price",         label: "Price (SAR)",       type: "number", required: true },
                  { key: "compare_price", label: "Compare Price" },
                  { key: "sku",           label: "SKU" },
                  { key: "stock_quantity",label: "Stock Quantity",    type: "number" },
                ].map(({ key, label, type = "text", required }) => (
                  <div key={key}>
                    <label className="text-sm font-medium block mb-1">{label}{required && " *"}</label>
                    <input
                      type={type}
                      value={form[key]}
                      onChange={(e) => update(key, e.target.value)}
                      step={type === "number" ? "0.01" : undefined}
                      className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
                      required={required}
                    />
                  </div>
                ))}

                <div>
                  <label className="text-sm font-medium block mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => update("category", e.target.value)}
                    className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
                  >
                    <option value="">-- Select --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-sm font-medium block mb-1">Description</label>
                  <textarea
                    value={form.description}
                    rows={4}
                    onChange={(e) => update("description", e.target.value)}
                    className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-sm font-medium block mb-1">New Image (optional)</label>
                  <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])} />
                </div>

                {/* TRD_HOLD: free delivery hidden unless flag enabled */}
                {SHOW_FREE_DELIVERY && (
                  <div>
                    <label className="flex items-center gap-2 text-sm cursor-pointer mt-2">
                      <input
                        type="checkbox"
                        checked={form.is_free_delivery}
                        onChange={(e) => update("is_free_delivery", e.target.checked)}
                        className="w-4 h-4"
                      />
                      Offer Free Delivery
                    </label>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={busy} className="btn-accent px-8 py-2.5 rounded font-bold">
                  {busy ? "Saving…" : "Save Changes"}
                </button>
                <button type="button" onClick={() => router.back()} className="px-6 py-2.5 border rounded font-medium text-sm">
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </SellerLayout>
    </>
  );
}

EditProductPage.getLayout = (page) => page;
