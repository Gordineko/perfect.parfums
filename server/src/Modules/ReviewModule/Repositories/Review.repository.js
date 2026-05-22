// Repositories/Review.repository.js
import { ReviewModel } from "../Models/Review.model.js";

export const reviewRepository = {
  async findById(id, { select } = {}) {
    return ReviewModel.findById(id).select(select || "").populate("product").lean();
  },

  async create(data) {
    const doc = await ReviewModel.create(data);
    return this.findById(doc._id);
  },

  async updateById(id, patch) {
    return ReviewModel.findByIdAndUpdate(id, patch, {
      new: true,
      runValidators: true,
    }).populate("product").lean();
  },

  async deleteById(id) {
    return ReviewModel.findByIdAndDelete(id).populate("product").lean();
  },

  async findList({ filter = {}, select = "", sort = "-createdAt", page = 1, limit = 20 }) {
    const skip = Math.max(0, (Number(page) || 1) - 1) * (Number(limit) || 20);
    const [items, total] = await Promise.all([
      ReviewModel.find(filter).select(select).sort(sort).populate("product").skip(skip).limit(Number(limit) || 20).lean(),
      ReviewModel.countDocuments(filter),
    ]);
    return { items, total, page: Number(page) || 1, limit: Number(limit) || 20, totalPages: Math.max(1, Math.ceil(total / (Number(limit) || 20))) };
  },
};
