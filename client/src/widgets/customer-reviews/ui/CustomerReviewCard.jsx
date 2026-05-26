"use client";

import ProductCardStars from "@entities/product/ui/ProductCardStars";
import { localePath, useI18n } from "@shared";
import Image from "next/image";
import Link from "next/link";

import ReviewUserAvatarIcon from "./ReviewUserAvatarIcon";
import styles from "./CustomerReviews.module.scss";

const PRODUCT_IMAGE_FALLBACK = "/img/product-placeholder.png";

function formatReviewDate(value, t) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}.${month}.${year}`;
}

function buildProductHref(locale, slug) {
  if (!slug) return null;

  const path = `product/${slug
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/")}`;

  return localePath(locale, path);
}

export default function CustomerReviewCard({ review }) {
  const { locale, t } = useI18n();
  const name = review.name || t("reviews.nameFallback");
  const dateText = formatReviewDate(review.date, t);
  const productHref = buildProductHref(locale, review.product?.slug);
  const productTitle =
    review.product?.title || t("reviews.productFallback");
  const productImage = review.product?.imageUrl || PRODUCT_IMAGE_FALLBACK;
  const avatarSrc = review.avatarUrl || "";

  const productBlock = (
    <>
      <div className={styles.productImageWrap}>
        <Image
          src={productImage}
          alt=""
          width={80}
          height={80}
          className={styles.productImage}
          sizes="80px"
        />
      </div>
      <div className={styles.productMeta}>
        <p className={styles.productTitle}>{productTitle}</p>
        <ProductCardStars rating={review.rating} />
      </div>
    </>
  );

  return (
    <article className={styles.card}>
      <header className={styles.user}>
        <div className={styles.avatarWrap}>
          {avatarSrc ? (
            <Image
              src={avatarSrc}
              alt=""
              width={40}
              height={40}
              className={styles.avatar}
              sizes="40px"
            />
          ) : (
            <ReviewUserAvatarIcon />
          )}
        </div>
        <div className={styles.userMeta}>
          <p className={styles.userName}>{name}</p>
          {dateText ? (
            <p className={styles.userDate}>{dateText}</p>
          ) : null}
        </div>
      </header>

      {productHref ? (
        <Link href={productHref} className={styles.product}>
          {productBlock}
        </Link>
      ) : (
        <div className={styles.product}>{productBlock}</div>
      )}

      <p className={styles.text}>{review.text || t("reviews.textFallback")}</p>
    </article>
  );
}
