/**
 * contexts/WishlistContext.js
 * Server-synced wishlist for logged-in customers; localStorage fallback for guests.
 */
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { wishlistApi } from "@/lib/api";
import { isCustomerLoggedIn } from "@/lib/auth";
import { useAuth } from "@/contexts/AuthContext";

const WishlistContext = createContext(null);

const GUEST_KEY = "trd_wishlist_guest";

function loadGuest() {
  if (typeof window === "undefined") return [];
  try {
    return (JSON.parse(localStorage.getItem(GUEST_KEY)) || []).map(Number).filter(Boolean);
  } catch {
    return [];
  }
}

export function WishlistProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  // productIds as array of numbers
  const [wishlistIds, setWishlistIds] = useState([]);
  const [synced, setSynced]           = useState(false);

  useEffect(() => {
    if (authLoading) return;

    async function syncWishlist() {
      if (!user || !isCustomerLoggedIn()) {
        setWishlistIds(loadGuest());
        setSynced(true);
        return;
      }

      const guestIds = loadGuest();
      try {
        for (const productId of guestIds) {
          try {
            await wishlistApi.toggle(productId);
          } catch {
            // Ignore stale guest IDs so one deleted product cannot block the user's real wishlist.
          }
        }
        if (guestIds.length) {
          localStorage.removeItem(GUEST_KEY);
        }
        const { data } = await wishlistApi.list();
        const lists = Array.isArray(data) ? data : [];
        const ids = lists.flatMap((l) => (l.items || []).map((i) => Number(i.product)));
        setWishlistIds([...new Set(ids)]);
        setSynced(true);
      } catch {
        setWishlistIds(guestIds);
        setSynced(true);
      }
    }

    setSynced(false);
    syncWishlist();
  }, [user, authLoading]);

  const toggle = useCallback(async (product) => {
    const id = Number(product.id ?? product);
    if (!id) return;

    const previousIds = wishlistIds;
    const wasWishlisted = previousIds.includes(id);
    const nextIds = wasWishlisted
      ? previousIds.filter((x) => x !== id)
      : [...previousIds, id];

    setWishlistIds(nextIds);

    if (!user || !isCustomerLoggedIn()) {
      localStorage.setItem(GUEST_KEY, JSON.stringify(nextIds));
      return;
    }

    try {
      if (wasWishlisted) {
        await wishlistApi.remove(id);
      } else {
        await wishlistApi.toggle(id);
      }
    } catch (error) {
      setWishlistIds(previousIds);
      throw error;
    }
  }, [user, wishlistIds]);

  const isWishlisted = useCallback((id) => wishlistIds.includes(Number(id)), [wishlistIds]);

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
