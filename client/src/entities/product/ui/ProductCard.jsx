"use client";

import CartButton from "@features/cart-buttons";
import ProductWishlistButton from "@features/toggle-wishlist";
import {
  formatPriceDigits,
  parsePriceLikeNumber,
} from "@shared/lib/formatPrice";
import { useI18n } from "@shared";
import Image from "next/image";
import { useMemo, useState } from "react";

import { mapProductCardView } from "../model/mapProductCardView";
import ProductCardStars from "./ProductCardStars";
import ProductCardVolumeSelect from "./ProductCardVolumeSelect";
import styles from "./ProductCard.module.scss";

function resolveOffer(product, volume) {
  if (!volume?.offerId || !Array.isArray(product?.offers)) {
    return product?.offers?.[0] ?? null;
  }

  return (
    product.offers.find(
      (offer) => String(offer?._id) === String(volume.offerId),
    ) ?? product.offers[0] ?? null
  );
}

export default function ProductCard({
  product,
  card: cardProp,
  locale: localeProp,
  className,
  imagePriority = false,
  discountBadge = null,
  WishButton: WishButtonProp,
  CartButton: CartButtonProp,
}) {
  const { locale: i18nLocale } = useI18n();
  const locale = localeProp ?? i18nLocale ?? "ua";

  const card = useMemo(() => {
    if (cardProp) return cardProp;
    return mapProductCardView(product, locale);
  }, [cardProp, product, locale]);

  if (!card) {
    return null;
  }

  const {
    product: cardProduct,
    image,
    brand,
    title,
    rating,
    pricing,
    volumes,
  } = card;

  const defaultVolumeId =
    volumes[0]?.offerId ?? String(volumes[0]?.ml ?? "default");

  const [selectedVolumeId, setSelectedVolumeId] = useState(defaultVolumeId);

  const selectedVolume = useMemo(
    () =>
      volumes.find(
        (volume) =>
          (volume.offerId ?? String(volume.ml)) === selectedVolumeId,
      ) ?? volumes[0],
    [selectedVolumeId, volumes],
  );

  const selectedOffer = useMemo(
    () => resolveOffer(cardProduct, selectedVolume),
    [cardProduct, selectedVolume],
  );

  const productForCart = useMemo(() => {
    if (!selectedOffer) {
      return cardProduct;
    }

    return {
      ...cardProduct,
      _id: selectedOffer._id ?? cardProduct._id,
      offers: [selectedOffer],
      pricing: {
        min: String(
          Math.round(
            Number(selectedOffer.effectivePrice ?? selectedOffer.price) ||
              0,
          ),
        ),
        currency: pricing?.currency ?? "UAH",
      },
    };
  }, [cardProduct, selectedOffer, pricing?.currency]);

  const WishButton = WishButtonProp ?? ProductWishlistButton;
  const CardCartButton = CartButtonProp ?? CartButton;

  const priceValue = parsePriceLikeNumber(pricing?.min);
  const oldPriceValue = parsePriceLikeNumber(pricing?.old);
  const hasOldPrice =
    pricing?.old != null &&
    String(pricing.old).trim() !== "" &&
    Number.isFinite(oldPriceValue) &&
    Number.isFinite(priceValue) &&
    oldPriceValue > priceValue;

  const priceText = Number.isFinite(priceValue)
    ? `${formatPriceDigits(priceValue)} грн`
    : "0 грн";

  return (
    <article
      className={[styles.card, className].filter(Boolean).join(" ")}
    >
      <div className={styles.media}>
        <div className={styles.imageWrap}>
          <Image
            className={styles.image}
            src={image}
            alt={title}
            width={366}
            height={366}
            priority={imagePriority}
            sizes="(max-width: 768px) 50vw, 25vw"
          />

          {discountBadge ? (
            <div
              className={styles.discount}
              aria-label={discountBadge.ariaLabel}
            >
              <span className={styles.discountText}>
                {discountBadge.text}
              </span>
            </div>
          ) : null}

          <div className={styles.wishlist}>
            <WishButton product={cardProduct} />
          </div>
        </div>

        <div className={styles.rating}>
          <ProductCardStars rating={rating} />
        </div>
      </div>

      <div className={styles.body}>
        {brand ? (
          <p className={styles.brand}>{brand}</p>
        ) : null}
        <h3 className={styles.name}>{title}</h3>

        <div className={styles.price}>
          <div className={styles.priceRow}>
            <p className={styles.priceCurrent}>{priceText}</p>
            {hasOldPrice ? (
              <p className={styles.priceOld}>
                {`${formatPriceDigits(oldPriceValue)} грн`}
              </p>
            ) : null}
          </div>
        </div>

        <div className={styles.volume}>
          <ProductCardVolumeSelect
            id={`volume-${card.id}`}
            volumes={volumes}
            value={selectedVolumeId}
            ariaLabel={locale === "en" ? "Volume" : "Об'єм"}
            onChange={setSelectedVolumeId}
          />
        </div>

        <div className={styles.actions}>
          <CardCartButton product={productForCart} />
        </div>
      </div>
    </article>
  );
}
