import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

function getAuthHeaders() {
  const token = Cookies.get("auth_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function cartFetch(url, init = {}) {
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

export function iamUserCartBaseUrl() {
  const trimmed = String(API_URL).replace(/\/$/, "");
  const custom = process.env.NEXT_PUBLIC_USER_CART_PATH;
  if (custom != null && String(custom).trim() !== "") {
    const p = String(custom).replace(/^\/+|\/+$/g, "");
    return `${trimmed}/${p}`;
  }
  if (/\/v\d+$/i.test(trimmed)) {
    return `${trimmed}/iam/user/cart`;
  }
  return `${trimmed}/v1/iam/user/cart`;
}

function userCartUrlWithoutIamPrefix() {
  const trimmed = String(API_URL).replace(/\/$/, "");
  if (/\/v\d+$/i.test(trimmed)) {
    return `${trimmed}/user/cart`;
  }
  return `${trimmed}/v1/user/cart`;
}

async function parseJsonSafe(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

export async function fetchIamUserCart() {
  const response = await cartFetch(iamUserCartBaseUrl(), { method: "GET" });
  if (!response.ok) {
    throw new Error("Cart fetch failed");
  }
  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

export async function postIamUserCartAdd(offerId, addQty) {
  const response = await cartFetch(iamUserCartBaseUrl(), {
    method: "POST",
    body: JSON.stringify({
      offerId: String(offerId),
      qty: Math.max(1, Math.floor(Number(addQty)) || 1),
    }),
  });
  const data = await parseJsonSafe(response);
  if (!response.ok) {
    throw new Error(
      data?.message || data?.code || `Cart add failed (${response.status})`,
    );
  }
  return data;
}

function serverQtyByOfferId(rawServerCart) {
  const map = new Map();
  if (!Array.isArray(rawServerCart)) {
    return map;
  }
  for (const row of rawServerCart) {
    const id =
      row?.offerId != null ? String(row.offerId).trim() : "";
    if (!id) {
      continue;
    }
    const q = Math.max(
      0,
      Math.floor(Number(row?.qty ?? row?.quantity ?? 0)) || 0,
    );
    map.set(id, Math.max(map.get(id) ?? 0, q));
  }
  return map;
}

export async function mergeGuestCartLinesWithPost(lines, serverRawCart) {
  if (!Array.isArray(lines) || lines.length === 0) {
    return { failed: [] };
  }

  const serverMap = serverQtyByOfferId(serverRawCart);
  const posts = [];

  for (const row of lines) {
    const offerId = String(row.offerId);
    const guestQty = Math.max(
      1,
      Math.floor(Number(row.qty)) || 1,
    );
    const serverQty = Math.max(
      0,
      Math.floor(Number(serverMap.get(offerId) ?? 0)) || 0,
    );
    const targetQty = Math.max(serverQty, guestQty);
    const delta = targetQty - serverQty;
    if (delta > 0) {
      posts.push({ offerId, delta });
    }
  }

  if (posts.length === 0) {
    return { failed: [] };
  }

  const results = await Promise.allSettled(
    posts.map((p) => postIamUserCartAdd(p.offerId, p.delta)),
  );

  const failed = [];
  results.forEach((r, i) => {
    if (r.status === "rejected") {
      failed.push({
        offerId: posts[i]?.offerId,
        reason: r.reason,
      });
    }
  });

  if (failed.length > 0) {
    console.warn(
      "[cart] guest merge: some POST /v1/iam/user/cart failed",
      failed.length,
      failed,
    );
  }

  return { failed };
}

export async function patchIamUserCartQty(offerId, qty) {
  const response = await cartFetch(iamUserCartBaseUrl(), {
    method: "PATCH",
    body: JSON.stringify({
      offerId: String(offerId),
      qty: Math.max(1, Math.floor(Number(qty)) || 1),
    }),
  });
  const data = await parseJsonSafe(response);
  if (!response.ok) {
    throw new Error(
      data?.message || data?.code || `Cart update failed (${response.status})`,
    );
  }
  return data;
}

export async function deleteIamUserCartLine(offerId) {
  const enc = encodeURIComponent(String(offerId));
  const primaryUrl = `${iamUserCartBaseUrl()}/${enc}`;
  const fallbackUrl = `${userCartUrlWithoutIamPrefix()}/${enc}`;

  let response = await cartFetch(primaryUrl, { method: "DELETE" });

  if (response.status === 404 && fallbackUrl !== primaryUrl) {
    response = await cartFetch(fallbackUrl, { method: "DELETE" });
  }

  const data = await parseJsonSafe(response);
  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error(
      data?.message || data?.code || `Cart remove failed (${response.status})`,
    );
  }
  return data;
}
