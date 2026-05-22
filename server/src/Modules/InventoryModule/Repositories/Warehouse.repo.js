import { Warehouse } from "../Models/Warehouse.model.js";

export function createWarehouseRepo() {
  return {
    async findPage(filter = {}, { skip = 0, limit = 50, sort = { sort: 1, _id: 1 } } = {}) {
      const [items, total] = await Promise.all([
        Warehouse.find(filter).sort(sort).skip(skip).limit(limit).lean(),
        Warehouse.countDocuments(filter),
      ]);

      return { items, total };
    },

    async findAllActive() {
      return Warehouse.find({ status: "active" }).sort({ sort: 1, _id: 1 }).lean();
    },

    async findById(id) {
      return Warehouse.findById(id).lean();
    },

    async findByCode(code) {
      return Warehouse.findOne({ code }).lean();
    },

    async create(doc) {
      const created = await Warehouse.create(doc);
      return created.toObject();
    },

    async updateById(id, patch) {
      return Warehouse.findByIdAndUpdate(id, patch, {
        new: true,
        runValidators: true,
      }).lean();
    },
  };
}