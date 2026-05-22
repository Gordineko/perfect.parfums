import { StockDocument } from "../Models/StockDocument.model.js";

export function createStockDocumentRepo() {
  return {
    async create(doc, { session = null } = {}) {
      const [created] = await StockDocument.create([doc], { session });
      return created.toObject();
    },

    async findById(id) {
      return StockDocument.findById(id).lean();
    },

    async findPage(filter = {}, { skip = 0, limit = 50, sort = { createdAt: -1, _id: -1 } } = {}) {
      const [items, total] = await Promise.all([
        StockDocument.find(filter).sort(sort).skip(skip).limit(limit).lean(),
        StockDocument.countDocuments(filter),
      ]);
      return { items, total };
    },
  };
}