import mongoose from "mongoose";
import { Offer } from "../../CatalogModule/Models/Offer.model.js";
import { ProductGroup } from "../../CatalogModule/Models/ProductGroup.model.js";

function normalizeStockRow(stock) {
  const onHand = Math.max(0, Number(stock?.onHand || 0));
  const reserved = Math.min(onHand, Math.max(0, Number(stock?.reserved || 0)));
  const available = Math.max(0, onHand - reserved);

  return {
    warehouseId: stock?.warehouseId || null,
    onHand,
    reserved,
    available,
    purchasePrice: Math.max(0, Number(stock?.purchasePrice || 0)),
    updatedAt: stock?.updatedAt || null,
  };
}

export function createInventoryRepo() {
  return {
    async findOfferById(id, { session = null } = {}) {
      const q = Offer.findById(id);
      if (session) q.session(session);
      return q.lean();
    },

    async findOfferDocById(id, { session = null } = {}) {
      const q = Offer.findById(id);
      if (session) q.session(session);
      return q;
    },

    async findOffersAdminPage(filter = {}, { skip = 0, limit = 50, sort = { _id: -1 } } = {}) {
      const [items, total] = await Promise.all([
        Offer.find(filter)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        Offer.countDocuments(filter),
      ]);

      return { items, total };
    },

    async findGroupsMapByIds(ids = []) {
      if (!ids.length) return new Map();

      const groups = await ProductGroup.find(
        { _id: { $in: ids } },
        { title: 1, slug: 1, imageURL: 1, categoryIds: 1 }
      ).lean();

      return new Map(groups.map((g) => [String(g._id), g]));
    },

    async searchOffersForStock({ q = "", categoryId = null, limit = 50 } = {}) {
      const filter = {};

      if (q && String(q).trim()) {
        const rx = new RegExp(String(q).trim(), "i");
        filter.$or = [{ sku: rx }];
      }

      const offers = await Offer.find(filter)
        .sort({ _id: -1 })
        .limit(limit)
        .lean();

      if (!categoryId) return offers;

      const groupIds = [...new Set(offers.map((x) => String(x.groupId)).filter(Boolean))];
      const groups = await ProductGroup.find(
        { _id: { $in: groupIds }, categoryIds: categoryId },
        { _id: 1 }
      ).lean();

      const allowed = new Set(groups.map((g) => String(g._id)));
      return offers.filter((x) => allowed.has(String(x.groupId)));
    },

    ensureWarehouseStock(offerDoc, warehouseId) {
      offerDoc.stocks = Array.isArray(offerDoc.stocks) ? offerDoc.stocks : [];

      let row = offerDoc.stocks.find((s) => String(s.warehouseId) === String(warehouseId));
      if (!row) {
        row = {
          warehouseId,
          onHand: 0,
          reserved: 0,
          purchasePrice: 0,
          updatedAt: new Date(),
        };
        offerDoc.stocks.push(row);
      }

      return row;
    },

    calcOfferTotals(stocks = []) {
      let onHand = 0;
      let reserved = 0;

      for (const stock of stocks || []) {
        const n = normalizeStockRow(stock);
        onHand += n.onHand;
        reserved += n.reserved;
      }

      return {
        onHand,
        reserved,
        available: Math.max(0, onHand - reserved),
      };
    },
  };
}