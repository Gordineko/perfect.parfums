import {
  badRequest,
  isValidObjectId,
} from "./catalogAdmin.helpers.js";

const ALLOWED_GROUP_STATUS = ["active", "draft", "hidden"];
const ALLOWED_AXIS_TYPES = ["number", "select", "string"];
const ALLOWED_CHAR_TYPES = ["string", "number", "boolean", "select", "multiselect"];

export function validateGroupPayload(payload = {}) {
  if (!payload || typeof payload !== "object") {
    throw badRequest("Payload is required");
  }

  if (!payload.slug || !String(payload.slug).trim()) {
    throw badRequest("slug is required");
  }

  if (payload.status && !ALLOWED_GROUP_STATUS.includes(payload.status)) {
    throw badRequest(`Invalid status: ${payload.status}`, {
      allowed: ALLOWED_GROUP_STATUS,
    });
  }

  if (!Array.isArray(payload.categoryIds)) {
    throw badRequest("categoryIds must be array");
  }

  if (!Array.isArray(payload.variationAxes)) {
    throw badRequest("variationAxes must be array");
  }

  if (!Array.isArray(payload.characteristics || [])) {
    throw badRequest("characteristics must be array");
  }

  if (!Array.isArray(payload.offers)) {
    throw badRequest("offers must be array");
  }
}

export function validateVariationAxes(variationAxes = []) {
  const seen = new Set();

  for (let i = 0; i < variationAxes.length; i += 1) {
    const axis = variationAxes[i];

    if (!axis?.axisId || !String(axis.axisId).trim()) {
      throw badRequest(`variationAxes[${i}].axisId is required`);
    }

    const axisId = String(axis.axisId).trim();
    if (seen.has(axisId)) {
      throw badRequest(`Duplicate axisId: ${axisId}`);
    }
    seen.add(axisId);

    if (axis?.type && !ALLOWED_AXIS_TYPES.includes(axis.type)) {
      throw badRequest(`Invalid variationAxes[${i}].type: ${axis.type}`, {
        allowed: ALLOWED_AXIS_TYPES,
      });
    }
  }
}

export function validateCharacteristics(characteristics = [], field = "characteristics") {
  for (let i = 0; i < characteristics.length; i += 1) {
    const c = characteristics[i];

    if (!c?.key || !String(c.key).trim()) {
      throw badRequest(`${field}[${i}].key is required`);
    }

    if (!c?.type || !ALLOWED_CHAR_TYPES.includes(c.type)) {
      throw badRequest(`${field}[${i}].type is invalid`, {
        allowed: ALLOWED_CHAR_TYPES,
      });
    }

    if (c.type === "multiselect" && !Array.isArray(c.values)) {
      throw badRequest(`${field}[${i}].values must be array for multiselect`);
    }
  }
}

export function validateOfferPayload(
  offer = {},
  index = 0,
  variationAxes = [],
  options = {}
) {
  if (!offer?.sku || !String(offer.sku).trim()) {
    throw badRequest(`offers[${index}].sku is required`);
  }

  if (offer?.price == null || !Number.isFinite(Number(offer.price))) {
    throw badRequest(`offers[${index}].price must be number`);
  }

  if (Number(offer.price) < 0) {
    throw badRequest(`offers[${index}].price must be >= 0`);
  }

  if (offer?.opt_price != null && !Number.isFinite(Number(offer.opt_price))) {
    throw badRequest(`offers[${index}].opt_price must be number or null`);
  }

  if (!offer?.optionMap || typeof offer.optionMap !== "object") {
    throw badRequest(`offers[${index}].optionMap is required`);
  }

  const axisIds = new Set(variationAxes.map((a) => a.axisId));
  const optionalAxisIds = new Set(options.optionalAxisIds || []);

  for (const key of Object.keys(offer.optionMap || {})) {
    if (!axisIds.has(key)) {
      throw badRequest(`offers[${index}].optionMap contains unknown axisId: ${key}`);
    }
  }

  for (let i = 0; i < variationAxes.length; i += 1) {
    const axis = variationAxes[i];
    const value = offer.optionMap?.[axis.axisId];
    const isOptionalTemplateAxis = optionalAxisIds.has(axis.axisId);

    const isOptionalEmptySelectAxis =
      axis?.type === "select" &&
      (!Array.isArray(axis?.valuesPreset) || axis.valuesPreset.length === 0);

    if (
      (isOptionalTemplateAxis || isOptionalEmptySelectAxis) &&
      (value === undefined || value === null || value === "")
    ) {
      continue;
    }

    if (value === undefined || value === null || value === "") {
      throw badRequest(
        `offers[${index}].optionMap.${axis.axisId} is required because this axis exists in variationAxes`
      );
    }
  }

  if (Array.isArray(offer?.characteristics)) {
    validateCharacteristics(offer.characteristics, `offers[${index}].characteristics`);
  }

  if (Array.isArray(offer?.stocks)) {
    for (let i = 0; i < offer.stocks.length; i += 1) {
      const s = offer.stocks[i];
      if (!s?.warehouseId || !isValidObjectId(s.warehouseId)) {
        throw badRequest(`offers[${index}].stocks[${i}].warehouseId is invalid`);
      }
      if (!Number.isFinite(Number(s?.onHand || 0))) {
        throw badRequest(`offers[${index}].stocks[${i}].onHand must be number`);
      }
      if (!Number.isFinite(Number(s?.reserved || 0))) {
        throw badRequest(`offers[${index}].stocks[${i}].reserved must be number`);
      }
    }
  }
}

export function validateOffersUniqueness(offers = []) {
  const skuSet = new Set();
  const optionKeySet = new Set();

  for (const offer of offers) {
    if (skuSet.has(offer.sku)) {
      throw badRequest(`Duplicate sku in payload: ${offer.sku}`);
    }
    skuSet.add(offer.sku);

    if (optionKeySet.has(offer.optionKey)) {
      throw badRequest(`Duplicate variant combination in payload: ${offer.optionKey}`);
    }
    optionKeySet.add(offer.optionKey);
  }
}