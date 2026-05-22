import mongoose from "mongoose";
import { Character } from "../Models/Character.model.js";
import { Offer } from "../../CatalogModule/Models/Offer.model.js";

function attachPricePreview(items = []) {
  if (!Array.isArray(items)) return items;

  return Promise.all(
    items.map(async (character) => {
      const products = Array.isArray(character.products) ? character.products : [];

      const groupIds = products
        .map((p) => p?.productGroupId?._id || p?.productGroupId)
        .filter(Boolean)
        .map((id) => new mongoose.Types.ObjectId(String(id)));

      if (!groupIds.length) {
        return {
          ...character,
          products,
        };
      }

      const prices = await Offer.aggregate([
        {
          $match: {
            groupId: { $in: groupIds },
          },
        },
        {
          $group: {
            _id: "$groupId",
            minPrice: { $min: "$price" },
            maxPrice: { $max: "$price" },
            hasAvailable: {
              $max: {
                $cond: ["$available", 1, 0],
              },
            },
          },
        },
      ]);

      const priceMap = new Map(
        prices.map((x) => [
          String(x._id),
          {
            min: x.minPrice ?? null,
            max: x.maxPrice ?? null,
            hasAvailable: Boolean(x.hasAvailable),
            currency: "UAH",
          },
        ])
      );

      return {
        ...character,
        products: products.map((item) => {
          const group = item?.productGroupId;
          const groupId = group?._id || group;

          return {
            ...item,
            productGroupId: group && typeof group === "object"
              ? {
                  ...group,
                  pricePreview: priceMap.get(String(groupId)) || {
                    min: null,
                    max: null,
                    hasAvailable: false,
                    currency: "UAH",
                  },
                }
              : group,
          };
        }),
      };
    })
  );
}

export function createCharacterRepo() {
  return {
    async findPage(
      filter,
      { skip = 0, limit = 20, sort = { position: 1, _id: 1 } } = {}
    ) {
      const [items, total] = await Promise.all([
        Character.find(filter)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .populate({
            path: "products.productGroupId",
            select: {
              slug: 1,
              title: 1,
              subtitle: 1,
              imageURL: 1,
              status: 1,
              categoryIds: 1,
            },
            populate: {
              path: "categoryIds",
              select: {
                slug: 1,
                title: 1,
                fullSlug: 1,
                parentId: 1,
              },
            },
          })
          .lean(),
        Character.countDocuments(filter),
      ]);

      const itemsWithPrice = await attachPricePreview(items);

      return { items: itemsWithPrice, total };
    },

    async findById(id) {
      const item = await Character.findById(id)
        .populate({
          path: "products.productGroupId",
          select: {
            slug: 1,
            title: 1,
            subtitle: 1,
            imageURL: 1,
            status: 1,
            categoryIds: 1,
          },
          populate: {
            path: "categoryIds",
            select: {
              slug: 1,
              title: 1,
              fullSlug: 1,
              parentId: 1,
            },
          },
        })
        .lean();

      if (!item) return null;

      const [withPrice] = await attachPricePreview([item]);
      return withPrice;
    },

    async findBySlug(slug) {
      return Character.findOne({ slug }).lean();
    },

    async create(doc) {
      const created = await Character.create(doc);
      return created.toObject();
    },

    async updateById(id, patch) {
      const item = await Character.findByIdAndUpdate(id, patch, {
        new: true,
      })
        .populate({
          path: "products.productGroupId",
          select: {
            slug: 1,
            title: 1,
            subtitle: 1,
            imageURL: 1,
            status: 1,
            categoryIds: 1,
          },
          populate: {
            path: "categoryIds",
            select: {
              slug: 1,
              title: 1,
              fullSlug: 1,
              parentId: 1,
            },
          },
        })
        .lean();

      if (!item) return null;

      const [withPrice] = await attachPricePreview([item]);
      return withPrice;
    },

    async deleteById(id) {
      return Character.deleteOne({ _id: id });
    },

    async listActive() {
      const items = await Character.find({ status: "active" })
        .sort({ position: 1, _id: 1 })
        .populate({
          path: "products.productGroupId",
          select: {
            slug: 1,
            title: 1,
            subtitle: 1,
            imageURL: 1,
            status: 1,
            categoryIds: 1,
          },
          populate: {
            path: "categoryIds",
            select: {
              slug: 1,
              title: 1,
              fullSlug: 1,
              parentId: 1,
            },
          },
        })
        .lean();

      return attachPricePreview(items);
    },
  };
}