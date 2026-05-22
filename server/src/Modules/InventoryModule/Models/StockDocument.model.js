import mongoose from "mongoose";

const { Schema } = mongoose;

const StockDocumentItemSchema = new Schema(
  {
    offerId: { type: Schema.Types.ObjectId, ref: "Offer", required: true },
    groupId: { type: Schema.Types.ObjectId, ref: "ProductGroup", default: null },

    fromWarehouseId: { type: Schema.Types.ObjectId, ref: "Warehouse", default: null },
    toWarehouseId: { type: Schema.Types.ObjectId, ref: "Warehouse", default: null },

    qty: { type: Number, required: true, default: 0 },

    purchasePrice: { type: Number, default: 0 },
    catalogPrice: { type: Number, default: 0 },

    comment: { type: String, default: "" },
  },
  { _id: false }
);

const StockDocumentSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["incoming", "stocktake", "transfer"],
      required: true,
      index: true,
    },

    warehouseId: { type: Schema.Types.ObjectId, ref: "Warehouse", default: null },
    fromWarehouseId: { type: Schema.Types.ObjectId, ref: "Warehouse", default: null },
    toWarehouseId: { type: Schema.Types.ObjectId, ref: "Warehouse", default: null },

    currency: { type: String, default: "UAH" },
    comment: { type: String, default: "" },

    status: {
      type: String,
      enum: ["draft", "applied", "cancelled"],
      default: "applied",
      index: true,
    },

    items: { type: [StockDocumentItemSchema], default: [] },

    actorUserId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    actorName: { type: String, default: "" },
  },
  { timestamps: true }
);

export const StockDocument =
  mongoose.models.StockDocument || mongoose.model("StockDocument", StockDocumentSchema);