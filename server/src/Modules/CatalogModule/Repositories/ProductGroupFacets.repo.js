export function createProductGroupFacetsRepo({ ProductGroup }) {
  return {
    async aggregateCharacteristicBuckets({ groupFilter, allowedKeys }) {
      const keys = Array.isArray(allowedKeys) ? allowedKeys.filter(Boolean) : [];

      if (!keys.length) return [];

      const rows = await ProductGroup.aggregate([
        { $match: groupFilter },

        { $unwind: "$characteristics" },
        { $match: { "characteristics.key": { $in: keys } } },

        // нормализуем к одному полю "normValue"
        {
          $project: {
            key: "$characteristics.key",
            type: "$characteristics.type",
            value: "$characteristics.value",
            values: "$characteristics.values",
          },
        },

        // делаем единый поток: scalar -> normValue=value, multiselect -> normValue из values[]
        {
          $facet: {
            scalar: [
              { $match: { type: { $ne: "multiselect" } } },
              { $project: { key: 1, normValue: "$value" } },
            ],
            multi: [
              { $match: { type: "multiselect" } },
              { $unwind: "$values" },
              { $project: { key: 1, normValue: "$values" } },
            ],
          },
        },

        { $project: { rows: { $concatArrays: ["$scalar", "$multi"] } } },
        { $unwind: "$rows" },
        { $replaceRoot: { newRoot: "$rows" } },

        // убираем пустые значения
        { $match: { normValue: { $ne: null } } },

        // считаем buckets: (key, value) -> count
        {
          $group: {
            _id: { key: "$key", value: "$normValue" },
            count: { $sum: 1 },
          },
        },

        // собираем buckets по key
        {
          $group: {
            _id: "$_id.key",
            buckets: { $push: { value: "$_id.value", count: "$count" } },
          },
        },

        { $sort: { _id: 1 } },
      ]);

      return rows;
    },

    async aggregateCharacteristicBucketsOneKey({ groupFilter, key }) {
      const rows = await ProductGroup.aggregate([
        { $match: groupFilter },

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

      const buckets = rows?.[0]?.buckets ?? [];
      return buckets.map((x) => ({ value: x._id ?? null, count: x.count ?? 0 }));
    },

    async listCharacteristicKeys({ groupFilter }) {
      const rows = await ProductGroup.aggregate([
        { $match: groupFilter },
        { $unwind: "$characteristics" },
        { $group: { _id: "$characteristics.key" } },
        { $sort: { _id: 1 } },
      ]);
      return rows.map((r) => r._id).filter(Boolean);
    },

    /**
     * Sticky-режим одним запросом через $facet.
     * keyFilters: { [key]: groupFilter без этого ключа }
     * baseGroupFilter: общий фильтр без char-условий (для первичного $match)
     */
    async aggregateStickyBatch({ baseGroupFilter, keyFilters }) {
      const entries = Object.entries(keyFilters);
      if (!entries.length) return {};

      const facetBranches = {};

      for (const [key, gf] of entries) {
        // $facet не допускает точки и $ в именах ключей
        const safeKey = key.replace(/[.$]/g, "_");

        facetBranches[safeKey] = [
          { $match: gf },
          { $unwind: "$characteristics" },
          { $match: { "characteristics.key": key } },
          {
            $project: {
              // нормализуем scalar и multiselect в единый массив vals
              vals: {
                $cond: {
                  if: { $eq: ["$characteristics.type", "multiselect"] },
                  then: { $ifNull: ["$characteristics.values", []] },
                  else: [{ $ifNull: ["$characteristics.value", null] }],
                },
              },
            },
          },
          { $unwind: "$vals" },
          { $match: { vals: { $ne: null } } },
          { $group: { _id: "$vals", count: { $sum: 1 } } },
          { $project: { _id: 0, value: "$_id", count: 1 } },
        ];
      }

      const rows = await ProductGroup.aggregate([
        { $match: baseGroupFilter },
        { $facet: facetBranches },
      ]);

      const raw = rows[0] ?? {};
      const result = {};

      for (const [key] of entries) {
        const safeKey = key.replace(/[.$]/g, "_");
        result[key] = raw[safeKey] ?? [];
      }

      return result;
    },
  };
}
