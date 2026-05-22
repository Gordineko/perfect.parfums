import mongoose from "mongoose";
import { OrderModel } from "../Models/Order.model.js";
import { Offer } from "../../CatalogModule/Models/Offer.model.js";
import { ProductGroup } from "../../CatalogModule/Models/ProductGroup.model.js";
import { UserModel } from "../Models/User.model.js";

export function createOrderAdminRepo() {
  return {
    async findPage({
      filter = {},
      page = 1,
      limit = 20,
      sort = { createdAt: -1, _id: -1 },
    }) {
      const safePage = Math.max(1, Number(page) || 1);
      const safeLimit = Math.min(200, Math.max(1, Number(limit) || 20));
      const skip = (safePage - 1) * safeLimit;

      const [items, total] = await Promise.all([
        OrderModel.find(filter)
          .sort(sort)
          .skip(skip)
          .limit(safeLimit)
          .populate({
            path: "userId",
            select: "firstName lastName middleName email phone status",
          })
          .populate({
            path: "items.offerId",
            select: "sku price available img optionKey optionValues optionMap groupId",
          })
          .populate({
            path: "items.groupId",
            select: "slug title imageURL subtitle status categoryIds",
          })
          .lean(),
        OrderModel.countDocuments(filter),
      ]);

      return {
        items,
        total,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.max(1, Math.ceil(total / safeLimit)),
      };
    },

    async findAll({ filter = {}, sort = { createdAt: -1, _id: -1 } } = {}) {
      return OrderModel.find(filter)
        .sort(sort)
        .populate({
          path: "userId",
          select: "firstName lastName middleName email phone status",
        })
        .populate({
          path: "items.offerId",
          select: "sku price available img optionKey optionValues optionMap groupId",
        })
        .populate({
          path: "items.groupId",
          select: "slug title imageURL subtitle status categoryIds",
        })
        .lean();
    },

    async findById(id) {
      if (!mongoose.Types.ObjectId.isValid(String(id))) return null;

      return OrderModel.findById(id)
        .populate({
          path: "userId",
          select: "firstName lastName middleName email phone status",
        })
        .populate({
          path: "items.offerId",
          select: "sku price available img optionKey optionValues optionMap groupId",
        })
        .populate({
          path: "items.groupId",
          select: "slug title imageURL subtitle status categoryIds",
        })
        .lean();
    },

    async findByOrderNumber(orderNumber) {
      return OrderModel.findOne({
        $or: [
          { order_number: String(orderNumber) },
          { orderNumber: Number(orderNumber) },
        ],
      })
        .populate({
          path: "userId",
          select: "firstName lastName middleName email phone status",
        })
        .populate({
          path: "items.offerId",
          select: "sku price available img optionKey optionValues optionMap groupId",
        })
        .populate({
          path: "items.groupId",
          select: "slug title imageURL subtitle status categoryIds",
        })
        .lean();
    },

    async updateById(id, patch) {
      if (!mongoose.Types.ObjectId.isValid(String(id))) return null;

      return OrderModel.findByIdAndUpdate(id, patch, {
        new: true,
        runValidators: true,
      })
        .populate({
          path: "userId",
          select: "firstName lastName middleName email phone status",
        })
        .populate({
          path: "items.offerId",
          select: "sku price available img optionKey optionValues optionMap groupId",
        })
        .populate({
          path: "items.groupId",
          select: "slug title imageURL subtitle status categoryIds",
        })
        .lean();
    },

    async create(doc) {
      const created = await OrderModel.create(doc);

      return OrderModel.findById(created._id)
        .populate({
          path: "userId",
          select: "firstName lastName middleName email phone status",
        })
        .populate({
          path: "items.offerId",
          select: "sku price available img optionKey optionValues optionMap groupId",
        })
        .populate({
          path: "items.groupId",
          select: "slug title imageURL subtitle status categoryIds",
        })
        .lean();
    },

    async appendChangeLog(id, entry) {
      if (!mongoose.Types.ObjectId.isValid(String(id))) return null;

      return OrderModel.findByIdAndUpdate(
        id,
        {
          $push: {
            changeLog: {
              ...entry,
              createdAt: entry?.createdAt || new Date(),
            },
          },
        },
        { new: false }
      ).lean();
    },

    async findOfferById(offerId) {
      if (!mongoose.Types.ObjectId.isValid(String(offerId))) return null;
      return Offer.findById(offerId).lean();
    },

    async findProductGroupById(groupId) {
      if (!mongoose.Types.ObjectId.isValid(String(groupId))) return null;
      return ProductGroup.findById(groupId).lean();
    },

    async findUserById(userId) {
      if (!mongoose.Types.ObjectId.isValid(String(userId))) return null;
      return UserModel.findById(userId).lean();
    },

    async getNextOrderNumber() {
      const last = await OrderModel.findOne({})
        .sort({ orderNumber: -1, _id: -1 })
        .select({ orderNumber: 1 })
        .lean();

      return Math.max(100000, Number(last?.orderNumber || 0) + 1);
    },
  };
}