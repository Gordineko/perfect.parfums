import { StockMovement } from "../Models/StockMovement.model.js";

export function createStockMovementRepo() {
  return {
    async create(doc, { session = null } = {}) {
      const [created] = await StockMovement.create([doc], { session });
      return created.toObject();
    },

    async insertMany(docs, { session = null } = {}) {
      if (!docs.length) return [];
      return StockMovement.insertMany(docs, { session });
    },

    async findPage(filter = {}, { skip = 0, limit = 50, sort = { createdAt: -1, _id: -1 } } = {}) {
      const [items, total] = await Promise.all([
        StockMovement.find(filter)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .populate("warehouseId", "code title status")
          .populate("relatedWarehouseId", "code title status")
          .populate("offerId", "sku optionKey optionValues")
          .lean(),
        StockMovement.countDocuments(filter),
      ]);

      return { items, total };
    },
  };
}