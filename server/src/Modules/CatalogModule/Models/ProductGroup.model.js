import mongoose from "mongoose";

const { Schema } = mongoose;

const LocalizedTextSchema = new Schema(
  { ua: { type: String, default: "" }, en: { type: String, default: "" } },
  { _id: false }
);

export const CharacteristicValueSchema = new Schema(
  {
    key: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ["string", "number", "boolean", "select", "multiselect"],
      required: true,
    },
    unit: { type: String, default: null },
    value: { type: Schema.Types.Mixed, default: null },
    values: { type: [Schema.Types.Mixed], default: [] },
  },
  { _id: false }
);

const VariationAxisSchema = new Schema(
  {
    axisId: { type: String, required: true, trim: true },
    title: { type: LocalizedTextSchema, default: () => ({}) },
    type: { type: String, enum: ["number", "select", "string"], default: "string" },
    unit: { type: String, default: null },
    valuesPreset: { type: [Schema.Types.Mixed], default: [] },
  },
  { _id: false }
);

const GalleryImageSchema = new Schema(
  {
    url: { type: String, required: true },
    alt: { type: LocalizedTextSchema, default: () => ({}) },
    sort: { type: Number, default: 0 },
    isMain: { type: Boolean, default: false },
  },
  { _id: false }
);

const SizeChartSchema = new Schema(
  {
    imageUrl: { type: String, default: "" },
    title: { type: LocalizedTextSchema, default: () => ({}) },
    description: { type: LocalizedTextSchema, default: () => ({}) },
  },
  { _id: false }
);

const ContentSectionSchema = new Schema(
  {
    key: { type: String, required: true }, // description, specs, shipping
    title: { type: LocalizedTextSchema, default: () => ({}) },
    content: { type: LocalizedTextSchema, default: () => ({}) },
    sort: { type: Number, default: 0 },
  },
  { _id: false }
);

const AccessoryItemSchema = new Schema(
  {
    productGroupId: { type: Schema.Types.ObjectId, ref: "ProductGroup", default: null },
    title: { type: LocalizedTextSchema, default: () => ({}) },
    subtitle: { type: LocalizedTextSchema, default: () => ({}) },
    imageUrl: { type: String, default: "" },
    price: { type: Number, default: 0 },
    selectedByDefault: { type: Boolean, default: false },
  },
  { _id: false }
);

const RatingSummarySchema = new Schema(
  {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 },
  },
  { _id: false }
);

const ProductGroupSchema = new Schema(
  {
    slug: { type: String, required: true, trim: true, unique: true, index: true },
    title: { type: LocalizedTextSchema, default: () => ({}) },
    subtitle: { type: LocalizedTextSchema, default: () => ({}) },
    description: { type: LocalizedTextSchema, default: () => ({}) },

    categoryIds: { type: [Schema.Types.ObjectId], ref: "Category", default: [], index: true },

    imageURL: { type: String, default: "" },
    gallery: { type: [GalleryImageSchema], default: [] },

    sizeChart: { type: SizeChartSchema, default: () => ({}) },
    contentSections: { type: [ContentSectionSchema], default: [] },

    variationAxes: { type: [VariationAxisSchema], default: [] },
    characteristics: { type: [CharacteristicValueSchema], default: [] },

    relatedProductIds: { type: [Schema.Types.ObjectId], ref: "ProductGroup", default: [] },

    accessories: { type: [AccessoryItemSchema], default: [] },

    reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: "Review" }],
    ratingSummary: { type: RatingSummarySchema, default: () => ({}) },

    status: {
      type: String,
      enum: ["active", "draft", "hidden"],
      default: "active",
      index: true,
    },

    isPopular: { type: Boolean, default: false, index: true },
    isSale: { type: Boolean, default: false, index: true },
    isNew: { type: Boolean, default: false, index: true },
  },


  { timestamps: true }
);

ProductGroupSchema.index({ categoryIds: 1, status: 1 });
ProductGroupSchema.index({ updatedAt: -1 });
ProductGroupSchema.index({ "characteristics.key": 1, "characteristics.value": 1 });

export const ProductGroup =
  mongoose.models.ProductGroup || mongoose.model("ProductGroup", ProductGroupSchema);