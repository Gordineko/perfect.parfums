import { useState } from 'react';
import { translateText } from '../api/translate.service';

const GOOGLE_LANG_MAP = {
  ua: 'uk',
  en: 'en',
};

function getByPath(obj, path) {
  return path.split('.').reduce((acc, key) => acc?.[key], obj);
}

export function useAutoTranslate(formik) {
  const [isTranslating, setIsTranslating] = useState(false);

  const translateFields = async (pairs) => {
    setIsTranslating(true);
    try {
      const results = await Promise.allSettled(
        pairs.map(async ({ from, to }) => {
          const sourceText = getByPath(formik.values, from);
          if (!sourceText?.trim()) return;

         
          const sourceLang = from.split('.').at(-1);
          const targetLang = to.split('.').at(-1);

          const translated = await translateText(
            sourceText,
            GOOGLE_LANG_MAP[sourceLang] ?? sourceLang,
            GOOGLE_LANG_MAP[targetLang] ?? targetLang,
          );

          if (translated) {
            formik.setFieldValue(to, translated);
          }
        }),
      );

      const failed = results.filter((r) => r.status === 'rejected');
      if (failed.length > 0) {
        console.error('[useAutoTranslate] Some translations failed:', failed.map((f) => f.reason));
      }
    } finally {
      setIsTranslating(false);
    }
  };

  return { translateFields, isTranslating };
}
