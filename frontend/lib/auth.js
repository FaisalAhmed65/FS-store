/**
 * lib/auth.js
 * JWT helpers for customer + seller auth.
 */
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";

// ─── Token management ────────────────────────────────────────────────────────

export function setCustomerTokens({ access, refresh }) {
  Cookies.set("trd_access",   access,  { expires: 1 / 24, sameSite: "Lax" }); // 1 h
  Cookies.set("trd_refresh",  refresh, { expires: 7,       sameSite: "Lax" }); // 7 d
}

export function clearCustomerTokens() {
  Cookies.remove("trd_access");
  Cookies.remove("trd_refresh");
}

export function setSellerToken(access) {
  Cookies.set("trd_seller_access", access, { expires: 1 / 3, sameSite: "Lax" }); // 8 h
}

export function clearSellerToken() {
  Cookies.remove("trd_seller_access");
}

// ─── Token decoders ───────────────────────────────────────────────────────────

export function getCustomerPayload() {
  const token = Cookies.get("trd_access");
  if (!token) return null;
  try {
    const payload = jwtDecode(token);
    if (payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getSellerPayload() {
  const token = Cookies.get("trd_seller_access");
  if (!token) return null;
  try {
    const payload = jwtDecode(token);
    if (payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function isCustomerLoggedIn() {
  return getCustomerPayload() !== null;
}

export function isSellerLoggedIn() {
  return getSellerPayload() !== null;
}

/** Returns "customer" | "seller" | null */
export function getAuthType() {
  if (isCustomerLoggedIn()) return "customer";
  if (isSellerLoggedIn())   return "seller";
  return null;
}
