// src/shared/i18n/server.js
export function createI18nServer(messages) {
  return {
    t: (key) => {
      const parts = key.split('.');
      let value = messages;

      for (const part of parts) {
        value = value?.[part];
      }

      if (!value) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`Missing translation: ${key}`);
        }
        return key;
      }

      return value;
    },
  };
}