import { getAllProducts } from "@shared/api/productsServices";

export async function searchProducts(query, locale = "ua") {
  const q = String(query ?? "").trim();
  if (!q) return { items: [], meta: { total: 0 } };

  const data = await getAllProducts({ value: q }, undefined, locale);

  if (Array.isArray(data)) {
    throw new Error("Search request failed");
  }

  if (!data || typeof data !== "object") {
    return { items: [], meta: { total: 0 } };
  }

  const items = Array.isArray(data.items) ? data.items : [];
  const meta = data.meta && typeof data.meta === "object" ? data.meta : {};
  const total = Number.isFinite(meta.total) ? meta.total : items.length;

  return { items, meta: { ...meta, total } };
}
