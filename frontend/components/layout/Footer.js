import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-primary text-gray-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand */}
        <div>
          <h2 className="font-black text-2xl text-white mb-3">
            TRD<span className="text-accent">STORE</span>
          </h2>
          <p className="text-sm opacity-70">
            Your trusted marketplace in Saudi Arabia. Shop smart, save more.
          </p>
        </div>

        {/* Shop */}
        <div>
          <h3 className="text-white font-semibold mb-3">Shop</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/shop" className="hover:text-accent">All Products</Link></li>
            <li><Link href="/shop?filter=featured" className="hover:text-accent">Featured</Link></li>
            <li><Link href="/shop?filter=deals" className="hover:text-accent">Deals</Link></li>
            <li><Link href="/shop?filter=new-arrivals" className="hover:text-accent">New Arrivals</Link></li>
          </ul>
        </div>

        {/* Sell */}
        <div>
          <h3 className="text-white font-semibold mb-3">Sell</h3>
          <ul className="space-y-2 text-sm">
            {/* TRD: /seller → /seller/register (next.config.js redirect) */}
            <li><Link href="/seller/register" className="hover:text-accent">Become a Seller</Link></li>
            <li><Link href="/seller/login" className="hover:text-accent">Seller Login</Link></li>
            <li><Link href="/seller/dashboard" className="hover:text-accent">Seller Dashboard</Link></li>
          </ul>
        </div>

        {/* Help */}
        <div>
          <h3 className="text-white font-semibold mb-3">Help</h3>
          <ul className="space-y-2 text-sm">
            <li><a href="mailto:support@trdstore.sa" className="hover:text-accent">Contact Us</a></li>
            <li><Link href="/shop/wishlist" className="hover:text-accent">My Wishlist</Link></li>
            <li><Link href="/login" className="hover:text-accent">Sign In</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-700 py-4 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} TRD Store. All rights reserved.
      </div>
    </footer>
  );
}
