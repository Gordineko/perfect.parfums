import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export const reviewsApiBaseUrl = String(API_URL).replace(/\/$/, "");

function getAuthHeaders() {
  const token = Cookies.get("auth_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function parseJsonSafe(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

function reviewsPublicProductUrl(productId, limit) {
  return `${reviewsApiBaseUrl}/reviews/public/product/${encodeURIComponent(productId)}?limit=${limit}`;
}

export async function fetchProductReviews(productId, options = {}) {
  const id = productId != null ? String(productId).trim() : "";
  if (!id) {
    return [];
  }

  const rawLimit = options.limit != null ? Number(options.limit) : 20;
  const limit = Math.min(
    100,
    Math.max(
      1,
      Number.isFinite(rawLimit) ? Math.floor(rawLimit) : 20,
    ),
  );

  const response = await fetch(reviewsPublicProductUrl(id, limit), {
    method: "GET",
    credentials: "include",
    headers: getAuthHeaders(),
  });

  const data = await parseJsonSafe(response);

  if (!response.ok) {
    const message =
      (typeof data?.message === "string" && data.message) ||
      `Failed to fetch reviews (${response.status})`;
    throw new Error(message);
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }
  if (Array.isArray(data)) {
    return data;
  }
  return [];
}

export async function createReview(reviewData) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/reviews`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reviewData),
      },
    );

    if (!response.ok) {
      throw new Error("Failed to create review");
    }

    const data = await response.json();

    return data;
  } catch (e) {
    console.error("Error creating review:", e);
    throw e;
  }
}
