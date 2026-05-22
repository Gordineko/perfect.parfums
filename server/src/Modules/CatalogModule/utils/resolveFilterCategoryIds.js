import { parseCategoryIdsQueryParam } from "./query.js";

export async function resolveFilterCategoryIds({
  categoryRepo,
  categoryId = null,
  categoryInclude = "branch",
  categoryIdsParam = null,
}) {
  const selected = parseCategoryIdsQueryParam(categoryIdsParam);

  if (categoryId) {
    const branch =
      categoryInclude === "self"
        ? [String(categoryId)]
        : await categoryRepo.getDescendantIds(categoryId, {
            includeSelf: true,
            status: "active",
          });
    const branchNorm = branch.map(String);
    if (selected?.length) {
      const allowed = new Set(branchNorm);
      const inter = selected.filter((id) => allowed.has(String(id)));
      return inter.length ? inter : branchNorm;
    }
    return branchNorm;
  }

  if (selected?.length) return selected;
  return null;
}
