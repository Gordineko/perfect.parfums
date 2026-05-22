import { categoryNodeFullSlug } from "@shared";

export function sortCategoriesBySort(nodes) {
  const arr = Array.isArray(nodes) ? [...nodes] : [];
  return arr.sort((a, b) => {
    const sa =
      typeof a.sort === "number"
        ? a.sort
        : Number(a.sort) || 0;
    const sb =
      typeof b.sort === "number"
        ? b.sort
        : Number(b.sort) || 0;
    return sa - sb;
  });
}

export function findCategoryById(treeRoots, id) {
  const target = id != null ? String(id).trim() : "";
  if (!target) return null;

  function walk(nodes) {
    for (const n of nodes || []) {
      const nid =
        n?._id != null
          ? String(n._id)
          : n?.id != null
            ? String(n.id)
            : "";
      if (nid && nid === target) return n;
      const nested = walk(n.children);
      if (nested) return nested;
    }
    return null;
  }

  return walk(Array.isArray(treeRoots) ? treeRoots : []);
}

export function findCategoryByFullSlug(treeRoots, fullSlug) {
  const target = String(fullSlug || "")
    .trim()
    .replace(/^\/+|\/+$/g, "");
  if (!target || target === "all") return null;

  function walk(nodes) {
    for (const n of nodes || []) {
      const fs = categoryNodeFullSlug(n);
      if (fs === target) return n;
      const nested = walk(n.children);
      if (nested) return nested;
    }
    return null;
  }

  return walk(Array.isArray(treeRoots) ? treeRoots : []);
}

export function findCategoryAncestorChainBySlug(treeRoots, routeSlug) {
  const target = String(routeSlug || "")
    .trim()
    .replace(/^\/+|\/+$/g, "");
  if (!target || target === "all") {
    return null;
  }

  function walk(nodes, ancestorChain) {
    const sorted = sortCategoriesBySort(nodes || []);
    for (const n of sorted) {
      const fs = categoryNodeFullSlug(n);
      const chain = [...ancestorChain, n];
      if (fs === target) {
        return chain;
      }
      const children = n.children;
      if (Array.isArray(children) && children.length > 0) {
        const found = walk(children, chain);
        if (found) {
          return found;
        }
      }
    }
    return null;
  }

  return walk(Array.isArray(treeRoots) ? treeRoots : [], []);
}

export function categoryTreeDescendantsForFilter(
  treeRoots,
  options = {},
) {
  const anchor = options.anchorCategory ?? null;
  const out = [];

  function walk(node, depth) {
    if (!node) return;
    out.push({ category: node, depth });
    const children = sortCategoriesBySort(node.children);
    for (const child of children) {
      walk(child, depth + 1);
    }
  }

  if (!anchor) {
    const roots = sortCategoriesBySort(
      Array.isArray(treeRoots) ? treeRoots : [],
    );
    for (const root of roots) {
      walk(root, 0);
    }
    return out;
  }

  const children = sortCategoriesBySort(anchor.children);
  for (const child of children) {
    walk(child, 0);
  }
  return out;
}

function bucketCategoryId(bucket) {
  if (!bucket || typeof bucket !== "object") {
    return null;
  }
  const v = bucket.value ?? bucket.key ?? bucket._id;
  if (v == null) {
    return null;
  }
  if (typeof v === "object") {
    const inner = v.value ?? v._id ?? v.id;
    return inner != null ? String(inner) : null;
  }
  return String(v);
}

function canonCategoryIdForMatch(id) {
  return String(id ?? "")
    .trim()
    .toLowerCase();
}

export function resolveCategoryFacetCount(filters, categoryId) {
  const buckets =
    filters?.facets?.categories?.buckets ??
    filters?.facets?.category?.buckets;
  if (!Array.isArray(buckets) || categoryId == null) {
    return null;
  }

  const idCanon = canonCategoryIdForMatch(categoryId);
  for (const b of buckets) {
    const sid = bucketCategoryId(b);
    if (sid == null) {
      continue;
    }
    if (canonCategoryIdForMatch(sid) !== idCanon) {
      continue;
    }
    const n = Number(b?.count ?? b?.doc_count ?? b?.docCount);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function categoryNodeProductCount(cat) {
  if (!cat || typeof cat !== "object") return null;
  const raw =
    cat.doc_count ??
    cat.docCount ??
    cat.count ??
    cat.productCount ??
    cat.productsCount ??
    cat.itemsCount ??
    null;
  if (raw == null) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}
