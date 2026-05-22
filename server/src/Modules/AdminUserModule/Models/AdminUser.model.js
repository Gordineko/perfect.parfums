import mongoose from "mongoose";
const { Schema, model, models } = mongoose;

const AdminUserSchema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      default: "",
      index: true,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
      default: "",
      index: true,
    },

    middleName: {
      type: String,
      trim: true,
      default: "",
    },

    phone: {
      type: String,
      default: "",
      index: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
      index: true,
    },

    login: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },

    passwordHash: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["active", "blocked", "pending"],
      default: "active",
      index: true,
    },

    roles: [
      {
        type: Schema.Types.ObjectId,
        ref: "AdminRole",
        default: [],
      },
    ],

    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "admin_users",
  }
);

AdminUserSchema.index({ lastName: 1, firstName: 1 });
AdminUserSchema.index({ email: 1, phone: 1, login: 1 });

export const AdminUserModel =
  models.AdminUser || model("AdminUser", AdminUserSchema);