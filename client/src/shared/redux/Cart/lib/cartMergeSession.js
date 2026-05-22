const STORAGE_KEY = "woh_cart_merge_token";

export function shouldMergeGuestCart(token) {
  if (typeof window === "undefined" || !token) {
    return false;
  }
  try {
    return sessionStorage.getItem(STORAGE_KEY) !== String(token);
  } catch {
    return true;
  }
}

export function markGuestCartMerged(token) {
  try {
    sessionStorage.setItem(STORAGE_KEY, String(token));
  } catch {
  }
}

export function resetCartMergeSession() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
  }
}
