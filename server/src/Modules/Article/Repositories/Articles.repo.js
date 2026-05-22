// src/Modules/ArticlesModule/Repositories/article.repo.js
import { ArticleModel } from "../Models/Article.model.js";

export const articleRepo = {
  async list({ page = 1, limit = 20, search = "", published } = {}) {
    const query = {};

    if (search) {
      query["title.ua"] = { $regex: search, $options: "i" };
    }

    if (typeof published === "boolean") {
      query.isPublished = published;
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      ArticleModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ArticleModel.countDocuments(query),
    ]);

    return { items, total, page, limit };
  },

  async getById(id) {
    return ArticleModel.findById(id).lean();
  },

  async getBySlug(slug) {
    return ArticleModel.findOne({ slug, isPublished: true }).lean();
  },

  async create(data) {
    const doc = await ArticleModel.create(data);
    return doc.toObject();
  },

  async update(id, data) {
    const doc = await ArticleModel.findByIdAndUpdate(id, data, {
      new: true,
    }).lean();
    return doc;
  },

  async remove(id) {
    await ArticleModel.findByIdAndDelete(id);
  },
};
