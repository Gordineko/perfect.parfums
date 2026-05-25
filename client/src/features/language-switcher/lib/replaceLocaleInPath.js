import { localePath, pathWithoutLocale } from "@shared/lib/localePath";

export const replaceLocaleInPath = (path, newLocale) => {
  const base = pathWithoutLocale(path);
  return localePath(newLocale, base === "/" ? "" : base);
};
