import { UserModel } from "../../IAM/Models/User.model.js";
import { OrderModel } from "../../IAM/Models/Order.model.js";
import mongoose from "mongoose";

const SUCCESS_STATUSES = ["paid", "processing", "shipped", "delivered"];
const FAILED_STATUSES = ["cancelled"];
const ACTIVE_STATUSES = ["new", "pending_payment", "processing", "shipped", "installment_waiting_store_confirm"];

function toObjectId(id) {
  return new mongoose.Types.ObjectId(String(id));
}

export function createCustomerRepo() {
  return {
    async findUsersPage(filter, { skip = 0, limit = 20, sort = { createdAt: -1, _id: -1 } } = {}) {
      const [items, total] = await Promise.all([
        UserModel.find(filter)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .populate({
            path: "assignedManager",
            select: {
              firstName: 1,
              lastName: 1,
              email: 1,
              phone: 1,
            },
          })
          .select({
            email: 1,
            firstName: 1,
            lastName: 1,
            middleName: 1,
            phone: 1,
            status: 1,
            deliveryProvince: 1,
            deliveryCity: 1,
            deliveryPostOffice: 1,
            createdAt: 1,
            customerTags: 1,
            assignedManager: 1,
          })
          .lean(),
        UserModel.countDocuments(filter),
      ]);

      return { items, total };
    },

    async findById(id) {
      return UserModel.findById(id)
        .populate({
          path: "assignedManager",
          select: {
            firstName: 1,
            lastName: 1,
            email: 1,
            phone: 1,
          },
        })
        .select({
          email: 1,
          firstName: 1,
          lastName: 1,
          middleName: 1,
          phone: 1,
          status: 1,
          bonusBalance: 1,
          referralBalance: 1,
          deliveryProvince: 1,
          deliveryCity: 1,
          deliveryPostOffice: 1,
          createdAt: 1,
          updatedAt: 1,
          customerTags: 1,
          customerNotes: 1,
          assignedManager: 1,
        })
        .lean();
    },

    async updateById(id, patch) {
      return UserModel.findByIdAndUpdate(id, patch, {
        new: true,
        runValidators: true,
      })
        .populate({
          path: "assignedManager",
          select: {
            firstName: 1,
            lastName: 1,
            email: 1,
            phone: 1,
          },
        })
        .lean();
    },

    async aggregateOrderStatsByUserIds(userIds = []) {
      if (!Array.isArray(userIds) || !userIds.length) return [];

      return OrderModel.aggregate([
        {
          $match: {
            userId: { $in: userIds.map((id) => toObjectId(id)) },
          },
        },
        {
          $group: {
            _id: "$userId",
            ordersCount: { $sum: 1 },
            turnover: { $sum: { $ifNull: ["$finalPrice", 0] } },
            lastOrderAt: { $max: "$createdAt" },
            successOrders: {
              $sum: {
                $cond: [{ $in: ["$status", SUCCESS_STATUSES] }, 1, 0],
              },
            },
            failedOrders: {
              $sum: {
                $cond: [{ $in: ["$status", FAILED_STATUSES] }, 1, 0],
              },
            },
            activeOrders: {
              $sum: {
                $cond: [{ $in: ["$status", ACTIVE_STATUSES] }, 1, 0],
              },
            },
          },
        },
      ]);
    },

    async listOrdersByUser(userId, { skip = 0, limit = 10, sort = { createdAt: -1, _id: -1 } } = {}) {
      const [items, total] = await Promise.all([
        OrderModel.find({ userId })
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .populate({
            path: "items.offerId",
            select: {
              sku: 1,
              price: 1,
              img: 1,
              optionKey: 1,
              optionValues: 1,
            },
          })
          .lean(),
        OrderModel.countDocuments({ userId }),
      ]);

      return { items, total };
    },

    async listAllOrdersByUser(userId) {
      return OrderModel.find({ userId })
        .sort({ createdAt: -1, _id: -1 })
        .lean();
    },

    async aggregateTurnoverChart(userId, { months = 12 } = {}) {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

      return OrderModel.aggregate([
        {
          $match: {
            userId: toObjectId(userId),
            createdAt: { $gte: start },
          },
        },
        {
          $group: {
            _id: {
              y: { $year: "$createdAt" },
              m: { $month: "$createdAt" },
            },
            turnover: { $sum: { $ifNull: ["$finalPrice", 0] } },
            ordersCount: { $sum: 1 },
          },
        },
        {
          $sort: {
            "_id.y": 1,
            "_id.m": 1,
          },
        },
      ]);
    },
  };
}