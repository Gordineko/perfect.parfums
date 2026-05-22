import mongoose from "mongoose";

const { Schema } = mongoose;

const LocalizedTitleSchema = new Schema(
  {
    ua: { type: String, default: "" },
    en: { type: String, default: "" },
  },
  { _id: false }
);

const VariationTemplateAxisSchema = new Schema(
  {
    axisId: { type: String, required: true, trim: true },
    title: { type: LocalizedTitleSchema, default: () => ({}) },
    type: { type: String, enum: ["number", "select", "string"], default: "string" },
    unit: { type: String, default: null },
    valuesPreset: { type: [Schema.Types.Mixed], default: [] },
  },
  { _id: false }
);

const CategorySchema = new Schema(
  {
    parentId: { type: Schema.Types.ObjectId, ref: "Category", default: null, index: true },
    slug: { type: String, required: true, trim: true, index: true },

    title: { type: LocalizedTitleSchema, default: () => ({}) },

    description: { type: LocalizedTitleSchema, default: () => ({}) },
  variationTemplate: { type: [VariationTemplateAxisSchema], default: [] },
    // ["skin-structure","cleansing","foam"]
    path: { type: [String], default: [], index: true },

    // [ObjectId(root), ObjectId(parent)]
    ancestors: { type: [Schema.Types.ObjectId], ref: "Category", default: [], index: true },

    // ✅ NEW: уровень (0 = root)
    level: { type: Number, default: 0, index: true },

    // ✅ NEW: "skin-structure/cleansing/foam"
    fullSlug: { type: String, default: "", index: true },

    status: { type: String, enum: ["active", "hidden"], default: "active", index: true },
    sort: { type: Number, default: 0, index: true },
  },
  { timestamps: true }
);

// ✅ уникальность slug в рамках одного родителя
CategorySchema.index({ parentId: 1, slug: 1 }, { unique: true });

// ✅ быстрый поиск "внутри ветки"
CategorySchema.index({ ancestors: 1, status: 1 });
CategorySchema.index({ path: 1, status: 1 });

// ✅ NEW: быстрый роутинг по URL
CategorySchema.index({ fullSlug: 1, status: 1 });
CategorySchema.index({ level: 1, status: 1 });

// ✅ автозаполнение derived полей
CategorySchema.pre("validate", function (next) {
  const p = Array.isArray(this.path) ? this.path : [];
  const a = Array.isArray(this.ancestors) ? this.ancestors : [];
  this.level = a.length;
  this.fullSlug = p.join("/");
  next();
});

export const Category = mongoose.models.Category || mongoose.model("Category", CategorySchema);