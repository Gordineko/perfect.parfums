import mongoose from "mongoose";
import dotenv from "dotenv";

import { Character } from "../Modules/CharacterModule/Models/Character.model.js";
import { ProductGroup } from "../Modules/CatalogModule/Models/ProductGroup.model.js";

dotenv.config();

async function run() {
  await mongoose.connect("mongodb://mongoAdmin:aifnniniqniniqin@127.0.0.1:27017/woh?authSource=admin");
  console.log("Mongo connected");

  const productSlugs = [
    "high-heels-scarlet-pro-gloss-1",
    "high-heels-scarlet-stage-flex-2",
    "high-heels-scarlet-motion-line-3",
    "high-heels-scarlet-studio-pro-4",
    "high-heels-scarlet-prime-gloss-5",
    "high-heels-scarlet-elite-shape-6",
    "high-heels-scarlet-aura-move-7",
    "high-heels-scarlet-velvet-step-8",
    "high-heels-scarlet-rhythm-pro-9",
  ];

   const groups = await ProductGroup.find({
    slug: { $in: productSlugs },
  })
    .select({ _id: 1, slug: 1, imageURL: 1, title: 1 })
    .lean();

  if (!groups.length) {
    throw new Error("No ProductGroups found for provided slugs");
  }

  const foundSlugs = groups.map((x) => x.slug);
  const missing = productSlugs.filter((slug) => !foundSlugs.includes(slug));

  if (missing.length) {
    console.log("Missing ProductGroups:");
    console.log(missing.join(", "));
  }

  const chunkSize = 3;
  const chunks = [];

  for (let i = 0; i < groups.length; i += chunkSize) {
    const chunk = groups.slice(i, i + chunkSize).filter(Boolean);
    if (chunk.length) {
      chunks.push(chunk);
    }
  }

  if (!chunks.length) {
    throw new Error("No valid chunks generated");
  }

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const first = chunk[0];

    if (!first) continue;

    const products = chunk
      .filter((item) => item && item._id)
      .map((item, index) => ({
        productGroupId: item._id,
        position: index + 1,
      }));

    if (!products.length) continue;

    const doc = {
      slug: `scarlet-look-${i + 1}`,
      title: {
        ua: `Scarlet Look ${i + 1}`,
        en: `Scarlet Look ${i + 1}`,
      },
      imageURL: first.imageURL || "",
      status: "active",
      position: i + 1,
      products,
    };

    await Character.updateOne(
      { slug: doc.slug },
      { $set: doc },
      { upsert: true }
    );

    console.log(`✔ Seeded: ${doc.slug}`);
  }

  console.log("🎉 Characters seed done");
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});