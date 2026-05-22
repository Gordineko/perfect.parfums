// Repos/Offer.repo.js
import { canonicalizeOfferCharacteristicValue, mergeOfferCharacteristicBuckets } from "../utils/offerCharacteristicCanonicalization.js";

function buildOfferMatch({ groupIds, onlyAvailable, priceMin, priceMax }) {
  const match = { groupId: { $in: groupIds } };
  if (onlyAvailable) match.available = true;

  if (priceMin != null || priceMax != null) {
    match.price = {};
    if (priceMin != null) match.price.$gte = Number(priceMin);
    if (priceMax != null) match.price.$lte = Number(priceMax);
  }
  return match;
}

function buildOptMatch(optAxisFilter) {
  const match = {};
  if (!optAxisFilter || typeof optAxisFilter !== "object") return match;

  for (const [axisId, rawValue] of Object.entries(optAxisFilter)) {
    if (!axisId) continue;

    const fieldPath = `optionMap.${axisId}`;

    if (Array.isArray(rawValue)) {
      const values = rawValue.filter((value) => value !== undefined && value !== null);
      if (!values.length) continue;
      match[fieldPath] = { $in: values };
      continue;
    }

    if (rawValue === undefined || rawValue === null) continue;
    match[fieldPath] = rawValue;
  }

  return match;
}

function omitOptAxis(optAxisFilter, axisIdToSkip) {
  if (!optAxisFilter || typeof optAxisFilter !== "object") return null;
  const out = {};
  for (const [axisId, value] of Object.entries(optAxisFilter)) {
    if (axisId === axisIdToSkip) continue;
    out[axisId] = value;
  }
  return Object.keys(out).length ? out : null;
}

function buildCharacteristicScalarProjection(path) {
  return {
    $cond: [
      {
        $and: [
          { $ne: [path, null] },
          { $eq: [{ $type: path }, "object"] },
        ],
      },
      `${path}.value`,
      path,
    ],
  };
}


export function createOfferRepo({ Offer }) {
  return {
    async listByGroup(groupId) {
      return Offer.find({ groupId }).sort({ available: -1, price: 1, _id: 1 }).lean();
    },

    async findByGroupAndOptionKey(groupId, optionKey) {
      return Offer.findOne({ groupId, optionKey }).lean();
    },

    async findByGroupAndOptionValues(groupId, optionValues) {
      const key = Array.isArray(optionValues) ? optionValues.map(String).join("|") : "";
      if (!key) return null;
      return Offer.findOne({ groupId, optionKey: key }).lean();
    },

    // ✅ ВАЖНО: получить universe groupIds по offer-фильтрам (offerChar + opt + price + available)
    async getMatchedGroupIdsByOfferFilters({
      baseGroupIds,          // groupIds из groupFilter (категория/поиск)
      onlyAvailable = false,
      priceMin = null,
      priceMax = null,
      optAxisFilter = null,
      offerCharMatch = null, // из buildOfferCharMatch()
    }) {
      const offerMatch = buildOfferMatch({
        groupIds: baseGroupIds,
        onlyAvailable,
        priceMin,
        priceMax,
      });

      const optMatch = buildOptMatch(optAxisFilter);
      const matchStage = { $match: { ...offerMatch, ...optMatch, ...(offerCharMatch || {}) } };

      const rows = await Offer.aggregate([
        matchStage,
        { $group: { _id: "$groupId" } },
      ]);

      return rows.map((r) => r._id);
    },

    async aggregateCatalogInfo({
  groupIds,
  enabledPreview,
  depth,
  maxValuesPerAxis,
  includeOffers,
  maxOffersPerGroup,
  onlyAvailable = false,
  priceMin = null,
  priceMax = null,
  optAxisFilter = null,
  offerCharMatch = null,
  preferMatchedOfferImage = false,
}) {
  const wantBestOffer = includeOffers === "preview";
  const wantAllOffers = includeOffers === "all";
  const wantAnyOffers = wantBestOffer || wantAllOffers;
  const safeMaxOffersPerGroup = Math.max(
    1,
    Math.min(500, maxOffersPerGroup ?? 80)
  );

  const offerMatch = buildOfferMatch({
    groupIds,
    onlyAvailable,
    priceMin,
    priceMax,
  });

  const optMatch = buildOptMatch(optAxisFilter);

  const rootStage = {
    $match: {
      ...offerMatch,
      ...optMatch,
      ...(offerCharMatch || {}),
    },
  };

  return Offer.aggregate([
    rootStage,

    // считаем totalStockPerOffer для каждого оффера
    {
      $addFields: {
        totalStockPerOffer: {
          $sum: {
            $map: {
              input: { $ifNull: ["$stocks", []] },
              as: "stock",
              in: {
                $max: [
                  {
                    $subtract: [
                      { $ifNull: ["$$stock.onHand", 0] },
                      { $ifNull: ["$$stock.reserved", 0] },
                    ],
                  },
                  0,
                ],
              },
            },
          },
        },
      },
    },

    {
      $group: {
        _id: "$groupId",
        minPrice: { $min: "$price" },
        maxPrice: { $max: "$price" },
        variantsCount: { $sum: 1 },
        hasAvailable: { $max: { $cond: ["$available", 1, 0] } },
        totalStock: { $sum: "$totalStockPerOffer" },
      },
    },

    ...(enabledPreview && depth > 0
      ? [
          {
            $lookup: {
              from: Offer.collection.name,
              let: { gid: "$_id" },
              pipeline: [
                {
                  $match: {
                    ...offerMatch,
                    ...optMatch,
                    ...(offerCharMatch || {}),
                    $expr: { $eq: ["$groupId", "$$gid"] },
                  },
                },
                { $unwind: { path: "$optionValues", includeArrayIndex: "axisIndex" } },
                { $match: { axisIndex: { $lt: depth } } },
                { $group: { _id: { axisIndex: "$axisIndex", value: "$optionValues" } } },
                { $group: { _id: "$_id.axisIndex", values: { $push: "$_id.value" } } },
                {
                  $project: {
                    _id: 0,
                    axisIndex: "$_id",
                    values: { $slice: ["$values", maxValuesPerAxis] },
                  },
                },
              ],
              as: "variantPreviewAxes",
            },
          },
        ]
      : [{ $addFields: { variantPreviewAxes: [] } }]),

    ...(preferMatchedOfferImage
      ? [
          {
            $lookup: {
              from: Offer.collection.name,
              let: { gid: "$_id" },
              pipeline: [
                {
                  $match: {
                    ...offerMatch,
                    ...optMatch,
                    ...(offerCharMatch || {}),
                    $expr: { $eq: ["$groupId", "$$gid"] },
                  },
                },
                { $sort: { available: -1, price: 1, _id: 1 } },
                { $limit: 1 },
                { $project: { _id: 0, img: 1 } },
              ],
              as: "matchedImageOffer",
            },
          },
          {
            $addFields: {
              matchedImageURL: {
                $let: {
                  vars: { bestOffer: { $first: "$matchedImageOffer" } },
                  in: { $ifNull: ["$$bestOffer.img", null] },
                },
              },
            },
          },
        ]
      : [{ $addFields: { matchedImageURL: null } }]),

    ...(wantAnyOffers
      ? [
          {
            $lookup: {
              from: Offer.collection.name,
              let: { gid: "$_id" },
              pipeline: [
                {
                  $match: {
                    ...offerMatch,
                    ...optMatch,
                    ...(offerCharMatch || {}),
                    $expr: { $eq: ["$groupId", "$$gid"] },
                  },
                },
                {
                  $addFields: {
                    totalStock: {
                      $sum: {
                        $map: {
                          input: { $ifNull: ["$stocks", []] },
                          as: "stock",
                          in: {
                            $max: [
                              {
                                $subtract: [
                                  { $ifNull: ["$$stock.onHand", 0] },
                                  { $ifNull: ["$$stock.reserved", 0] },
                                ],
                              },
                              0,
                            ],
                          },
                        },
                      },
                    },
                  },
                },
                { $sort: { available: -1, price: 1, _id: 1 } },
                { $limit: wantBestOffer ? 1 : safeMaxOffersPerGroup },
                {
                  $project: {
                    _id: 1,
                    groupId: 1,
                    sku: 1,
                    price: 1,
                    effectivePrice: 1,
                    opt_price: 1,
                    discount: 1,
                    discountUAH: 1,
                    discountType: 1,
                    available: 1,
                    img: 1,
                    optionValues: 1,
                    optionKey: 1,
                    characteristics: 1,
                    totalStock: 1,
                  },
                },
              ],
              as: "offers",
            },
          },
        ]
      : [{ $addFields: { offers: [] } }]),

    {
      $project: {
        _id: 1,
        minPrice: 1,
        maxPrice: 1,
        variantsCount: 1,
        hasAvailable: 1,
        totalStock: 1,
        matchedImageURL: 1,
        variantPreviewAxes: 1,
        offers: 1,
      },
    },
  ]);
},

    async aggregateOfferFacets({
      groupIds,
      onlyAvailable = false,
      priceMin = null,
      priceMax = null,
      optAxisFilter = null,
      axisIds = [],
      offerCharMatch = null,
    }) {
      const offerMatch = buildOfferMatch({ groupIds, onlyAvailable, priceMin, priceMax });

      // ===== pricing: учитывает ВСЕ opt-фильтры =====
      const fullOptMatch = buildOptMatch(optAxisFilter);
      const pricingMatchStage = {
        $match: { ...offerMatch, ...fullOptMatch, ...(offerCharMatch || {}) },
      };

      // ===== axis facets (sticky): для каждой оси убираем её opt-фильтр =====
      const axisFacets = {};
      for (const axisId of axisIds || []) {
        const stickyOpt = omitOptAxis(optAxisFilter, axisId);
        const stickyOptMatch = buildOptMatch(stickyOpt);
        const axisMatchStage = {
          $match: { ...offerMatch, ...stickyOptMatch, ...(offerCharMatch || {}) },
        };

        axisFacets[`a_${axisId}`] = [
          axisMatchStage,
          { $project: { v: `$optionMap.${axisId}`, gid: "$groupId" } },
          { $group: { _id: { value: "$v", gid: "$gid" } } },
          { $group: { _id: "$_id.value", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          {
            $project: {
              _id: 0,
              value: { $ifNull: ["$_id", null] },
              count: 1,
            },
          },
        ];
      }

      const rows = await Offer.aggregate([
        {
          $facet: {
            pricing: [
              pricingMatchStage,
              { $group: { _id: null, min: { $min: "$price" }, max: { $max: "$price" } } },
            ],
            ...axisFacets,
          },
        },
      ]);

      const out = rows?.[0] || {};
      const pricing = out.pricing?.[0] || { min: null, max: null };

      const axisBuckets = (axisIds || []).map((axisId) => ({
        _id: axisId,
        buckets: (out[`a_${axisId}`] || []).map((r) => ({
          value: r.value ?? null,
          count: r.count ?? 0,
        })),
      }));

      return { pricing, axisBuckets };
    },

    // ✅ FACETS по Offer.characteristics (одним аггрегатом для всех keys)
    async aggregateOfferCharacteristicBuckets({ offerBaseMatch, allowedKeys }) {
      const keys = Array.isArray(allowedKeys) ? allowedKeys.filter(Boolean) : [];
      if (!keys.length) return [];

      const rows = await Offer.aggregate([
        { $match: offerBaseMatch },

        { $unwind: "$characteristics" },
        { $match: { "characteristics.key": { $in: keys } } },

        {
          $facet: {
            scalar: [
              { $match: { "characteristics.type": { $ne: "multiselect" } } },
              {
                $project: {
                  key: "$characteristics.key",
                  gid: "$groupId",
                  normValue: buildCharacteristicScalarProjection("$characteristics.value"),
                },
              },
            ],
            multi: [
              { $match: { "characteristics.type": "multiselect" } },
              { $unwind: "$characteristics.values" },
              {
                $project: {
                  key: "$characteristics.key",
                  gid: "$groupId",
                  normValue: buildCharacteristicScalarProjection("$characteristics.values"),
                },
              },
            ],
          },
        },

        { $project: { rows: { $concatArrays: ["$scalar", "$multi"] } } },
        { $unwind: "$rows" },
        { $replaceRoot: { newRoot: "$rows" } },

        { $match: { normValue: { $ne: null } } },

        { $group: { _id: { key: "$key", value: "$normValue", gid: "$gid" } } },
        { $group: { _id: { key: "$_id.key", value: "$_id.value" }, count: { $sum: 1 } } },
        { $group: { _id: "$_id.key", buckets: { $push: { value: "$_id.value", count: "$count" } } } },
        { $sort: { _id: 1 } },
      ]);

      return rows.map((row) => ({
        ...row,
        buckets: mergeOfferCharacteristicBuckets(row?._id, row?.buckets || []),
      }));
    },

    // ✅ sticky для одного offer-key (точно, но дороже)
    async aggregateOfferCharacteristicBucketsOneKey({ offerBaseMatch, key }) {
      const rows = await Offer.aggregate([
        { $match: offerBaseMatch },

        { $unwind: "$characteristics" },
        { $match: { "characteristics.key": key } },

        {
          $facet: {
            scalar: [
              { $match: { "characteristics.type": { $ne: "multiselect" } } },
              {
                $group: {
                  _id: {
                    value: buildCharacteristicScalarProjection("$characteristics.value"),
                    gid: "$groupId",
                  },
                },
              },
              {
                $group: {
                  _id: "$_id.value",
                  count: { $sum: 1 },
                },
              },
            ],
            multi: [
              { $match: { "characteristics.type": "multiselect" } },
              { $unwind: "$characteristics.values" },
              {
                $group: {
                  _id: {
                    value: buildCharacteristicScalarProjection("$characteristics.values"),
                    gid: "$groupId",
                  },
                },
              },
              {
                $group: {
                  _id: "$_id.value",
                  count: { $sum: 1 },
                },
              },
            ],
          },
        },

        { $project: { buckets: { $concatArrays: ["$scalar", "$multi"] } } },
      ]);

      const buckets = rows?.[0]?.buckets ?? [];
      return mergeOfferCharacteristicBuckets(
        key,
        buckets.map((x) => ({
          value: canonicalizeOfferCharacteristicValue(key, x._id ?? null),
          count: x.count ?? 0,
        }))
      );
    },
    async listOfferCharacteristicKeys({ offerBaseMatch }) {
      const rows = await Offer.aggregate([
        { $match: offerBaseMatch },
        { $unwind: "$characteristics" },
        { $group: { _id: "$characteristics.key" } },
        { $sort: { _id: 1 } },
      ]);
      return rows.map((r) => r._id).filter(Boolean);
    },

    /**
     * Пагинация групп, отсортированных по минимальной цене оффера.
     * Используется вместо findPage когда sort=price_asc/price_desc.
     */
    async paginateByMinPrice({
      groupIds,
      sortDir = 1,
      skip = 0,
      limit = 24,
      onlyAvailable = false,
      priceMin = null,
      priceMax = null,
      offerCharMatch = null,
      optAxisFilter = null,
    }) {
      if (!groupIds || !groupIds.length) return { sortedGroupIds: [], total: 0 };

      const offerMatch = buildOfferMatch({ groupIds, onlyAvailable, priceMin, priceMax });
      const optMatch = buildOptMatch(optAxisFilter);
      const matchStage = {
        $match: { ...offerMatch, ...optMatch, ...(offerCharMatch || {}) },
      };

      const [rows, countRows] = await Promise.all([
        Offer.aggregate([
          matchStage,
          { $group: { _id: "$groupId", minPrice: { $min: "$price" } } },
          { $sort: { minPrice: sortDir, _id: 1 } },
          { $skip: skip },
          { $limit: limit },
        ]),
        Offer.aggregate([
          matchStage,
          { $group: { _id: "$groupId" } },
          { $count: "total" },
        ]),
      ]);

      return {
        sortedGroupIds: rows.map((r) => r._id),
        total: countRows[0]?.total ?? 0,
      };
    },
  };
}