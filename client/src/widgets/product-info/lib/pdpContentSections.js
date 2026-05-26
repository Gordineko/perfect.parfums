import { pickLocalizedString } from "@shared/lib/pickLocalized";

function sortedContentSections(product) {
  const list = Array.isArray(product?.contentSections)
    ? [...product.contentSections]
    : [];
  return list.sort((a, b) => (a?.sort ?? 0) - (b?.sort ?? 0));
}

/**
 * Статичні блоки «ОПИС» та інші секції для нижньої частини PDP.
 */
export function buildPdpDetailBlocks(product, locale, { descriptionTitle }) {
  const sections = sortedContentSections(product);
  const blocks = [];
  const normalizeTitle = (rawTitle, key) => {
    const title = String(rawTitle ?? "").trim();
    const upper = title.toUpperCase();
    const keyLc = String(key ?? "").toLowerCase();
    if (upper === "ОПИС МОДЕЛІ" || keyLc === "description" || keyLc === "desc") {
      return descriptionTitle;
    }
    if (upper === "MODEL DESCRIPTION") {
      return descriptionTitle;
    }
    return title;
  };

  for (let idx = 0; idx < sections.length; idx += 1) {
    const section = sections[idx];
    const key = section.key ?? `section-${idx}`;
    const rawTitle =
      pickLocalizedString(section.title, locale) || String(key).toUpperCase();
    const title = normalizeTitle(rawTitle, key) || descriptionTitle;
    const body = pickLocalizedString(section.content, locale);
    if (!body?.trim()) continue;
    blocks.push({ key, title, body });
  }

  if (!blocks.length) {
    const fallback = pickLocalizedString(product?.description, locale);
    if (fallback?.trim()) {
      blocks.push({
        key: "description",
        title: descriptionTitle,
        body: fallback,
      });
    }
  }

  return blocks;
}
