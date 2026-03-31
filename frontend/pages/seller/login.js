/**
 * pages/seller/login.js — Seller Sign In
 */
import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/router";
import { sellerApi } from "@/lib/api";
import { setSellerToken } from "@/lib/auth";

export default function SellerLoginPage() {
  const router = useRouter();
  const [form, setForm]   = useState({ email: "", password: "" });
  const [error, setError] = useState(null);
  const [busy,  setBusy]  = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { data } = await sellerApi.login({ email: form.email, password: form.password });
      setSellerToken(data.access);
      router.push("/seller/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Invalid email or password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Head><title>Seller Sign In – TRD Store</title></Head>
      <div className="min-h-screen flex items-center justify-center bg-surface px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="font-black text-3xl text-primary">
              TRD<span className="text-accent">STORE</span>
            </Link>
            <h1 className="text-2xl font-bold text-primary mt-3">Seller Portal</h1>
          </div>

          <div className="bg-card rounded-xl shadow-card p-8">
            {error && <p className="text-red-600 text-sm bg-red-50 rounded p-3 mb-4">{error}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={busy}
                className="w-full btn-primary py-2.5 rounded font-bold"
              >
                {busy ? "Signing in…" : "Sign In"}
              </button>
            </form>

            <p className="text-sm text-center mt-4 text-muted">
              New seller?{" "}
              <Link href="/seller/register" className="text-secondary font-medium hover:underline">
                Apply now
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

SellerLoginPage.getLayout = (page) => page;
