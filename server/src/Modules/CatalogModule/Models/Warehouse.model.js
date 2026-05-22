import mongoose from "mongoose";

const { Schema } = mongoose;

const WarehouseSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, unique: true, index: true },

    address: { type: String, default: "" },
    isActive: { type: Boolean, default: true, index: true },
    isDefault: { type: Boolean, default: false, index: true },

    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

WarehouseSchema.index({ name: 1 });

export const Warehouse =
  mongoose.models.Warehouse || mongoose.model("Warehouse", WarehouseSchema);