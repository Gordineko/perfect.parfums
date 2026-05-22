import mongoose from "mongoose";
import ExcelJS from "exceljs";

import { buildOrderItemPricingSnapshot } from "../utils/orderItemPricing.js";

function badRequest(message, details = null) {
  const err = new Error(message);
  err.code = "BAD_REQUEST";
  err.status = 400;
  if (details) err.details = details;
  return err;
}

function escapeRegex(str = "") {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseIntSafe(v, fallback = 0) {
  const n = Number.parseInt(String(v), 10);
  return Number.isFinite(n) ? n : fallback;
}

function parseDateSafe(v) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function escapeCsv(value) {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes('"') || str.includes(",") || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

const ALLOWED_STATUSES = new Set([
  "new",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
]);

const ALLOWED_PAYMENT_STATUSES = new Set([
  "unpaid",
  "pending",
  "paid",
  "partially_paid",
  "failed",
  "refunded",
  "waiting_for_client",
  "waiting_for_store_confirm",
]);

function buildOrderAdminFilter(qs = {}) {
  const filter = {};

  if (qs.q && String(qs.q).trim()) {
    const rx = new RegExp(escapeRegex(String(qs.q).trim()), "i");
    const qNum = Number(String(qs.q).trim());

    filter.$or = [
      { order_number: rx },
      ...(Number.isFinite(qNum) ? [{ orderNumber: qNum }] : []),
      { lastName: rx },
      { firstName: rx },
      { middleName: rx },
      { customerPhone: rx },
      { customerEmail: rx },
      { deliveryCity: rx },
    ];
  }

  if (qs.status) {
    const arr = String(qs.status).split(",").map((s) => s.trim()).filter(Boolean);
    if (arr.length) filter.status = { $in: arr };
  }

  if (qs.payment) {
    const arr = String(qs.payment).split(",").map((s) => s.trim()).filter(Boolean);
    if (arr.length) filter.payment = { $in: arr };
  }

  if (qs.paymentStatus) {
    const arr = String(qs.paymentStatus).split(",").map((s) => s.trim()).filter(Boolean);
    if (arr.length) filter.paymentStatus = { $in: arr };
  }

  if (qs.deliveryMethod) {
    const arr = String(qs.deliveryMethod).split(",").map((s) => s.trim()).filter(Boolean);
    if (arr.length) filter.deliveryMethod = { $in: arr };
  }

  const dateFrom = parseDateSafe(qs.dateFrom);
  const dateTo = parseDateSafe(qs.dateTo);

  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = dateFrom;
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }

  return filter;
}

function buildOrderListItem(order) {
  const fullName = [order.lastName, order.firstName, order.middleName]
    .filter(Boolean)
    .join(" ")
    .trim();

  const itemsPreview = Array.isArray(order.items)
    ? order.items.slice(0, 3).map((item) => ({
        title:
          item?.titleSnapshot?.ua ||
          item?.titleSnapshot?.en ||
          item?.groupId?.title?.ua ||
          item?.groupId?.title?.en ||
          item?.sku ||
          "Товар",
        qty: item?.qty || 0,
        subtotal: item?.subtotal || 0,
      }))
    : [];

  return {
    _id: order._id,
    orderNumber: order.orderNumber,
    order_number: order.order_number,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt || order.createdAt,
    status: order.status,
    payment: order.payment,
    paymentStatus: order.paymentStatus || "unpaid",
    customer: {
      fullName,
      phone: order.customerPhone || "",
      email: order.customerEmail || "",
    },
    delivery: {
      method: order.deliveryMethod || "",
      province: order.deliveryProvince || "",
      city: order.deliveryCity || "",
      postOffice: order.deliveryPostOffice || "",
      label: [
        order.deliveryMethod || "",
        order.deliveryCity || "",
        order.deliveryProvince || "",
        order.deliveryPostOffice || "",
      ]
        .filter(Boolean)
        .join(" — "),
    },
    totals: {
      itemsCount: Array.isArray(order.items)
        ? order.items.reduce((s, x) => s + (Number(x.qty) || 0), 0)
        : 0,
      subtotal: Number(order.subtotal || 0),
      finalPrice: Number(order.finalPrice || 0),
      totalToPay: Number(order.totalToPay || 0),
      currency: order.currency || "UAH",
    },
    itemsPreview,
  };
}

function buildOrderDetails(order) {
  return {
    item: {
      _id: order._id,
      orderNumber: order.orderNumber,
      order_number: order.order_number,
      user: order.userId || null,
      customer: {
        lastName: order.lastName || "",
        firstName: order.firstName || "",
        middleName: order.middleName || "",
        customerPhone: order.customerPhone || "",
        customerEmail: order.customerEmail || "",
      },
      delivery: {
        deliveryMethod: order.deliveryMethod || "",
        deliveryProvince: order.deliveryProvince || "",
        deliveryCity: order.deliveryCity || "",
        deliveryPostOffice: order.deliveryPostOffice || "",
      },
      paymentInfo: {
        payment: order.payment || "",
        paymentStatus: order.paymentStatus || "unpaid",
        installmentMonths: Number(order.installmentMonths || 0),
        payments: Array.isArray(order.payments) ? order.payments : [],
      },
      pricing: {
        subtotal: Number(order.subtotal || 0),
        usedBonusBalance: Number(order.usedBonusBalance || 0),
        usedReferralBalance: Number(order.usedReferralBalance || 0),
        adminDiscount: Number(order.adminDiscount || 0),
        adminDiscountComment: order.adminDiscountComment || "",
        finalPrice: Number(order.finalPrice || 0),
        totalToPay: Number(order.totalToPay || 0),
        currency: order.currency || "UAH",
      },
      status: order.status,
      adminComment: order.adminComment || "",
      items: Array.isArray(order.items) ? order.items : [],
      payments: Array.isArray(order.payments) ? order.payments : [],
      sitniks: order.sitniks || {},
      createdAt: order.createdAt,
      updatedAt: order.updatedAt || order.createdAt,
    },
  };
}

function mapOrderExportRow(order) {
  return {
    orderId: String(order?._id || ""),
    orderNumber: String(order?.orderNumber || ""),
    order_number: String(order?.order_number || ""),
    status: String(order?.status || ""),
    paymentStatus: String(order?.paymentStatus || ""),
    payment: String(order?.payment || ""),
    customerType: String(order?.customerType || ""),
    customerName: [order?.lastName, order?.firstName, order?.middleName]
      .filter(Boolean)
      .join(" ")
      .trim(),
    customerPhone: String(order?.customerPhone || ""),
    customerEmail: String(order?.customerEmail || ""),
    deliveryMethod: String(order?.deliveryMethod || ""),
    deliveryProvince: String(order?.deliveryProvince || ""),
    deliveryCity: String(order?.deliveryCity || ""),
    deliveryPostOffice: String(order?.deliveryPostOffice || ""),
    subtotal: Number(order?.subtotal || 0),
    finalPrice: Number(order?.finalPrice || 0),
    totalToPay: Number(order?.totalToPay || 0),
    currency: String(order?.currency || "UAH"),
    itemsCount: Array.isArray(order?.items)
      ? order.items.reduce((sum, x) => sum + (Number(x?.qty) || 0), 0)
      : 0,
    createdAt: order?.createdAt ? new Date(order.createdAt).toISOString() : "",
    updatedAt: order?.updatedAt ? new Date(order.updatedAt).toISOString() : "",
  };
}

function mapOrderItemExportRows(order) {
  const base = mapOrderExportRow(order);
  const items = Array.isArray(order?.items) ? order.items : [];

  if (!items.length) {
    return [
      {
        ...base,
        itemIndex: "",
        offerId: "",
        groupId: "",
        sku: "",
        optionKey: "",
        qty: "",
        pricePerUnit: "",
        itemSubtotal: "",
      },
    ];
  }

  return items.map((item, idx) => ({
    ...base,
    itemIndex: idx,
    offerId: item?.offerId ? String(item.offerId?._id || item.offerId) : "",
    groupId: item?.groupId ? String(item.groupId?._id || item.groupId) : "",
    sku: String(item?.sku || item?.offerId?.sku || ""),
    optionKey: String(item?.optionKey || item?.offerId?.optionKey || ""),
    qty: Number(item?.qty || 0),
    pricePerUnit: Number(item?.pricePerUnit || 0),
    itemSubtotal: Number(item?.subtotal || 0),
  }));
}

async function buildAdminOrderItems(orderAdminRepo, rawItems = []) {
  const items = [];

  for (const row of rawItems) {
    const offerId = row?.offerId;
    if (!mongoose.Types.ObjectId.isValid(String(offerId))) {
      throw badRequest("Invalid offerId in items");
    }

    const offer = await orderAdminRepo.findOfferById(offerId);
    if (!offer) throw badRequest(`Offer not found: ${offerId}`);

    const group = offer.groupId
      ? await orderAdminRepo.findProductGroupById(offer.groupId)
      : null;

    const qty = Math.max(1, parseIntSafe(row.qty, 1));
    const pricing = buildOrderItemPricingSnapshot(offer, {
      qty,
      pricePerUnit: row.pricePerUnit,
    });

    items.push({
      offerId: offer._id,
      groupId: offer.groupId || null,
      sku: offer.sku || "",
      optionKey: offer.optionKey || "",
      optionValues: Array.isArray(offer.optionValues) ? offer.optionValues : [],
      titleSnapshot: group?.title || {},
      imgSnapshot: offer.img || group?.imageURL || "",
      qty,
      ...pricing,
    });
  }

  return items;
}

export function createOrderAdminService({ orderAdminRepo }) {
  return {
    async listOrders(params = {}) {
      const page = Math.max(1, parseIntSafe(params.page, 1));
      const limit = Math.min(200, Math.max(1, parseIntSafe(params.limit, 10)));

      const sortMap = {
        createdAt_desc: { createdAt: -1, _id: -1 },
        createdAt_asc: { createdAt: 1, _id: 1 },
        total_desc: { finalPrice: -1, _id: -1 },
        total_asc: { finalPrice: 1, _id: 1 },
      };

      const sort = sortMap[String(params.sort || "createdAt_desc")] || {
        createdAt: -1,
        _id: -1,
      };

      const filter = buildOrderAdminFilter(params);

      const data = await orderAdminRepo.findPage({ filter, page, limit, sort });

      return {
        items: data.items.map(buildOrderListItem),
        meta: {
          page: data.page,
          limit: data.limit,
          total: data.total,
          pages: data.totalPages,
        },
      };
    },

    async exportOrdersCsv(params = {}) {
      const sortMap = {
        createdAt_desc: { createdAt: -1, _id: -1 },
        createdAt_asc: { createdAt: 1, _id: 1 },
        total_desc: { finalPrice: -1, _id: -1 },
        total_asc: { finalPrice: 1, _id: 1 },
      };

      const sort = sortMap[String(params.sort || "createdAt_desc")] || {
        createdAt: -1,
        _id: -1,
      };

      const filter = buildOrderAdminFilter(params);
      const orders = await orderAdminRepo.findAll({ filter, sort });
      const rows = orders.flatMap((order) => mapOrderItemExportRows(order));

      const headers = [
        "orderId",
        "orderNumber",
        "order_number",
        "status",
        "paymentStatus",
        "payment",
        "customerType",
        "customerName",
        "customerPhone",
        "customerEmail",
        "deliveryMethod",
        "deliveryProvince",
        "deliveryCity",
        "deliveryPostOffice",
        "subtotal",
        "finalPrice",
        "totalToPay",
        "currency",
        "itemsCount",
        "createdAt",
        "updatedAt",
        "itemIndex",
        "offerId",
        "groupId",
        "sku",
        "optionKey",
        "qty",
        "pricePerUnit",
        "itemSubtotal",
      ];

      const lines = [headers.join(",")];
      for (const row of rows) {
        lines.push(headers.map((key) => escapeCsv(row[key])).join(","));
      }

      return lines.join("\n");
    },

    async exportOrdersXlsx(params = {}) {
      const sortMap = {
        createdAt_desc: { createdAt: -1, _id: -1 },
        createdAt_asc: { createdAt: 1, _id: 1 },
        total_desc: { finalPrice: -1, _id: -1 },
        total_asc: { finalPrice: 1, _id: 1 },
      };

      const sort = sortMap[String(params.sort || "createdAt_desc")] || {
        createdAt: -1,
        _id: -1,
      };

      const filter = buildOrderAdminFilter(params);
      const orders = await orderAdminRepo.findAll({ filter, sort });

      const orderRows = orders.map((order) => mapOrderExportRow(order));
      const itemRows = orders.flatMap((order) =>
        (Array.isArray(order?.items) ? order.items : []).map((item, idx) => ({
          orderId: String(order?._id || ""),
          orderNumber: String(order?.orderNumber || ""),
          itemIndex: idx,
          offerId: item?.offerId ? String(item.offerId?._id || item.offerId) : "",
          groupId: item?.groupId ? String(item.groupId?._id || item.groupId) : "",
          sku: String(item?.sku || item?.offerId?.sku || ""),
          optionKey: String(item?.optionKey || item?.offerId?.optionKey || ""),
          qty: Number(item?.qty || 0),
          pricePerUnit: Number(item?.pricePerUnit || 0),
          itemSubtotal: Number(item?.subtotal || 0),
        }))
      );

      const workbook = new ExcelJS.Workbook();

      const ordersSheet = workbook.addWorksheet("orders");
      ordersSheet.columns = [
        { header: "orderId", key: "orderId", width: 30 },
        { header: "orderNumber", key: "orderNumber", width: 16 },
        { header: "order_number", key: "order_number", width: 16 },
        { header: "status", key: "status", width: 14 },
        { header: "paymentStatus", key: "paymentStatus", width: 18 },
        { header: "payment", key: "payment", width: 16 },
        { header: "customerType", key: "customerType", width: 14 },
        { header: "customerName", key: "customerName", width: 28 },
        { header: "customerPhone", key: "customerPhone", width: 18 },
        { header: "customerEmail", key: "customerEmail", width: 28 },
        { header: "deliveryMethod", key: "deliveryMethod", width: 16 },
        { header: "deliveryProvince", key: "deliveryProvince", width: 24 },
        { header: "deliveryCity", key: "deliveryCity", width: 22 },
        { header: "deliveryPostOffice", key: "deliveryPostOffice", width: 30 },
        { header: "subtotal", key: "subtotal", width: 14 },
        { header: "finalPrice", key: "finalPrice", width: 14 },
        { header: "totalToPay", key: "totalToPay", width: 14 },
        { header: "currency", key: "currency", width: 10 },
        { header: "itemsCount", key: "itemsCount", width: 12 },
        { header: "createdAt", key: "createdAt", width: 28 },
        { header: "updatedAt", key: "updatedAt", width: 28 },
      ];
      ordersSheet.addRows(orderRows);

      const itemsSheet = workbook.addWorksheet("items");
      itemsSheet.columns = [
        { header: "orderId", key: "orderId", width: 30 },
        { header: "orderNumber", key: "orderNumber", width: 16 },
        { header: "itemIndex", key: "itemIndex", width: 10 },
        { header: "offerId", key: "offerId", width: 30 },
        { header: "groupId", key: "groupId", width: 30 },
        { header: "sku", key: "sku", width: 28 },
        { header: "optionKey", key: "optionKey", width: 28 },
        { header: "qty", key: "qty", width: 10 },
        { header: "pricePerUnit", key: "pricePerUnit", width: 14 },
        { header: "itemSubtotal", key: "itemSubtotal", width: 14 },
      ];
      itemsSheet.addRows(itemRows);

      const buffer = await workbook.xlsx.writeBuffer();
      return Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
    },

    async getOrderById(id) {
      if (!mongoose.Types.ObjectId.isValid(String(id))) {
        throw badRequest("Invalid orderId");
      }

      const order = await orderAdminRepo.findById(id);
      if (!order) return null;

      return buildOrderDetails(order);
    },

    async getOrderByNumber(orderNumber) {
      const order = await orderAdminRepo.findByOrderNumber(orderNumber);
      if (!order) return null;

      return buildOrderDetails(order);
    },

    async createOrder(payload = {}, actor = null) {
      if (!Array.isArray(payload.items) || !payload.items.length) {
        throw badRequest("items are required");
      }

      let user = null;
      let userId = null;
      let customerType = "guest";

      if (payload.userId !== undefined && payload.userId !== null && payload.userId !== "") {
        if (!mongoose.Types.ObjectId.isValid(String(payload.userId))) {
          throw badRequest("Invalid userId");
        }

        user = await orderAdminRepo.findUserById(payload.userId);
        if (!user) throw badRequest("User not found");

        userId = user._id;
        customerType = "registered";
      }

      const items = await buildAdminOrderItems(orderAdminRepo, payload.items);
      const subtotal = items.reduce((sum, item) => sum + Number(item.subtotal || 0), 0);

      const usedBonusBalance = 0;
      const usedReferralBalance = 0;
      const adminDiscount = Math.max(0, Number(payload?.discount?.adminDiscount || 0));

      const status = payload?.status ? String(payload.status) : "new";
      if (!ALLOWED_STATUSES.has(status)) throw badRequest("Invalid status");

      const paymentStatus = payload?.paymentInfo?.paymentStatus
        ? String(payload.paymentInfo.paymentStatus)
        : "unpaid";
      if (!ALLOWED_PAYMENT_STATUSES.has(paymentStatus)) {
        throw badRequest("Invalid paymentStatus");
      }

      const finalPrice = Math.max(
        0,
        subtotal - usedBonusBalance - usedReferralBalance - adminDiscount
      );

      const orderNumber = await orderAdminRepo.getNextOrderNumber();

      const created = await orderAdminRepo.create({
        userId,
        customerType,
        orderNumber,
        order_number: String(orderNumber),

        items,

        subtotal,
        usedBonusBalance,
        usedReferralBalance,
        adminDiscount,
        adminDiscountComment: String(payload?.discount?.adminDiscountComment || ""),
        totalToPay: finalPrice,
        finalPrice,
        currency: "UAH",

        lastName: String(payload?.customer?.lastName || ""),
        firstName: String(payload?.customer?.firstName || ""),
        middleName: String(payload?.customer?.middleName || ""),
        customerPhone: String(payload?.customer?.customerPhone || ""),
        customerEmail: String(payload?.customer?.customerEmail || ""),

        deliveryMethod: String(payload?.delivery?.deliveryMethod || ""),
        deliveryProvince: String(payload?.delivery?.deliveryProvince || ""),
        deliveryCity: String(payload?.delivery?.deliveryCity || ""),
        deliveryPostOffice: String(payload?.delivery?.deliveryPostOffice || ""),

        promoCode: String(payload?.promoCode || ""),
        payment: String(payload?.paymentInfo?.payment || ""),
        paymentStatus,
        installmentMonths:
          String(payload?.paymentInfo?.payment || "") === "installment"
            ? Math.max(0, parseIntSafe(payload?.paymentInfo?.installmentMonths, 0))
            : 0,

        status,
        adminComment: String(payload?.adminComment || ""),
        payments: [],
        sitniks: {},
        changeLog: [
          {
            action: "order_created_by_admin",
            byUserId: actor?._id || null,
            payload,
            createdAt: new Date(),
          },
        ],
      });

      return buildOrderDetails(created);
    },

    async updateOrder(id, payload = {}, actor = null) {
      const existing = await orderAdminRepo.findById(id);
      if (!existing) return null;

      const patch = {
        updatedAt: new Date(),
      };

      if (payload.status !== undefined) {
        const nextStatus = String(payload.status || "");
        if (!ALLOWED_STATUSES.has(nextStatus)) throw badRequest("Invalid status");
        patch.status = nextStatus;
      }

      if (payload.customer && typeof payload.customer === "object") {
        patch.lastName =
          payload.customer.lastName !== undefined
            ? String(payload.customer.lastName || "")
            : existing.lastName;

        patch.firstName =
          payload.customer.firstName !== undefined
            ? String(payload.customer.firstName || "")
            : existing.firstName;

        patch.middleName =
          payload.customer.middleName !== undefined
            ? String(payload.customer.middleName || "")
            : existing.middleName;

        patch.customerPhone =
          payload.customer.customerPhone !== undefined
            ? String(payload.customer.customerPhone || "")
            : existing.customerPhone;

        patch.customerEmail =
          payload.customer.customerEmail !== undefined
            ? String(payload.customer.customerEmail || "")
            : existing.customerEmail;
      }

      if (payload.delivery && typeof payload.delivery === "object") {
        patch.deliveryMethod =
          payload.delivery.deliveryMethod !== undefined
            ? String(payload.delivery.deliveryMethod || "")
            : existing.deliveryMethod;

        patch.deliveryProvince =
          payload.delivery.deliveryProvince !== undefined
            ? String(payload.delivery.deliveryProvince || "")
            : existing.deliveryProvince;

        patch.deliveryCity =
          payload.delivery.deliveryCity !== undefined
            ? String(payload.delivery.deliveryCity || "")
            : existing.deliveryCity;

        patch.deliveryPostOffice =
          payload.delivery.deliveryPostOffice !== undefined
            ? String(payload.delivery.deliveryPostOffice || "")
            : existing.deliveryPostOffice;
      }

      if (payload.paymentInfo && typeof payload.paymentInfo === "object") {
        patch.payment =
          payload.paymentInfo.payment !== undefined
            ? String(payload.paymentInfo.payment || "")
            : existing.payment;

        if (payload.paymentInfo.paymentStatus !== undefined) {
          const nextPaymentStatus = String(payload.paymentInfo.paymentStatus || "");
          if (!ALLOWED_PAYMENT_STATUSES.has(nextPaymentStatus)) {
            throw badRequest("Invalid paymentStatus");
          }
          patch.paymentStatus = nextPaymentStatus;
        } else {
          patch.paymentStatus = existing.paymentStatus || "unpaid";
        }

        patch.installmentMonths =
          (patch.payment || existing.payment) === "installment"
            ? Math.max(
                0,
                parseIntSafe(
                  payload.paymentInfo.installmentMonths,
                  existing.installmentMonths || 0
                )
              )
            : 0;
      }

      if (payload.discount && typeof payload.discount === "object") {
        patch.adminDiscount = Math.max(0, Number(payload.discount.adminDiscount || 0));
        patch.adminDiscountComment =
          payload.discount.adminDiscountComment !== undefined
            ? String(payload.discount.adminDiscountComment || "")
            : existing.adminDiscountComment || "";
      } else {
        patch.adminDiscount = Number(existing.adminDiscount || 0);
        patch.adminDiscountComment = existing.adminDiscountComment || "";
      }

      if (payload.adminComment !== undefined) {
        patch.adminComment = String(payload.adminComment || "");
      }

      let nextItems = existing.items || [];

      if (Array.isArray(payload.items)) {
        nextItems = await buildAdminOrderItems(orderAdminRepo, payload.items);
        patch.items = nextItems;
      }

      const subtotal = (patch.items || nextItems || []).reduce(
        (sum, item) => sum + Number(item.subtotal || 0),
        0
      );

      const usedBonusBalance = Number(existing.usedBonusBalance || 0);
      const usedReferralBalance = Number(existing.usedReferralBalance || 0);
      const adminDiscount = Number(patch.adminDiscount || 0);

      const finalPrice = Math.max(
        0,
        subtotal - usedBonusBalance - usedReferralBalance - adminDiscount
      );

      patch.subtotal = subtotal;
      patch.finalPrice = finalPrice;
      patch.totalToPay = finalPrice;

      const updated = await orderAdminRepo.updateById(id, patch);

      await orderAdminRepo.appendChangeLog(id, {
        action: "order_updated",
        byUserId: actor?._id || null,
        payload,
      });

      return buildOrderDetails(updated);
    },
  };
}