/**
 * components/seller/SellerLayout.js
 * Sidebar layout for all seller dashboard pages.
 */
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { getSellerPayload, clearSellerToken } from "@/lib/auth";
import {
  Squares2X2Icon, CubeIcon, PlusCircleIcon, ArrowRightOnRectangleIcon,
  ShoppingBagIcon,
} from "@heroicons/react/24/outline";

const SHOW_ORDERS = true;

const navItems = [
  { href: "/seller/dashboard",     label: "Dashboard",   icon: Squares2X2Icon },
  { href: "/seller/product/add",   label: "Add Product", icon: PlusCircleIcon },
  { href: "/seller/products",      label: "My Products", icon: CubeIcon },
  // TRD_HOLD: My Orders — hidden via NEXT_PUBLIC_SELLER_SHOW_ORDERS
  ...(SHOW_ORDERS ? [{ href: "/seller/orders", label: "My Orders", icon: ShoppingBagIcon }] : []),
];

export default function SellerLayout({ children, title }) {
  const router = useRouter();
  const [seller, setSeller] = useState(null);

  useEffect(() => {
    const payload = getSellerPayload();
    if (!payload) {
      router.replace("/seller/login");
    } else {
      setSeller(payload);
    }
  }, [router]);

  function handleLogout() {
    clearSellerToken();
    router.push("/seller/login");
  }

  return (
    <div className="min-h-screen flex bg-surface">
      {/* Sidebar */}
      <aside className="w-64 bg-primary text-white flex flex-col shrink-0 hidden md:flex">
        <div className="p-5 border-b border-white/10">
          <Link href="/" className="font-black text-xl">
            TRD<span className="text-accent">STORE</span>
          </Link>
          {seller && (
            <p className="text-xs text-gray-400 mt-1 truncate">{seller.email}</p>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded text-sm font-medium transition-colors ${
                router.pathname === href
                  ? "bg-accent text-gray-900"
                  : "hover:bg-white/10"
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white w-full"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white shadow-sm px-6 py-4 flex items-center gap-4">
          <h1 className="font-bold text-lg text-primary">{title}</h1>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
