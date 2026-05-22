import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

function getAuthHeaders() {
  const token = Cookies.get("auth_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function wishlistFetch(url, init = {}) {
  const { headers: initHeaders, ...rest } = init;
  return fetch(url, {
    credentials: "include",
    ...rest,
    headers: {
      ...getAuthHeaders(),
      ...(initHeaders && typeof initHeaders === "object" ? initHeaders : {}),
    },
  });
}

export function iamUserWishlistBaseUrl() {
  const trimmed = String(API_URL).replace(/\/$/, "");
  const custom = process.env.NEXT_PUBLIC_USER_WISHLIST_PATH;
  if (custom != null && String(custom).trim() !== "") {
    const p = String(custom).replace(/^\/+|\/+$/g, "");
    return `${trimmed}/${p}`;
  }
  if (/\/v\d+$/i.test(trimmed)) {
    return `${trimmed}/iam/user/wishlist`;
  }
  return `${trimmed}/v1/iam/user/wishlist`;
}

async function parseJsonSafe(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

export async function fetchIamUserWishlist() {
  const response = await wishlistFetch(iamUserWishlistBaseUrl(), {
    method: "GET",
  });
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized");
    }
    throw new Error(`Wishlist fetch failed (${response.status})`);
  }
  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

export async function postIamUserWishlistAdd(groupId) {
  const response = await wishlistFetch(iamUserWishlistBaseUrl(), {
    method: "POST",
    body: JSON.stringify({ groupId: String(groupId) }),
  });
  const data = await parseJsonSafe(response);
  if (!response.ok) {
    throw new Error(
      data?.message || data?.code || `Wishlist add failed (${response.status})`,
    );
  }
  return data;
}

export async function deleteIamUserWishlistLine(groupId) {
  const enc = encodeURIComponent(String(groupId));
  const response = await wishlistFetch(
    `${iamUserWishlistBaseUrl()}/${enc}`,
    { method: "DELETE" },
  );
  const data = await parseJsonSafe(response);
  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error(
      data?.message || data?.code || `Wishlist remove failed (${response.status})`,
    );
  }
  return data;
}
