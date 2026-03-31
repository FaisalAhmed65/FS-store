/**
 * pages/login.js — Customer Sign In
 */
import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [form, setForm]   = useState({ email: "", password: "" });
  const [error, setError] = useState(null);
  const [busy,  setBusy]  = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(form.email, form.password);
      router.push(router.query.next || "/");
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid email or password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Head><title>Sign In – TRD Store</title></Head>
      <div className="min-h-screen flex items-center justify-center bg-surface px-4">
        <div className="w-full max-w-md bg-card rounded-xl shadow-card p-8">
          <h1 className="font-black text-2xl text-primary mb-1">Welcome back</h1>
          <p className="text-muted text-sm mb-6">Sign in to your TRD Store account</p>

          {error && <p className="text-red-600 text-sm bg-red-50 rounded p-3 mb-4">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Email or Username</label>
              <input
                type="text"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
                required
                autoFocus
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
            Don't have an account?{" "}
            <Link href="/signup" className="text-secondary font-medium hover:underline">Create one</Link>
          </p>
        </div>
      </div>
    </>
  );
}
