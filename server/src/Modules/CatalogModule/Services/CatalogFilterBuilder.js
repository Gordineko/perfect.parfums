// Services/CatalogFilterBuilder.js
import mongoose from "mongoose";
import { safeJsonParse, escapeRegex } from "../utils/query.js";
import { expandOfferCharacteristicFilterValues } from "../utils/offerCharacteristicCanonicalization.js";

const NUMERIC_OFFER_CHAR_KEYS = new Set(["heelHeight", "insoleSize"]);

function toFiniteNumber(value) {
  const num = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(num) ? num : null;
}

function expandOfferFilterValuesForMatch(key, rawValue) {
  const expanded = expandOfferCharacteristicFilterValues(key, rawValue);
  const result = new Set(
    expanded
      .filter((item) => item !== undefined && item !== null)
      .map((item) => (typeof item === "string" ? item.trim() : item))
      .filter((item) => item !== "")
  );

  if (NUMERIC_OFFER_CHAR_KEYS.has(key)) {
    for (const item of expanded) {
      const num = toFiniteNumber(item);
      if (num === null) continue;
      result.add(num);
      result.add(String(num));
    }
  }

  return [...result];
}

function extractCharacteristicKeyFromClause(clause) {
  if (!clause || typeof clause !== "object") return null;

  // прямой вариант
  const direct = clause?.characteristics?.$elemMatch?.key;
  if (direct) return direct;

  // вариант через $or
  if (Array.isArray(clause.$or)) {
    for (const item of clause.$or) {
      const key = item?.characteristics?.$elemMatch?.key;
      if (key) return key;
    }
  }

  return null;
}

export function buildGroupFilter({
  status = "active",
  categoryIds = null,
  q = null,
  charRaw = null,
  isPopular = false,
  isNew = false,
  isSale = false,
} = {}) {
  const groupFilter = {};

  if (status) groupFilter.status = status;

  if (Array.isArray(categoryIds) && categoryIds.length) {
    groupFilter.categoryIds = {
      $in: categoryIds.map((x) => new mongoose.Types.ObjectId(String(x))),
    };
  }

  if (q && String(q).trim()) {
    const rx = new RegExp(escapeRegex(String(q).trim()), "i");
    groupFilter.$or = [{ "title.ua": rx }, { "title.en": rx }];
  }

  const charObj =
    typeof charRaw === "string"
      ? safeJsonParse(charRaw, null)
      : charRaw;

    if (isPopular) groupFilter.isPopular = true;
    if (isSale) groupFilter.isSale = true;
    if (isNew) groupFilter.isNew = true;

  if (charObj && typeof charObj === "object") {
    const and = [];

    for (const [key, val] of Object.entries(charObj)) {
      if (val === undefined || val === null) continue;

      if (Array.isArray(val)) {
        const arr = val.filter((x) => x !== undefined && x !== null);
        if (!arr.length) continue;

        and.push({
          $or: [
            // старый multiselect
            {
              characteristics: {
                $elemMatch: {
                  key,
                  values: { $in: arr },
                },
              },
            },
            // новый multiselect
            {
              characteristics: {
                $elemMatch: {
                  key,
                  "values.value": { $in: arr },
                },
              },
            },
            // если select прислали массивом
            {
              characteristics: {
                $elemMatch: {
                  key,
                  value: { $in: arr },
                },
              },
            },
            {
              characteristics: {
                $elemMatch: {
                  key,
                  "value.value": { $in: arr },
                },
              },
            },
            
          ],
        });
      } else {
        and.push({
          $or: [
            // старый scalar
            {
              characteristics: {
                $elemMatch: {
                  key,
                  value: val,
                },
              },
            },
            // новый scalar
            {
              characteristics: {
                $elemMatch: {
                  key,
                  "value.value": val,
                },
              },
            },
            // на случай хранения одиночного значения в values
            {
              characteristics: {
                $elemMatch: {
                  key,
                  values: val,
                },
              },
            },
            {
              characteristics: {
                $elemMatch: {
                  key,
                  "values.value": val,
                },
              },
            },
          ],
        });
      }
    }

    if (and.length) {
      groupFilter.$and = [...(groupFilter.$and || []), ...and];
    }
  }

  return groupFilter;
}

export function omitCharKeyFromGroupFilter(groupFilter, omitKey) {
  if (!groupFilter || typeof groupFilter !== "object") return groupFilter;

  const and = Array.isArray(groupFilter.$and) ? groupFilter.$and : null;
  if (!and || !and.length) return groupFilter;

  const nextAnd = and.filter((clause) => {
    const key = extractCharacteristicKeyFromClause(clause);
    return key !== omitKey;
  });

  const next = { ...groupFilter };

  if (nextAnd.length) next.$and = nextAnd;
  else delete next.$and;

  return next;
}

// Offer-characteristics filter (mongo match для Offer)
export function buildOfferCharMatch(offerCharRaw) {
  const obj =
    typeof offerCharRaw === "string"
      ? safeJsonParse(offerCharRaw, null)
      : offerCharRaw;

  if (!obj || typeof obj !== "object") return {};

  const and = [];

  for (const [key, val] of Object.entries(obj)) {
    if (val === undefined || val === null) continue;

    if (Array.isArray(val)) {
      const arr = [
        ...new Set(
          val
            .filter((x) => x !== undefined && x !== null)
            .flatMap((item) => expandOfferFilterValuesForMatch(key, item))
        ),
      ];
      if (!arr.length) continue;

      and.push({
        $or: [
          {
            characteristics: {
              $elemMatch: { key, "value.value": { $in: arr } },
            },
          },
          {
            characteristics: {
              $elemMatch: { key, "values.value": { $in: arr } },
            },
          },
          // старый формат
          {
            characteristics: {
              $elemMatch: { key, value: { $in: arr } },
            },
          },
          {
            characteristics: {
              $elemMatch: { key, values: { $in: arr } },
            },
          },
        ],
      });
    } else {
      const arr = [...new Set(expandOfferFilterValuesForMatch(key, val))];
      if (!arr.length) continue;

      and.push({
        $or: [
          {
            characteristics: {
              $elemMatch: { key, "value.value": { $in: arr } },
            },
          },
          {
            characteristics: {
              $elemMatch: { key, "values.value": { $in: arr } },
            },
          },
          // старый формат
          {
            characteristics: {
              $elemMatch: { key, value: { $in: arr } },
            },
          },
          {
            characteristics: {
              $elemMatch: { key, values: { $in: arr } },
            },
          },
        ],
      });
    }
  }

  return and.length ? { $and: and } : {};
}

export function omitOfferCharKeyFromOfferMatch(offerMatch, omitKey) {
  if (!offerMatch || typeof offerMatch !== "object") return offerMatch;

  const and = Array.isArray(offerMatch.$and) ? offerMatch.$and : null;
  if (!and || !and.length) return offerMatch;

  const nextAnd = and.filter((clause) => {
    const key = extractCharacteristicKeyFromClause(clause);
    return key !== omitKey;
  });

  const next = { ...offerMatch };

  if (nextAnd.length) next.$and = nextAnd;
  else delete next.$and;

  return next;
}