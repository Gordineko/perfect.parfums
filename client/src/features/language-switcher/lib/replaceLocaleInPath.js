
export const replaceLocaleInPath = (path, newLocale) => {
  const segments = path.split("/").filter(Boolean);
  if (segments.length > 0) {
    segments[0] = newLocale;
    return "/" + segments.join("/");
  }
  return "/" + newLocale;
};