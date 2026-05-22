import "dotenv/config";

import mongoose from "mongoose";
import axios from "axios";
import sharp from "sharp";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";


const MONGO_URI = process.env.MONGO_URI;

const OLD_HOST = "https://worldofheels.api.keycrm.app";
const UPLOAD_DIR = "/var/www/maloe/server/uploads";
const PUBLIC_URL = "https://maloeatelier.com/uploads";

const DRY_RUN = process.env.DRY_RUN === "true";

if (!MONGO_URI) {
  console.error("ERROR: MONGO_URI not found in .env");
  process.exit(1);
}

const anySchema = new mongoose.Schema({}, { strict: false });

const ProductGroup = mongoose.model("ProductGroup", anySchema, "productgroups");
const Offer = mongoose.model("Offer", anySchema, "offers");

const urlCache = new Map();

function isOldKeycrmUrl(url) {
  return typeof url === "string" && url.startsWith(OLD_HOST);
}

function makeFileName(url) {
  const hash = crypto.createHash("md5").update(url).digest("hex");
  return `woh-${hash}.webp`;
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function downloadAndConvert(url) {
  if (!isOldKeycrmUrl(url)) return url;

  if (urlCache.has(url)) {
    return urlCache.get(url);
  }

  const fileName = makeFileName(url);
  const filePath = path.join(UPLOAD_DIR, fileName);
  const newUrl = `${PUBLIC_URL}/${fileName}`;

  if (DRY_RUN) {
    console.log(`[DRY_RUN] ${url} => ${newUrl}`);
    urlCache.set(url, newUrl);
    return newUrl;
  }

  const exists = await fileExists(filePath);

  if (exists) {
    console.log(`[SKIP EXISTS] ${newUrl}`);
    urlCache.set(url, newUrl);
    return newUrl;
  }

  try {
    console.log(`[DOWNLOAD] ${url}`);

    const response = await axios.get(url, {
      responseType: "arraybuffer",
      timeout: 60000,
      validateStatus: (status) => status >= 200 && status < 300,
      headers: {
        "User-Agent": "Mozilla/5.0 WorldOfHeels image migration",
      },
    });

    await sharp(response.data)
      .rotate()
      .resize({
        width: 1600,
        withoutEnlargement: true,
      })
      .webp({
        quality: 82,
      })
      .toFile(filePath);

    console.log(`[SAVED] ${newUrl}`);

    urlCache.set(url, newUrl);
    return newUrl;
  } catch (error) {
    const status = error?.response?.status || "NO_STATUS";

    console.error(`[FAILED DOWNLOAD] ${status} ${url}`);

    await fs.appendFile(
      path.join(UPLOAD_DIR, "failed-keycrm-images.log"),
      `${new Date().toISOString()} | ${status} | ${url}\n`
    );

    urlCache.set(url, url);

    return url;
  }
}

async function migrateProductGroups() {
  console.log("\n=== Migrating productgroups ===");

  const groups = await ProductGroup.find({
    $or: [
      { imageURL: { $regex: OLD_HOST } },
      { "gallery.url": { $regex: OLD_HOST } },
      { "sizeChart.imageUrl": { $regex: OLD_HOST } },
    ],
  });

  console.log(`Found productgroups: ${groups.length}`);

  let updated = 0;

  for (const group of groups) {
    const update = {};
    let changed = false;

    if (isOldKeycrmUrl(group.imageURL)) {
      const newUrl = await downloadAndConvert(group.imageURL);
      update.imageURL = newUrl;
      changed = true;

      console.log(`[productgroups:${group._id}] imageURL updated`);
    }

    if (Array.isArray(group.gallery)) {
      const newGallery = [];

      for (const item of group.gallery) {
        const newItem = item?.toObject ? item.toObject() : { ...item };

        if (isOldKeycrmUrl(newItem.url)) {
          newItem.url = await downloadAndConvert(newItem.url);
          changed = true;

          console.log(`[productgroups:${group._id}] gallery.url updated`);
        }

        newGallery.push(newItem);
      }

      if (changed) {
        update.gallery = newGallery;
      }
    }

    if (isOldKeycrmUrl(group.sizeChart?.imageUrl)) {
      const newUrl = await downloadAndConvert(group.sizeChart.imageUrl);
      update["sizeChart.imageUrl"] = newUrl;
      changed = true;

      console.log(`[productgroups:${group._id}] sizeChart.imageUrl updated`);
    }

    if (changed) {
      updated++;

      if (!DRY_RUN) {
        await ProductGroup.updateOne(
          { _id: group._id },
          { $set: update }
        );
      }
    }
  }

  console.log(`Updated productgroups: ${updated}`);
}

async function migrateOffers() {
  console.log("\n=== Migrating offers ===");

  const offers = await Offer.find({
    img: { $regex: OLD_HOST },
  });

  console.log(`Found offers: ${offers.length}`);

  let updated = 0;

  for (const offer of offers) {
    if (!isOldKeycrmUrl(offer.img)) continue;

    const newUrl = await downloadAndConvert(offer.img);

    updated++;

    console.log(`[offers:${offer._id}] img updated`);

    if (!DRY_RUN) {
      await Offer.updateOne(
        { _id: offer._id },
        {
          $set: {
            img: newUrl,
          },
        }
      );
    }
  }

  console.log(`Updated offers: ${updated}`);
}

async function main() {
  console.log("Starting image migration...");
  console.log(`DRY_RUN: ${DRY_RUN}`);
  console.log(`UPLOAD_DIR: ${UPLOAD_DIR}`);
  console.log(`PUBLIC_URL: ${PUBLIC_URL}`);

  await fs.mkdir(UPLOAD_DIR, { recursive: true });

  await mongoose.connect(MONGO_URI);

  await migrateProductGroups();
  await migrateOffers();

  await mongoose.disconnect();

  console.log("\nDone.");
}

main().catch(async (error) => {
  console.error("\nMigration failed:");
  console.error(error);

  try {
    await mongoose.disconnect();
  } catch {}

  process.exit(1);
});