import mongoose from "mongoose";

function badRequest(message, details = null) {
  const err = new Error(message);
  err.code = "BAD_REQUEST";
  err.status = 400;
  if (details) err.details = details;
  return err;
}

function toObjectIdOrNull(value) {
  if (!value) return null;
  return mongoose.Types.ObjectId.isValid(String(value))
    ? new mongoose.Types.ObjectId(String(value))
    : null;
}

function toPositiveNumber(value, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return n < 0 ? 0 : n;
}

export function createStockOperationService({
  inventoryRepo,
  warehouseRepo,
  stockMovementRepo,
  stockDocumentRepo,
}) {
  return {
    async intake(payload = {}, actor = null) {
      const defaultWarehouseId = payload.warehouseId || null;

      if (!Array.isArray(payload.items) || !payload.items.length) {
        throw badRequest("items are required");
      }

      const resultItems = [];
      const movementDocs = [];

      for (const [index, row] of payload.items.entries()) {
        const offerId = row?.offerId;
        const warehouseId = row?.warehouseId || defaultWarehouseId;
        const qty = toPositiveNumber(row?.qty, 0);

        if (!mongoose.Types.ObjectId.isValid(String(offerId))) {
          throw badRequest(`Invalid offerId in items[${index}]`);
        }

        if (!mongoose.Types.ObjectId.isValid(String(warehouseId))) {
          throw badRequest(`Invalid warehouseId in items[${index}]`);
        }

        if (qty <= 0) {
          throw badRequest(`qty must be > 0 in items[${index}]`);
        }

        const warehouse = await warehouseRepo.findById(warehouseId);
        if (!warehouse) {
          throw badRequest(`Warehouse not found in items[${index}]`);
        }

        const offerDoc = await inventoryRepo.findOfferDocById(offerId);
        if (!offerDoc) {
          throw badRequest(`Offer not found in items[${index}]`);
        }

        const stockRow = inventoryRepo.ensureWarehouseStock(offerDoc, warehouseId);

        const beforeOnHand = Number(stockRow.onHand || 0);
        const beforeReserved = Number(stockRow.reserved || 0);

        stockRow.onHand = beforeOnHand + qty;
        stockRow.purchasePrice = Math.max(
          0,
          Number(row?.purchasePrice || stockRow.purchasePrice || 0)
        );
        stockRow.updatedAt = new Date();

        await offerDoc.save();

        resultItems.push({
          offerId: offerDoc._id,
          groupId: offerDoc.groupId || null,
          fromWarehouseId: null,
          toWarehouseId: warehouseId,
          qty,
          purchasePrice: Number(row?.purchasePrice || 0),
          catalogPrice: Number(row?.catalogPrice || 0),
          comment: String(row?.comment || ""),
        });

        movementDocs.push({
          offerId: offerDoc._id,
          groupId: offerDoc.groupId || null,
          warehouseId,
          relatedWarehouseId: null,
          type: "incoming",
          qtyDelta: qty,
          reservedDelta: 0,
          beforeOnHand,
          afterOnHand: stockRow.onHand,
          beforeReserved,
          afterReserved: stockRow.reserved,
          comment: row?.comment || payload?.comment || "Incoming stock",
          actorUserId: actor?._id || null,
          actorName: actor?.email || "",
          meta: {
            purchasePrice: Number(row?.purchasePrice || 0),
            catalogPrice: Number(row?.catalogPrice || 0),
          },
        });
      }

      const document = await stockDocumentRepo.create({
        type: "incoming",
        warehouseId: defaultWarehouseId && mongoose.Types.ObjectId.isValid(String(defaultWarehouseId))
          ? defaultWarehouseId
          : null,
        fromWarehouseId: null,
        toWarehouseId: null,
        currency: payload.currency || "UAH",
        comment: String(payload.comment || ""),
        status: "applied",
        actorUserId: actor?._id || null,
        actorName: actor?.email || "",
        items: resultItems,
      });

      const docsWithDocumentId = movementDocs.map((x) => ({
        ...x,
        documentId: document._id,
      }));

      await stockMovementRepo.insertMany(docsWithDocumentId);

      return {
        ok: true,
        documentId: document._id,
      };
    },

    async stocktake(payload = {}, actor = null) {
      const defaultWarehouseId = payload.warehouseId || null;

      if (!Array.isArray(payload.items) || !payload.items.length) {
        throw badRequest("items are required");
      }

      const resultItems = [];
      const movementDocs = [];

      for (const [index, row] of payload.items.entries()) {
        const offerId = row?.offerId;
        const warehouseId = row?.warehouseId || defaultWarehouseId;
        const factQty = toPositiveNumber(row?.factQty, 0);

        if (!mongoose.Types.ObjectId.isValid(String(offerId))) {
          throw badRequest(`Invalid offerId in items[${index}]`);
        }

        if (!mongoose.Types.ObjectId.isValid(String(warehouseId))) {
          throw badRequest(`Invalid warehouseId in items[${index}]`);
        }

        const warehouse = await warehouseRepo.findById(warehouseId);
        if (!warehouse) {
          throw badRequest(`Warehouse not found in items[${index}]`);
        }

        const offerDoc = await inventoryRepo.findOfferDocById(offerId);
        if (!offerDoc) {
          throw badRequest(`Offer not found in items[${index}]`);
        }

        const stockRow = inventoryRepo.ensureWarehouseStock(offerDoc, warehouseId);

        const beforeOnHand = Number(stockRow.onHand || 0);
        const beforeReserved = Number(stockRow.reserved || 0);

        stockRow.onHand = factQty;
        if (Number(stockRow.reserved || 0) > stockRow.onHand) {
          stockRow.reserved = stockRow.onHand;
        }
        stockRow.updatedAt = new Date();

        await offerDoc.save();

        resultItems.push({
          offerId: offerDoc._id,
          groupId: offerDoc.groupId || null,
          fromWarehouseId: null,
          toWarehouseId: warehouseId,
          qty: factQty,
          purchasePrice: 0,
          catalogPrice: 0,
          comment: String(row?.comment || ""),
        });

        movementDocs.push({
          offerId: offerDoc._id,
          groupId: offerDoc.groupId || null,
          warehouseId,
          relatedWarehouseId: null,
          type: "stocktake",
          qtyDelta: factQty - beforeOnHand,
          reservedDelta: Number(stockRow.reserved || 0) - beforeReserved,
          beforeOnHand,
          afterOnHand: stockRow.onHand,
          beforeReserved,
          afterReserved: stockRow.reserved,
          comment: row?.comment || payload?.comment || "Stocktake",
          actorUserId: actor?._id || null,
          actorName: actor?.email || "",
          meta: {
            factQty,
          },
        });
      }

      const document = await stockDocumentRepo.create({
        type: "stocktake",
        warehouseId: defaultWarehouseId && mongoose.Types.ObjectId.isValid(String(defaultWarehouseId))
          ? defaultWarehouseId
          : null,
        fromWarehouseId: null,
        toWarehouseId: null,
        currency: payload.currency || "UAH",
        comment: String(payload.comment || ""),
        status: "applied",
        actorUserId: actor?._id || null,
        actorName: actor?.email || "",
        items: resultItems,
      });

      const docsWithDocumentId = movementDocs.map((x) => ({
        ...x,
        documentId: document._id,
      }));

      await stockMovementRepo.insertMany(docsWithDocumentId);

      return {
        ok: true,
        documentId: document._id,
      };
    },

    async transfer(payload = {}, actor = null) {
      const defaultFromWarehouseId = payload.fromWarehouseId || null;
      const defaultToWarehouseId = payload.toWarehouseId || null;

      if (!Array.isArray(payload.items) || !payload.items.length) {
        throw badRequest("items are required");
      }

      const resultItems = [];
      const movementDocs = [];

      for (const [index, row] of payload.items.entries()) {
        const offerId = row?.offerId;
        const fromWarehouseId = row?.fromWarehouseId || defaultFromWarehouseId;
        const toWarehouseId = row?.toWarehouseId || defaultToWarehouseId;
        const qty = toPositiveNumber(row?.qty, 0);

        if (!mongoose.Types.ObjectId.isValid(String(offerId))) {
          throw badRequest(`Invalid offerId in items[${index}]`);
        }

        if (!mongoose.Types.ObjectId.isValid(String(fromWarehouseId))) {
          throw badRequest(`Invalid fromWarehouseId in items[${index}]`);
        }

        if (!mongoose.Types.ObjectId.isValid(String(toWarehouseId))) {
          throw badRequest(`Invalid toWarehouseId in items[${index}]`);
        }

        if (String(fromWarehouseId) === String(toWarehouseId)) {
          throw badRequest(`fromWarehouseId and toWarehouseId must be different in items[${index}]`);
        }

        if (qty <= 0) {
          throw badRequest(`qty must be > 0 in items[${index}]`);
        }

        const fromWarehouse = await warehouseRepo.findById(fromWarehouseId);
        if (!fromWarehouse) {
          throw badRequest(`Source warehouse not found in items[${index}]`);
        }

        const toWarehouse = await warehouseRepo.findById(toWarehouseId);
        if (!toWarehouse) {
          throw badRequest(`Target warehouse not found in items[${index}]`);
        }

        const offerDoc = await inventoryRepo.findOfferDocById(offerId);
        if (!offerDoc) {
          throw badRequest(`Offer not found in items[${index}]`);
        }

        const fromRow = inventoryRepo.ensureWarehouseStock(offerDoc, fromWarehouseId);
        const toRow = inventoryRepo.ensureWarehouseStock(offerDoc, toWarehouseId);

        const beforeFromOnHand = Number(fromRow.onHand || 0);
        const beforeFromReserved = Number(fromRow.reserved || 0);
        const availableFrom = Math.max(0, beforeFromOnHand - beforeFromReserved);

        if (qty > availableFrom) {
          throw badRequest(`Not enough available stock in items[${index}]`);
        }

        const beforeToOnHand = Number(toRow.onHand || 0);
        const beforeToReserved = Number(toRow.reserved || 0);

        fromRow.onHand = beforeFromOnHand - qty;
        toRow.onHand = beforeToOnHand + qty;

        fromRow.updatedAt = new Date();
        toRow.updatedAt = new Date();

        await offerDoc.save();

        resultItems.push({
          offerId: offerDoc._id,
          groupId: offerDoc.groupId || null,
          fromWarehouseId,
          toWarehouseId,
          qty,
          purchasePrice: 0,
          catalogPrice: 0,
          comment: String(row?.comment || ""),
        });

        movementDocs.push(
          {
            offerId: offerDoc._id,
            groupId: offerDoc.groupId || null,
            warehouseId: fromWarehouseId,
            relatedWarehouseId: toWarehouseId,
            type: "transfer_out",
            qtyDelta: -qty,
            reservedDelta: 0,
            beforeOnHand: beforeFromOnHand,
            afterOnHand: fromRow.onHand,
            beforeReserved: beforeFromReserved,
            afterReserved: fromRow.reserved,
            comment: row?.comment || payload?.comment || "Transfer OUT",
            actorUserId: actor?._id || null,
            actorName: actor?.email || "",
            meta: {},
          },
          {
            offerId: offerDoc._id,
            groupId: offerDoc.groupId || null,
            warehouseId: toWarehouseId,
            relatedWarehouseId: fromWarehouseId,
            type: "transfer_in",
            qtyDelta: qty,
            reservedDelta: 0,
            beforeOnHand: beforeToOnHand,
            afterOnHand: toRow.onHand,
            beforeReserved: beforeToReserved,
            afterReserved: toRow.reserved,
            comment: row?.comment || payload?.comment || "Transfer IN",
            actorUserId: actor?._id || null,
            actorName: actor?.email || "",
            meta: {},
          }
        );
      }

      const document = await stockDocumentRepo.create({
        type: "transfer",
        warehouseId: null,
        fromWarehouseId:
          defaultFromWarehouseId && mongoose.Types.ObjectId.isValid(String(defaultFromWarehouseId))
            ? defaultFromWarehouseId
            : null,
        toWarehouseId:
          defaultToWarehouseId && mongoose.Types.ObjectId.isValid(String(defaultToWarehouseId))
            ? defaultToWarehouseId
            : null,
        currency: payload.currency || "UAH",
        comment: String(payload.comment || ""),
        status: "applied",
        actorUserId: actor?._id || null,
        actorName: actor?.email || "",
        items: resultItems,
      });

      const docsWithDocumentId = movementDocs.map((x) => ({
        ...x,
        documentId: document._id,
      }));

      await stockMovementRepo.insertMany(docsWithDocumentId);

      return {
        ok: true,
        documentId: document._id,
      };
    },

    async listMovements(params = {}) {
      const page = Math.max(1, Number(params.page || 1));
      const limit = Math.min(200, Math.max(1, Number(params.limit || 50)));
      const skip = (page - 1) * limit;

      const filter = {};

      if (params.offerId) {
        if (!mongoose.Types.ObjectId.isValid(String(params.offerId))) {
          throw badRequest("Invalid offerId");
        }
        filter.offerId = toObjectIdOrNull(params.offerId);
      }

      if (params.warehouseId) {
        if (!mongoose.Types.ObjectId.isValid(String(params.warehouseId))) {
          throw badRequest("Invalid warehouseId");
        }
        filter.warehouseId = toObjectIdOrNull(params.warehouseId);
      }

      if (params.type) {
        filter.type = String(params.type);
      }

      if (params.documentId) {
        if (!mongoose.Types.ObjectId.isValid(String(params.documentId))) {
          throw badRequest("Invalid documentId");
        }
        filter.documentId = toObjectIdOrNull(params.documentId);
      }

      const { items, total } = await stockMovementRepo.findPage(filter, {
        skip,
        limit,
        sort: { createdAt: -1, _id: -1 },
      });

      return {
        items,
        meta: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    },
  };
}