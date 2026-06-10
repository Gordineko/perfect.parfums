// src/shared/i18n/use-i18n.js
"use client";

import { createContext, useContext, useEffect, useState } from "react";

const I18nContext = createContext(null);

export function I18nProvider({ locale, messages, children }) {
  // Используем стейт для сообщений
  const [currentMessages, setCurrentMessages] = useState(messages);

  // Обновляем сообщения при их изменении
  useEffect(() => {
    if (messages && messages !== currentMessages) {
      setCurrentMessages(messages);
    }
  }, [messages, currentMessages]);

  const t = (key) => {
    const parts = key.split(".");
    let value = currentMessages;

    for (const part of parts) {
      value = value?.[part];
    }

    if (!value) {
      if (process.env.NODE_ENV === "development") {
        console.warn(`Missing translation: ${key}`);
      }
      return key;
    }

    return value;
  };

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