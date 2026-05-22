import mongoose from "mongoose";

const { Schema } = mongoose;

const LocalizedTextSchema = new Schema(
  {
    ua: { type: String, default: "" },
    en: { type: String, default: "" },
  },
  { _id: false }
);

const HomeBannerSchema = new Schema(
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
      default: () => ({ ua: "", en: "" }),
    },

    subtitle: {
      type: LocalizedTextSchema,
      default: () => ({ ua: "", en: "" }),
    },

    description: {
      type: LocalizedTextSchema,
      default: () => ({ ua: "", en: "" }),
    },

    imageURL: {
      type: String,
      default: "",
    },

    mobileImageURL: {
      type: String,
      default: "",
    },

    videoURL: {
      type: String,
      default: "",
    },

    mobileVideoURL: {
      type: String,
      default: "",
    },

    buttonText: {
      type: LocalizedTextSchema,
      default: () => ({ ua: "", en: "" }),
    },

    // ручная ссылка
    link: {
      type: String,
      default: "",
    },

    // если баннер ведет на категорию
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null,
      index: true,
    },

    backgroundColor: {
      type: String,
      default: "",
    },

    textColor: {
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

    startsAt: {
      type: Date,
      default: null,
      index: true,
    },

    endsAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

HomeBannerSchema.index({ status: 1, position: 1 });
HomeBannerSchema.index({ status: 1, startsAt: 1, endsAt: 1 });

export const HomeBanner =
  mongoose.models.HomeBanner || mongoose.model("HomeBanner", HomeBannerSchema);
