import mongoose from "mongoose";
import { CharacteristicValueSchema } from "./ProductGroup.model.js";


const { Schema } = mongoose;

const OFFER_DISCOUNT_TYPES = new Set(["none", "percent", "amount"]);

function toFiniteNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function roundMoney(value) {
  return Math.round((toFiniteNumber(value, 0) + Number.EPSILON) * 100) / 100;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function hasOwn(obj, key) {
  return Boolean(obj) && Object.prototype.hasOwnProperty.call(obj, key);
}

function normalizeDiscountType(value) {
  return OFFER_DISCOUNT_TYPES.has(value) ? value : null;
}

function inferDiscountType(values = {}) {
  const explicitType = normalizeDiscountType(values.discountType);
  if (explicitType) return explicitType;

  const discount = Math.max(0, toFiniteNumber(values.discount, 0));
  const discountUAH = Math.max(0, toFiniteNumber(values.discountUAH, 0));

  if (discountUAH > 0 && discount <= 0) return "amount";
  if (discount > 0 && discountUAH <= 0) return "percent";
  if (discount <= 0 && discountUAH <= 0) return "none";

  return "percent";
}

export function syncOfferDiscountFields(values = {}, preferredType = null) {
  const price = Math.max(0, roundMoney(values.price));
  const discountType = normalizeDiscountType(preferredType) || inferDiscountType(values);

  let discount = 0;
  let discountUAH = 0;
  let effectivePrice = price;

  if (discountType === "amount") {
    discountUAH = clamp(roundMoney(values.discountUAH), 0, price);
    effectivePrice = clamp(roundMoney(price - discountUAH), 0, price);
  } else if (discountType === "percent") {
    discount = clamp(roundMoney(values.discount), 0, 100);
    effectivePrice = clamp(roundMoney(price * (1 - discount / 100)), 0, price);
  }

  return {
    price,
    discount,
    discountUAH,
    discountType:
      discount > 0 || discountUAH > 0
        ? discountType
        : "none",
    effectivePrice,
  };
}

function resolveDocumentDiscountType(doc) {
  if (doc.isModified("discountType")) {
    return normalizeDiscountType(doc.discountType);
  }

  if (doc.isModified("discount") && !doc.isModified("discountUAH")) {
    return toFiniteNumber(doc.discount, 0) > 0 ? "percent" : "none";
  }

  if (doc.isModified("discountUAH") && !doc.isModified("discount")) {
    return toFiniteNumber(doc.discountUAH, 0) > 0 ? "amount" : "none";
  }

  return normalizeDiscountType(doc.discountType);
}

async function syncOfferUpdatePayload(next) {
  const update = this.getUpdate() || {};
  const directEntries = Object.entries(update).filter(([key]) => !key.startsWith("$"));

  if (directEntries.length) {
    update.$set = {
      ...(update.$set || {}),
      ...Object.fromEntries(directEntries),
    };

    for (const [key] of directEntries) {
      delete update[key];
    }
  }

  const set = update.$set || {};
  const unset = update.$unset || {};
  const current = await this.model
    .findOne(this.getQuery())
    .select({ price: 1, discount: 1, discountUAH: 1, discountType: 1 })
    .lean();

  if (!current && !hasOwn(set, "price")) {
    this.setUpdate(update);
    next();
    return;
  }

  let preferredType = normalizeDiscountType(set.discountType);
  const touchesDiscount = hasOwn(set, "discount") || hasOwn(unset, "discount");
  const touchesAmount = hasOwn(set, "discountUAH") || hasOwn(unset, "discountUAH");

  if (!preferredType) {
    if (touchesDiscount && !touchesAmount) {
      preferredType = toFiniteNumber(set.discount, 0) > 0 ? "percent" : "none";
    } else if (touchesAmount && !touchesDiscount) {
      preferredType = toFiniteNumber(set.discountUAH, 0) > 0 ? "amount" : "none";
    } else {
      preferredType = normalizeDiscountType(current?.discountType);
    }
  }

  const synced = syncOfferDiscountFields(
    {
      price: hasOwn(set, "price")
        ? set.price
        : hasOwn(unset, "price")
          ? 0
          : current?.price,
      discount: hasOwn(set, "discount")
        ? set.discount
        : hasOwn(unset, "discount")
          ? 0
          : current?.discount,
      discountUAH: hasOwn(set, "discountUAH")
        ? set.discountUAH
        : hasOwn(unset, "discountUAH")
          ? 0
          : current?.discountUAH,
      discountType: preferredType || current?.discountType,
    },
    preferredType || current?.discountType
  );

  update.$set = {
    ...set,
    ...synced,
  };

  if (update.$unset) {
    delete update.$unset.discount;
    delete update.$unset.discountUAH;
    delete update.$unset.discountType;
    delete update.$unset.effectivePrice;

    if (!Object.keys(update.$unset).length) {
      delete update.$unset;
    }
  }

  this.setUpdate(update);
  next();
}

const WarehouseStockSchema = new Schema(
  {
    warehouseId: { type: Schema.Types.ObjectId, ref: "Warehouse", required: true },
    onHand: { type: Number, default: 0 },
    reserved: { type: Number, default: 0 },
    purchasePrice: { type: Number, default: 0 },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const OfferSchema = new Schema(
  {
    groupId: { type: Schema.Types.ObjectId, ref: "ProductGroup", required: true, index: true },

    sku: { type: String, required: true, unique: true, index: true },

    price: { type: Number, required: true },
    opt_price: { type: Number, default: null },

    discount: { type: Number, default: 0 }, // процент скидки, например 15 для 15%
    discountUAH: { type: Number, default: 0 }, // абсолютная скидка в валюте, например 150 
    discountType: { type: String, enum: ["none", "percent", "amount"], default: "none" },
    effectivePrice: { type: Number, default: 0 },

    available: { type: Boolean, default: true, index: true },

    img: { type: String, default: "" },

    // канон: сохраняем, но фильтры лучше делать по optionMap
    optionValues: { type: [Schema.Types.Mixed], default: [] },

    // ✅ стабильный ключ без JSON-кавычек
    optionKey: { type: String, required: true, index: true },

    // ✅ ключевая денормализация для фильтров и фасетов
    optionMap: { type: Schema.Types.Mixed, default: {} }, // { A1: "yellow", A2: 30 }

    // ✅ опционально: остатки по складам (вариация = SKU)
    stocks: { type: [WarehouseStockSchema], default: [] },

    characteristics: { type: [CharacteristicValueSchema], default: [] },
  },
  { timestamps: true }
);

OfferSchema.pre("validate", function syncOfferBeforeValidate(next) {
  const synced = syncOfferDiscountFields(this, resolveDocumentDiscountType(this) || this.discountType);

  this.price = synced.price;
  this.discount = synced.discount;
  this.discountUAH = synced.discountUAH;
  this.discountType = synced.discountType;
  this.effectivePrice = synced.effectivePrice;

  next();
});

OfferSchema.pre("insertMany", function syncOffersBeforeInsertMany(next, docs) {
  for (const doc of docs) {
    const synced = syncOfferDiscountFields(doc, doc?.discountType);
    Object.assign(doc, synced);
  }

  next();
});

OfferSchema.pre("findOneAndUpdate", syncOfferUpdatePayload);
OfferSchema.pre("updateOne", syncOfferUpdatePayload);

OfferSchema.index({ groupId: 1, available: 1 });
OfferSchema.index({ groupId: 1, price: 1 });
OfferSchema.index({ groupId: 1, available: 1, price: 1 });

// ✅ мастхэв: уникальность варианта внутри группы
OfferSchema.index({ groupId: 1, optionKey: 1 }, { unique: true });

// ✅ для offer фасетов/фильтра
OfferSchema.index({ "characteristics.key": 1 });
OfferSchema.index({ groupId: 1, "characteristics.key": 1 });

// Важно: для optionMap.* индексы динамические, Mongo не любит миллионы вариантов ключей.
// Обычно достаточно groupId + available/price, а optionMap матчится уже после match по groupId.
export const Offer = mongoose.models.Offer || mongoose.model("Offer", OfferSchema);
