function entrySaleSlug(entry) {
  if (!entry || typeof entry !== "object") {
    return "";
  }
  const raw = entry.slug ?? entry.fullSlug ?? "";
  return String(raw).trim().toLowerCase();
}

export function categoryIdsHasSale(group) {
  if (!group || typeof group !== "object") {
    return false;
  }

  const lists = [group.categories, group.categoryIds].filter(
    Array.isArray,
  );

  for (const list of lists) {
    const hit = list.some((entry) => {
      const s = entrySaleSlug(entry);
      if (s === "sale") {
        return true;
      }
      if (s.includes("/")) {
        return s.split("/").some((part) => part === "sale");
      }
      return false;
    });
    if (hit) {
      return true;
    }
  }

  return false;
}
