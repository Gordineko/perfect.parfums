import mongoose from "mongoose";

const { Schema } = mongoose;

const StockMovementSchema = new Schema(
  {
    offerId: { type: Schema.Types.ObjectId, ref: "Offer", required: true, index: true },
    groupId: { type: Schema.Types.ObjectId, ref: "ProductGroup", default: null, index: true },

    warehouseId: { type: Schema.Types.ObjectId, ref: "Warehouse", required: true, index: true },
    relatedWarehouseId: { type: Schema.Types.ObjectId, ref: "Warehouse", default: null },

    documentId: { type: Schema.Types.ObjectId, ref: "StockDocument", default: null, index: true },

    type: {
      type: String,
      enum: [
        "incoming",
        "stocktake",
        "transfer_out",
        "transfer_in",
        "reserve",
        "release",
        "sale",
        "manual_adjustment",
      ],
      required: true,
      index: true,
    },

    qtyDelta: { type: Number, required: true, default: 0 },
    reservedDelta: { type: Number, default: 0 },

    beforeOnHand: { type: Number, default: 0 },
    afterOnHand: { type: Number, default: 0 },

    beforeReserved: { type: Number, default: 0 },
    afterReserved: { type: Number, default: 0 },

    comment: { type: String, default: "" },

    actorUserId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    actorName: { type: String, default: "" },

    meta: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

StockMovementSchema.index({ createdAt: -1 });
StockMovementSchema.index({ warehouseId: 1, createdAt: -1 });
StockMovementSchema.index({ offerId: 1, createdAt: -1 });

export const StockMovement =
  mongoose.models.StockMovement || mongoose.model("StockMovement", StockMovementSchema);