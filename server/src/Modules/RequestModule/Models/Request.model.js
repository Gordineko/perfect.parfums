import mongoose from "mongoose";

const RequestSchema = new mongoose.Schema(
  {
    name: {
      type: String,

      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: ["new", "in_progress", "done", "rejected"],
      default: "new",
    },
    source: {
      type: String,
      default: "site",
      trim: true,
    },
    comment: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Request = mongoose.model("Request", RequestSchema);
