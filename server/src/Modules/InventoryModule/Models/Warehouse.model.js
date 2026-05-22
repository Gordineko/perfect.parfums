import mongoose from "mongoose";

const { Schema } = mongoose;

const WarehouseSchema = new Schema(
  {
    code: { type: String, required: true, trim: true, unique: true, index: true },
    title: {
      ua: { type: String, default: "" },
      ru: { type: String, default: "" },
    },
    address: { type: String, default: "" },
    sort: { type: Number, default: 0, index: true },
    status: {
      type: String,
      enum: ["active", "disabled"],
      default: "active",
      index: true,
    },
    isDefault: { type: Boolean, default: false },
    notes: { type: String, default: "" },
    isActive: { type: Boolean, default: true, index: true }
  },
  { timestamps: true }
);

export const Warehouse =
  mongoose.models.Warehouse || mongoose.model("Warehouse", WarehouseSchema);