// src/shared/i18n/getMessages.js

import { messagesMap } from "./locales";

/**
 * Загружает JSON с переводами по locale
 * Работает на сервере ИЛИ с предзагруженными данными
 */
export async function getMessages(locale = "en") {
  // Возвращаем из предзагруженного объекта
  return messagesMap[locale] || messagesMap.en;
}