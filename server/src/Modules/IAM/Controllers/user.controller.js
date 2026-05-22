// controllers/user.controller.js
// Актуальная версия под подход ProductGroup + Offer
// - wishlist хранит ProductGroup _id
// - cart хранит Offer _id
// - order.items хранит offerId (Offer) + qty + pricePerUnit + subtotal + snapshots
// - добавлен paymentStatus
// - добавлена складская логика reserve / release / commit

import jwt from "jsonwebtoken";
import crypto from "crypto";
import mongoose from "mongoose";

import { UserModel } from "../Models/User.model.js";
import { OrderModel } from "../Models/Order.model.js";

import { ProductGroup } from "../../CatalogModule/Models/ProductGroup.model.js";
import { Offer } from "../../CatalogModule/Models/Offer.model.js";

import { getNextOrderNumber } from "../utils/getNextOrderNumber.js";
import { buildOrderItemPricingSnapshot } from "../utils/orderItemPricing.js";
import { triggerKeycrmOrderSync } from "../Services/keycrmOrderSync.service.js";

/**
 * =========================
 * Monobank Merchant (обычная оплата)
 * =========================
 */
const monoMerchantToken = process.env.MONO_MERCHANT_TOKEN || "";

/**
 * =========================
 * Monobank Installments
 * =========================
 */
const MONO_PARTS_BASE_URL =
  process.env.MONO_PARTS_BASE_URL || "https://u2.monobank.com.ua";

const TELEGRAM_BOT_TOKEN =
  process.env.TELEGRAM_BOT_TOKEN || process.env.TG_BOT_TOKEN || "";
const TELEGRAM_CHAT_ID =
  process.env.TELEGRAM_CHAT_ID || process.env.TG_CHAT_ID || "";

function logEvent(event, payload = {}) {
  console.info(event, {
    at: new Date().toISOString(),
    ...payload,
  });
}

function logError(event, payload = {}) {
  console.error(event, {
    at: new Date().toISOString(),
    ...payload,
  });
}

const signMonoParts = (bodyString, secret) => {
  return crypto
    .createHmac("sha256", secret)
    .update(bodyString, "utf8")
    .digest("base64");
};

function normalizeProductName(v) {
  if (typeof v === "string") return v.trim() || "Товар";
  if (v && typeof v === "object") {
    const s = v.ua || v.en || v.ru || v.title || v.name;
    if (typeof s === "string" && s.trim()) return s.trim();
    return "Товар";
  }
  return "Товар";
}

/**
 * =========================
 * Helpers: auth
 * =========================
 */
async function getUserIdFromReq(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;

  const token = authHeader.split(" ")[1];
  if (!token) return null;

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your_jwt_secret_here"
    );
    return decoded.sub;
  } catch {
    return null;
  }
}

async function getUser(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;

  const token = authHeader.split(" ")[1];
  if (!token) return null;

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your_jwt_secret_here"
    );
    return await UserModel.findById(decoded.sub);
  } catch {
    return null;
  }
}

/**
 * =========================
 * Helpers: common
 * =========================
 */
function toNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizePhone(input = "") {
  return String(input).replace(/[^\d+]/g, "").trim();
}

function getEffectivePrice(offer) {
  if (!offer) return 0;

  return buildOrderItemPricingSnapshot(offer).pricePerUnit;
}

function validateQty(qty) {
  const n = Number(qty);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1) {
    return null;
  }
  return n;
}

function getOfferAvailableQty(offer) {
  if (!offer) return 0;

  if (Array.isArray(offer.warehouseStocks) && offer.warehouseStocks.length) {
    return offer.warehouseStocks.reduce((sum, row) => {
      const onHand = toNum(row?.onHand, 0);
      const reserved = toNum(row?.reserved, 0);
      return sum + Math.max(0, onHand - reserved);
    }, 0);
  }

  if (Array.isArray(offer.stocks) && offer.stocks.length) {
    return offer.stocks.reduce((sum, row) => {
      const onHand = toNum(row?.onHand, 0);
      const reserved = toNum(row?.reserved, 0);
      return sum + Math.max(0, onHand - reserved);
    }, 0);
  }

  if (typeof offer.quantity === "number") {
    return Math.max(0, offer.quantity);
  }

  if (offer.available === false) {
    return 0;
  }

  return Number.POSITIVE_INFINITY;
}

function getTitleSnapshot(group, offer) {
  return (
    group?.title ||
    group?.name ||
    offer?.title ||
    offer?.name ||
    { ua: "Товар", en: "Товар" }
  );
}

function getImgSnapshot(group, offer) {
  return group?.imageURL || offer?.img || "";
}

function buildIdempotencyHash({ userId = "", payload = {}, items = [] }) {
  return crypto
    .createHash("sha256")
    .update(
      JSON.stringify({
        userId: String(userId || ""),
        payload,
        items: items.map((x) => ({
          offerId: String(x.offerId),
          qty: x.qty,
          pricePerUnit: x.pricePerUnit,
        })),
      })
    )
    .digest("hex");
}

function buildOrderResponse(orderDoc, { cashbackEarned = 0 } = {}) {
  return {
    orderId: String(orderDoc._id),
    orderNumber: orderDoc.orderNumber,
    status: orderDoc.status,
    paymentStatus: orderDoc.paymentStatus || "unpaid",
    subtotal: orderDoc.subtotal,
    usedBonusBalance: orderDoc.usedBonusBalance || 0,
    usedReferralBalance: orderDoc.usedReferralBalance || 0,
    totalToPay: orderDoc.totalToPay,
    currency: orderDoc.currency,
    cashbackEarned,
    items: orderDoc.items || [],
    delivery: {
      lastName: orderDoc.lastName,
      firstName: orderDoc.firstName,
      middleName: orderDoc.middleName,
      customerPhone: orderDoc.customerPhone,
      customerEmail: orderDoc.customerEmail,
      deliveryProvince: orderDoc.deliveryProvince,
      deliveryCity: orderDoc.deliveryCity,
      deliveryPostOffice: orderDoc.deliveryPostOffice,
    },
    payment: orderDoc.payment,
    installmentMonths: orderDoc.installmentMonths,
    createdAt: orderDoc.createdAt,
  };
}

function getOrderItemName(item, index) {
  const snap = item?.titleSnapshot;
  if (typeof snap === "string" && snap.trim()) return snap.trim();

  if (snap && typeof snap === "object") {
    const localized = snap.ua || snap.en || snap.ru || snap.title || snap.name;
    if (typeof localized === "string" && localized.trim()) return localized.trim();
  }

  const offerName =
    item?.offerId?.name?.ua ||
    item?.offerId?.name?.en ||
    item?.offerId?.name ||
    item?.name ||
    "";

  if (typeof offerName === "string" && offerName.trim()) return offerName.trim();

  return `Item ${index + 1}`;
}

function shouldSendOrderToTelegramAfterWebhook(orderDoc) {
  const payment = String(orderDoc?.payment || "").toLowerCase();
  return payment === "monobank" || payment === "installment";
}

async function sendOrderToTelegram(orderDoc, { source = "unknown" } = {}) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    logEvent("[TELEGRAM] order:skipped_missing_config", {
      source,
      orderNumber: orderDoc?.orderNumber,
    });
    return { skipped: true, reason: "missing_config" };
  }

  const items = Array.isArray(orderDoc?.items) ? orderDoc.items : [];
  const itemsText = items.length
    ? items
        .map((item, idx) => {
          const name = getOrderItemName(item, idx);
          const qty = Math.max(1, toNum(item?.qty, 1));
          const subtotal = toNum(item?.subtotal, 0);
          return `${idx + 1}. ${name} x${qty} - ${subtotal.toFixed(2)} UAH`;
        })
        .join("\n")
    : "-";

  const text = [
    "New order",
    `#${orderDoc?.orderNumber || "-"}`,
    `Source: ${source}`,
    `Order status: ${orderDoc?.status || "-"}`,
    `Payment status: ${orderDoc?.paymentStatus || "-"}`,
    `Payment method: ${orderDoc?.payment || "-"}`,
    `Total: ${toNum(orderDoc?.totalToPay, 0).toFixed(2)} ${orderDoc?.currency || "UAH"}`,
    `Customer: ${String(orderDoc?.lastName || "").trim()} ${String(orderDoc?.firstName || "").trim()}`.trim(),
    `Phone: ${orderDoc?.customerPhone || "-"}`,
    `City: ${orderDoc?.deliveryCity || "-"}`,
    "Items:",
    itemsText,
  ].join("\n");

  const tgRes = await fetch(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text,
        disable_web_page_preview: true,
      }),
    }
  );

  const tgData = await tgRes.json().catch(() => ({}));

  if (!tgRes.ok || tgData?.ok === false) {
    throw new Error(tgData?.description || `Telegram API failed with ${tgRes.status}`);
  }

  logEvent("[TELEGRAM] order:sent", {
    source,
    orderNumber: orderDoc?.orderNumber,
    messageId: tgData?.result?.message_id,
  });

  return { skipped: false };
}

/**
 * =========================
 * Helpers: stock
 * =========================
 */
function getStockAvailable(row) {
  const onHand = Math.max(0, toNum(row?.onHand, 0));
  const reserved = Math.max(0, toNum(row?.reserved, 0));
  return Math.max(0, onHand - reserved);
}

function sortStocksByAvailability(stocks = []) {
  return [...stocks].sort((a, b) => getStockAvailable(b) - getStockAvailable(a));
}

async function reserveOfferStocksForOrder(order) {
  for (const it of order.items || []) {
    const offerId = it?.offerId?._id || it?.offerId;
    if (!offerId) continue;

    const reserveQty = Math.max(0, toNum(it.qty, 0));
    if (!reserveQty) continue;

    const offer = await Offer.findById(offerId);
    if (!offer) {
      logError("[STOCK] reserve:offer_not_found", {
        orderNumber: order?.orderNumber,
        offerId: String(offerId),
      });
      continue;
    }

    if (!Array.isArray(offer.stocks) || !offer.stocks.length) {
      logError("[STOCK] reserve:no_stocks", {
        orderNumber: order?.orderNumber,
        offerId: String(offerId),
        sku: offer?.sku || "",
      });
      continue;
    }

    let leftToReserve = reserveQty;
    const stocks = sortStocksByAvailability(offer.stocks);

    for (const stock of stocks) {
      if (leftToReserve <= 0) break;

      const available = getStockAvailable(stock);
      if (available <= 0) continue;

      const take = Math.min(available, leftToReserve);
      stock.reserved = Math.max(0, toNum(stock.reserved, 0)) + take;
      leftToReserve -= take;
    }

    await offer.save();

    logEvent("[STOCK] reserve:success", {
      orderNumber: order?.orderNumber,
      offerId: String(offerId),
      sku: offer?.sku || "",
      reservedBy: reserveQty,
      leftUnreserved: leftToReserve,
    });

    if (leftToReserve > 0) {
      logError("[STOCK] reserve:partial", {
        orderNumber: order?.orderNumber,
        offerId: String(offerId),
        sku: offer?.sku || "",
        requested: reserveQty,
        leftUnreserved: leftToReserve,
      });
    }
  }
}

async function releaseOfferStocksForOrder(order) {
  for (const it of order.items || []) {
    const offerId = it?.offerId?._id || it?.offerId;
    if (!offerId) continue;

    let qtyToRelease = Math.max(0, toNum(it.qty, 0));
    if (!qtyToRelease) continue;

    const offer = await Offer.findById(offerId);
    if (!offer) {
      logError("[STOCK] release:offer_not_found", {
        orderNumber: order?.orderNumber,
        offerId: String(offerId),
      });
      continue;
    }

    if (!Array.isArray(offer.stocks) || !offer.stocks.length) {
      logError("[STOCK] release:no_stocks", {
        orderNumber: order?.orderNumber,
        offerId: String(offerId),
        sku: offer?.sku || "",
      });
      continue;
    }

    for (const stock of offer.stocks) {
      if (qtyToRelease <= 0) break;

      const reserved = Math.max(0, toNum(stock.reserved, 0));
      if (reserved <= 0) continue;

      const take = Math.min(reserved, qtyToRelease);
      stock.reserved = reserved - take;
      qtyToRelease -= take;
    }

    await offer.save();

    logEvent("[STOCK] release:success", {
      orderNumber: order?.orderNumber,
      offerId: String(offerId),
      sku: offer?.sku || "",
      releasedBy: toNum(it.qty, 0),
      leftUnreleased: qtyToRelease,
    });
  }
}

async function commitOfferStocksFromOrder(order) {
  for (const it of order.items || []) {
    const offerId = it?.offerId?._id || it?.offerId;
    if (!offerId) continue;

    let qtyToCommit = Math.max(0, toNum(it.qty, 0));
    if (!qtyToCommit) continue;

    const offer = await Offer.findById(offerId);
    if (!offer) {
      logError("[STOCK] commit:offer_not_found", {
        orderNumber: order?.orderNumber,
        offerId: String(offerId),
      });
      continue;
    }

    if (!Array.isArray(offer.stocks) || !offer.stocks.length) {
      logError("[STOCK] commit:no_stocks", {
        orderNumber: order?.orderNumber,
        offerId: String(offerId),
        sku: offer?.sku || "",
      });
      continue;
    }

    const stocks = sortStocksByAvailability(offer.stocks);

    for (const stock of stocks) {
      if (qtyToCommit <= 0) break;

      const onHand = Math.max(0, toNum(stock.onHand, 0));
      const reserved = Math.max(0, toNum(stock.reserved, 0));

      if (onHand <= 0) continue;

      const take = Math.min(onHand, qtyToCommit);

      stock.onHand = onHand - take;
      stock.reserved = Math.max(0, reserved - Math.min(reserved, take));

      qtyToCommit -= take;
    }

    await offer.save();

    logEvent("[STOCK] commit:success", {
      orderNumber: order?.orderNumber,
      offerId: String(offerId),
      sku: offer?.sku || "",
      committedBy: toNum(it.qty, 0),
      leftUncommitted: qtyToCommit,
    });

    if (qtyToCommit > 0) {
      logError("[STOCK] commit:partial", {
        orderNumber: order?.orderNumber,
        offerId: String(offerId),
        sku: offer?.sku || "",
        requested: toNum(it.qty, 0),
        leftUncommitted: qtyToCommit,
      });
    }
  }
}

/**
 * =========================
 * Helpers: validation
 * =========================
 */
function validateRequiredCheckoutFields(payload = {}) {
  const errors = [];

  const {
    lastName,
    firstName,
    customerPhone,
    payment,
    deliveryProvince,
    deliveryCity,
    deliveryPostOffice,
  } = payload;

  if (!String(firstName || "").trim()) {
    errors.push({ field: "firstName", message: "firstName is required" });
  }

  if (!String(lastName || "").trim()) {
    errors.push({ field: "lastName", message: "lastName is required" });
  }

  if (!String(customerPhone || "").trim()) {
    errors.push({ field: "customerPhone", message: "customerPhone is required" });
  }

  if (!String(payment || "").trim()) {
    errors.push({ field: "payment", message: "payment is required" });
  }

  const deliveryRequiredPayments = ["cod", "iban", "monobank", "installment", "online", "postpaid"];

  if (deliveryRequiredPayments.includes(String(payment))) {
    if (!String(deliveryProvince || "").trim()) {
      errors.push({
        field: "deliveryProvince",
        message: "deliveryProvince is required",
      });
    }

    if (!String(deliveryCity || "").trim()) {
      errors.push({
        field: "deliveryCity",
        message: "deliveryCity is required",
      });
    }

    if (!String(deliveryPostOffice || "").trim()) {
      errors.push({
        field: "deliveryPostOffice",
        message: "deliveryPostOffice is required",
      });
    }
  }

  const normalizedPhone = normalizePhone(customerPhone);
  if (customerPhone && normalizedPhone.replace(/\D/g, "").length < 10) {
    errors.push({ field: "customerPhone", message: "customerPhone is invalid" });
  }

  return errors;
}

async function loadOffersAndGroups(offerIds) {
  const offers = offerIds.length
    ? await Offer.find({ _id: { $in: offerIds } }).lean()
    : [];

  const offersById = Object.fromEntries(offers.map((o) => [String(o._id), o]));

  const groupIds = offers.map((o) => o.groupId).filter(Boolean);

  const groups = groupIds.length
    ? await ProductGroup.find({ _id: { $in: groupIds } }).lean()
    : [];

  const groupsById = Object.fromEntries(groups.map((g) => [String(g._id), g]));

  return { offersById, groupsById };
}

async function buildValidatedOrderItems(rawItems) {
  const errors = [];

  const normalizedItems = (rawItems || []).map((row, index) => ({
    index,
    offerId: row?.offerId,
    qty: Number(row?.qty),
  }));

  for (const row of normalizedItems) {
    if (!row.offerId || !mongoose.Types.ObjectId.isValid(String(row.offerId))) {
      errors.push({
        field: `items[${row.index}].offerId`,
        code: "INVALID_OFFER_ID",
        message: "offerId is invalid",
      });
    }

    if (!Number.isInteger(row.qty) || row.qty < 1) {
      errors.push({
        field: `items[${row.index}].qty`,
        code: "INVALID_QTY",
        message: "qty must be an integer >= 1",
      });
    }
  }

  if (errors.length) {
    return { errors, orderItems: null, subtotal: 0 };
  }

  const offerIds = normalizedItems.map((x) => x.offerId);
  const { offersById, groupsById } = await loadOffersAndGroups(offerIds);

  const orderItems = [];

  for (const row of normalizedItems) {
    const offer = offersById[String(row.offerId)];

    if (!offer) {
      errors.push({
        field: `items[${row.index}]`,
        code: "OFFER_NOT_FOUND",
        message: "Offer not found",
        offerId: row.offerId,
      });
      continue;
    }

    if (offer.available === false) {
      errors.push({
        field: `items[${row.index}]`,
        code: "OFFER_UNAVAILABLE",
        message: "Offer is unavailable",
        offerId: row.offerId,
      });
      continue;
    }

    const availableQty = getOfferAvailableQty(offer);
    if (Number.isFinite(availableQty) && row.qty > availableQty) {
      errors.push({
        field: `items[${row.index}]`,
        code: "INSUFFICIENT_STOCK",
        message: "Requested quantity exceeds available stock",
        offerId: row.offerId,
        availableQty,
      });
      continue;
    }

    const group = offer?.groupId ? groupsById[String(offer.groupId)] : null;
    const pricing = buildOrderItemPricingSnapshot(offer, { qty: row.qty });

    orderItems.push({
      offerId: offer._id,
      groupId: offer.groupId || null,
      sku: offer.sku || "",
      optionKey: offer.optionKey || "",
      optionValues: Array.isArray(offer.optionValues) ? offer.optionValues : [],
      titleSnapshot: getTitleSnapshot(group, offer),
      imgSnapshot: getImgSnapshot(group, offer),
      qty: row.qty,
      ...pricing,
    });
  }

  const subtotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0);

  return { errors, orderItems, subtotal };
}

/**
 * =========================
 * Helpers: wishlist/cart
 * =========================
 */
async function buildWishlistCards(groupIdsArray) {
  if (!groupIdsArray || !groupIdsArray.length) return [];

  const groups = await ProductGroup.find({
    _id: { $in: groupIdsArray },
  }).lean();

  const byId = Object.fromEntries(groups.map((g) => [g._id.toString(), g]));

  return groupIdsArray
    .map((id) => byId[id.toString()])
    .filter(Boolean);
}

async function getCartUser(req, res) {
  const user = await getUser(req);
  if (!user) {
    res.status(401).json({ message: "Unauthorized" });
    return null;
  }
  return user;
}

async function findOfferOr404(offerId, res) {
  if (!offerId || !mongoose.Types.ObjectId.isValid(String(offerId))) {
    res.status(404).json({ code: "OFFER_NOT_FOUND", message: "Offer not found" });
    return null;
  }

  const offerDoc = await Offer.findById(offerId).lean();
  if (!offerDoc) {
    res.status(404).json({ code: "OFFER_NOT_FOUND", message: "Offer not found" });
    return null;
  }

  return offerDoc;
}

async function buildCartResponse(userId) {
  const user = await UserModel.findById(userId).lean();
  const cart = Array.isArray(user?.cart) ? user.cart : [];

  const offerIds = cart.map((r) => r.offerId).filter(Boolean);
  const offers = offerIds.length
    ? await Offer.find({ _id: { $in: offerIds } }).lean()
    : [];

  const offersById = Object.fromEntries(offers.map((o) => [String(o._id), o]));

  const groupIds = offers.map((o) => o.groupId).filter(Boolean);
  const groups = groupIds.length
    ? await ProductGroup.find({ _id: { $in: groupIds } }).lean()
    : [];

  const groupsById = Object.fromEntries(groups.map((g) => [String(g._id), g]));

  return cart.map((row) => {
    const offer = offersById[String(row.offerId)] || null;
    const group =
      offer?.groupId ? groupsById[String(offer.groupId)] || null : null;

    const currentPrice = offer ? getEffectivePrice(offer) : null;

    let issueCode = null;
    let issueMessage = null;

    if (!offer) {
      issueCode = "OFFER_NOT_FOUND";
      issueMessage = "Offer not found";
    } else if (offer.available === false) {
      issueCode = "OFFER_UNAVAILABLE";
      issueMessage = "Offer is unavailable";
    } else {
      const availableQty = getOfferAvailableQty(offer);

      if (Number.isFinite(availableQty) && row.qty > availableQty) {
        issueCode = "INSUFFICIENT_STOCK";
        issueMessage = "Requested quantity exceeds available stock";
      } else if (currentPrice !== row.priceAtAdd) {
        issueCode = "PRICE_CHANGED";
        issueMessage = "Price has changed";
      }
    }

    return {
      offerId: row.offerId,
      qty: row.qty,
      priceAtAdd: row.priceAtAdd,
      offer,
      group,
      state: {
        issueCode,
        issueMessage,
        priceChanged: issueCode === "PRICE_CHANGED",
        unavailable:
          issueCode === "OFFER_UNAVAILABLE" || issueCode === "OFFER_NOT_FOUND",
      },
    };
  });
}

function toUserShort(user) {
  return {
    id: String(user._id),
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    middleName: user.middleName,
    birthDate: user.birthDate,
    phone: user.phone,
    status: user.status,
    bonusBalance: user.bonusBalance,
    referralBalance: user.referralBalance,
    referralCode: user.referralCode,
    invitedBy: user.invitedBy,
    deliveryProvince: user.deliveryProvince,
    deliveryCity: user.deliveryCity,
    deliveryPostOffice: user.deliveryPostOffice,
    createdAt: user.createdAt,
  };
}

/**
 * =========================
 * Controllers
 * =========================
 */
export function wishlistController(router) {
  router.get("/user/wishlist", async (req, res) => {
    const user = await getUser(req);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const populated = await UserModel.findById(user._id)
      .populate({
        path: "wishlist",
        model: "ProductGroup",
      })
      .lean();

    res.json(populated.wishlist || []);
  });

  router.post("/user/wishlist", async (req, res) => {
    const user = await getUser(req);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const { groupId } = req.body || {};
    if (!groupId) return res.status(400).json({ message: "groupId is required" });

    const exists = (user.wishlist || []).some((id) => String(id) === String(groupId));
    if (!exists) {
      user.wishlist.push(groupId);
      await user.save();
    }

    const cards = await buildWishlistCards(user.wishlist);
    res.json(cards);
  });

  router.delete("/user/wishlist/:groupId", async (req, res) => {
    const user = await getUser(req);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const { groupId } = req.params;

    user.wishlist = (user.wishlist || []).filter(
      (id) => String(id) !== String(groupId)
    );
    await user.save();

    const cards = await buildWishlistCards(user.wishlist);
    res.json(cards);
  });
}

export function cartController(router) {
  router.get("/user/cart", async (req, res) => {
    const user = await getCartUser(req, res);
    if (!user) return;

    const response = await buildCartResponse(user._id);
    res.json(response);
  });

  router.post("/user/cart", async (req, res) => {
    const user = await getCartUser(req, res);
    if (!user) return;

    const { offerId, qty = 1 } = req.body || {};

    if (!offerId) {
      return res.status(400).json({
        code: "VALIDATION_ERROR",
        message: "offerId is required",
      });
    }

    const addQty = validateQty(qty);
    if (addQty === null) {
      return res.status(400).json({
        code: "INVALID_QTY",
        message: "qty must be an integer >= 1",
      });
    }

    const offerDoc = await findOfferOr404(offerId, res);
    if (!offerDoc) return;

    if (offerDoc.available === false) {
      return res.status(409).json({
        code: "OFFER_UNAVAILABLE",
        message: "Offer is unavailable",
      });
    }

    const availableQty = getOfferAvailableQty(offerDoc);

    const existing = (user.cart || []).find(
      (row) => String(row.offerId) === String(offerId)
    );

    const nextQty = (existing?.qty || 0) + addQty;

    if (Number.isFinite(availableQty) && nextQty > availableQty) {
      return res.status(409).json({
        code: "INSUFFICIENT_STOCK",
        message: "Requested quantity exceeds available stock",
        availableQty,
      });
    }

    const finalPrice = getEffectivePrice(offerDoc);

    if (existing) {
      existing.qty = nextQty;
    } else {
      user.cart.push({
        offerId,
        qty: addQty,
        priceAtAdd: finalPrice,
      });
    }

    await user.save();
    const response = await buildCartResponse(user._id);
    res.json(response);
  });

  router.patch("/user/cart", async (req, res) => {
    const user = await getCartUser(req, res);
    if (!user) return;

    const { offerId, qty } = req.body || {};

    if (!offerId || qty === undefined) {
      return res.status(400).json({
        code: "VALIDATION_ERROR",
        message: "offerId and qty are required",
      });
    }

    const nextQty = validateQty(qty);
    if (nextQty === null) {
      return res.status(400).json({
        code: "INVALID_QTY",
        message: "qty must be an integer >= 1",
      });
    }

    const item = (user.cart || []).find(
      (row) => String(row.offerId) === String(offerId)
    );

    if (!item) {
      return res.status(404).json({
        code: "CART_ITEM_NOT_FOUND",
        message: "Item not found in cart",
      });
    }

    const offerDoc = await findOfferOr404(offerId, res);
    if (!offerDoc) return;

    if (offerDoc.available === false) {
      return res.status(409).json({
        code: "OFFER_UNAVAILABLE",
        message: "Offer is unavailable",
      });
    }

    const availableQty = getOfferAvailableQty(offerDoc);
    if (Number.isFinite(availableQty) && nextQty > availableQty) {
      return res.status(409).json({
        code: "INSUFFICIENT_STOCK",
        message: "Requested quantity exceeds available stock",
        availableQty,
      });
    }

    item.qty = nextQty;

    await user.save();
    const response = await buildCartResponse(user._id);
    res.json(response);
  });

  router.delete("/user/cart/:offerId", async (req, res) => {
    const user = await getCartUser(req, res);
    if (!user) return;

    const { offerId } = req.params;

    const exists = (user.cart || []).some(
      (row) => String(row.offerId) === String(offerId)
    );

    if (!exists) {
      return res.status(404).json({
        code: "CART_ITEM_NOT_FOUND",
        message: "Item not found in cart",
      });
    }

    user.cart = (user.cart || []).filter(
      (row) => String(row.offerId) !== String(offerId)
    );

    await user.save();
    const response = await buildCartResponse(user._id);
    res.json(response);
  });
}

export function userController(router) {
  router.get("/user", async (req, res) => {
    const userId = await getUserIdFromReq(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const user = await UserModel.findById(userId).select(
      "_id email firstName lastName middleName birthDate phone status bonusBalance referralBalance referralCode invitedBy deliveryProvince deliveryCity deliveryPostOffice createdAt"
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(toUserShort(user));
  });

  router.patch("/user", async (req, res) => {
    try {
      const userId = await getUserIdFromReq(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const update = {};

      if (req.body?.email !== undefined) {
        const normalizedEmail = String(req.body.email || "").trim().toLowerCase();
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!normalizedEmail || !emailPattern.test(normalizedEmail)) {
          return res.status(400).json({ message: "email must be a valid email" });
        }

        update.email = normalizedEmail;
      }

      if (req.body?.firstName !== undefined) update.firstName = req.body.firstName;
      if (req.body?.lastName !== undefined) update.lastName = req.body.lastName;
      if (req.body?.middleName !== undefined) update.middleName = req.body.middleName;
      if (req.body?.phone !== undefined) update.phone = req.body.phone;
      if (req.body?.deliveryProvince !== undefined) {
        update.deliveryProvince = req.body.deliveryProvince;
      }
      if (req.body?.deliveryCity !== undefined) update.deliveryCity = req.body.deliveryCity;
      if (req.body?.deliveryPostOffice !== undefined) {
        update.deliveryPostOffice = req.body.deliveryPostOffice;
      }

      if (req.body?.birthDate !== undefined) {
        if (req.body.birthDate === null || req.body.birthDate === "") {
          update.birthDate = null;
        } else {
          const parsedDate = new Date(req.body.birthDate);
          if (Number.isNaN(parsedDate.getTime())) {
            return res.status(400).json({ message: "birthDate must be a valid date" });
          }
          update.birthDate = parsedDate;
        }
      }

      if (!Object.keys(update).length) {
        return res.status(400).json({
          message: "No updatable fields provided",
        });
      }

      const user = await UserModel.findByIdAndUpdate(
        userId,
        { $set: update },
        { new: true, runValidators: true }
      ).select(
        "_id email firstName lastName middleName birthDate phone status bonusBalance referralBalance referralCode invitedBy deliveryProvince deliveryCity deliveryPostOffice createdAt"
      );

      if (!user) return res.status(404).json({ message: "User not found" });

      return res.json(toUserShort(user));
    } catch (e) {
      if (e?.code === 11000) {
        return res.status(409).json({ message: "Phone or email already in use" });
      }

      console.error("PATCH /iam/user error:", e);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  router.get("/user/orders", async (req, res) => {
    const userId = await getUserIdFromReq(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const orders = await OrderModel.find({ userId }).lean();
    res.json(orders);
  });
}

/**
 * =========================
 * Checkout + Payments controller
 * =========================
 */
export function checkoutController(router) {
  router.post("/create-mono-payment", async (req, res) => {
    try {
      const { totalCost, orderNumber, description } = req.body;

      logEvent("[MONO] payment:create:start", {
        orderNumber,
        totalCost,
      });

      if (!totalCost || !orderNumber) {
        logError("[MONO] payment:create:validation_error", {
          orderNumber,
          totalCost,
          error: "Missing totalCost or orderNumber",
        });

        return res.status(400).json({ message: "Missing totalCost or orderNumber" });
      }

      const orderDoc = await OrderModel.findOne({
        $or: [
          { order_number: String(orderNumber) },
          { orderNumber: Number(orderNumber) },
        ],
      }).populate({ path: "items.offerId" });

      if (!orderDoc) {
        logError("[MONO] payment:create:order_not_found", {
          orderNumber,
        });

        return res.status(404).json({ message: `Заказ №${orderNumber} не найден` });
      }

      const basketOrder = (orderDoc.items || []).map((row, idx) => {
        const offer = row.offerId;

        const name =
          row?.titleSnapshot?.ua ||
          row?.titleSnapshot?.en ||
          offer?.name?.ua ||
          offer?.name?.en ||
          `Item ${idx + 1}`;

        const qty = Math.max(1, parseInt(row.qty, 10) || 1);

        const price = Number(row.pricePerUnit);
        const priceKop = Number.isFinite(price) ? Math.round(price * 100) : 0;
        const sum = priceKop * qty;

        const code = String(
          row?.sku || offer?.sku || offer?.integrationSku || offer?._id || idx + 1
        );

        return { name, qty, sum, code };
      });

      if (!basketOrder.length) {
        basketOrder.push({
          name: description || `Order #${orderNumber}`,
          qty: 1,
          sum: Math.round(Number(totalCost) * 100),
          code: String(orderNumber),
        });
      }

      const amount = Math.round(Number(totalCost) * 100);

      const basketSum = basketOrder.reduce((s, i) => s + (Number(i.sum) || 0), 0);
      if (basketSum !== amount) {
        const diff = amount - basketSum;
        basketOrder[basketOrder.length - 1].sum += diff;
      }

      for (const i of basketOrder) {
        if (!i.name || !Number.isFinite(i.qty) || !Number.isFinite(i.sum) || i.sum <= 0) {
          logError("[MONO] payment:create:invalid_basket", {
            orderNumber,
            item: i,
          });

          return res.status(400).json({ message: "Invalid basketOrder", item: i });
        }
      }

      const payload = {
        amount,
        redirectUrl: process.env.MONO_REDIRECT_URL || "https://sanashoes.com.ua",
        webHookUrl:
          process.env.MONO_WEBHOOK_URL || "https://sanashoes.com.ua/api/iam/webhook-mono",
        merchantPaymInfo: {
          reference: String(orderNumber),
          destination: description || `Оплата замовлення №${orderNumber}`,
          basketOrder,
          redirectUrl: process.env.MONO_REDIRECT_URL || "https://sanashoes.com.ua",
          webHookUrl:
            process.env.MONO_WEBHOOK_URL || "https://sanashoes.com.ua/api/iam/webhook-mono",
        },
      };

      const mbRes = await fetch(
        "https://api.monobank.ua/api/merchant/invoice/create",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Token": monoMerchantToken,
          },
          body: JSON.stringify(payload),
        }
      );

      const mbData = await mbRes.json();

      if (mbRes.ok && mbData.invoiceId) {
        orderDoc.payments = orderDoc.payments || [];

        const alreadyExists = orderDoc.payments.some(
          (p) => String(p.invoiceId) === String(mbData.invoiceId)
        );

        if (!alreadyExists) {
          orderDoc.payments.push({
            payment_method_id: 6,
            payment_method: "Monobank",
            amount: Number(totalCost),
            status: "pending",
            invoiceId: mbData.invoiceId,
            reference: String(orderNumber),
            pageUrl: mbData.pageUrl,
          });
        }

        orderDoc.paymentStatus = "pending";
        await orderDoc.save();

        logEvent("[MONO] payment:create:success", {
          orderNumber,
          orderId: String(orderDoc._id),
          invoiceId: mbData.invoiceId,
          statusCode: mbRes.status,
          status: orderDoc.status,
          paymentStatus: orderDoc.paymentStatus,
        });
      } else {
        logError("[MONO] payment:create:failed", {
          orderNumber,
          orderId: String(orderDoc._id),
          statusCode: mbRes.status,
          error: mbData,
        });
      }

      return res.status(mbRes.status).json(mbData);
    } catch (error) {
      logError("[MONO] payment:create:error", {
        orderNumber: req.body?.orderNumber,
        error: error?.message || String(error),
      });

      return res.status(500).json({
        message: "Не удалось создать платёж Monobank",
        error: error.message,
      });
    }
  });

  router.post("/webhook-mono", async (req, res) => {
    const data = req.body;

    try {
      const reference =
        data.reference ||
        data.orderReference ||
        data.merchantPaymInfo?.reference ||
        null;

      const invoiceId =
        data.invoiceId ||
        data.invoice_id ||
        data.invoice?.invoiceId ||
        null;

      logEvent("[MONO] webhook:start", {
        reference,
        invoiceId,
        monoStatus: data?.status || null,
      });

      let orderQuery = null;

      if (reference) orderQuery = { order_number: String(reference) };
      else if (invoiceId) orderQuery = { "payments.invoiceId": String(invoiceId) };

      if (!orderQuery) {
        logError("[MONO] webhook:missing_reference", {
          reference,
          invoiceId,
        });
        return res.status(400).send("Missing reference/invoiceId");
      }

      const order = await OrderModel.findOne(orderQuery).populate("items.offerId");
      if (!order) {
        logError("[MONO] webhook:order_not_found", {
          reference,
          invoiceId,
        });
        return res.status(404).send("Order not found");
      }

      if (data.status !== "success") {
        logEvent("[MONO] webhook:ignored", {
          orderNumber: order.orderNumber,
          invoiceId,
          monoStatus: data.status,
        });
        return res.status(200).send("Ignored");
      }

      if (order.paymentStatus === "paid") {
        logEvent("[MONO] webhook:already_processed", {
          orderNumber: order.orderNumber,
          invoiceId,
          paymentStatus: order.paymentStatus,
        });
        return res.status(200).send("Already processed");
      }

      order.paymentStatus = "paid";
      order.status = "processing";

      if (Array.isArray(order.payments) && order.payments.length) {
        const payIdx = order.payments.findIndex(
          (p) =>
            String(p.invoiceId) === String(invoiceId) ||
            String(p.reference) === String(reference)
        );

        if (payIdx !== -1) {
          order.payments[payIdx].status = "success";
          if (data.amount) order.payments[payIdx].amount = Number(data.amount) / 100;
        }
      }

      await order.save();

      try {
        await commitOfferStocksFromOrder(order);
      } catch (stockErr) {
        logError("[MONO] webhook:stock_error", {
          orderNumber: order.orderNumber,
          invoiceId,
          error: stockErr?.message || String(stockErr),
        });
      }

      logEvent("[MONO] webhook:success", {
        orderNumber: order.orderNumber,
        orderId: String(order._id),
        invoiceId,
        status: order.status,
        paymentStatus: order.paymentStatus,
      });

      try {
        await sendOrderToTelegram(order, {
          source: "webhook-mono-paid",
        });
      } catch (tgErr) {
        logError("[MONO] webhook:telegram_error", {
          orderNumber: order.orderNumber,
          invoiceId,
          error: tgErr?.message || String(tgErr),
        });
      }

      return res.status(200).send("OK");
    } catch (err) {
      logError("[MONO] webhook:error", {
        reference:
          data?.reference ||
          data?.orderReference ||
          data?.merchantPaymInfo?.reference ||
          null,
        invoiceId:
          data?.invoiceId ||
          data?.invoice_id ||
          data?.invoice?.invoiceId ||
          null,
        error: err?.message || String(err),
      });

      return res.status(500).send(err?.message || "Internal error");
    }
  });

  router.post("/webhook-mono-installment", async (req, res) => {
    try {
      const data = req.body || {};

      const monoOrderId = data.order_id || data.orderId || null;
      const status = data.status || null;
      const sub = data.sub_status || null;

      const paidNowKop =
        toNum(data.amount) || toNum(data.totalAmount) || toNum(data.finalAmount) || 0;

      logEvent("[MONO_PARTS] webhook:start", {
        monoOrderId,
        status,
        subStatus: sub,
      });

      if (!monoOrderId) {
        logError("[MONO_PARTS] webhook:missing_order_id", {});
        return res.status(400).send("Missing order_id");
      }

      const order = await OrderModel.findOne({
        "payments.monoPartsOrderId": String(monoOrderId),
      }).populate("items.offerId");

      if (!order) {
        logError("[MONO_PARTS] webhook:order_not_found", {
          monoOrderId,
        });
        return res.status(404).send("Order not found");
      }

      const payIdx = (order.payments || []).findIndex(
        (p) => String(p.monoPartsOrderId) === String(monoOrderId)
      );

      if (status === "FAIL") {
        if (payIdx !== -1) order.payments[payIdx].status = "failed";
        order.paymentStatus = "failed";
        order.status = "cancelled";
        await order.save();

        try {
          await releaseOfferStocksForOrder(order);
        } catch (stockErr) {
          logError("[MONO_PARTS] webhook:release_error", {
            orderNumber: order.orderNumber,
            monoOrderId,
            error: stockErr?.message || String(stockErr),
          });
        }

        logEvent("[MONO_PARTS] webhook:failed", {
          orderNumber: order.orderNumber,
          monoOrderId,
          status: order.status,
          paymentStatus: order.paymentStatus,
        });

        return res.status(200).send("OK");
      }

      const confirmed =
        (status === "IN_PROCESS" && sub === "WAITING_FOR_STORE_CONFIRM") ||
        status === "SUCCESS";

      if (!confirmed) {
        const nextPayStatus = (sub || "waiting_for_client").toLowerCase();

        if (payIdx !== -1) {
          order.payments[payIdx].status = nextPayStatus;
        }

        order.paymentStatus =
          nextPayStatus === "waiting_for_store_confirm"
            ? "waiting_for_store_confirm"
            : "waiting_for_client";

        await order.save();

        logEvent("[MONO_PARTS] webhook:ignored", {
          orderNumber: order.orderNumber,
          monoOrderId,
          status,
          subStatus: sub,
          paymentStatus: order.paymentStatus,
        });

        return res.status(200).send("Ignored");
      }

      if (order.paymentStatus === "paid") {
        logEvent("[MONO_PARTS] webhook:already_processed", {
          orderNumber: order.orderNumber,
          monoOrderId,
          paymentStatus: order.paymentStatus,
        });
        return res.status(200).send("Already processed");
      }

      order.paymentStatus = "paid";
      order.status = "processing";

      if (payIdx !== -1) {
        order.payments[payIdx].status = "success";
        if (paidNowKop) order.payments[payIdx].amount = Number(paidNowKop) / 100;
      }

      await order.save();

      try {
        await commitOfferStocksFromOrder(order);
      } catch (stockErr) {
        logError("[MONO_PARTS] webhook:stock_error", {
          orderNumber: order.orderNumber,
          monoOrderId,
          error: stockErr?.message || String(stockErr),
        });
      }

      logEvent("[MONO_PARTS] webhook:success", {
        orderNumber: order.orderNumber,
        monoOrderId,
        status: order.status,
        paymentStatus: order.paymentStatus,
      });

      try {
        await sendOrderToTelegram(order, {
          source: "webhook-mono-installment-paid",
        });
      } catch (tgErr) {
        logError("[MONO_PARTS] webhook:telegram_error", {
          orderNumber: order.orderNumber,
          monoOrderId,
          error: tgErr?.message || String(tgErr),
        });
      }

      return res.status(200).send("OK");
    } catch (err) {
      logError("[MONO_PARTS] webhook:error", {
        monoOrderId: req.body?.order_id || req.body?.orderId || null,
        error: err?.message || String(err),
      });

      return res.status(500).send(err?.message || "Internal error");
    }
  });

  router.post("/create-mono-installment", async (req, res) => {
    try {
      const { totalCost, orderNumber, installmentMonths, clientPhone, items = [] } =
        req.body;

      logEvent("[MONO_PARTS] create:start", {
        orderNumber,
        totalCost,
        installmentMonths,
      });

      const orderDoc = await OrderModel.findOne({
        $or: [
          { order_number: String(orderNumber) },
          { orderNumber: Number(orderNumber) },
        ],
      });

      if (!orderDoc) {
        logError("[MONO_PARTS] create:order_not_found", {
          orderNumber,
        });

        return res.status(404).json({ message: `Заказ №${orderNumber} не найден` });
      }

      const MONO_PARTS_STORE_ID = process.env.MONO_PARTS_STORE_ID || "";
      const MONO_PARTS_SECRET = process.env.MONO_PARTS_SECRET || "";

      function normalizePhoneUA(input = "") {
        const digits = String(input).replace(/\D/g, "");
        if (digits.length === 10 && digits.startsWith("0")) return `38${digits}`;
        if (digits.length === 12 && digits.startsWith("380")) return digits;
        if (digits.length === 9) return `380${digits}`;
        return digits;
      }

      const normalizedPhone = normalizePhoneUA(clientPhone);
      if (!/^380\d{9}$/.test(normalizedPhone)) {
        logError("[MONO_PARTS] create:invalid_phone", {
          orderNumber,
          clientPhone,
        });

        return res.status(400).json({
          message: "Невірний формат телефону. Очікується формат 380XXXXXXXXX",
        });
      }

      const monoClientPhone = `+${normalizedPhone}`;
      const partsCount = Number(installmentMonths || 0);

      orderDoc.installmentMonths = partsCount;

      const payload = {
        store_order_id: String(orderNumber),
        client_phone: monoClientPhone,
        total_sum: Number(totalCost).toFixed(2),
        invoice: {
          date: new Date().toISOString().slice(0, 10),
          number: String(orderNumber),
          source: "INTERNET",
          point_id: "ONLINE",
        },
        available_programs: [
          {
            available_parts_count: [partsCount],
            type: "payment_installments",
          },
        ],
        products: items.map((it) => {
          const count = Number(it.quantity || it.qty || 1);
          const unit = Number(it.price || it.sum || 0);

          return {
            name: normalizeProductName(it.title ?? it.name),
            count,
            sum: Number((unit * count).toFixed(2)),
          };
        }),
        result_callback:
          process.env.MONO_PARTS_WEBHOOK_URL ||
          "https://sanashoes.com.ua/api/iam/webhook-mono-installment",
      };

      const bodyString = JSON.stringify(payload);
      const signature = signMonoParts(bodyString, MONO_PARTS_SECRET);

      const monoRes = await fetch(`${MONO_PARTS_BASE_URL}/api/order/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "store-id": MONO_PARTS_STORE_ID,
          signature,
        },
        body: bodyString,
      });

      const monoData = await monoRes.json().catch(() => ({}));

      if (monoRes.ok && monoData?.order_id) {
        orderDoc.payments = orderDoc.payments || [];

        const alreadyExists = orderDoc.payments.some(
          (p) => String(p.monoPartsOrderId) === String(monoData.order_id)
        );

        if (!alreadyExists) {
          orderDoc.payments.push({
            payment_method_id: 7,
            payment_method: "Monobank Installments",
            amount: Number(totalCost),
            status: "waiting_for_client",
            monoPartsOrderId: monoData.order_id,
            partsCount,
            monoPartsConfirmed: false,
          });
        }

        orderDoc.paymentStatus = "waiting_for_client";
        await orderDoc.save();

        logEvent("[MONO_PARTS] create:success", {
          orderNumber,
          monoOrderId: monoData.order_id,
          statusCode: monoRes.status,
          status: orderDoc.status,
          paymentStatus: orderDoc.paymentStatus,
        });
      } else {
        logError("[MONO_PARTS] create:failed", {
          orderNumber,
          statusCode: monoRes.status,
          error: monoData,
        });
      }

      return res.status(monoRes.status).json(monoData);
    } catch (e) {
      logError("[MONO_PARTS] create:error", {
        orderNumber: req.body?.orderNumber,
        error: e?.message || String(e),
      });

      return res.status(500).json({
        message: "Не удалось создать заявку Оплати частинами",
        error: e.message,
      });
    }
  });

  router.post("/checkout", async (req, res) => {
    try {
      const user = await getUser(req);
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      const {
        useBonusBalance = 0,
        useReferralBalance = 0,
        lastName,
        firstName,
        middleName,
        customerPhone,
        customerEmail,
        deliveryProvince,
        deliveryCity,
        deliveryPostOffice,
        promoCode,
        payment,
        installmentMonths,
      } = req.body || {};

      logEvent("[CHECKOUT] create:start", {
        userId: String(user._id),
        payment,
      });

      const validationErrors = validateRequiredCheckoutFields(req.body);
      if (validationErrors.length) {
        logError("[CHECKOUT] create:validation_error", {
          userId: String(user._id),
          payment,
          error: validationErrors,
        });

        return res.status(400).json({
          code: "VALIDATION_ERROR",
          message: "Checkout validation failed",
          errors: validationErrors,
        });
      }

      const cart = Array.isArray(user.cart) ? user.cart : [];
      if (!cart.length) {
        logError("[CHECKOUT] create:empty_cart", {
          userId: String(user._id),
          payment,
        });

        return res.status(400).json({
          code: "EMPTY_CART",
          message: "Cart is empty",
        });
      }

      const { errors: itemErrors, orderItems, subtotal } =
        await buildValidatedOrderItems(cart);

      if (itemErrors.length) {
        const hasConflict = itemErrors.some((e) =>
          ["OFFER_UNAVAILABLE", "INSUFFICIENT_STOCK"].includes(e.code)
        );

        logError("[CHECKOUT] create:item_error", {
          userId: String(user._id),
          payment,
          error: itemErrors,
        });

        return res.status(hasConflict ? 409 : 400).json({
          code: hasConflict ? "CART_CONFLICT" : "CART_VALIDATION_ERROR",
          message: hasConflict
            ? "Some cart items are unavailable"
            : "Cart validation failed",
          errors: itemErrors,
        });
      }

      if (!orderItems.length) {
        logError("[CHECKOUT] create:no_valid_items", {
          userId: String(user._id),
          payment,
        });

        return res.status(400).json({
          code: "EMPTY_ORDER_ITEMS",
          message: "No valid offers in cart",
        });
      }

      const bonusMaxAllowed = Math.floor(subtotal * 0.05);
      const bonusToUse = Math.max(
        0,
        Math.min(Number(useBonusBalance) || 0, user.bonusBalance, bonusMaxAllowed)
      );

      const afterBonus = subtotal - bonusToUse;

      const referralToUse = Math.max(
        0,
        Math.min(Number(useReferralBalance) || 0, user.referralBalance, afterBonus)
      );

      const totalToPayRaw = afterBonus - referralToUse;
      const finalTotal = totalToPayRaw < 0 ? 0 : totalToPayRaw;
      const cashbackAmount = Math.floor(subtotal * 0.05);

      const idempotencyKey = req.get("Idempotency-Key") || "";
      const requestHash = buildIdempotencyHash({
        userId: user._id,
        payload: {
          lastName,
          firstName,
          middleName,
          customerPhone,
          customerEmail,
          deliveryProvince,
          deliveryCity,
          deliveryPostOffice,
          promoCode,
          payment,
          installmentMonths,
          useBonusBalance: bonusToUse,
          useReferralBalance: referralToUse,
        },
        items: orderItems,
      });

      if (idempotencyKey) {
        const existingOrder = await OrderModel.findOne({ idempotencyKey }).lean();

        if (existingOrder) {
          if (existingOrder.requestHash !== requestHash) {
            logError("[CHECKOUT] create:idempotency_conflict", {
              userId: String(user._id),
              payment,
              error: "Idempotency-Key already used with different payload",
            });

            return res.status(409).json({
              code: "IDEMPOTENCY_KEY_REUSED",
              message: "Idempotency-Key already used with different payload",
            });
          }

          logEvent("[CHECKOUT] create:idempotency_hit", {
            userId: String(user._id),
            orderNumber: existingOrder.orderNumber,
            status: existingOrder.status,
          });

          return res.status(200).json(
            buildOrderResponse(existingOrder, { cashbackEarned: cashbackAmount })
          );
        }
      }

      const nextOrderNumber = await getNextOrderNumber();

      const orderDoc = new OrderModel({
        userId: user._id,
        order_number: String(nextOrderNumber),
        orderNumber: nextOrderNumber,
        idempotencyKey: idempotencyKey || undefined,
        requestHash,
        items: orderItems,
        subtotal,
        usedBonusBalance: bonusToUse,
        usedReferralBalance: referralToUse,
        totalToPay: finalTotal,
        finalPrice: finalTotal,
        currency: "UAH",
        lastName,
        firstName,
        middleName,
        customerPhone,
        customerEmail,
        deliveryProvince,
        deliveryCity,
        deliveryPostOffice,
        promoCode,
        status: "new",
        payment,
        paymentStatus:
          payment === "postpaid"
            ? "unpaid"
            : payment === "installment"
            ? "waiting_for_client"
            : "pending",
        installmentMonths: payment === "installment" ? Number(installmentMonths || 0) : 0,
      });

      await orderDoc.save();

      try {
        await reserveOfferStocksForOrder(orderDoc);
      } catch (stockErr) {
        logError("[CHECKOUT] create:reserve_error", {
          orderNumber: orderDoc.orderNumber,
          status: orderDoc.status,
          error: stockErr?.message || String(stockErr),
        });
      }

      user.bonusBalance -= bonusToUse;
      user.referralBalance -= referralToUse;

      if (user.bonusBalance < 0) user.bonusBalance = 0;
      if (user.referralBalance < 0) user.referralBalance = 0;

      user.bonusBalance += cashbackAmount;
      user.cart = [];

      user.orders = user.orders || [];
      user.orders.push({
        orderId: orderDoc._id,
        orderNumber: nextOrderNumber,
        createdAt: orderDoc.createdAt,
        total: finalTotal,
        status: orderDoc.status,
      });

      await user.save();

      logEvent("[CHECKOUT] create:success", {
        userId: String(user._id),
        orderNumber: orderDoc.orderNumber,
        orderId: String(orderDoc._id),
        payment: orderDoc.payment,
        status: orderDoc.status,
        paymentStatus: orderDoc.paymentStatus,
        totalToPay: orderDoc.totalToPay,
      });

      if (!shouldSendOrderToTelegramAfterWebhook(orderDoc)) {
        try {
          await sendOrderToTelegram(orderDoc, {
            source: "checkout-created",
          });
        } catch (tgErr) {
          logError("[CHECKOUT] create:telegram_error", {
            orderNumber: orderDoc.orderNumber,
            orderId: String(orderDoc._id),
            error: tgErr?.message || String(tgErr),
          });
        }
      }

      try {
        const syncResult = await triggerKeycrmOrderSync(orderDoc._id, {
          source: "checkout",
        });

        if (syncResult.skipped) {
          logEvent("[CHECKOUT] create:keycrm_sync_skipped", {
            orderNumber: orderDoc.orderNumber,
            orderId: String(orderDoc._id),
            reason: syncResult.reason,
          });
        }
      } catch (syncErr) {
        logError("[CHECKOUT] create:keycrm_sync_error", {
          orderNumber: orderDoc.orderNumber,
          orderId: String(orderDoc._id),
          error: syncErr?.message || String(syncErr),
        });
      }

      return res.status(201).json(
        buildOrderResponse(orderDoc, { cashbackEarned: cashbackAmount })
      );
    } catch (err) {
      logError("[CHECKOUT] create:error", {
        payment: req.body?.payment,
        error: err?.message || String(err),
      });

      return res.status(500).json({ message: "Internal server error" });
    }
  });

  router.post("/guest-checkout", async (req, res) => {
    try {
      const {
        items,
        lastName,
        firstName,
        middleName,
        customerPhone,
        customerEmail,
        deliveryProvince,
        deliveryCity,
        deliveryPostOffice,
        promoCode,
        payment,
        installmentMonths,
      } = req.body || {};

      logEvent("[GUEST_CHECKOUT] create:start", {
        payment,
      });

      const validationErrors = validateRequiredCheckoutFields(req.body);
      if (validationErrors.length) {
        logError("[GUEST_CHECKOUT] create:validation_error", {
          payment,
          error: validationErrors,
        });

        return res.status(400).json({
          code: "VALIDATION_ERROR",
          message: "Checkout validation failed",
          errors: validationErrors,
        });
      }

      if (!Array.isArray(items) || items.length === 0) {
        logError("[GUEST_CHECKOUT] create:empty_cart", {
          payment,
        });

        return res.status(400).json({
          code: "EMPTY_CART",
          message: "items are required",
        });
      }

      const { errors: itemErrors, orderItems, subtotal } =
        await buildValidatedOrderItems(items);

      if (itemErrors.length) {
        const hasConflict = itemErrors.some((e) =>
          ["OFFER_UNAVAILABLE", "INSUFFICIENT_STOCK"].includes(e.code)
        );

        logError("[GUEST_CHECKOUT] create:item_error", {
          payment,
          error: itemErrors,
        });

        return res.status(hasConflict ? 409 : 400).json({
          code: hasConflict ? "CART_CONFLICT" : "CART_VALIDATION_ERROR",
          message: hasConflict
            ? "Some cart items are unavailable"
            : "Cart validation failed",
          errors: itemErrors,
        });
      }

      const idempotencyKey = req.get("Idempotency-Key") || "";
      const requestHash = buildIdempotencyHash({
        userId: "",
        payload: {
          lastName,
          firstName,
          middleName,
          customerPhone,
          customerEmail,
          deliveryProvince,
          deliveryCity,
          deliveryPostOffice,
          promoCode,
          payment,
          installmentMonths,
        },
        items: orderItems,
      });

      if (idempotencyKey) {
        const existingOrder = await OrderModel.findOne({ idempotencyKey }).lean();

        if (existingOrder) {
          if (existingOrder.requestHash !== requestHash) {
            logError("[GUEST_CHECKOUT] create:idempotency_conflict", {
              payment,
              error: "Idempotency-Key already used with different payload",
            });

            return res.status(409).json({
              code: "IDEMPOTENCY_KEY_REUSED",
              message: "Idempotency-Key already used with different payload",
            });
          }

          logEvent("[GUEST_CHECKOUT] create:idempotency_hit", {
            orderNumber: existingOrder.orderNumber,
            status: existingOrder.status,
          });

          return res.status(200).json(
            buildOrderResponse(existingOrder, { cashbackEarned: 0 })
          );
        }
      }

      const nextOrderNumber = await getNextOrderNumber();

      const orderDoc = new OrderModel({
        userId: null,
        order_number: String(nextOrderNumber),
        orderNumber: nextOrderNumber,
        idempotencyKey: idempotencyKey || undefined,
        requestHash,
        items: orderItems,
        subtotal,
        usedBonusBalance: 0,
        usedReferralBalance: 0,
        totalToPay: subtotal,
        finalPrice: subtotal,
        currency: "UAH",
        lastName,
        firstName,
        middleName,
        customerPhone,
        customerEmail,
        deliveryProvince,
        deliveryCity,
        deliveryPostOffice,
        promoCode,
        status: "new",
        payment,
        paymentStatus:
          payment === "postpaid"
            ? "unpaid"
            : payment === "installment"
            ? "waiting_for_client"
            : "pending",
        installmentMonths: payment === "installment" ? Number(installmentMonths || 0) : 0,
      });

      await orderDoc.save();

      try {
        await reserveOfferStocksForOrder(orderDoc);
      } catch (stockErr) {
        logError("[GUEST_CHECKOUT] create:reserve_error", {
          orderNumber: orderDoc.orderNumber,
          status: orderDoc.status,
          error: stockErr?.message || String(stockErr),
        });
      }

      logEvent("[GUEST_CHECKOUT] create:success", {
        orderNumber: orderDoc.orderNumber,
        orderId: String(orderDoc._id),
        payment: orderDoc.payment,
        status: orderDoc.status,
        paymentStatus: orderDoc.paymentStatus,
        totalToPay: orderDoc.totalToPay,
      });

      if (!shouldSendOrderToTelegramAfterWebhook(orderDoc)) {
        try {
          await sendOrderToTelegram(orderDoc, {
            source: "guest-checkout-created",
          });
        } catch (tgErr) {
          logError("[GUEST_CHECKOUT] create:telegram_error", {
            orderNumber: orderDoc.orderNumber,
            orderId: String(orderDoc._id),
            error: tgErr?.message || String(tgErr),
          });
        }
      }

      try {
        const syncResult = await triggerKeycrmOrderSync(orderDoc._id, {
          source: "guest-checkout",
        });

        if (syncResult.skipped) {
          logEvent("[GUEST_CHECKOUT] create:keycrm_sync_skipped", {
            orderNumber: orderDoc.orderNumber,
            orderId: String(orderDoc._id),
            reason: syncResult.reason,
          });
        }
      } catch (syncErr) {
        logError("[GUEST_CHECKOUT] create:keycrm_sync_error", {
          orderNumber: orderDoc.orderNumber,
          orderId: String(orderDoc._id),
          error: syncErr?.message || String(syncErr),
        });
      }

      return res.status(201).json(
        buildOrderResponse(orderDoc, { cashbackEarned: 0 })
      );
    } catch (err) {
      logError("[GUEST_CHECKOUT] create:error", {
        payment: req.body?.payment,
        error: err?.message || String(err),
      });

      return res.status(500).json({ message: "Internal server error" });
    }
  });
}