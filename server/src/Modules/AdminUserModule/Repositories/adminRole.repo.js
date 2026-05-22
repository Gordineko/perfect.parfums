import { AdminRoleModel } from "../Models/AdminRole.model.js";

export function createAdminRoleRepo() {
  return {
    async findById(id) {
      return AdminRoleModel.findById(id).lean();
    },

    async findByIds(ids = []) {
      if (!Array.isArray(ids) || !ids.length) return [];
      return AdminRoleModel.find({
        _id: { $in: ids },
        isActive: true,
      }).lean();
    },

    async findByCode(code) {
      return AdminRoleModel.findOne({
        code: String(code || "").trim().toLowerCase(),
      }).lean();
    },

    async list({ onlyActive = true } = {}) {
      const filter = onlyActive ? { isActive: true } : {};
      return AdminRoleModel.find(filter)
        .sort({ level: -1, name: 1 })
        .lean();
    },

    async create(data) {
      const doc = await AdminRoleModel.create(data);
      return doc.toObject();
    },

    async updateById(id, patch) {
      return AdminRoleModel.findByIdAndUpdate(id, patch, {
        new: true,
        runValidators: true,
      }).lean();
    },
  };
}