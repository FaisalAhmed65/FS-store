/**
 * contexts/CartContext.js
 * Cart state stored in localStorage, no server-side cart.
 * Items: [{ product (object snapshot), quantity }]
 */
import { createContext, useContext, useEffect, useReducer, useCallback } from "react";

const CART_KEY = "trd_cart";

const CartContext = createContext(null);

function loadCart() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

function saveCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

function cartReducer(state, action) {
  switch (action.type) {
    case "ADD": {
      const existing = state.find((i) => i.product.id === action.product.id);
      if (existing) {
        return state.map((i) =>
          i.product.id === action.product.id
            ? { ...i, quantity: i.quantity + (action.qty || 1) }
            : i
        );
      }
      return [...state, { product: action.product, quantity: action.qty || 1 }];
    }
    case "REMOVE":
      return state.filter((i) => i.product.id !== action.productId);
    case "UPDATE_QTY":
      return state.map((i) =>
        i.product.id === action.productId ? { ...i, quantity: action.qty } : i
      );
    case "CLEAR":
      return [];
    case "INIT":
      return action.items;
    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [items, dispatch] = useReducer(cartReducer, [], loadCart);

  // Persist on every change
  useEffect(() => {
    saveCart(items);
  }, [items]);

  const addItem = useCallback((product, qty = 1) => {
    dispatch({ type: "ADD", product, qty });
  }, []);

  const removeItem = useCallback((productId) => {
    dispatch({ type: "REMOVE", productId });
  }, []);

  const updateQty = useCallback((productId, qty) => {
    if (qty < 1) {
      dispatch({ type: "REMOVE", productId });
    } else {
      dispatch({ type: "UPDATE_QTY", productId, qty });
    }
  }, []);

  const clearCart = useCallback(() => dispatch({ type: "CLEAR" }), []);

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = items.reduce(
    (s, i) => s + Number(i.product.price) * i.quantity,
    0
  );
  const isInCart = (productId) => items.some((i) => i.product.id === productId);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQty, clearCart, totalItems, totalPrice, isInCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
