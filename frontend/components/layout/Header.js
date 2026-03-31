/**
 * components/layout/Header.js
 * Top navigation bar — TRD dark-navy + yellow-accent style.
 */
import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import CartDrawer from "@/components/cart/CartDrawer";
import { ShoppingCartIcon, HeartIcon, UserIcon, MagnifyingGlassIcon, Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/router";

export default function Header() {
  const { totalItems } = useCart();
  const { user, logout } = useAuth();
  const [cartOpen,   setCartOpen]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search,     setSearch]     = useState("");
  const router = useRouter();

  function handleSearch(e) {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/shop?search=${encodeURIComponent(search.trim())}`);
      setSearch("");
    }
  }

  return (
    <>
      {/* ─── Top strip ─────────────────────────────────────── */}
      <div className="bg-primary text-white text-xs py-1 px-4 flex justify-between items-center">
        <span>Free delivery on orders above SAR 200</span>
        <div className="flex gap-4">
          {user ? (
            <>
              <span className="opacity-80">Hi, {user.first_name || user.username}</span>
              <button onClick={logout} className="underline">Logout</button>
            </>
          ) : (
            <>
              <Link href="/login"  className="hover:text-accent">Sign In</Link>
              <Link href="/signup" className="hover:text-accent">Register</Link>
            </>
          )}
          {/* TRD: /seller → /seller/register via next.config.js redirect */}
          <Link href="/seller/register" className="hover:text-accent">Sell on TRD</Link>
        </div>
      </div>

      {/* ─── Main nav ───────────────────────────────────────── */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          {/* Logo */}
          <Link href="/" className="font-black text-2xl text-primary shrink-0">
            TRD<span className="text-accent">STORE</span>
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 hidden md:flex">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products…"
              className="border border-gray-300 rounded-l px-4 py-2 w-full text-sm focus:outline-none focus:border-primary"
            />
            <button
              type="submit"
              className="bg-accent hover:bg-accent-hover px-4 py-2 rounded-r text-sm font-semibold"
              aria-label="Search"
            >
              <MagnifyingGlassIcon className="w-5 h-5" />
            </button>
          </form>

          {/* Icons */}
          <div className="flex items-center gap-3 ml-auto">
            {/* TRD: /wishlist → /shop/wishlist via redirect */}
            <Link href="/shop/wishlist" aria-label="Wishlist" className="relative p-1">
              <HeartIcon className="w-6 h-6 text-gray-600 hover:text-primary" />
            </Link>

            {user && (
              <Link href="/account" aria-label="Account" className="p-1">
                <UserIcon className="w-6 h-6 text-gray-600 hover:text-primary" />
              </Link>
            )}

            <button
              onClick={() => setCartOpen(true)}
              aria-label="Cart"
              className="relative p-1"
            >
              <ShoppingCartIcon className="w-6 h-6 text-gray-600 hover:text-primary" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-accent text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-1"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Menu"
            >
              {mobileOpen ? (
                <XMarkIcon className="w-6 h-6" />
              ) : (
                <Bars3Icon className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile search */}
        <form onSubmit={handleSearch} className="md:hidden px-4 pb-3 flex">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…"
            className="border border-gray-300 rounded-l px-3 py-2 w-full text-sm focus:outline-none"
          />
          <button type="submit" className="bg-accent px-3 rounded-r">
            <MagnifyingGlassIcon className="w-5 h-5" />
          </button>
        </form>

        {/* Category nav */}
        <nav className="bg-primary hidden md:block">
          <div className="max-w-7xl mx-auto px-4 flex items-center gap-6 h-10">
            <Link href="/shop" className="text-white text-sm font-medium hover:text-accent">
              All Products
            </Link>
            <Link href="/shop?filter=featured" className="text-white text-sm hover:text-accent">
              Featured
            </Link>
            <Link href="/shop?filter=deals" className="text-white text-sm hover:text-accent">
              Deals
            </Link>
            <Link href="/shop?filter=new-arrivals" className="text-white text-sm hover:text-accent">
              New Arrivals
            </Link>
            <Link href="/shop?filter=bestsellers" className="text-white text-sm hover:text-accent">
              Best Sellers
            </Link>
          </div>
        </nav>
      </header>

      {/* Cart Drawer */}
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
