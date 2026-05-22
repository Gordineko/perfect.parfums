"use client";

import { getLocalizedProductField } from "@entities/product/model/getLocalizedProductField";
import { pickPrimaryImageFromProduct } from "@entities/product/model/pickPrimaryImageFromProduct";
import { resolveProductSlug } from "@entities/product/model/resolveProductSlug";
import Image from "next/image";
import Link from "next/link";

import styles from "./SearchResultRow.module.scss";

export default function SearchResultRow({ product, locale, onClose }) {
  const slug = resolveProductSlug(product, locale);
  if (!slug) return null;

  const href = `/${locale}/product/${slug
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/")}`;

  const title = getLocalizedProductField(product, "title", locale);
  const imageSrc = pickPrimaryImageFromProduct(product);

  return (
    <Link href={href} className={styles.row} onClick={onClose}>
      <span className={styles.thumb}>
        {imageSrc ? (
          <Image src={imageSrc} alt="" width={48} height={48} className={styles.image} />
        ) : (
          <span className={styles.thumbPlaceholder} aria-hidden />
        )}
      </span>
      <span className={styles.title}>{title}</span>
    </Link>
  );
}
