import mongoose from "mongoose";
import { ProductGroup } from "../Models/ProductGroup.model.js";

export function createProductGroupRepo() {
  return {
    async findPage(filter, { skip, limit, sort }) {
      const [items, total] = await Promise.all([
        ProductGroup.find(filter).sort(sort).skip(skip).limit(limit).lean(),
        ProductGroup.countDocuments(filter),
      ]);
      return { items, total };
    },

    async findIds(filter) {
      const rows = await ProductGroup.find(filter).select({ _id: 1 }).lean();
      return rows.map((x) => x._id);
    },

    async findByIds(ids = []) {
      if (!ids || !ids.length) return [];
      return ProductGroup.find({ _id: { $in: ids } }).lean();
    },

    async findIdsWithAxes(filter) {
      return ProductGroup.find(filter).select({ _id: 1, variationAxes: 1 }).lean();
    },

    async aggregateCategoryIdCounts(groupIds = []) {
      const seen = new Set();
      const ids = [];
      for (const x of groupIds || []) {
        const s = String(x ?? "");
        if (!mongoose.Types.ObjectId.isValid(s) || seen.has(s)) continue;
        seen.add(s);
        ids.push(new mongoose.Types.ObjectId(s));
      }
      if (!ids.length) return [];

      const rows = await ProductGroup.aggregate([
        { $match: { _id: { $in: ids } } },
        {
          $unwind: {
            path: "$categoryIds",
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $group: {
            _id: "$categoryIds",
            count: { $sum: 1 },
          },
        },
      ]);

      return rows.map((r) => ({
        value: String(r._id),
        count: Number(r.count) || 0,
      }));
    },

    async findBySlug(slug) {
      return ProductGroup.findOne({ slug })
        .populate({
          path: "reviews",
          options: { sort: { createdAt: -1 } },
        })
        .lean();
    },

    async getFacetUniverse(groupIds) {
      const rows = await ProductGroup.aggregate([
        { $match: { _id: { $in: groupIds } } },
        {
          $project: {
            axesIds: {
              $map: {
                input: { $ifNull: ["$variationAxes", []] },
                as: "a",
                in: "$$a.axisId",
              },
            },
            charKeys: {
              $map: {
                input: { $ifNull: ["$characteristics", []] },
                as: "c",
                in: "$$c.key",
              },
            },
          },
        },
        {
          $group: {
            _id: null,
            axesIds: { $addToSet: "$axesIds" },
            charKeys: { $addToSet: "$charKeys" },
          },
        },
        {
          $project: {
            _id: 0,
            axesIds: {
              $reduce: {
                input: "$axesIds",
                initialValue: [],
                in: { $setUnion: ["$$value", "$$this"] },
              },
            },
            charKeys: {
              $reduce: {
                input: "$charKeys",
                initialValue: [],
                in: { $setUnion: ["$$value", "$$this"] },
              },
            },
          },
        },
      ]);

      return {
        axesIds: rows?.[0]?.axesIds ?? [],
        charKeys: rows?.[0]?.charKeys ?? [],
      };
    },

    async aggregateCharacteristicBuckets({ groupIds, key, charObj }) {
      const matchChar = buildCharMatchPipeline(charObj);

      const res = await ProductGroup.aggregate([
        { $match: { _id: { $in: groupIds } } },
        ...(matchChar.length ? matchChar : []),

        { $unwind: "$characteristics" },
        { $match: { "characteristics.key": key } },

        {
          $project: {
            type: "$characteristics.type",
            value: "$characteristics.value",
            values: "$characteristics.values",
          },
        },
        {
          $facet: {
            scalar: [
              { $match: { type: { $ne: "multiselect" } } },
              { $group: { _id: "$value", count: { $sum: 1 } } },
            ],
            multi: [
              { $match: { type: "multiselect" } },
              { $unwind: "$values" },
              { $group: { _id: "$values", count: { $sum: 1 } } },
            ],
          },
        },
        { $project: { buckets: { $concatArrays: ["$scalar", "$multi"] } } },
      ]);

      const buckets = res?.[0]?.buckets ?? [];
      return buckets
        .map((x) => ({ value: x._id ?? null, count: x.count ?? 0 }))
        .sort((a, b) => (b.count ?? 0) - (a.count ?? 0));
    },
  };
}

function buildCharMatchPipeline(charObj) {
  if (!charObj || typeof charObj !== "object") return [];

  const and = [];

  for (const [key, raw] of Object.entries(charObj)) {
    if (raw === undefined || raw === null) continue;

    if (Array.isArray(raw)) {
      and.push({
        $or: [
          { characteristics: { $elemMatch: { key, "value.value": { $in: raw } } } },
          { characteristics: { $elemMatch: { key, "values.value": { $in: raw } } } },
        ],
      });
    } else {
      and.push({
        $or: [
          { characteristics: { $elemMatch: { key, "value.value": raw } } },
          { characteristics: { $elemMatch: { key, "values.value": raw } } },
        ],
      });
    }
  }

  return and.length ? [{ $match: { $and: and } }] : [];
}