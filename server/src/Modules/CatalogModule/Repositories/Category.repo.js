export function createCategoryRepo({ Category }) {
  function normalizePath(pathStr) {
    return String(pathStr || "")
      .trim()
      .replace(/^\/+|\/+$/g, "");
  }

  function buildFullSlugQuery(pathStr, status = "active") {
    const clean = normalizePath(pathStr);
    if (!clean) return null;

    const pathArr = clean.split("/").filter(Boolean);
    return {
      ...(status ? { status } : {}),
      $or: [
        { fullSlug: clean },
        { fullSlug: { $in: ["", null] }, path: pathArr },
      ],
    };
  }

  return {
    async listRoots({ status = "active" } = {}) {
      return Category.find({ parentId: null, ...(status ? { status } : {}) })
        .sort({ sort: 1, "title.ua": 1, _id: 1 })
        .lean();
    },

    async listChildren(parentId, { status = "active" } = {}) {
      return Category.find({ parentId, ...(status ? { status } : {}) })
        .sort({ sort: 1, "title.ua": 1, _id: 1 })
        .lean();
    },

    async listByParentIds(parentIds = [], { status = "active" } = {}) {
      if (!Array.isArray(parentIds) || !parentIds.length) return [];
      return Category.find({
        parentId: { $in: parentIds },
        ...(status ? { status } : {}),
      })
        .sort({ sort: 1, "title.ua": 1, _id: 1 })
        .lean();
    },

    async getById(id) {
      return Category.findById(id).lean();
    },

    async listByIds(ids) {
      return Category.find({ _id: { $in: ids } }).lean();
    },

    async create(doc) {
      const created = await Category.create(doc);
      return Category.findById(created._id).lean();
    },

    async updateById(id, patch) {
      return Category.findByIdAndUpdate(id, patch, { new: true }).lean();
    },

    async deleteById(id) {
      return Category.findByIdAndDelete(id).lean();
    },

    async listAll({ status = "active" } = {}) {
      return Category.find(status ? { status } : {})
        .sort({ sort: 1, "title.ua": 1, _id: 1 })
        .lean();
    },

    async listDescendants(categoryId, { status = "active" } = {}) {
      return Category.find({
        ...(status ? { status } : {}),
        ancestors: categoryId,
      })
        .select({ _id: 1 })
        .lean();
    },

    async getDescendantIds(
      categoryId,
      { includeSelf = true, status = "active" } = {}
    ) {
      const base = await Category.findById(categoryId).select({ _id: 1 }).lean();
      if (!base) return [];

      const descendants = await Category.find({
        ...(status ? { status } : {}),
        ancestors: base._id,
      })
        .select({ _id: 1 })
        .lean();

      const ids = descendants.map((d) => d._id);
      return includeSelf ? [base._id, ...ids] : ids;
    },

    async getByFullSlug(fullSlug, { status = "active" } = {}) {
      const query = buildFullSlugQuery(fullSlug, status);
      if (!query) return null;
      return Category.findOne(query).lean();
    },

    async getByPathArray(pathArr, { status = "active" } = {}) {
      return Category.findOne({
        path: pathArr,
        ...(status ? { status } : {}),
      }).lean();
    },

    async getByPathString(pathStr, { status = "active" } = {}) {
      const query = buildFullSlugQuery(pathStr, status);
      if (!query) return null;
      return Category.findOne(query).lean();
    },

    async findByIds(ids = []) {
      if (!Array.isArray(ids) || !ids.length) return [];

      return Category.find(
        { _id: { $in: ids } },
        { _id: 1, title: 1, slug: 1, fullSlug: 1 }
      ).lean();
    },
  };
}