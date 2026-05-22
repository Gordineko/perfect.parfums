import { colorPresetValueToHex } from "@shared/lib/colorPresetHex";

export { colorPresetValueToHex };

const COLOR_TITLE_HINTS = [
  "колір",
  "кольор",
  "color",
  "couleur",
  "цвет",
];

export function isPdpColorSwatchAxis(axis) {
  if (!axis || typeof axis !== "object") return false;
  const titles = [
    axis.title?.ua,
    axis.title?.uk,
    axis.title?.en,
    axis.title?.ru,
    typeof axis.title === "string" ? axis.title : null,
  ];
  if (axis.title && typeof axis.title === "object") {
    for (const v of Object.values(axis.title)) {
      titles.push(v);
    }
  }
  return titles.some((raw) => {
    if (raw == null) return false;
    const t = String(raw).toLowerCase();
    return COLOR_TITLE_HINTS.some((h) => t.includes(h));
  });
}
