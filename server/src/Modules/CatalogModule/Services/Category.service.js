function toId(x) {
  return String(x);
}

function normalizePathStr(pathStr) {
  return String(pathStr || "").trim().replace(/^\/+|\/+$/g, "");
}

function getRootCategoryId(category) {
  if (!category) return null;
  if (!category.parentId) return category._id;
  return Array.isArray(category.ancestors) && category.ancestors.length
    ? category.ancestors[0]
    : category._id;
}

function mapCategoryNode(category, rootCategory) {
  const resolvedRoot = rootCategory || category;

  return {
    _id: category._id,
    parentId: category.parentId,
    slug: category.slug,
    title: category.title,
    description: category.description,
    variationTemplate: Array.isArray(category.variationTemplate) ? category.variationTemplate : [],
    path: category.path,
    fullSlug: category.fullSlug || (Array.isArray(category.path) ? category.path.join("/") : ""),
    ancestors: category.ancestors,
    level: category.level ?? (Array.isArray(category.ancestors) ? category.ancestors.length : 0),
    status: category.status,
    sort: category.sort,
    rootCategoryId: resolvedRoot?._id || category._id,
    rootCategoryTitle: resolvedRoot?.title || category.title,
    rootVariationTemplate: Array.isArray(resolvedRoot?.variationTemplate)
      ? resolvedRoot.variationTemplate
      : [],
    isVariationTemplateOwner:
      String(resolvedRoot?._id || category._id) === String(category._id),
  };
}

export function createCategoryService({ categoryRepo }) {
  return {
    // 1) дерево целиком
    async getTree({ status = "active" } = {}) {
      const all = await categoryRepo.listAll({ status });
      const childrenByParent = new Map();
      const categoryById = new Map();

      for (const c of all) {
        const pid = c.parentId ? toId(c.parentId) : null;
        if (!childrenByParent.has(pid)) childrenByParent.set(pid, []);
        childrenByParent.get(pid).push(c);
        categoryById.set(toId(c._id), c);
      }

      // сортировка детей в памяти
      for (const [k, arr] of childrenByParent.entries()) {
        arr.sort(
          (a, b) =>
            (a.sort ?? 0) - (b.sort ?? 0) ||
            (a.title?.ua || "").localeCompare(b.title?.ua || "")
        );
      }

      function buildNode(c) {
        const id = toId(c._id);
        const kids = childrenByParent.get(id) || [];
        const rootCategory = categoryById.get(toId(getRootCategoryId(c))) || c;
        return {
          ...mapCategoryNode(c, rootCategory),
          children: kids.map(buildNode),
        };
      }

      const roots = childrenByParent.get(null) || [];
      return roots.map(buildNode);
    },

    // 2) дети одного узла
    async getChildren({ parentId = null, status = "active" } = {}) {
      const items = !parentId
        ? await categoryRepo.listRoots({ status })
        : await categoryRepo.listChildren(parentId, { status });

      if (!items.length) return [];

      const rootIds = Array.from(
        new Set(items.map((item) => String(getRootCategoryId(item))))
      );
      const roots = await categoryRepo.listByIds(rootIds);
      const rootsById = new Map(roots.map((item) => [toId(item._id), item]));

      return items.map((item) => {
        const rootCategory = rootsById.get(toId(getRootCategoryId(item))) || item;
        return mapCategoryNode(item, rootCategory);
      });
    },

    // 3) хлебные крошки: ancestors + self
    async getBreadcrumbs({ categoryId }) {
      const cat = await categoryRepo.getById(categoryId);
      if (!cat) return [];

      const ids = [...(cat.ancestors || []), cat._id];
      const list = await categoryRepo.listByIds(ids);

      const byId = new Map(list.map((x) => [toId(x._id), x]));
      const rootCategory = byId.get(toId(getRootCategoryId(cat))) || cat;
      return ids
        .map((id) => byId.get(toId(id)))
        .filter(Boolean)
        .map((item) => mapCategoryNode(item, rootCategory));
    },

    // ✅ NEW: получить категорию по path string (skin-structure/cleansing/foam)
    async getByPath({ path, status = "active" } = {}) {
      const clean = normalizePathStr(path);
      if (!clean) return null;

      const category = await categoryRepo.getByPathString(clean, { status });
      if (!category) return null;

      const rootCategoryId = getRootCategoryId(category);
      const rootCategory =
        String(rootCategoryId) === String(category._id)
          ? category
          : await categoryRepo.getById(rootCategoryId);

      return mapCategoryNode(category, rootCategory || category);
    },

    // ✅ NEW: получить категорию по fullSlug
    async getByFullSlug({ fullSlug, status = "active" } = {}) {
      const clean = normalizePathStr(fullSlug);
      if (!clean) return null;

      const category = await categoryRepo.getByFullSlug(clean, { status });
      if (!category) return null;

      const rootCategoryId = getRootCategoryId(category);
      const rootCategory =
        String(rootCategoryId) === String(category._id)
          ? category
          : await categoryRepo.getById(rootCategoryId);

      return mapCategoryNode(category, rootCategory || category);
    },

    // ✅ NEW: subtree по path (узел + children рекурсивно)
    async getSubtreeByPath({ path, status = "active" } = {}) {
      const root = await this.getByPath({ path, status });
      if (!root) return null;

      // получаем ВСЕХ потомков одним запросом (через ancestors)
      const descendantsIds = await categoryRepo.getDescendantIds(root._id, {
        includeSelf: true,
        status,
      });

      // вытаскиваем все категории ветки
      const branch = await categoryRepo.listByIds(descendantsIds);

      // строим дерево в памяти
      const childrenByParent = new Map();
      for (const c of branch) {
        const pid = c.parentId ? toId(c.parentId) : null;
        if (!childrenByParent.has(pid)) childrenByParent.set(pid, []);
        childrenByParent.get(pid).push(c);
      }

      for (const [k, arr] of childrenByParent.entries()) {
        arr.sort(
          (a, b) =>
            (a.sort ?? 0) - (b.sort ?? 0) ||
            (a.title?.ua || "").localeCompare(b.title?.ua || "")
        );
      }

      function buildNode(c) {
        const id = toId(c._id);
        const kids = childrenByParent.get(id) || [];
        const rootCategory = branch.find((item) => String(item._id) === String(getRootCategoryId(c))) || c;
        return {
          ...mapCategoryNode(c, rootCategory),
          children: kids.map(buildNode),
        };
      }

      return buildNode(root);
    },
  };
}