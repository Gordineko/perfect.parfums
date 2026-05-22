// src/shared/i18n/use-i18n.js
"use client";

import { createContext, useContext, useEffect, useState } from "react";

import { translate } from "./translateCore";

const I18nContext = createContext(null);

export function I18nProvider({ locale, messages, children }) {
  const [currentMessages, setCurrentMessages] = useState(messages);

  useEffect(() => {
    if (messages && messages !== currentMessages) {
      setCurrentMessages(messages);
    }
  }, [messages, currentMessages]);

  const t = (key, second) =>
    translate(currentMessages, key, second);

  return (
    <I18nContext.Provider value={{ locale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return ctx;
}