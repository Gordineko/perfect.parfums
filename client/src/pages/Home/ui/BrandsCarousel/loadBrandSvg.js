import { readdirSync, readFileSync } from "fs";
import { join } from "path";

export const BRANDS_DIR = join(process.cwd(), "src/pages/Home/ui/BrandsCarousel");

const BRAND_FILE_PATTERN = /^brand-(\d+)\.svg$/i;

export function loadBrandSvg(filename) {
  return readFileSync(join(BRANDS_DIR, filename), "utf8").trim();
}

export function getBrands() {
  const filenames = readdirSync(BRANDS_DIR)
    .filter((name) => BRAND_FILE_PATTERN.test(name))
    .sort((a, b) => {
      const numA = Number(a.match(BRAND_FILE_PATTERN)?.[1] ?? 0);
      const numB = Number(b.match(BRAND_FILE_PATTERN)?.[1] ?? 0);
      return numA - numB;
    });

  return filenames.map((filename) => {
    const index = filename.match(BRAND_FILE_PATTERN)?.[1] ?? "";
    return {
      id: `brand-${index}`,
      name: `Brand ${index}`,
      svg: loadBrandSvg(filename),
    };
  });
}
