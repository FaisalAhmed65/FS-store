/**
 * pages/seller/product/add.js
 * TRD feature flag:
 *   NEXT_PUBLIC_SELLER_SHOW_FREE_DELIVERY — shows/hides free delivery toggle
 */
import Head from "next/head";
import { useState } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
import { sellerApi, categoriesApi } from "@/lib/api";
import SellerLayout from "@/components/seller/SellerLayout";

const SHOW_FREE_DELIVERY = true;

export default function AddProductPage() {
  const router = useRouter();
  const { data: categories } = useSWR("categories-all",
    () => categoriesApi.list().then((r) => r.data?.results ?? r.data));

  const [form, setForm] = useState({
    name:           "",
    name_bn:        "",
    description:    "",
    description_bn: "",
    price:          "",
    compare_price:  "",
    category:       "",
    sku:            "",
    stock_quantity: "",
    delivery_type:  "normal",
    normal_delivery_charge:  "0",
    express_delivery_charge: "0",
    // TRD_HOLD: is_free_delivery — hidden via NEXT_PUBLIC_SELLER_SHOW_FREE_DELIVERY
    is_free_delivery: false,
    get_in:         "",
  });
  const [image, setImage] = useState(null);
  const [error, setError] = useState(null);
  const [busy,  setBusy]  = useState(false);

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
      await sellerApi.products.create(fd);
      router.push("/seller/dashboard");
    } catch (err) {
      const data = err.response?.data;
      setError(
        typeof data === "object"
          ? Object.values(data).flat().join(" ")
          : "Failed to add product."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Head><title>Add Product – Seller Dashboard</title></Head>
      <SellerLayout title="Add New Product">
        <div className="max-w-2xl">
          {error && <p className="text-red-600 text-sm bg-red-50 p-3 rounded mb-4">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-5 bg-card rounded-xl shadow-card p-6">
            <Section title="Product Information">
              <Field label="Product Name (EN)" required>
                <input value={form.name} onChange={(e) => update("name", e.target.value)}
                  className="input-field" required />
              </Field>
              <Field label="Product Name (বাংলা)">
                <input value={form.name_bn} onChange={(e) => update("name_bn", e.target.value)}
                  className="input-field" placeholder="পণ্যের নাম বাংলায়" />
              </Field>
              <Field label="Description" full>
                <textarea value={form.description} rows={4}
                  onChange={(e) => update("description", e.target.value)}
                  className="input-field" />
              </Field>
              <Field label="SKU">
                <input value={form.sku} onChange={(e) => update("sku", e.target.value)} className="input-field" />
              </Field>
              <Field label="What's in the Box">
                <input value={form.get_in} onChange={(e) => update("get_in", e.target.value)} className="input-field" />
              </Field>
            </Section>

            <Section title="Pricing & Stock">
              <Field label="Price (BDT ৳)" required>
                <input type="number" step="0.01" min="0" value={form.price}
                  onChange={(e) => update("price", e.target.value)}
                  className="input-field" required />
              </Field>
              <Field label="Compare Price (BDT ৳)">
                <input type="number" step="0.01" min="0" value={form.compare_price}
                  onChange={(e) => update("compare_price", e.target.value)}
                  className="input-field" />
              </Field>
              <Field label="Stock Quantity">
                <input type="number" min="0" value={form.stock_quantity}
                  onChange={(e) => update("stock_quantity", e.target.value)}
                  className="input-field" />
              </Field>
            </Section>

            <Section title="Category">
              <Field label="Category" full>
                <select value={form.category} onChange={(e) => update("category", e.target.value)}
                  className="input-field">
                  <option value="">-- Select Category --</option>
                  {categories?.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </Field>
            </Section>

            <Section title="Delivery">
              <Field label="Delivery Type" full>
                <select value={form.delivery_type} onChange={(e) => update("delivery_type", e.target.value)}
                  className="input-field">
                  <option value="normal">Normal</option>
                  <option value="express">Express</option>
                  <option value="both">Normal + Express</option>
                </select>
              </Field>
              <Field label="Normal Delivery Charge (BDT ৳)">
                <input type="number" step="0.01" min="0" value={form.normal_delivery_charge}
                  onChange={(e) => update("normal_delivery_charge", e.target.value)}
                  className="input-field" />
              </Field>
              {(form.delivery_type === "express" || form.delivery_type === "both") && (
                <Field label="Express Delivery Charge (BDT ৳)">
                  <input type="number" step="0.01" min="0" value={form.express_delivery_charge}
                    onChange={(e) => update("express_delivery_charge", e.target.value)}
                    className="input-field" />
                </Field>
              )}
              {/* TRD_HOLD: free delivery — hidden unless NEXT_PUBLIC_SELLER_SHOW_FREE_DELIVERY=true */}
              {SHOW_FREE_DELIVERY && (
                <Field label="" full>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.is_free_delivery}
                      onChange={(e) => update("is_free_delivery", e.target.checked)}
                      className="w-4 h-4"
                    />
                    Offer Free Delivery
                  </label>
                </Field>
              )}
            </Section>

            <Section title="Image">
              <Field label="Main Image" full>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImage(e.target.files[0])}
                  className="text-sm"
                />
              </Field>
            </Section>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={busy} className="btn-accent px-8 py-2.5 rounded font-bold">
                {busy ? "Saving…" : "Submit Product"}
              </button>
              <button type="button" onClick={() => router.back()} className="px-6 py-2.5 border rounded font-medium text-sm">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </SellerLayout>
    </>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h3 className="font-semibold text-primary mb-3 border-b pb-1">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {children}
      </div>
    </div>
  );
}

function Field({ label, children, full, required }) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      {label && (
        <label className="text-sm font-medium text-gray-700 block mb-1">
          {label}{required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {children}
    </div>
  );
}

AddProductPage.getLayout = (page) => page;
