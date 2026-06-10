// src/shared/i18n/server/getMessages.js
"use server";

import fs from "fs/promises";
import path from "path";

/**
 * Только для серверных компонентов
 */
export async function getMessagesServer(locale = "en") {
  const filePath = path.join(process.cwd(), "src/shared/i18n/locales", `${locale}.json`);

  try {
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.warn(`Translation file not found for locale "${locale}".`, err);
    return {};
  }
}