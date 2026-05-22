function normalizeCategoryTree(data) {
  if (data == null) {
    return { items: [] };
  }
  if (Array.isArray(data)) {
    return { items: data };
  }
  if (Array.isArray(data.items)) {
    return { items: data.items };
  }
  return { items: [] };
}

function normalizeBreadcrumbCategories(data) {
  const raw = data?.items;
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.filter(
    (x) =>
      x &&
      typeof x === "object" &&
      (typeof x.slug === "string" ||
        (Array.isArray(x.path) && x.path.length > 0) ||
        typeof x.fullSlug === "string"),
  );
}

async function fetchAllCategory() {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base || String(base).trim() === "") {
    console.warn(
      "getAllCategory: NEXT_PUBLIC_API_URL не задано — меню каталогу порожнє.",
    );
    return { items: [] };
  }

  const url = `${String(base).replace(/\/$/, "")}/catalog/categories/tree`;

  try {
    const response = await fetch(url, {
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      console.warn(
        "getAllCategory: відповідь не OK",
        response.status,
        response.statusText,
      );
      return { items: [] };
    }

    const data = await response.json();
    return normalizeCategoryTree(data);
  } catch (e) {
    console.warn(
      "getAllCategory: fetch не вдався (перевірте URL API і чи запущений бекенд):",
      e instanceof Error ? e.message : e,
    );
    return { items: [] };
  }
}

export const getAllCategory = fetchAllCategory;

async function fetchCategoryBreadcrumbs(categoryId) {
  const id = categoryId != null ? String(categoryId).trim() : "";
  if (!id) {
    return { items: [] };
  }

  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base || String(base).trim() === "") {
    console.warn(
      "getCategoryBreadcrumbs: NEXT_PUBLIC_API_URL не задано.",
    );
    return { items: [] };
  }

  const root = String(base).replace(/\/$/, "");
  const url = `${root}/catalog/categories/breadcrumbs?categoryId=${encodeURIComponent(id)}`;

  try {
    const response = await fetch(url, {
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      console.warn(
        "getCategoryBreadcrumbs: відповідь не OK",
        response.status,
        response.statusText,
      );
      return { items: [] };
    }

    const data = await response.json();
    const items = normalizeBreadcrumbCategories(data);
    return { items };
  } catch (e) {
    console.warn(
      "getCategoryBreadcrumbs: fetch не вдався:",
      e instanceof Error ? e.message : e,
    );
    return { items: [] };
  }
}

export const getCategoryBreadcrumbs = fetchCategoryBreadcrumbs;
