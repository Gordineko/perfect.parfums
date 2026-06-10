import { generateSlug } from '../../product-form/lib/generateSlug';

const generateRandom7Digit = () => String(Math.floor(1000000 + Math.random() * 9000000));

export const generateSku = (...parts) => {
    const normalized = parts
        .flat()
        .map((part) => String(part ?? '').trim())
        .filter(Boolean)
        .map((part) => generateSlug(part).toUpperCase())
        .filter(Boolean)
        .join('-')
        .replace(/-+/g, '-');

    const baseSku = normalized || 'SKU';

    return `${baseSku}-${generateRandom7Digit()}`;
};