import mongoose from "mongoose";

function badRequest(message) {
  const err = new Error(message);
  err.code = "BAD_REQUEST";
  err.status = 400;
  return err;
}

export function createInventoryService({
  inventoryRepo,
  warehouseRepo,
}) {
  return {
    async listStocks(params = {}) {
      const page = Math.max(1, Number(params.page || 1));
      const limit = Math.min(200, Math.max(1, Number(params.limit || 20)));
      const skip = (page - 1) * limit;

      const filter = {};

      if (params.q && String(params.q).trim()) {
        const rx = new RegExp(String(params.q).trim(), "i");
        filter.$or = [{ sku: rx }];
      }

      if (params.priceMin || params.priceMax) {
        filter.price = {};
        if (params.priceMin) filter.price.$gte = Number(params.priceMin);
        if (params.priceMax) filter.price.$lte = Number(params.priceMax);
      }

      if (params.available === "true") {
        filter.available = true;
      }

      const { items, total } = await inventoryRepo.findOffersAdminPage(filter, {
        skip,
        limit,
        sort: { _id: -1 },
      });

      const groupMap = await inventoryRepo.findGroupsMapByIds(
        [...new Set(items.map((x) => String(x.groupId)).filter(Boolean))]
      );

      const warehouses = await warehouseRepo.findAllActive();

      const rows = items.map((offer) => {
        const group = groupMap.get(String(offer.groupId)) || null;
        const totals = inventoryRepo.calcOfferTotals(offer.stocks || []);

        const warehouseRows = warehouses.map((warehouse) => {
          const stock = (offer.stocks || []).find(
            (s) => String(s.warehouseId) === String(warehouse._id)
          );

          const onHand = Math.max(0, Number(stock?.onHand || 0));
          const reserved = Math.min(onHand, Math.max(0, Number(stock?.reserved || 0)));
          const available = Math.max(0, onHand - reserved);

          return {
            warehouseId: warehouse._id,
            warehouseCode: warehouse.code,
            warehouseTitle: warehouse.title,
            onHand,
            reserved,
            available,
            purchasePrice: Number(stock?.purchasePrice || 0),
            updatedAt: stock?.updatedAt || null,
          };
        });

        return {
          offerId: offer._id,
          groupId: offer.groupId,
          groupSlug: group?.slug || "",
          title: group?.title || {},
          imageURL: offer.img || group?.imageURL || "",
          sku: offer.sku || "",
          price: Number(offer.price || 0),

          totals: {
            onHand: Number(totals?.onHand || 0),
            reserved: Number(totals?.reserved || 0),
            available: Number(totals?.available || 0),
          },

          available: Number(totals?.available || 0),

          warehouses: warehouseRows,
        };
      });

      return {
        items: rows,
        warehouses,
        meta: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    },

    async searchOffers(params = {}) {
      const offers = await inventoryRepo.searchOffersForStock({
        q: params.q || "",
        categoryId: params.categoryId || null,
        limit: Math.min(100, Math.max(1, Number(params.limit || 30))),
      });

      const groups = await inventoryRepo.findGroupsMapByIds(
        [...new Set(offers.map((x) => String(x.groupId)).filter(Boolean))]
      );

      return offers.map((offer) => {
        const group = groups.get(String(offer.groupId)) || null;
        const totals = inventoryRepo.calcOfferTotals(offer.stocks || []);

        return {
          offerId: offer._id,
          groupId: offer.groupId,
          groupSlug: group?.slug || "",
          title: group?.title || {},
          imageURL: offer.img || group?.imageURL || "",
          sku: offer.sku || "",
          price: Number(offer.price || 0),

          totals: {
            onHand: Number(totals?.onHand || 0),
            reserved: Number(totals?.reserved || 0),
            available: Number(totals?.available || 0),
          },

          available: Number(totals?.available || 0),
        };
      });
    },
  };
}