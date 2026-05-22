import mongoose from "mongoose";

const { Schema } = mongoose;

const LocalizedTextSchema = new Schema(
  {
    ua: { type: String, default: "" },
    en: { type: String, default: "" },
  },
  { _id: false }
);

const CharacterProductSchema = new Schema(
  {
    productGroupId: {
      type: Schema.Types.ObjectId,
      ref: "ProductGroup",
      required: true,
    },
    position: {
      type: Number,
      default: 0,
      index: true,
    },
  },
  { _id: false }
);

const CharacterSchema = new Schema(
  {
    slug: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },

    title: {
      type: LocalizedTextSchema,
      default: () => ({ ua: "", ru: "" }),
    },

    imageURL: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["active", "draft", "hidden"],
      default: "active",
      index: true,
    },

    position: {
      type: Number,
      default: 0,
      index: true,
    },

    products: {
      type: [CharacterProductSchema],
      default: [],
    },
  },
  { timestamps: true }
);

CharacterSchema.index({ status: 1, position: 1 });
CharacterSchema.index({ "products.productGroupId": 1 });

export const Character =
  mongoose.models.Character || mongoose.model("Character", CharacterSchema);