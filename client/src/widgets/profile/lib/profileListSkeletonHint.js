export const PROFILE_ORDERS_COUNT_KEY = "profile_orders_count";

export function readProfileOrdersCountHint() {
  if (typeof window === "undefined") return null;

  try {
    const raw = sessionStorage.getItem(PROFILE_ORDERS_COUNT_KEY);
    if (raw === null) return null;
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

export function writeProfileOrdersCountHint(count) {
  if (typeof window === "undefined") return;

  try {
    sessionStorage.setItem(PROFILE_ORDERS_COUNT_KEY, String(count));
  } catch {}
}

export function readWishlistCountFromStorage() {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem("wishlist");
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}
