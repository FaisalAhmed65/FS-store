/**
 * lib/utils.js
 * Shared utility functions.
 */

/** Format a number as BDT price string. */
export function formatPrice(amount, locale = "en-BD") {
  if (amount == null) return "";
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(amount));
  return `\u09F3${formatted}`;
}

/** Calculate percentage discount between two prices */
export function discountPct(original, sale) {
  if (!original || !sale || Number(original) <= Number(sale)) return 0;
  return Math.round(((Number(original) - Number(sale)) / Number(original)) * 100);
}

/** Build full media URL from a relative path returned by the API */
export function mediaUrl(path) {
  if (!path) return "/images/placeholder.svg";
  if (path.startsWith("http")) return path;
  const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1")
    .replace(/\/+$/, "");
  const normalizedApiBase = /\/api\/v\d+$/i.test(apiBase)
    ? apiBase
    : /\/api$/i.test(apiBase)
    ? `${apiBase}/v1`
    : `${apiBase}/api/v1`;
  const base = normalizedApiBase.replace(/\/api\/v\d+$/i, "");
  return `${base}${path.startsWith("/") ? "" : "/"}${path}`;
}

/** Build a stable product detail link, falling back to search for local placeholder data. */
export function productHref(product) {
  if (!product) return "/shop";
  const isFallback = typeof product.id === "string" && product.id.startsWith("fallback-");
  if (isFallback) return `/shop?search=${encodeURIComponent(product.name || "")}`;
  if (product.slug) return `/shop/product/${encodeURIComponent(product.slug)}`;
  if (product.id != null) return `/shop/product/${encodeURIComponent(product.id)}`;
  return `/shop?search=${encodeURIComponent(product.name || "")}`;
}

/** Very simple slugify for local use */
export function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");
}

/** Truncate text to maxLen characters */
export function truncate(text, maxLen = 80) {
  if (!text) return "";
  return text.length > maxLen ? text.slice(0, maxLen) + "..." : text;
}

/** Check if a feature flag env var is enabled */
export function featureEnabled(envVarName) {
  return (process.env[envVarName] || "").toLowerCase() === "true";
}

/** Return array of page numbers for a paginator */
export function paginate(totalPages, currentPage) {
  const delta = 2;
  const range = [];
  for (
    let i = Math.max(2, currentPage - delta);
    i <= Math.min(totalPages - 1, currentPage + delta);
    i++
  ) {
    range.push(i);
  }
  if (currentPage - delta > 2) range.unshift("...");
  if (currentPage + delta < totalPages - 1) range.push("...");
  range.unshift(1);
  if (totalPages > 1) range.push(totalPages);
  return range;
}
