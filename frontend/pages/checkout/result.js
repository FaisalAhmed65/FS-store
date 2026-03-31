/**
 * pages/checkout/result.js
 * Handles SSLCommerz payment redirect for success / fail / cancel.
 * SSLCommerz redirects the customer here with ?status=&tran_id=
 */
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { api } from "@/lib/api";

export default function CheckoutResultPage() {
  const router = useRouter();
  const { tran_id, status } = router.query;

  const [txn, setTxn] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tran_id) return;
    api
      .get(`/payments/status/${tran_id}/`)
      .then((r) => setTxn(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tran_id]);

  const resolvedStatus = txn?.status ?? status ?? "pending";

  const config = {
    success: {
      icon:  "✓",
      color: "text-success",
      ring:  "ring-success",
      title: "পেমেন্ট সফল হয়েছে",        // Payment successful
      sub:   "আপনার অর্ডার নিশ্চিত হয়েছে।", // Your order has been confirmed.
      cta:   { label: "আমার অর্ডার দেখুন", href: "/orders" },
    },
    failed: {
      icon:  "✗",
      color: "text-danger",
      ring:  "ring-danger",
      title: "পেমেন্ট ব্যর্থ হয়েছে",
      sub:   "আবার চেষ্টা করুন বা অন্য পদ্ধতি ব্যবহার করুন।",
      cta:   { label: "কার্টে ফিরে যান", href: "/cart" },
    },
    cancelled: {
      icon:  "⊘",
      color: "text-muted",
      ring:  "ring-muted",
      title: "পেমেন্ট বাতিল হয়েছে",
      sub:   "আপনি পেমেন্ট বাতিল করেছেন।",
      cta:   { label: "কার্টে ফিরে যান", href: "/cart" },
    },
    pending: {
      icon:  "⏳",
      color: "text-accent",
      ring:  "ring-accent",
      title: "পেমেন্ট প্রক্রিয়াধীন",
      sub:   "কিছুক্ষণ অপেক্ষা করুন…",
      cta:   { label: "হোম পেজে যান", href: "/" },
    },
  };

  const c = config[resolvedStatus] ?? config.pending;

  return (
    <>
      <Head>
        <title>পেমেন্ট ফলাফল – TRD Store</title>
      </Head>
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
          {loading ? (
            <p className="text-muted animate-pulse">লোড হচ্ছে…</p>
          ) : (
            <div className={`bg-card rounded-2xl shadow-card p-10 max-w-md w-full text-center ring-2 ${c.ring}/30`}>
              {/* Icon circle */}
              <div className={`mx-auto mb-6 w-20 h-20 flex items-center justify-center rounded-full bg-surface ring-4 ${c.ring}/40 text-4xl ${c.color}`}>
                {c.icon}
              </div>

              <h1 className={`text-2xl font-bold mb-2 ${c.color}`}>{c.title}</h1>
              <p className="text-muted mb-1">{c.sub}</p>

              {txn && (
                <div className="mt-4 text-left text-sm bg-surface rounded-lg p-4 space-y-1 text-gray-700">
                  <Row label="ট্রানজেকশন আইডি" value={txn.tran_id} mono />
                  {txn.card_type && <Row label="পেমেন্ট মাধ্যম" value={txn.card_type} />}
                  {txn.amount    && <Row label="পরিমাণ" value={`৳${Number(txn.amount).toLocaleString("en-BD")}`} />}
                </div>
              )}

              <div className="mt-8 flex flex-col gap-3">
                <Link href={c.cta.href}
                  className="btn-accent w-full text-center py-3 rounded-lg font-semibold">
                  {c.cta.label}
                </Link>
                <Link href="/" className="text-muted text-sm hover:text-gray-700 transition-colors">
                  হোম পেজে যান
                </Link>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </>
  );
}

function Row({ label, value, mono = false }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted shrink-0">{label}:</span>
      <span className={`text-gray-800 text-right break-all ${mono ? "font-mono text-xs" : ""}`}>{value}</span>
    </div>
  );
}
