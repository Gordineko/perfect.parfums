// Models/Review.model.js
import mongoose from "mongoose";

const { Schema } = mongoose;

const ReviewSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    product:{ type: mongoose.Schema.Types.ObjectId, ref: "ProductGroup", required: true, index: true },
    photoUrl: { type: String, default: "" },
    text: { type: String, required: true, trim: true },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
      default: 5,
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "published",
      index: true,
    },
    position: { type: Number, default: 0, index: true },
    isVisibleProduct: { type: Boolean, default: true, index: true },
    isVisibleMainPage: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export const ReviewModel = mongoose.model("Review", ReviewSchema);
