import mongoose from "mongoose";
import { Offer } from "../Models/Offer.model.js";

function safeJsonParse(value, fallback = null) {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "object") return value;

  try {
    return JSON.parse(String(value));
  } catch {
    return fallback;
  }
}

function buildOfferAdminFilter({ available, priceMin, priceMax, opt, offerChar }) {
  const filter = {};

  if (available !== null && available !== undefined) {
    filter.available = available;
  }

  if (priceMin != null || priceMax != null) {
    filter.price = {};
    if (priceMin != null) filter.price.$gte = Number(priceMin);
    if (priceMax != null) filter.price.$lte = Number(priceMax);
  }

  const optObj = safeJsonParse(opt, null);
  if (optObj && typeof optObj === "object") {
    for (const [axisId, rawValue] of Object.entries(optObj)) {
      if (rawValue === undefined || rawValue === null || rawValue === "") continue;

      if (Array.isArray(rawValue)) {
        const arr = rawValue.filter((x) => x !== undefined && x !== null && x !== "");
        if (!arr.length) continue;
        filter[`optionMap.${axisId}`] = { $in: arr };
      } else {
        filter[`optionMap.${axisId}`] = rawValue;
      }
    }
  }

  const offerCharObj = safeJsonParse(offerChar, null);
  if (offerCharObj && typeof offerCharObj === "object") {
    const and = [];

    for (const [key, value] of Object.entries(offerCharObj)) {
      if (value === undefined || value === null) continue;

      if (Array.isArray(value)) {
        const arr = value.filter((x) => x !== undefined && x !== null);
        if (!arr.length) continue;

        and.push({
          $or: [
            { characteristics: { $elemMatch: { key, value: { $in: arr } } } },
            { characteristics: { $elemMatch: { key, "value.value": { $in: arr } } } },
            { characteristics: { $elemMatch: { key, values: { $in: arr } } } },
            { characteristics: { $elemMatch: { key, "values.value": { $in: arr } } } },
          ],
        });
      } else {
        and.push({
          $or: [
            { characteristics: { $elemMatch: { key, value } } },
            { characteristics: { $elemMatch: { key, "value.value": value } } },
            { characteristics: { $elemMatch: { key, values: value } } },
            { characteristics: { $elemMatch: { key, "values.value": value } } },
          ],
        });
      }
    }

    if (and.length) {
      filter.$and = [...(filter.$and || []), ...and];
    }
  }

  return filter;
}

export function createOfferWriteRepo() {
  return {
    async listByGroup(groupId) {
      return Offer.find({ groupId })
        .sort({ available: -1, price: 1, _id: 1 })
        .lean();
    },

    async findById(id) {
      return Offer.findById(id).lean();
    },

    async findBySku(sku) {
      return Offer.findOne({ sku }).lean();
    },

    async findPageByGroup(
      groupId,
      filter,
      {
        skip = 0,
        limit = 50,
        sort = { available: -1, _id: 1 },
        select = null,
      } = {}
    ) {
      const mongoFilter = {
        groupId: new mongoose.Types.ObjectId(String(groupId)),
        ...filter,
      };

      const query = Offer.find(mongoFilter)
        .sort(sort)
        .skip(skip)
        .limit(limit);

      if (select) {
        query.select(select);
      }

      const [items, total] = await Promise.all([
        query.lean(),
        Offer.countDocuments(mongoFilter),
      ]);

      return { items, total };
    },

    async listByGroupIds(
      groupIds = [],
      {
        available = null,
        priceMin = null,
        priceMax = null,
        opt = null,
        offerChar = null,
        sort = { groupId: 1, available: -1, _id: 1 },
        select = null,
      } = {}
    ) {
      if (!Array.isArray(groupIds) || !groupIds.length) return [];

      const offerFilter = buildOfferAdminFilter({
        available,
        priceMin,
        priceMax,
        opt,
        offerChar,
      });

      const mongoFilter = {
        groupId: { $in: groupIds },
        ...offerFilter,
      };

      const query = Offer.find(mongoFilter).sort(sort);
      if (select) query.select(select);

      return query.lean();
    },

    async create(doc) {
      const created = await Offer.create(doc);
      return created.toObject();
    },

    async updateById(id, patch) {
      return Offer.findByIdAndUpdate(id, patch, {
        new: true,
      }).lean();
    },

    async deleteById(id) {
      return Offer.deleteOne({ _id: id });
    },

    async bulkUpsert(groupId, offers) {
      if (!offers.length) {
        return { ok: 1, matchedCount: 0, modifiedCount: 0 };
      }

      const ops = offers.map((offer) => ({
        updateOne: {
          filter: offer._id
            ? { _id: offer._id, groupId }
            : { groupId, optionKey: offer.optionKey },
          update: {
            $set: {
              groupId,
              sku: offer.sku,
              price: offer.price,
              opt_price: offer.opt_price,
              available: offer.available,
              img: offer.img,
              optionMap: offer.optionMap,
              optionValues: offer.optionValues,
              optionKey: offer.optionKey,
              characteristics: offer.characteristics,
              stocks: offer.stocks,
            },
          },
          upsert: true,
        },
      }));

      return Offer.bulkWrite(ops);
    },

    async deleteManyByIds(ids) {
      if (!ids?.length) return { deletedCount: 0 };
      return Offer.deleteMany({ _id: { $in: ids } });
    },

    async deleteByGroupId(groupId) {
      return Offer.deleteMany({ groupId });
    },

    async findGroupIdsByAdminFilters({
      available = null,
      priceMin = null,
      priceMax = null,
      opt = null,
      offerChar = null,
    }) {
      const filter = buildOfferAdminFilter({
        available,
        priceMin,
        priceMax,
        opt,
        offerChar,
      });

      const rows = await Offer.aggregate([
        { $match: filter },
        { $group: { _id: "$groupId" } },
      ]);

      return rows.map((x) => x._id);
    },

    async aggregateAxes(groupIds = []) {
  if (!Array.isArray(groupIds) || !groupIds.length) return [];

  const rows = await Offer.aggregate([
    {
      $match: {
        groupId: { $in: groupIds },
      },
    },
    {
      $lookup: {
        from: "productgroups",
        localField: "groupId",
        foreignField: "_id",
        as: "group",
      },
    },
    { $unwind: "$group" },

    // optionMap -> [{k, v}]
    {
      $project: {
        variationAxes: { $ifNull: ["$group.variationAxes", []] },
        optionPairs: { $objectToArray: { $ifNull: ["$optionMap", {}] } },
      },
    },

    { $unwind: "$optionPairs" },

    // Находим axis meta по axisId
    {
      $project: {
        axisId: "$optionPairs.k",
        value: "$optionPairs.v",
        axisMeta: {
          $arrayElemAt: [
            {
              $filter: {
                input: "$variationAxes",
                as: "axis",
                cond: { $eq: ["$$axis.axisId", "$optionPairs.k"] },
              },
            },
            0,
          ],
        },
      },
    },

    {
      $match: {
        value: { $ne: null },
        axisMeta: { $ne: null },
      },
    },

    {
      $group: {
        _id: {
          axisId: "$axisId",
          value: "$value",
        },
        title: { $first: "$axisMeta.title" },
        type: { $first: "$axisMeta.type" },
        unit: { $first: "$axisMeta.unit" },
        count: { $sum: 1 },
      },
    },

    {
      $group: {
        _id: "$_id.axisId",
        title: { $first: "$title" },
        type: { $first: "$type" },
        unit: { $first: "$unit" },
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
        axisId: "$_id",
        title: 1,
        type: 1,
        unit: 1,
        values: 1,
      },
    },

    { $sort: { axisId: 1 } },
  ]);

  return rows;
},

    async aggregatePrice(groupIds = []) {
      if (!Array.isArray(groupIds) || !groupIds.length) {
        return { min: null, max: null };
      }

      const rows = await Offer.aggregate([
        {
          $match: {
            groupId: { $in: groupIds },
          },
        },
        {
          $group: {
            _id: null,
            min: { $min: "$price" },
            max: { $max: "$price" },
          },
        },
      ]);

      return rows?.[0]
        ? { min: rows[0].min ?? null, max: rows[0].max ?? null }
        : { min: null, max: null };
    },

    async aggregateOfferCharacteristicBuckets({ offerBaseMatch = {}, allowedKeys = null } = {}) {
      const pipeline = [
        { $match: offerBaseMatch },
        { $unwind: "$characteristics" },
      ];

      if (Array.isArray(allowedKeys) && allowedKeys.length) {
        pipeline.push({
          $match: {
            "characteristics.key": { $in: allowedKeys },
          },
        });
      }

      pipeline.push(
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
        { $sort: { key: 1 } }
      );

      return Offer.aggregate(pipeline);
    },
  };
}