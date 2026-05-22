import {
  categoryNodeFullSlug,
  categoryTreeItemHref,
  pickLocalizedString,
} from "@shared";
import {
  getCategoryBreadcrumbs,
} from "@shared/api/categoryServices";

import {
  findCategoryAncestorChainBySlug,
  findCategoryById,
} from "./categoryTreeFlatten";

function pickCategoryLabel(cat, locale) {
  if (!cat || typeof cat !== "object") {
    return "";
  }
  const fromTitle = pickLocalizedString(cat.title, locale);
  if (fromTitle && String(fromTitle).trim()) {
    return String(fromTitle).trim();
  }
  if (typeof cat.slug === "string" && cat.slug.trim()) {
    return cat.slug.trim();
  }
  return "";
}

export function mapCategoriesToBreadcrumbItems(
  categories,
  locale,
  { omitLastPath = false } = {},
) {
  const list = Array.isArray(categories) ? categories : [];
  const out = [];
  for (let i = 0; i < list.length; i++) {
    const cat = list[i];
    const label = pickCategoryLabel(cat, locale);
    if (!label) {
      continue;
    }
    const isLast = i === list.length - 1;
    const path =
      omitLastPath && isLast
        ? undefined
        : categoryTreeItemHref(locale, cat);
    out.push(path ? { label, path } : { label });
  }
  return out;
}

export async function resolveCatalogPageBreadcrumbItems({
  categoryId,
  pathKey,
  treeRoots,
  locale,
}) {
  const id = categoryId != null ? String(categoryId).trim() : "";
  let slugKey = String(pathKey || "")
    .trim()
    .replace(/^\/+|\/+$/g, "");

  if ((!slugKey || slugKey === "all") && id) {
    const anchor = findCategoryById(treeRoots, id);
    const fs = categoryNodeFullSlug(anchor);
    if (fs) {
      slugKey = fs;
    }
  }

  if (id) {
    const { items } = await getCategoryBreadcrumbs(id);
    if (Array.isArray(items) && items.length > 0) {
      const mapped = mapCategoriesToBreadcrumbItems(items, locale, {
        omitLastPath: true,
      });
      if (mapped.length) {
        return mapped;
      }
    }
  }

  if (!slugKey || slugKey === "all") {
    return null;
  }

  const chain = findCategoryAncestorChainBySlug(treeRoots, slugKey);
  if (chain && chain.length > 0) {
    return mapCategoriesToBreadcrumbItems(chain, locale, {
      omitLastPath: true,
    });
  }

  if (id) {
    const node = findCategoryById(treeRoots, id);
    if (node) {
      const label = pickCategoryLabel(node, locale);
      if (label) {
        return [{ label, path: categoryTreeItemHref(locale, node) }];
      }
    }
  }

  return null;
}

function listCategoryIdCandidatesForProduct(product) {
  if (!product || typeof product !== "object") {
    return [];
  }
  const out = [];
  const seen = new Set();
  const push = (raw) => {
    const s = raw != null ? String(raw).trim() : "";
    if (!s || seen.has(s)) return;
    seen.add(s);
    out.push(s);
  };

  const sub =
    product.subcategory ??
    product.subCategory ??
    product.sub_category;
  const cat = product.category ?? product.parentCategory;
  const subObj = sub && typeof sub === "object" ? sub : null;
  const subId =
    subObj?._id != null
      ? String(subObj._id)
      : product.subCategoryId != null
        ? String(product.subCategoryId)
        : product.subcategoryId != null
          ? String(product.subcategoryId)
          : null;
  if (subId && subId.trim()) {
    push(subId.trim());
  }

  const rawCat = Array.isArray(cat) ? cat[0] : cat;
  const catObj = rawCat && typeof rawCat === "object" ? rawCat : null;
  if (catObj?._id != null) {
    push(String(catObj._id));
  }
  if (product.categoryId != null) {
    push(String(product.categoryId));
  }
  if (product.parentCategoryId != null) {
    push(String(product.parentCategoryId));
  }

  const catIds = product.categoryIds ?? product.category_ids;
  if (Array.isArray(catIds) && catIds.length > 0) {
    for (let i = catIds.length - 1; i >= 0; i -= 1) {
      push(catIds[i]);
    }
  }

  return out;
}

export async function resolvePdpBreadcrumbItems({
  product,
  locale,
  treeRoots,
  productLabel,
  catalogFallbackLabel,
}) {
  const candidateIds = listCategoryIdCandidatesForProduct(product);
  const safeProductLabel =
    typeof productLabel === "string" && productLabel.trim()
      ? productLabel.trim()
      : "—";

  for (const cid of candidateIds) {
    const { items } = await getCategoryBreadcrumbs(cid);
    if (Array.isArray(items) && items.length > 0) {
      const mapped = mapCategoriesToBreadcrumbItems(items, locale, {
        omitLastPath: false,
      });
      if (mapped.length) {
        return [...mapped, { label: safeProductLabel }];
      }
    }
  }

  const roots = treeRoots?.items ?? treeRoots ?? [];
  for (const cid of candidateIds) {
    const node = findCategoryById(roots, cid);
    if (node) {
      const label = pickCategoryLabel(node, locale);
      if (label) {
        return [
          {
            label: catalogFallbackLabel,
            path: `/${locale}/categories/all`,
          },
          {
            label,
            path: categoryTreeItemHref(locale, node),
          },
          { label: safeProductLabel },
        ];
      }
    }
  }

  const rawCategory = product?.category ?? product?.parentCategory;
  const categoryFromProduct = Array.isArray(rawCategory)
    ? rawCategory[0]
    : rawCategory;

  const pick = (v) => {
    if (v == null) return null;
    if (typeof v === "string" || typeof v === "number") {
      const s = String(v).trim();
      return s.length ? s : null;
    }
    if (typeof v === "object") {
      const t =
        v[locale] ?? v.ua ?? v.uk ?? v.en ?? v.name ?? v.title;
      const s = String(t ?? "").trim();
      return s.length ? s : null;
    }
    return null;
  };

  const titleFromDoc = pickLocalizedString(
    categoryFromProduct?.title,
    locale,
  );
  const title =
    (titleFromDoc && String(titleFromDoc).trim()) ||
    pick(categoryFromProduct?.name) ||
    pick(product?.categoryTitle);

  const pathFromDoc = categoryNodeFullSlug(categoryFromProduct);
  const slug =
    (pathFromDoc && String(pathFromDoc).trim()) ||
    pick(categoryFromProduct?.slug) ||
    pick(product?.categorySlug) ||
    pick(product?.parentCategorySlug);

  if (title && slug) {
    const pathSlug = String(slug).replace(/^\/+|\/+$/g, "");
    return [
      {
        label: catalogFallbackLabel,
        path: `/${locale}/categories/all`,
      },
      {
        label: title,
        path: `/${locale}/categories/${pathSlug}`,
      },
      { label: safeProductLabel },
    ];
  }

  return [
    {
      label: catalogFallbackLabel,
      path: `/${locale}/categories/all`,
    },
    { label: safeProductLabel },
  ];
}
