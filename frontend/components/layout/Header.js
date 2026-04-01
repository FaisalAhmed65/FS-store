/**
 * components/layout/Header.js
 * Noon-style yellow header â€” matches Odoo TRD Store custom_header.
 * Features: Dark/Light toggle + Bengali/English language toggle.
 */
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useLang } from "@/contexts/LanguageContext";
import CartDrawer from "@/components/cart/CartDrawer";
import { useRouter } from "next/router";

function SearchIcon({ size = 22 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill="#666" viewBox="0 0 16 16">
      <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
    </svg>
  );
}
function UserIcon({ size = 22 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill="currentColor" viewBox="0 0 16 16">
      <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z"/>
    </svg>
  );
}
function HeartIcon({ size = 24 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill="currentColor" viewBox="0 0 16 16">
      <path d="m8 2.748-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01L8 2.748zM8 15C-7.333 4.868 3.279-3.04 7.824 1.143c.06.055.119.112.176.171a3.12 3.12 0 0 1 .176-.17C12.72-3.042 23.333 4.867 8 15z"/>
    </svg>
  );
}
function CartIcon({ size = 24 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill="currentColor" viewBox="0 0 16 16">
      <path d="M0 1.5A.5.5 0 0 1 .5 1H2a.5.5 0 0 1 .485.379L2.89 3H14.5a.5.5 0 0 1 .491.592l-1.5 8A.5.5 0 0 1 13 12H4a.5.5 0 0 1-.491-.408L2.01 3.607 1.61 2H.5a.5.5 0 0 1-.5-.5zM3.102 4l1.313 7h8.17l1.313-7H3.102zM5 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-7 1a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm7 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
    </svg>
  );
}

export default function Header() {
  const { totalItems } = useCart();
  const { user, logout } = useAuth();
  const { isDark, toggle: toggleTheme } = useTheme();
  const { lang, toggleLang } = useLang();
  const [cartOpen, setCartOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const router = useRouter();

  const isBn = lang === "bn";

  function handleSearch(e) {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/shop?search=${encodeURIComponent(search.trim())}`);
      setSearch("");
    }
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
      <header
        className="fixed top-0 left-0 right-0 z-[1000]"
        style={{
          backgroundColor: "#fccc04",
          borderBottom: "2px solid #e8b800",
          boxShadow: "0 2px 10px rgba(0,0,0,0.12)",
        }}
      >
        <div className="w-full px-2 md:px-4">
          {/* â”€â”€ Row 1: Logo + Search + Icons â”€â”€ */}
          <div className="flex items-center gap-2 py-2" style={{ minHeight: 54 }}>

            {/* Logo */}
            <Link href="/" className="flex-shrink-0 no-underline">
              <div className="flex flex-col leading-none">
                <span className="font-black text-[22px] md:text-[26px]" style={{ color: "#1a1a2e", letterSpacing: -0.5 }}>
                  TRD<span style={{ color: "#e62e04" }}>STORE</span>
                </span>
                <span className="text-[10px] font-semibold" style={{ color: "#333" }}>
                  <span className="t-en">Traders Store</span>
                  <span className="t-bn">à¦Ÿà§à¦°à§‡à¦¡à¦¾à¦°à§à¦¸ à¦¸à§à¦Ÿà§‹à¦°</span>
                </span>
              </div>
            </Link>

            {/* Delivery Location (desktop) */}
            <div className="hidden md:flex items-center flex-shrink-0 gap-1.5 px-2 py-1.5 cursor-pointer hover:bg-black/5 rounded-md">
              <span className="text-xl">ðŸ‡§ðŸ‡©</span>
              <div className="flex flex-col leading-tight">
                <span className="text-[10px] text-gray-600">
                  <span className="t-en">Deliver to</span>
                  <span className="t-bn">à¦¡à§‡à¦²à¦¿à¦­à¦¾à¦°à¦¿</span>
                </span>
                <span className="text-xs font-bold text-gray-800 whitespace-nowrap">
                  <span className="t-en">Bangladesh</span>
                  <span className="t-bn">à¦¬à¦¾à¦‚à¦²à¦¾à¦¦à§‡à¦¶</span>
                </span>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex-grow min-w-0">
              <form onSubmit={handleSearch} className="w-full">
                <div className="flex">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={isBn ? "à¦†à¦ªà¦¨à¦¿ à¦•à¦¿ à¦–à§à¦à¦œà¦›à§‡à¦¨?" : "What are you looking for?"}
                    className="flex-1 min-w-0 border-none rounded-l-[26px] rounded-r-none px-5 py-[10px] text-[15px] bg-white focus:outline-none focus:ring-2 focus:ring-yellow-300/50"
                  />
                  <button
                    type="submit"
                    className="bg-white border-none rounded-r-[26px] rounded-l-none px-4 hover:bg-gray-50 transition-colors border-l border-gray-200"
                    aria-label="Search"
                  >
                    <SearchIcon />
                  </button>
                </div>
              </form>
            </div>

            {/* â”€â”€ Desktop Right Icons â”€â”€ */}
            <div className="hidden md:flex items-center flex-shrink-0 gap-0.5">

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="flex items-center gap-1.5 bg-transparent border-none px-3 py-1.5 rounded-lg font-bold text-[13px] cursor-pointer hover:bg-black/[.08] transition-colors whitespace-nowrap"
                style={{ color: "#1a1a2e", minHeight: 40 }}
                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                <i className={`fa ${isDark ? "fa-sun-o" : "fa-moon-o"}`} style={{ fontSize: 15 }} />
                <span className="hidden lg:inline">
                  <span className="t-en">{isDark ? "LIGHT" : "DARK"}</span>
                  <span className="t-bn">{isDark ? "à¦²à¦¾à¦‡à¦Ÿ" : "à¦¡à¦¾à¦°à§à¦•"}</span>
                </span>
              </button>

              {/* Language Toggle â€” à¦¬à¦¾à¦‚à¦²à¦¾ â†” English */}
              <button
                onClick={toggleLang}
                className="flex items-center gap-1.5 bg-transparent border-none px-3 py-1.5 rounded-lg font-bold text-[13px] cursor-pointer hover:bg-black/[.08] transition-colors whitespace-nowrap"
                style={{ color: "#1a1a2e", minHeight: 40 }}
                title={isBn ? "Switch to English" : "à¦¬à¦¾à¦‚à¦²à¦¾à¦¯à¦¼ à¦ªà¦°à¦¿à¦¬à¦°à§à¦¤à¦¨ à¦•à¦°à§à¦¨"}
              >
                <i className="fa fa-language" style={{ fontSize: 15 }} />
                <span className="hidden lg:inline">
                  {isBn ? "English" : "à¦¬à¦¾à¦‚à¦²à¦¾"}
                </span>
              </button>

              {/* Separator */}
              <span className="inline-block w-px h-7 bg-black/20 mx-1" />

              {/* Profile / Login */}
              <div className="relative" ref={profileRef}>
                {user ? (
                  <>
                    <button
                      onClick={() => setProfileOpen(!profileOpen)}
                      className="flex items-center gap-1.5 bg-transparent border-none px-2 py-1 rounded-lg cursor-pointer hover:bg-black/[.08] transition-colors"
                      style={{ color: "#1a1a2e", fontWeight: 700, fontSize: 13, minHeight: 40 }}
                    >
                      <UserIcon size={20} />
                      <span className="hidden lg:inline max-w-[90px] truncate">{user.first_name || user.username}</span>
                    </button>
                    {profileOpen && (
                      <div className="absolute right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-[10000]" style={{ minWidth: 220 }}>
                        <div className="px-3 py-2 border-b border-gray-100 mb-1">
                          <div className="text-sm font-bold text-gray-800">{user.first_name || user.username}</div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </div>
                        <Link href="/account" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 no-underline" onClick={() => setProfileOpen(false)}>
                          <i className="fa fa-user-circle text-gray-400 w-4" />
                          <span className="t-en">My Account</span>
                          <span className="t-bn">à¦†à¦®à¦¾à¦° à¦…à§à¦¯à¦¾à¦•à¦¾à¦‰à¦¨à§à¦Ÿ</span>
                        </Link>
                        <Link href="/orders" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 no-underline" onClick={() => setProfileOpen(false)}>
                          <i className="fa fa-shopping-bag text-gray-400 w-4" />
                          <span className="t-en">My Orders</span>
                          <span className="t-bn">à¦†à¦®à¦¾à¦° à¦…à¦°à§à¦¡à¦¾à¦°</span>
                        </Link>
                        <Link href="/seller/dashboard" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 no-underline" onClick={() => setProfileOpen(false)}>
                          <i className="fa fa-store text-gray-400 w-4" />
                          <span className="t-en">Seller Dashboard</span>
                          <span className="t-bn">à¦¸à§‡à¦²à¦¾à¦° à¦¡à§à¦¯à¦¾à¦¶à¦¬à§‹à¦°à§à¦¡</span>
                        </Link>
                        <div className="border-t border-gray-100 my-1" />
                        <button
                          onClick={() => { logout(); setProfileOpen(false); }}
                          className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-red-600 font-semibold hover:bg-gray-50 border-none bg-transparent cursor-pointer"
                        >
                          <i className="fa fa-sign-out w-4" />
                          <span className="t-en">Log Out</span>
                          <span className="t-bn">à¦²à¦— à¦†à¦‰à¦Ÿ</span>
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    href="/login"
                    className="flex items-center gap-1.5 no-underline px-2 py-1 rounded-lg hover:bg-black/[.08] transition-colors"
                    style={{ color: "#1a1a2e", fontWeight: 700, fontSize: 13, minHeight: 40 }}
                  >
                    <UserIcon size={18} />
                    <span className="hidden lg:inline">
                      <span className="t-en">Log in</span>
                      <span className="t-bn">à¦²à¦— à¦‡à¦¨</span>
                    </span>
                  </Link>
                )}
              </div>

              {/* Wishlist */}
              <Link
                href="/shop/wishlist"
                className="relative flex items-center justify-center no-underline rounded-lg hover:bg-black/[.06] transition-colors"
                style={{ color: "#333", minWidth: 44, minHeight: 44 }}
                aria-label="Wishlist"
              >
                <HeartIcon />
              </Link>

              {/* Cart */}
              <button
                onClick={() => setCartOpen(true)}
                className="relative flex items-center justify-center bg-transparent border-none rounded-lg hover:bg-black/[.06] transition-colors cursor-pointer"
                style={{ color: "#333", minWidth: 44, minHeight: 44 }}
                aria-label="Cart"
              >
                <CartIcon />
                {totalItems > 0 && (
                  <span className="absolute top-0.5 right-0.5 min-w-[17px] h-[17px] rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center leading-none px-0.5">
                    {totalItems}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* â”€â”€ Row 2: Mobile bottom bar â”€â”€ */}
          <div className="flex md:hidden justify-around items-center pb-2 pt-1 border-t border-black/10 gap-1">
            {/* Theme */}
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center gap-1 bg-transparent border-none px-2 py-1 cursor-pointer text-[12px] font-bold"
              style={{ color: "#1a1a2e" }}
            >
              <i className={`fa ${isDark ? "fa-sun-o" : "fa-moon-o"} text-base`} />
              <span>{isDark ? "â˜€ï¸" : "ðŸŒ™"}</span>
            </button>

            {/* Language */}
            <button
              onClick={toggleLang}
              className="flex items-center justify-center gap-1 bg-transparent border-none px-2 py-1 cursor-pointer text-[12px] font-bold"
              style={{ color: "#1a1a2e" }}
            >
              <i className="fa fa-language text-base" />
              <span>{isBn ? "EN" : "à¦¬à¦¾à¦‚"}</span>
            </button>

            {/* User */}
            {user ? (
              <Link href="/account" className="flex items-center justify-center no-underline" style={{ color: "#1a1a2e", minWidth: 36 }}>
                <UserIcon size={22} />
              </Link>
            ) : (
              <Link href="/login" className="flex items-center justify-center no-underline" style={{ color: "#1a1a2e", minWidth: 36 }}>
                <UserIcon size={22} />
              </Link>
            )}

            {/* Wishlist */}
            <Link href="/shop/wishlist" className="flex items-center justify-center no-underline" style={{ color: "#1a1a2e", minWidth: 36 }}>
              <HeartIcon size={22} />
            </Link>

            {/* Cart */}
            <button
              onClick={() => setCartOpen(true)}
              className="relative flex items-center justify-center bg-transparent border-none cursor-pointer"
              style={{ color: "#1a1a2e", minWidth: 36 }}
            >
              <CartIcon size={22} />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[15px] h-[15px] rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Spacer to push content below fixed header */}
      <div id="trd-header-spacer" style={{ height: "var(--trd-header-height, 72px)" }} />

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
