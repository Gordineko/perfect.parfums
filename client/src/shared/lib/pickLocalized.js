export function pickLocalizedString(map, locale) {
  if (map == null) return "";
  if (typeof map === "string") return map.trim();
  if (typeof map === "number") return String(map);
  if (typeof map !== "object") return "";
  return (
    map[locale] ??
    map.ua ??
    map.uk ??
    map.en ??
    ""
  );
}
