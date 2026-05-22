// src/Modules/Article/Controllers/_slugify.js
export function slugify(input = "") {
  const map = {
    а:"a", б:"b", в:"v", г:"h", ґ:"g", д:"d", е:"e", є:"ie", ж:"zh", з:"z", и:"y", і:"i", ї:"i", й:"i",
    к:"k", л:"l", м:"m", н:"n", о:"o", п:"p", р:"r", с:"s", т:"t", у:"u", ф:"f", х:"kh", ц:"ts", ч:"ch",
    ш:"sh", щ:"shch", ь:"", ю:"iu", я:"ia",
    ё:"e", ы:"y", э:"e",
  };

  const s = String(input).toLowerCase()
    .replace(/[\u0400-\u04FF]/g, ch => map[ch] ?? ch)
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  return s || "article";
}

export async function ensureUniqueSlug(base, existsFn) {
  let slug = base;
  let i = 1;

  while (i < 50 && (await existsFn(slug))) {
    i += 1;
    slug = `${base}-${i}`;
  }

  return slug;
}
