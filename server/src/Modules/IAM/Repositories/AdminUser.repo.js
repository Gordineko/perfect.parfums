import mongoose from "mongoose";

const UserModel = mongoose.model("User");

export function createUserAdminRepo() {
  return {
    async find(filter = {}, options = {}) {
      const {
        skip = 0,
        limit = 20,
        sort = { createdAt: -1 },
        select = null,
      } = options;

      let query = UserModel.find(filter)
        .skip(Number(skip))
        .limit(Number(limit))
        .sort(sort);

      if (select) {
        query = query.select(select);
      }

      return query.lean();
    },

    async count(filter = {}) {
      return UserModel.countDocuments(filter);
    },

    async findById(id) {
      return UserModel.findById(id).lean();
    },

    async findOne(filter = {}) {
      return UserModel.findOne(filter).lean();
    },

    async create(data) {
      return UserModel.create(data);
    },

    async updateById(id, data) {
      return UserModel.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true,
      }).lean();
    },

    async deleteById(id) {
      return UserModel.findByIdAndDelete(id).lean();
    },

    async exists(filter = {}) {
      const doc = await UserModel.exists(filter);
      return Boolean(doc);
    },
  };
}