import mongoose from "mongoose";
const { Schema } = mongoose;

const LocalizedSchema = new Schema(
  { ua: { type: String, default: "" }, en: { type: String, default: "" } },
  { _id: false }
);

const CharacteristicMetaSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, index: true }, // "brand"
    title: { type: LocalizedSchema, default: () => ({}) },

    type: { type: String, enum: ["string", "number", "boolean", "select", "multiselect"], default: "string" },
    unit: { type: String, default: null },

    // для select/multiselect
    valuesPreset: { type: [Schema.Types.Mixed], default: [] },
    scope: {
      type: String,
      enum: ["group", "offer", "both"],
      default: "group",
      index: true,
    },

    // управление отображением/поиском
    filterable: { type: Boolean, default: true, index: true },
    searchable: { type: Boolean, default: false, index: true },

    sort: { type: Number, default: 0, index: true },
    status: { type: String, enum: ["active", "hidden"], default: "active", index: true },
  },
  { timestamps: true }
);

export const CharacteristicMeta =
  mongoose.models.CharacteristicMeta || mongoose.model("CharacteristicMeta", CharacteristicMetaSchema);
