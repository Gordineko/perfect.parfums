import mongoose from "mongoose";
const { Schema, model, models } = mongoose;

const AdminRoleSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },

    code: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },

    description: {
      type: String,
      default: "",
    },

    level: {
      type: Number,
      default: 1,
      index: true,
    },

    permissions: {
      type: [String],
      default: [],
    },

    isSystem: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "admin_roles",
  }
);

export const AdminRoleModel =
  models.AdminRole || model("AdminRole", AdminRoleSchema);