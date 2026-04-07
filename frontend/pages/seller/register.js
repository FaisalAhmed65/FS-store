/**
 * pages/seller/register.js
 * TRD: /seller redirects here via next.config.js
 */
import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/router";
import { sellerApi } from "@/lib/api";

export default function SellerRegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    business_name: "",
    email:         "",
    password:      "",
    confirm:       "",
    phone:         "",
    address:       "",
    description:   "",
  });
  const [error,   setError]   = useState(null);
  const [busy,    setBusy]    = useState(false);
  const [success, setSuccess] = useState(false);

  function update(k, v) { setForm((p) => ({ ...p, [k]: v })); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await sellerApi.register({
        business_name: form.business_name,
        email:         form.email,
        password:      form.password,
        password2:     form.confirm,
        phone:         form.phone,
        address:       form.address,
        description:   form.description,
      });
      setSuccess(true);
    } catch (err) {
      const data = err.response?.data;
      setError(
        typeof data === "object"
          ? Object.values(data).flat().join(" ")
          : "Registration failed. Please try again."
      );
    } finally {
      setBusy(false);
    }
  }

  // No default Layout — full-page form
  return (
    <>
      <Head><title>Become a Seller – TRD Store</title></Head>
      <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg">
          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/" className="font-black text-3xl text-primary">
              TRD<span className="text-accent">STORE</span>
            </Link>
            <h1 className="text-2xl font-bold text-primary mt-3">Start Selling Today</h1>
            <p className="text-muted text-sm mt-1">
              Fill in your details. Our team will review and approve your account.
            </p>
          </div>

          {success ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
              <div className="text-4xl mb-3">✅</div>
              <h2 className="font-bold text-lg text-green-700 mb-1">Application Received!</h2>
              <p className="text-green-600 text-sm">
                We'll review your details and get back to you within 24-48 hours.
              </p>
              <Link href="/" className="mt-4 inline-block btn-accent px-8 py-2 rounded font-bold">
                Back to Home
              </Link>
            </div>
          ) : (
            <div className="bg-card rounded-xl shadow-card p-8">
              {error && <p className="text-red-600 text-sm bg-red-50 rounded p-3 mb-4">{error}</p>}

              <form onSubmit={handleSubmit} className="space-y-4">
                {[
                  { key: "business_name", label: "Business / Store Name",  type: "text",     req: true },
                  { key: "email",         label: "Business Email",          type: "email",    req: true },
                  { key: "phone",         label: "Phone Number",            type: "tel",      req: false },
                  { key: "address",       label: "Business Address",        type: "text",     req: false },
                  { key: "password",      label: "Password",               type: "password", req: true },
                  { key: "confirm",       label: "Confirm Password",       type: "password", req: true },
                ].map(({ key, label, type, req }) => (
                  <div key={key}>
                    <label className="text-sm font-medium text-gray-700 block mb-1">{label}</label>
                    <input
                      type={type}
                      value={form[key]}
                      onChange={(e) => update(key, e.target.value)}
                      className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
                      required={req}
                    />
                  </div>
                ))}

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">About Your Business</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => update("description", e.target.value)}
                    rows={3}
                    className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
                    placeholder="Tell us what you sell…"
                  />
                </div>

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full btn-primary py-3 rounded font-bold mt-2"
                >
                  {busy ? "Submitting…" : "Submit Application"}
                </button>
              </form>

              <p className="text-sm text-center mt-4 text-muted">
                Already have an account?{" "}
                <Link href="/seller/login" className="text-secondary font-medium hover:underline">
                  Sign In
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

SellerRegisterPage.getLayout = (page) => page;
