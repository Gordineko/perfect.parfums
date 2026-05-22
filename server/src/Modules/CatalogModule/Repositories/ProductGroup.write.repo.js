import { ProductGroup } from "../Models/ProductGroup.model.js";

export function createProductGroupWriteRepo() {
  return {
    async findById(id) {
      return ProductGroup.findById(id).lean();
    },

    async findBySlug(slug) {
      return ProductGroup.findOne({ slug }).lean();
    },

    async findByCategoryIds(categoryIds = []) {
      if (!Array.isArray(categoryIds) || !categoryIds.length) {
        return [];
      }

      return ProductGroup.find({ categoryIds: { $in: categoryIds } })
        .select({ _id: 1, categoryIds: 1, variationAxes: 1 })
        .lean();
    },

    async create(doc) {
      const created = await ProductGroup.create(doc);
      return created.toObject();
    },

    async updateById(id, patch) {
      return ProductGroup.findByIdAndUpdate(id, patch, {
        new: true,
      }).lean();
    },

    async deleteById(id) {
      return ProductGroup.deleteOne({ _id: id });
    },

    async findAdminPage(filter, { skip = 0, limit = 20, sort = { updatedAt: -1, _id: 1 } }) {
      const [items, total] = await Promise.all([
        ProductGroup.find(filter)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .select({
            slug: 1,
            title: 1,
            subtitle: 1,
            status: 1,
            imageURL: 1,
            categoryIds: 1,
            updatedAt: 1,
            createdAt: 1,
          })
          .lean(),
        ProductGroup.countDocuments(filter),
      ]);

      return { items, total };
    },

    async findIdsWithAxes(filter) {
      return ProductGroup.find(filter)
        .select({
          _id: 1,
          variationAxes: 1,
        })
        .lean();
    },

    async findIds(filter) {
      const rows = await ProductGroup.find(filter)
        .select({ _id: 1 })
        .lean();

      return rows.map((x) => x._id);
    },
    async aggregateGroupCharacteristicBuckets(groupIds = []) {
  if (!Array.isArray(groupIds) || !groupIds.length) return [];

  const rows = await ProductGroup.aggregate([
    {
      $match: {
        _id: { $in: groupIds },
      },
    },
    { $unwind: "$characteristics" },
    {
      $facet: {
        scalar: [
          { $match: { "characteristics.type": { $ne: "multiselect" } } },
          {
            $project: {
              key: "$characteristics.key",
              value: {
                $ifNull: [
                  "$characteristics.value.value",
                  "$characteristics.value",
                ],
              },
            },
          },
        ],
        multi: [
          { $match: { "characteristics.type": "multiselect" } },
          { $unwind: "$characteristics.values" },
          {
            $project: {
              key: "$characteristics.key",
              value: {
                $ifNull: [
                  "$characteristics.values.value",
                  "$characteristics.values",
                ],
              },
            },
          },
        ],
      },
    },
    {
      $project: {
        rows: { $concatArrays: ["$scalar", "$multi"] },
      },
    },
    { $unwind: "$rows" },
    { $replaceRoot: { newRoot: "$rows" } },
    { $match: { value: { $ne: null } } },
    {
      $group: {
        _id: { key: "$key", value: "$value" },
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: "$_id.key",
        values: {
          $push: {
            value: "$_id.value",
            count: "$count",
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        key: "$_id",
        values: 1,
      },
    },
    { $sort: { key: 1 } },
  ]);

  return rows;
}
  };
}