// Services/Review.service.js
import mongoose from "mongoose";
import { reviewRepository } from "../Repositories/Review.repository.js";
import { ReviewModel } from "../Models/Review.model.js";
import { ProductGroup } from "../../CatalogModule/Models/ProductGroup.model.js";

const isObjectId = (v) => mongoose.Types.ObjectId.isValid(String(v));

function getEntityId(value) {
  if (!value) return null;
  if (typeof value === "object") {
    return value._id ? String(value._id) : null;
  }
  return String(value);
}

function badRequest(message, details = null) {
  const error = new Error(message);
  error.status = 400;
  if (details) error.details = details;
  return error;
}

function buildFilter(qs = {}) {
  const f = {};

  if (qs.reviewId !== undefined || qs.id !== undefined) {
    const reviewId = String(qs.reviewId ?? qs.id ?? "").trim();
    if (!reviewId) {
      throw badRequest("reviewId must not be empty");
    }
    if (!isObjectId(reviewId)) {
      throw badRequest("reviewId must be a valid ObjectId", { reviewId });
    }
    f._id = reviewId;
  }

  const searchConditions = [];
  const q = String(qs.q || "").trim();
  const comment = String(qs.comment || "").trim();

  if (q) {
    const regex = new RegExp(q, "i");
    searchConditions.push({ name: regex }, { text: regex });
  }

  if (comment) {
    searchConditions.push({ text: new RegExp(comment, "i") });
  }

  if (searchConditions.length) {
    f.$or = searchConditions;
  }

  if (qs.status) {
    const arr = String(qs.status)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (arr.length) f.status = { $in: arr };
  }

  const minR = Number(qs.minRating);
  const maxR = Number(qs.maxRating);
  if (Number.isFinite(minR) || Number.isFinite(maxR)) {
    f.rating = {};
    if (Number.isFinite(minR)) f.rating.$gte = Math.max(1, minR);
    if (Number.isFinite(maxR)) f.rating.$lte = Math.min(5, maxR);
  }

  if (qs.productId) {
    const productId = String(qs.productId).trim();
    if (!isObjectId(productId)) {
      throw badRequest("productId must be a valid ObjectId", { productId });
    }
    f.product = productId;
  }

  if (qs.isVisibleProduct !== undefined) {
    f.isVisibleProduct = String(qs.isVisibleProduct).toLowerCase() === "true";
  }

  if (qs.isVisibleMainPage !== undefined) {
    f.isVisibleMainPage = String(qs.isVisibleMainPage).toLowerCase() === "true";
  }

  return f;
}

function buildSelect(qs = {}) {
  // экономия трафика: можно пробросить ?select=name,photoUrl,text
  if (!qs.select) return "";
  return String(qs.select)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .join(" ");
}

async function syncProductRatingSummary(productIds = []) {
  const uniqueIds = Array.from(
    new Set(
      (productIds || [])
        .map((value) => String(value || "").trim())
        .filter((value) => isObjectId(value))
    )
  );

  if (!uniqueIds.length) return;

  const objectIds = uniqueIds.map((id) => new mongoose.Types.ObjectId(id));

  const rows = await ReviewModel.aggregate([
    {
      $match: {
        product: { $in: objectIds },
        status: "published",
      },
    },
    {
      $group: {
        _id: "$product",
        average: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
  ]);

  const summaryByProductId = new Map(
    rows.map((row) => [
      String(row._id),
      {
        average: Number(Number(row.average || 0).toFixed(2)),
        count: Number(row.count || 0),
      },
    ])
  );

  await ProductGroup.bulkWrite(
    uniqueIds.map((id) => ({
      updateOne: {
        filter: { _id: new mongoose.Types.ObjectId(id) },
        update: {
          $set: {
            ratingSummary: summaryByProductId.get(id) || { average: 0, count: 0 },
          },
        },
      },
    }))
  );
}

export const reviewService = {
  async getReviewsList(qs = {}) {
    const filter = buildFilter(qs);
    const select = buildSelect(qs);
    const sort = qs.sort || "-createdAt";
    const page = Math.max(1, Number(qs.page || 1));
    const limit = Math.min(100, Math.max(1, Number(qs.limit || 20)));
    return reviewRepository.findList({ filter, select, sort, page, limit });
  },

  async search(qs = {}) {
    return this.getReviewsList(qs);
  },

  async findById(id) {
    if (!isObjectId(id)) {
      throw badRequest("review id must be a valid ObjectId", { id: String(id) });
    }
    return reviewRepository.findById(id);
  },

  async create(data) {
    if (!data?.name || !String(data.name).trim()) {
      throw badRequest("name is required");
    }

    if (!data?.text || !String(data.text).trim()) {
      throw badRequest("text is required");
    }

    if (!data?.product || !isObjectId(data.product)) {
      throw badRequest("product must be a valid ObjectId");
    }

    // валидация rating на уровне сервиса дополнительно
    if (data.rating != null) {
      const r = Number(data.rating);
      if (!Number.isFinite(r) || r < 1 || r > 5) {
        throw new Error("rating must be between 1 and 5");
      }
      data.rating = Math.round(r);
    }

    // создаём сам отзыв
    const created = await reviewRepository.create(data);

    // если отзыв привязан к товару — положим его id в productGroup.reviews
    const createdProductId = getEntityId(created?.product);

    if (createdProductId && isObjectId(createdProductId)) {
      try {
        await ProductGroup.findByIdAndUpdate(
          createdProductId,
          {
            $addToSet: { reviews: created._id },
          },
          { new: false }
        );
      } catch (err) {
        console.error(
          "Не удалось записать отзыв в ProductGroup.reviews при создании",
          createdProductId,
          err
        );
      }

      await syncProductRatingSummary([createdProductId]);
    }

    return created;
  },

  async updateById(id, patch) {
    // нормализуем рейтинг, если пришёл
    if (patch.rating != null) {
      const r = Number(patch.rating);
      if (!Number.isFinite(r) || r < 1 || r > 5) {
        throw new Error("rating must be between 1 and 5");
      }
      patch.rating = Math.round(r);
    }

    // вытаскиваем текущий отзыв, чтобы понять старый product
    const existing = await reviewRepository.findById(id);
    if (!existing) return null;

    const prevProductId = getEntityId(existing.product);

    // обновляем отзыв
    await reviewRepository.updateById(id, patch);

    // читаем обновлённый отзыв
    const updated = await reviewRepository.findById(id);
    if (!updated) return null;

    const nextProductId = getEntityId(updated.product);

    // если привязка к товару изменилась — синхронизируем массив reviews в ProductGroup
    try {
      // убираем отзыв из старого товара, если был и изменился
      if (prevProductId && prevProductId !== nextProductId) {
        await ProductGroup.findByIdAndUpdate(
          prevProductId,
          { $pull: { reviews: updated._id } },
          { new: false }
        );
      }

      // добавляем в новый товар, если есть и изменился
      if (nextProductId && nextProductId !== prevProductId && isObjectId(nextProductId)) {
        await ProductGroup.findByIdAndUpdate(
          nextProductId,
          { $addToSet: { reviews: updated._id } },
          { new: false }
        );
      }
    } catch (err) {
      console.error(
        "Не удалось синхронизировать ProductGroup.reviews при обновлении",
        { prevProductId, nextProductId, reviewId: id },
        err
      );
    }

    await syncProductRatingSummary([prevProductId, nextProductId]);

    return updated;
  },

  async deleteById(id) {
    if (!isObjectId(id)) {
      throw badRequest("review id must be a valid ObjectId", { id: String(id) });
    }

    // сначала найдём отзыв, чтобы узнать product
    const existing = await reviewRepository.findById(id);
    if (!existing) return null;

    // удаляем отзыв
    const deleted = await reviewRepository.deleteById(id);

    const deletedProductId = getEntityId(existing.product);

    // убираем id этого отзыва из всех productGroups, где он был
    try {
      await ProductGroup.updateMany(
        { reviews: existing._id },
        { $pull: { reviews: existing._id } }
      );
    } catch (err) {
      console.error(
        "Не удалось удалить ссылку на отзыв из ProductGroup.reviews при удалении",
        { reviewId: id },
        err
      );
    }

    await syncProductRatingSummary([deletedProductId]);

    return deleted;
  },

  async cancelById(id) {
    if (!isObjectId(id)) {
      throw badRequest("review id must be a valid ObjectId", { id: String(id) });
    }

    const existing = await reviewRepository.findById(id);
    if (!existing) return null;

    const cancelled = await reviewRepository.updateById(id, {
      status: "archived",
      isVisibleMainPage: false,
      isVisibleProduct: false,
    });

    await syncProductRatingSummary([getEntityId(existing.product)]);

    return cancelled;
  },

  async getPublicMain({ limit } = {}) {
    const cappedLimit = Math.min(50, Math.max(1, parseInt(limit ?? "10", 10)));

    return reviewRepository.findList({
      filter: {
        status: "published",
        isVisibleMainPage: true,
      },
      sort: "position -createdAt",
      page: 1,
      limit: cappedLimit,
    });
  },

  async getPublicProduct(productId, { limit } = {}) {
    if (!isObjectId(productId)) {
      throw badRequest("productId must be a valid ObjectId", { productId: String(productId) });
    }

    const cappedLimit = Math.min(100, Math.max(1, parseInt(limit ?? "20", 10)));

    return reviewRepository.findList({
      filter: {
        product: productId,
        status: "published",
        isVisibleProduct: true,
      },
      sort: "position -createdAt",
      page: 1,
      limit: cappedLimit,
    });
  },
};
