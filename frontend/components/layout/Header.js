import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import CartDrawer from "@/components/cart/CartDrawer";

function SearchIcon({ size = 20 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
    </svg>
  );
}

function HeartIcon({ size = 22 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
      <path d="m8 2.748-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01L8 2.748zM8 15C-7.333 4.868 3.279-3.04 7.824 1.143c.06.055.119.112.176.171a3.12 3.12 0 0 1 .176-.17C12.72-3.042 23.333 4.867 8 15z" />
    </svg>
  );
}

function CartIcon({ size = 24 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M0 1.5A.5.5 0 0 1 .5 1H2a.5.5 0 0 1 .485.379L2.89 3H14.5a.5.5 0 0 1 .491.592l-1.5 8A.5.5 0 0 1 13 12H4a.5.5 0 0 1-.491-.408L2.01 3.607 1.61 2H.5a.5.5 0 0 1-.5-.5zM3.102 4l1.313 7h8.17l1.313-7H3.102zM5 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
    </svg>
  );
}

function ThemeToggleIcon({ isDark }) {
  return <i className={`fa ${isDark ? "fa-sun-o" : "fa-moon-o"}`} aria-hidden="true" />;
}

const navItems = [
  { href: "/shop", label: "All" },
  { href: "/shop?deal_type=deals", label: "Deal Lab" },
  { href: "/shop?deal_type=new_arrivals", label: "New Drops" },
  { href: "/shop?deal_type=bestseller", label: "Most Loved" },
  { href: "/shop?free_delivery=1", label: "Fast Delivery" },
  { href: "/seller/register", label: "Seller Hub" },
];

export default function Header() {
  const { totalItems } = useCart();
  const { user, logout } = useAuth();
  const { isDark, toggle: toggleTheme } = useTheme();
  const [cartOpen, setCartOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const router = useRouter();

  const displayName = user?.first_name || user?.username || "Account";

  function handleSearch(e) {
    e.preventDefault();
    const term = search.trim();
    const query = {};
    if (term) query.search = term;
    if (category) query.category_slug = category;
    router.push({ pathname: "/shop", query });
    setSearch("");
  }

  useEffect(() => {
    function handleClick(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <>
      <header className="site-header">
        <div className="amazon-topbar">
          <Link href="/" className="amazon-logo" aria-label="TRD Store home">
            <span className="amazon-logo-main">TRD</span>
            <span className="amazon-logo-accent">Store</span>
          </Link>

          <Link href="/shop?free_delivery=1" className="amazon-delivery">
            <span className="amazon-delivery-kicker">Delivering across</span>
            <span className="amazon-delivery-main">Bangladesh</span>
          </Link>

          <form onSubmit={handleSearch} className="amazon-search" role="search">
            <select
              aria-label="Search category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="amazon-search-select"
            >
              <option value="">All</option>
              <option value="electronics">Electronics</option>
              <option value="fashion">Fashion</option>
              <option value="home-living">Home</option>
              <option value="beauty">Beauty</option>
            </select>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search laptops, sneakers, skincare..."
              className="amazon-search-input"
            />
            <button type="submit" className="amazon-search-btn" aria-label="Search">
              <SearchIcon />
            </button>
          </form>

          <div className="amazon-actions">
            <button
              type="button"
              onClick={toggleTheme}
              className="theme-toggle-btn"
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              aria-pressed={isDark}
            >
              <span className="theme-toggle-track">
                <span className="theme-toggle-thumb">
                  <ThemeToggleIcon isDark={isDark} />
                </span>
              </span>
              <span className="theme-toggle-copy">
                <span>{isDark ? "Light" : "Dark"}</span>
                <small>Mode</small>
              </span>
            </button>

            <div className="relative" ref={profileRef}>
              {user ? (
                <>
                  <button
                    type="button"
                    onClick={() => setProfileOpen((open) => !open)}
                    className="amazon-action-btn"
                    aria-expanded={profileOpen}
                  >
                    <span className="amazon-action-kicker">Hello</span>
                    <span className="amazon-action-main max-w-[96px] truncate">{displayName}</span>
                  </button>
                  {profileOpen && (
                    <div className="amazon-profile-menu">
                      <div className="px-3 py-2 border-b border-gray-100">
                        <div className="text-sm font-bold text-gray-900 truncate">{displayName}</div>
                        {user.email && <div className="text-xs text-gray-500 truncate">{user.email}</div>}
                      </div>
                      <Link href="/shop/wishlist" className="amazon-profile-link" onClick={() => setProfileOpen(false)}>
                        Wishlist
                      </Link>
                      <Link href="/seller/dashboard" className="amazon-profile-link" onClick={() => setProfileOpen(false)}>
                        Seller Dashboard
                      </Link>
                      <button
                        type="button"
                        onClick={() => { logout(); setProfileOpen(false); }}
                        className="amazon-profile-link w-full text-left text-red-600"
                        style={{ color: "#dc2626" }}
                      >
                        Log Out
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <Link href="/login" className="amazon-action-btn">
                  <span className="amazon-action-kicker">Hello</span>
                  <span className="amazon-action-main">Sign in</span>
                </Link>
              )}
            </div>

            <Link href="/shop/wishlist" className="amazon-icon-btn" aria-label="Wishlist">
              <HeartIcon />
            </Link>

            <button type="button" onClick={() => setCartOpen(true)} className="amazon-cart-btn" aria-label="Cart">
              <CartIcon />
              <span className="amazon-cart-label">Cart</span>
              {totalItems > 0 && <span className="amazon-cart-count">{totalItems}</span>}
            </button>
          </div>
        </div>

        <nav className="amazon-subnav" aria-label="Store navigation">
          <button type="button" className="amazon-subnav-all" onClick={() => router.push("/shop")}>
            <i className="fa fa-bars" aria-hidden="true" />
            All
          </button>
          <div className="amazon-subnav-track">
            {navItems.slice(1).map((item) => (
              <Link key={item.href} href={item.href} className="amazon-subnav-link">
                {item.label}
              </Link>
            ))}
          </div>
          <Link href="/#quick-match" className="amazon-subnav-deal">
            Build my shelf
          </Link>
        </nav>
      </header>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
