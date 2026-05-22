import mongoose from "mongoose";

function badRequest(message, details = null) {
  const err = new Error(message);
  err.code = "BAD_REQUEST";
  err.status = 400;
  if (details) err.details = details;
  return err;
}

function escapeCsv(value) {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes('"') || str.includes(",") || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildFullName(user) {
  return [user?.lastName, user?.firstName, user?.middleName]
    .filter(Boolean)
    .join(" ")
    .trim();
}

function normalizePhone(value = "") {
  return String(value || "").replace(/[^\d+]/g, "").trim();
}

function buildSearchFilter(q) {
  if (!q || !String(q).trim()) return {};

  const raw = String(q).trim();
  const rx = new RegExp(raw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  const phone = normalizePhone(raw);

  const or = [
    { firstName: rx },
    { lastName: rx },
    { middleName: rx },
    { email: rx },
  ];

  if (phone) {
    or.push({ phone: { $regex: phone, $options: "i" } });
  }

  return { $or: or };
}

function calcReliability(stats) {
  const total = Number(stats?.ordersCount || 0);
  const success = Number(stats?.successOrders || 0);

  if (!total) {
    return {
      label: "Без рейтингу",
      percent: null,
    };
  }

  const percent = Math.round((success / total) * 100);

  return {
    label: `${percent}%`,
    percent,
  };
}

function formatChart(rows = [], months = 12) {
  const now = new Date();
  const map = new Map();

  for (const row of rows) {
    const key = `${row._id.y}-${row._id.m}`;
    map.set(key, {
      year: row._id.y,
      month: row._id.m,
      turnover: Number(row.turnover || 0),
      ordersCount: Number(row.ordersCount || 0),
    });
  }

  const result = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const key = `${y}-${m}`;
    const item = map.get(key);

    result.push({
      year: y,
      month: m,
      label: `${String(m).padStart(2, "0")}.${y}`,
      turnover: Number(item?.turnover || 0),
      ordersCount: Number(item?.ordersCount || 0),
    });
  }

  return result;
}

function mapOrderRow(order) {
  const customerName = [order?.lastName, order?.firstName, order?.middleName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return {
    _id: order._id,
    orderNumber: order.orderNumber,
    order_number: order.order_number,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt || null,
    status: order.status || "",
    paymentStatus: order.paymentStatus || "unpaid",
    payment: order.payment || "",
    finalPrice: Number(order.finalPrice || 0),
    totalToPay: Number(order.totalToPay || 0),
    subtotal: Number(order.subtotal || 0),
    currency: order.currency || "UAH",
    items: Array.isArray(order.items) ? order.items : [],
    customer: {
      fullName: customerName,
      phone: order.customerPhone || "",
      email: order.customerEmail || "",
    },
    delivery: {
      deliveryProvince: order.deliveryProvince || "",
      deliveryCity: order.deliveryCity || "",
      deliveryPostOffice: order.deliveryPostOffice || "",
      label: [order.deliveryProvince, order.deliveryCity, order.deliveryPostOffice]
        .filter(Boolean)
        .join(", "),
    },
  };
}

function normalizeString(value = "") {
  return String(value || "").trim();
}

function normalizeTags(tags) {
  if (!Array.isArray(tags)) return [];
  return tags.map((x) => String(x || "").trim()).filter(Boolean);
}

export function createCustomerAdminService({ customerRepo }) {
  return {
    async listCustomers(params = {}) {
      const page = Math.max(1, Number(params.page || 1));
      const limit = Math.min(200, Math.max(1, Number(params.limit || 10)));
      const skip = (page - 1) * limit;

      const filter = buildSearchFilter(params.q);

      const { items, total } = await customerRepo.findUsersPage(filter, {
        skip,
        limit,
        sort: { createdAt: -1, _id: -1 },
      });

      const statsRows = await customerRepo.aggregateOrderStatsByUserIds(
        items.map((x) => x._id)
      );

      const statsMap = new Map(statsRows.map((x) => [String(x._id), x]));

      const rows = items.map((user) => {
        const stats = statsMap.get(String(user._id)) || {};
        const reliability = calcReliability(stats);

        return {
          _id: user._id,
          fullName: buildFullName(user),
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          middleName: user.middleName || "",
          email: user.email || "",
          phone: user.phone || "",
          status: user.status || "active",
          customerTags: Array.isArray(user.customerTags) ? user.customerTags : [],
          assignedManager: user.assignedManager || null,
          reliability,
          ordersCount: Number(stats.ordersCount || 0),
          turnover: Number(stats.turnover || 0),
          lastOrderAt: stats.lastOrderAt || null,
          createdAt: user.createdAt || null,
        };
      });

      return {
        items: rows,
        meta: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    },

    async getCustomerProfile(userId, params = {}) {
      if (!mongoose.Types.ObjectId.isValid(String(userId))) {
        throw badRequest("Invalid userId");
      }

      const page = Math.max(1, Number(params.page || 1));
      const limit = Math.min(200, Math.max(1, Number(params.limit || 10)));
      const skip = (page - 1) * limit;

      const user = await customerRepo.findById(userId);
      if (!user) return null;

      const statsRows = await customerRepo.aggregateOrderStatsByUserIds([userId]);
      const stats = statsRows[0] || {};

      const { items: orders, total } = await customerRepo.listOrdersByUser(userId, {
        skip,
        limit,
        sort: { createdAt: -1, _id: -1 },
      });

      const chartRows = await customerRepo.aggregateTurnoverChart(userId, {
        months: 12,
      });

      const reliability = calcReliability(stats);

      return {
        customer: {
          _id: user._id,
          fullName: buildFullName(user),
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          middleName: user.middleName || "",
          email: user.email || "",
          phone: user.phone || "",
          status: user.status || "active",
          bonusBalance: Number(user.bonusBalance || 0),
          referralBalance: Number(user.referralBalance || 0),
          customerTags: Array.isArray(user.customerTags) ? user.customerTags : [],
          customerNotes: Array.isArray(user.customerNotes) ? user.customerNotes : [],
          assignedManager: user.assignedManager || null,
          delivery: {
            deliveryProvince: user.deliveryProvince || "",
            deliveryCity: user.deliveryCity || "",
            deliveryPostOffice: user.deliveryPostOffice || "",
            label: [user.deliveryProvince, user.deliveryCity, user.deliveryPostOffice]
              .filter(Boolean)
              .join(", "),
          },
          createdAt: user.createdAt || null,
          updatedAt: user.updatedAt || null,
        },
        summary: {
          reliability,
          ordersCount: Number(stats.ordersCount || 0),
          turnover: Number(stats.turnover || 0),
          successfulOrders: Number(stats.successOrders || 0),
          failedOrders: Number(stats.failedOrders || 0),
          activeOrders: Number(stats.activeOrders || 0),
          lastOrderAt: stats.lastOrderAt || null,
        },
        chart: formatChart(chartRows, 12),
        orders: orders.map(mapOrderRow),
        meta: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    },

    async getCustomerOrders(userId, params = {}) {
      if (!mongoose.Types.ObjectId.isValid(String(userId))) {
        throw badRequest("Invalid userId");
      }

      const user = await customerRepo.findById(userId);
      if (!user) return null;

      const page = Math.max(1, Number(params.page || 1));
      const limit = Math.min(200, Math.max(1, Number(params.limit || 10)));
      const skip = (page - 1) * limit;

      const { items, total } = await customerRepo.listOrdersByUser(userId, {
        skip,
        limit,
        sort: { createdAt: -1, _id: -1 },
      });

      return {
        items: items.map(mapOrderRow),
        meta: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    },

    async updateCustomer(userId, payload = {}, actor = null) {
      if (!mongoose.Types.ObjectId.isValid(String(userId))) {
        throw badRequest("Invalid userId");
      }

      const current = await customerRepo.findById(userId);
      if (!current) return null;

      const patch = {};

      if (payload.firstName !== undefined) patch.firstName = normalizeString(payload.firstName);
      if (payload.lastName !== undefined) patch.lastName = normalizeString(payload.lastName);
      if (payload.middleName !== undefined) patch.middleName = normalizeString(payload.middleName);
      if (payload.email !== undefined) patch.email = normalizeString(payload.email).toLowerCase();
      if (payload.phone !== undefined) patch.phone = normalizeString(payload.phone);
      if (payload.deliveryProvince !== undefined) patch.deliveryProvince = normalizeString(payload.deliveryProvince);
      if (payload.deliveryCity !== undefined) patch.deliveryCity = normalizeString(payload.deliveryCity);
      if (payload.deliveryPostOffice !== undefined) patch.deliveryPostOffice = normalizeString(payload.deliveryPostOffice);
      if (payload.customerTags !== undefined) patch.customerTags = normalizeTags(payload.customerTags);

      if (payload.assignedManager !== undefined) {
        if (
          payload.assignedManager !== null &&
          payload.assignedManager !== "" &&
          !mongoose.Types.ObjectId.isValid(String(payload.assignedManager))
        ) {
          throw badRequest("Invalid assignedManager");
        }
        patch.assignedManager = payload.assignedManager || null;
      }

      if (payload.note !== undefined && normalizeString(payload.note)) {
        patch.$push = {
          customerNotes: {
            text: normalizeString(payload.note),
            createdAt: new Date(),
            authorId: actor?._id || null,
            authorName: actor?.email || "",
          },
        };
      }

      const updated = await customerRepo.updateById(userId, patch);
      return updated;
    },

    async updateCustomerStatus(userId, status, actor = null) {
      if (!mongoose.Types.ObjectId.isValid(String(userId))) {
        throw badRequest("Invalid userId");
      }

      const allowed = ["active", "blocked", "pending"];
      if (!allowed.includes(String(status || ""))) {
        throw badRequest("Invalid status", { allowed });
      }

      const current = await customerRepo.findById(userId);
      if (!current) return null;

      const updated = await customerRepo.updateById(userId, {
        status: String(status),
        $push: {
          customerNotes: {
            text: `Статус змінено на ${String(status)}`,
            createdAt: new Date(),
            authorId: actor?._id || null,
            authorName: actor?.email || "",
          },
        },
      });

      return updated;
    },

    async exportCustomersCsv(params = {}) {
      const data = await this.listCustomers({
        q: params.q,
        page: 1,
        limit: 10000,
      });

      const headers = [
        "userId",
        "fullName",
        "phone",
        "email",
        "status",
        "reliability",
        "ordersCount",
        "turnover",
        "lastOrderAt",
        "tags",
        "assignedManager",
      ];

      const lines = [headers.join(",")];

      for (const row of data.items) {
        lines.push(
          [
            escapeCsv(row._id),
            escapeCsv(row.fullName),
            escapeCsv(row.phone),
            escapeCsv(row.email),
            escapeCsv(row.status),
            escapeCsv(row.reliability?.label || ""),
            escapeCsv(row.ordersCount),
            escapeCsv(row.turnover),
            escapeCsv(row.lastOrderAt || ""),
            escapeCsv((row.customerTags || []).join(" | ")),
            escapeCsv(
              row.assignedManager
                ? [row.assignedManager.lastName, row.assignedManager.firstName]
                    .filter(Boolean)
                    .join(" ")
                : ""
            ),
          ].join(",")
        );
      }

      return lines.join("\n");
    },

    async exportCustomerOrdersCsv(userId) {
      if (!mongoose.Types.ObjectId.isValid(String(userId))) {
        throw badRequest("Invalid userId");
      }

      const user = await customerRepo.findById(userId);
      if (!user) throw badRequest("Customer not found");

      const orders = await customerRepo.listAllOrdersByUser(userId);

      const headers = [
        "orderId",
        "orderNumber",
        "createdAt",
        "status",
        "paymentStatus",
        "payment",
        "subtotal",
        "finalPrice",
        "totalToPay",
        "currency",
      ];

      const lines = [headers.join(",")];

      for (const order of orders) {
        lines.push(
          [
            escapeCsv(order._id),
            escapeCsv(order.orderNumber || order.order_number || ""),
            escapeCsv(order.createdAt || ""),
            escapeCsv(order.status || ""),
            escapeCsv(order.paymentStatus || ""),
            escapeCsv(order.payment || ""),
            escapeCsv(order.subtotal || 0),
            escapeCsv(order.finalPrice || 0),
            escapeCsv(order.totalToPay || 0),
            escapeCsv(order.currency || "UAH"),
          ].join(",")
        );
      }

      return lines.join("\n");
    },
  };
}