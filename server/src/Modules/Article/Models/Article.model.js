// src/Modules/ArticlesModule/Models/article.model.js
import mongoose from "mongoose";

const LangStringSchema = new mongoose.Schema(
  {
    ua: { type: String, default: "" },
    en: { type: String, default: "" },
  },
  { _id: false }
);

const ImageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    preview: { type: String, default: "" },
    alt: LangStringSchema,
  },
  { _id: false }
);

const ArticleSchema = new mongoose.Schema(
  {
    title: {
      type: LangStringSchema,
      required: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    excerpt: LangStringSchema, // короткое описание
    body: LangStringSchema,    // HTML из ReactQuill
    cover: ImageSchema,        // обложка
    publishedAt: {
      type: Date,
      default: null,
      index: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
      index: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    // на будущее — SEO блок под статью
    seo: {
      title: LangStringSchema,
      description: LangStringSchema,
    },
  },
  {
    timestamps: true,
  }
);

export const ArticleModel = mongoose.model("Article", ArticleSchema);
