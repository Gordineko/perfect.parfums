import { AdminUserModel } from "../Models/AdminUser.model.js";

export function createAdminUserRepo() {
  return {
    async findByLogin(login) {
      return AdminUserModel.findOne({
        login: String(login || "").trim().toLowerCase(),
      })
        .populate("roles")
        .lean();
    },

    async findById(id) {
      return AdminUserModel.findById(id)
        .populate("roles")
        .lean();
    },

    async findPage(
      filter,
      { skip = 0, limit = 20, sort = { createdAt: -1, _id: -1 } } = {}
    ) {
      const [items, total] = await Promise.all([
        AdminUserModel.find(filter)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .populate("roles")
          .lean(),
        AdminUserModel.countDocuments(filter),
      ]);

      return { items, total };
    },

    async create(data) {
      const doc = await AdminUserModel.create(data);
      return AdminUserModel.findById(doc._id).populate("roles").lean();
    },

    async updateById(id, patch) {
      return AdminUserModel.findByIdAndUpdate(id, patch, {
        new: true,
        runValidators: true,
      })
        .populate("roles")
        .lean();
    },
  };
}