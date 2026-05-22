const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.CLIENT_URL ||
  "https://maloeatelier.com";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
const LOCALES = ["ua", "en"];

async function fetchJson(path) {
  if (!API_URL || String(API_URL).trim() === "") {
    return null;
  }

  const base = String(API_URL).replace(/\/$/, "");
  try {
    const response = await fetch(`${base}${path}`);
    if (!response.ok) {
      return null;
    }
    return await response.json();
  } catch {
    return null;
  }
}

function categoryFullSlug(category) {
  if (!category || typeof category !== "object") {
    return "";
  }
  if (typeof category.fullSlug === "string" && category.fullSlug.trim()) {
    return category.fullSlug.trim();
  }
  if (Array.isArray(category.path) && category.path.length > 0) {
    return category.path.map(String).filter(Boolean).join("/");
  }
  if (typeof category.slug === "string" && category.slug.trim()) {
    return category.slug.trim();
  }
  return "";
}

function flattenCategories(items, out = []) {
  if (!Array.isArray(items)) {
    return out;
  }

  for (const item of items) {
    if (!item || typeof item !== "object") {
      continue;
    }
    out.push(item);
    flattenCategories(item.children || item.subcategories, out);
  }
  return out;
}

function localizedPaths(path) {
  return LOCALES.map((locale) => ({
    loc: `/${locale}${path === "/" ? "" : path}`,
  }));
}

async function getProductPaths() {
  const data = await fetchJson(
    "/catalog/cards?status=active&preview=true&includeOffers=preview&limit=5000",
  );
  const items = Array.isArray(data?.items) ? data.items : [];

  return items
    .map((item) => (typeof item?.slug === "string" ? item.slug.trim() : ""))
    .filter(Boolean)
    .flatMap((slug) => localizedPaths(`/product/${slug}`));
}

async function getCategoryPaths() {
  const data = await fetchJson("/catalog/categories/tree");
  const items = Array.isArray(data?.items)
    ? data.items
    : Array.isArray(data)
      ? data
      : [];

  return flattenCategories(items)
    .map(categoryFullSlug)
    .filter(Boolean)
    .flatMap((slug) => localizedPaths(`/categories/${slug}`));
}

const config = {
  siteUrl: SITE_URL,
  generateRobotsTxt: true,
  changefreq: "daily",
  sitemapSize: 5000,
  exclude: [
    "/admin/*",
    "/api/*",
    "/panel5587436/*",
    "/dashboard/*",
    "/placement/*",
    "/cart/*",
  ],
  additionalPaths: async () => {
    const staticPages = [
      "/",
      "/about-us",
      "/contacts",
      "/cooperation",
      "/payment-delivery",
      "/warranty-returns",
      "/categories/all",
    ].flatMap(localizedPaths);

    const [categoryPaths, productPaths] = await Promise.all([
      getCategoryPaths(),
      getProductPaths(),
    ]);

    return [...staticPages, ...categoryPaths, ...productPaths];
  },
};

module.exports = config;
