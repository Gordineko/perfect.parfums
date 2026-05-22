// src/shared/i18n/server.js
import { translate } from "./translateCore";

export function createI18nServer(messages) {
  return {
    t: (key, second) => translate(messages, key, second),
  };
}