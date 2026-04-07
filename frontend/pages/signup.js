/**
 * pages/signup.js — Customer Registration
 */
import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";

export default function SignupPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [form, setForm]   = useState({
    username: "", email: "", first_name: "", last_name: "",
    password: "", confirm_password: "",
  });
  const [error, setError] = useState(null);
  const [busy,  setBusy]  = useState(false);

  function update(key, val) {
    setForm((p) => ({ ...p, [key]: val }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.password !== form.confirm_password) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await register({
        username:   form.username,
        email:      form.email,
        first_name: form.first_name,
        last_name:  form.last_name,
        password:   form.password,
        password2:  form.confirm_password,
      });
      router.push("/");
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

  return (
    <>
      <Head><title>Create Account – TRD Store</title></Head>
      <div className="min-h-screen flex items-center justify-center bg-surface px-4 py-10">
        <div className="w-full max-w-md bg-card rounded-xl shadow-card p-8">
          <h1 className="font-black text-2xl text-primary mb-1">Create Account</h1>
          <p className="text-muted text-sm mb-6">Join TRD Store and start shopping</p>

          {error && <p className="text-red-600 text-sm bg-red-50 rounded p-3 mb-4">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">First Name</label>
                <input
                  type="text"
                  value={form.first_name}
                  onChange={(e) => update("first_name", e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Last Name</label>
                <input
                  type="text"
                  value={form.last_name}
                  onChange={(e) => update("last_name", e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
                />
              </div>
            </div>
            {[
              { key: "username",   label: "Username",        type: "text",     required: true },
              { key: "email",      label: "Email Address",   type: "email",    required: true },
              { key: "password",   label: "Password",        type: "password", required: true },
              { key: "confirm_password", label: "Confirm Password", type: "password", required: true },
            ].map(({ key, label, type, required }) => (
              <div key={key}>
                <label className="text-sm font-medium text-gray-700 block mb-1">{label}</label>
                <input
                  type={type}
                  value={form[key]}
                  onChange={(e) => update(key, e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
                  required={required}
                />
              </div>
            ))}
            <button
              type="submit"
              disabled={busy}
              className="w-full btn-primary py-2.5 rounded font-bold"
            >
              {busy ? "Creating account…" : "Create Account"}
            </button>
          </form>

          <p className="text-sm text-center mt-4 text-muted">
            Already have an account?{" "}
            <Link href="/login" className="text-secondary font-medium hover:underline">Sign In</Link>
          </p>
        </div>
      </div>
    </>
  );
}
