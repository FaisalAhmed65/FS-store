/**
 * contexts/WishlistContext.js
 * Server-synced wishlist for logged-in customers; localStorage fallback for guests.
 */
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { wishlistApi } from "@/lib/api";
import { isCustomerLoggedIn } from "@/lib/auth";

const WishlistContext = createContext(null);

const GUEST_KEY = "trd_wishlist_guest";

function loadGuest() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(GUEST_KEY)) || [];
  } catch {
    return [];
  }
}

export function WishlistProvider({ children }) {
  // productIds as array of numbers
  const [wishlistIds, setWishlistIds] = useState([]);
  const [synced, setSynced]           = useState(false);

  useEffect(() => {
    if (isCustomerLoggedIn()) {
      wishlistApi.list().then(({ data }) => {
        // data is a list of WishlistListSerializer, first list's items
        const lists = Array.isArray(data) ? data : [];
        const ids   = lists.flatMap((l) => l.items.map((i) => i.product));
        setWishlistIds(ids);
        setSynced(true);
      }).catch(() => {
        setWishlistIds(loadGuest());
        setSynced(true);
      });
    } else {
      setWishlistIds(loadGuest());
      setSynced(true);
    }
  }, []);

  const toggle = useCallback(async (product) => {
    const id = product.id ?? product;
    if (isCustomerLoggedIn()) {
      if (wishlistIds.includes(id)) {
        await wishlistApi.remove(id);
        setWishlistIds((prev) => prev.filter((x) => x !== id));
      } else {
        await wishlistApi.toggle(id);
        setWishlistIds((prev) => [...prev, id]);
      }
    } else {
      setWishlistIds((prev) => {
        const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
        localStorage.setItem(GUEST_KEY, JSON.stringify(next));
        return next;
      });
    }
  }, [wishlistIds]);

  const isWishlisted = useCallback((id) => wishlistIds.includes(id), [wishlistIds]);

  return (
    <WishlistContext.Provider value={{ wishlistIds, toggle, isWishlisted, synced }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used inside WishlistProvider");
  return ctx;
}
