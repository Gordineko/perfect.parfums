// seed-collections.js
import mongoose from "mongoose";


const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb://mongoAdmin:ofoaOFFO8282c@185.237.204.185:27017/woh?authSource=admin";

const categorySchema = new mongoose.Schema(
  {},
  { strict: false, collection: "categories" }
);

const Category = mongoose.model("Category", categorySchema);

const rootCategory = {
  parentId: null,
  slug: "collections",
  title: {
    ua: "Колекції",
    en: "Collections",
  },
  description: {
    ua: "",
    en: "",
  },
  variationTemplate: [],
  path: ["collections"],
  ancestors: [],
  level: 0,
  fullSlug: "collections",
  status: "active",
  sort: 20,
};

const subcategories = [
  {
    slug: "elegant",
    title: {
      ua: "Elegant",
      en: "Elegant",
    },
    sort: 10,
  },
  {
    slug: "sport",
    title: {
      ua: "Sport",
      en: "Sport",
    },
    sort: 20,
  },
  {
    slug: "casual",
    title: {
      ua: "Casual",
      en: "Casual",
    },
    sort: 30,
  },
];

async function seedCollections() {
  try {
    await mongoose.connect(MONGO_URI);

    console.log("Connected to MongoDB");

    const parent = await Category.findOneAndUpdate(
      { fullSlug: rootCategory.fullSlug },
      {
        $set: {
          ...rootCategory,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      {
        upsert: true,
        new: true,
      }
    );

    console.log("Root category created/updated:", parent.fullSlug);

    for (const item of subcategories) {
      const category = {
        parentId: parent._id,
        slug: item.slug,
        title: item.title,
        description: {
          ua: "",
          en: "",
        },
        variationTemplate: [],
        path: ["collections", item.slug],
        ancestors: [parent._id],
        level: 1,
        fullSlug: `collections/${item.slug}`,
        status: "active",
        sort: item.sort,
      };

      const saved = await Category.findOneAndUpdate(
        { fullSlug: category.fullSlug },
        {
          $set: {
            ...category,
            updatedAt: new Date(),
          },
          $setOnInsert: {
            createdAt: new Date(),
          },
        },
        {
          upsert: true,
          new: true,
        }
      );

      console.log("Subcategory created/updated:", saved.fullSlug);
    }

    console.log("Collections seeding finished");
  } catch (error) {
    console.error("Seeding failed:", error);
  } finally {
    await mongoose.disconnect();
  }
}

seedCollections();