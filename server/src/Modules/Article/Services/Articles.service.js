// src/Modules/ArticlesModule/Services/article.service.js
import mongoose from "mongoose";
import { articleRepo } from "../Repositories/Articles.repo.js";
import { ArticleModel } from "../Models/Article.model.js";

// src/Common/slugifyUa.js
export function slugifyUa(str = "") {
  return String(str)
    .trim()
    .toLowerCase()
    .replace(/ї/g, "yi")
    .replace(/і/g, "i")
    .replace(/є/g, "ye")
    .replace(/ґ/g, "g")
    .replace(/й/g, "y")
    .replace(/ю/g, "yu")
    .replace(/я/g, "ya")
    .replace(/ж/g, "zh")
    .replace(/х/g, "kh")
    .replace(/ш/g, "sh")
    .replace(/щ/g, "shch")
    .replace(/ч/g, "ch")
    .replace(/ц/g, "ts")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isObjectId(value) {
  return mongoose.Types.ObjectId.isValid(String(value || ""));
}

export const articleService = {
  async list(filter, options) {
    if (options === undefined) return articleRepo.list(filter);
    return articleRepo.list(filter, options);
  },

  async getBySlug(slug) {
    return ArticleModel.findOne({ slug: String(slug || "").trim() }).exec();
  },

  async get(id) {
    return articleRepo.getById(id);
  },

  async getByIdOrSlug(idOrSlug) {
    const key = String(idOrSlug || "").trim();
    if (!key) return null;

    if (isObjectId(key)) {
      return articleRepo.getById(key);
    }

    return this.getBySlug(key);
  },

  async existsBySlug(slug, excludeId = null) {
    const q = { slug: String(slug || "").trim() };
    if (excludeId) q._id = { $ne: excludeId };
    const exists = await ArticleModel.exists(q);
    return Boolean(exists);
  },

  async create(payload) {
    const titleUa = payload?.title?.ua || payload?.title?.uk || "";
    const slug =
      payload.slug?.trim() || slugifyUa(titleUa) || `article-${Date.now()}`;

    const isActive =
      typeof payload.isActive === "boolean" ? payload.isActive : true;

    const publishedAt =
      isActive && !payload.publishedAt ? new Date() : payload.publishedAt || null;

    return articleRepo.create({
      ...payload,
      slug,
      isActive,
      publishedAt,
    });
  },

  async updateById(id, payload) {
    const existing = await articleRepo.getById(id);
    if (!existing) throw new Error("Article not found");

    const next = this._applyUpdateRules(existing, payload);
    return articleRepo.update(id, next);
  },

  async updateBySlug(slug, payload) {
    const existing = await this.getBySlug(slug);
    if (!existing) throw new Error("Article not found");

    const next = this._applyUpdateRules(existing, payload);
    // обновляем по _id
    return articleRepo.update(existing._id, next);
  },

  async updateByIdOrSlug(idOrSlug, payload) {
    const key = String(idOrSlug || "").trim();
    if (!key) throw new Error("Article not found");

    if (isObjectId(key)) return this.updateById(key, payload);
    return this.updateBySlug(key, payload);
  },

  _applyUpdateRules(existing, payload) {
    let slug = existing.slug;

    if (payload.slug) slug = String(payload.slug).trim();
    else if (!existing.slug && (payload?.title?.ua || payload?.title?.uk)) {
      slug = slugifyUa(payload.title.ua || payload.title.uk);
    }

    const isActive =
      typeof payload.isActive === "boolean" ? payload.isActive : existing.isActive;

    let publishedAt = existing.publishedAt || null;
    if (!existing.isActive && isActive && !publishedAt) {
      publishedAt = new Date();
    }

    return {
      ...payload,
      slug,
      isActive,
      publishedAt,
    };
  },

  async remove(id) {
    return articleRepo.remove(id);
  },
};
