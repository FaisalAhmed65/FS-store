/**
 * pages/cart.js
 */
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/router";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import api, { ordersApi } from "@/lib/api";
import { formatPrice, mediaUrl } from "@/lib/utils";
import { TrashIcon } from "@heroicons/react/24/outline";

export default function CartPage() {
  const { items, removeItem, updateQty, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  const [shipping, setShipping] = useState({
    shipping_name: "",
    shipping_street: "",
    shipping_city: "",
    shipping_country: "Bangladesh",
    shipping_zip: "",
    shipping_phone: "",
  });
  const [placing, setPlacing] = useState(false);
  const [error,   setError]   = useState(null);
  const [success, setSuccess] = useState(null);

  async function placeOrder(e) {
    e.preventDefault();
    if (!user) { router.push("/login?next=/cart"); return; }
    setPlacing(true);
    setError(null);
    try {
      // 1. Create order
      const orderData = {
        ...shipping,
        items: items.map((i) => ({
          product: i.product.id,
          quantity: i.quantity,
          price:    i.product.price,
        })),
      };
      const { data: order } = await ordersApi.create(orderData);

      // 2. Initiate SSLCommerz payment — redirects customer to gateway
      const { data: payData } = await api.post("/payments/initiate/", { order_id: order.id });
      clearCart();
      // Redirect browser to SSLCommerz payment page (bKash / Nagad / VISA ...)
      window.location.href = payData.gateway_url;
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.detail ||
        "পেমেন্ট শুরু করা যায়নি। আবার চেষ্টা করুন।"
      );
    } finally {
      setPlacing(false);
    }
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h1 className="text-2xl font-bold text-primary mb-2">Order Placed!</h1>
        <p className="text-muted mb-6">Order #{success} has been received. We'll contact you soon.</p>
        <Link href="/shop" className="btn-accent px-8 py-3 rounded font-bold">Continue Shopping</Link>
      </div>
    );
  }

  return (
    <>
      <Head><title>Cart – TRD Store</title></Head>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="section-title text-2xl mb-6">Shopping Cart</h1>

        {items.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted mb-4">Your cart is empty.</p>
            <Link href="/shop" className="btn-accent px-8 py-2 rounded font-bold">Continue Shopping</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map(({ product, quantity }) => (
                <div key={product.id} className="bg-card rounded-lg shadow-card p-4 flex gap-4">
                  <div className="relative w-20 h-20 shrink-0 bg-gray-50 rounded overflow-hidden">
                    <Image src={mediaUrl(product.image)} alt={product.name} fill className="object-contain p-1" unoptimized />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/shop/product/${product.slug}`} className="font-medium text-gray-800 hover:text-primary line-clamp-2 text-sm">
                      {product.name}
                    </Link>
                    <p className="text-price-red font-bold mt-1">{formatPrice(product.price)}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <button onClick={() => updateQty(product.id, quantity - 1)} className="w-7 h-7 border rounded font-bold text-gray-600 hover:bg-gray-100">−</button>
                      <span className="text-sm w-6 text-center">{quantity}</span>
                      <button onClick={() => updateQty(product.id, quantity + 1)} className="w-7 h-7 border rounded font-bold text-gray-600 hover:bg-gray-100">+</button>
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <button onClick={() => removeItem(product.id)} className="text-gray-400 hover:text-red-500">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                    <span className="font-bold text-sm">{formatPrice(Number(product.price) * quantity)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Order summary + checkout */}
            <div>
              <div className="bg-card rounded-lg shadow-card p-6">
                <h2 className="font-bold text-lg mb-4 text-primary">Order Summary</h2>
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-muted">Subtotal</span>
                    <span>{formatPrice(totalPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">ডেলিভারি চার্জ</span>
                    <span className="text-success font-medium">চেকআউটে যোগ হবে</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold">
                    <span>Total</span>
                    <span className="text-price-red">{formatPrice(totalPrice)}</span>
                  </div>
                </div>

                {/* Shipping form */}
                <form onSubmit={placeOrder} className="mt-4 space-y-3">
                  <h3 className="font-semibold text-sm text-gray-700">ডেলিভারি ঠিকানা</h3>
                  {Object.entries({
                    shipping_name:    "পূর্ণ নাম",
                    shipping_street:  "রাস্তার ঠিকানা",
                    shipping_city:    "শহর",
                    shipping_country: "দেশ",
                    shipping_zip:     "পোস্ট কোড",
                    shipping_phone:   "ফোন নম্বর",
                  }).map(([key, placeholder]) => (
                    <input
                      key={key}
                      type="text"
                      placeholder={placeholder}
                      value={shipping[key]}
                      onChange={(e) => setShipping((p) => ({ ...p, [key]: e.target.value }))}
                      required={["shipping_name", "shipping_street", "shipping_city"].includes(key)}
                      className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
                    />
                  ))}

                  {error && <p className="text-red-600 text-sm">{error}</p>}

                  <button
                    type="submit"
                    disabled={placing}
                    className="w-full btn-accent py-3 rounded font-bold mt-2"
                  >
                    {placing ? "অপেক্ষা করুন…" : user ? "পেমেন্ট করুন (SSLCommerz)" : "লগইন করুন"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
