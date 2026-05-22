"use client";

import { useI18n } from "@shared/i18n/use-i18n";
import {
  formatPriceDigits,
  parsePriceLikeNumber,
} from "@shared/lib/formatPrice";

const ProductPrice = ({
  quantity,
  price,
  isBasket,
  showCurrent = true,
  showOld = true,
  hasDiscount = false,
}) => {
  const safePriceValue = parsePriceLikeNumber(price?.min);
  const safeOldPriceValue = parsePriceLikeNumber(price?.old);
  const safePrice = Number.isFinite(safePriceValue)
    ? safePriceValue
    : 0;
  const safeOldPrice = Number.isFinite(safeOldPriceValue)
    ? safeOldPriceValue
    : 0;

  const { t } = useI18n();
  const currency = price?.currency ?? "UAH";
  const currencyLabel =
    currency === "UAH" ? t("currency.uah") : currency;

  const lineCurrent = quantity
    ? quantity * safePrice
    : safePrice;
  const lineOld = quantity
    ? quantity * safeOldPrice
    : safeOldPrice;

  const hasOldFromBackend =
    price?.old != null &&
    String(price.old).trim() !== "" &&
    Number.isFinite(safeOldPriceValue);
  const isDiscount =
    hasOldFromBackend && safeOldPrice > safePrice;
  const saleHighlight = Boolean(hasDiscount || isDiscount);

  const priceTextOther = (value) =>
    `${formatPriceDigits(value)} ${currencyLabel}`;

  const renderPriceLine = (value, withSaleAccent) => (
    <span
      className={[
        "product-item__price",
        "product-item__price-line",
        withSaleAccent && saleHighlight
          ? "product-item__price-line--sale"
          : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {currency === "UAH"
        ? priceTextOther(value)
        : priceTextOther(value)}
    </span>
  );

  return (
    <div
      itemProp="offers"
      itemScope
      itemType="https://schema.org/Offer"
      className={[
        "product-item__wrapper",
        showOld && isDiscount ? "product-item__wrapper--discount" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {showOld && isDiscount && (
        <span className="product-item__price-old">
          {priceTextOther(lineOld)}
        </span>
      )}

      {showCurrent && (
        <>
          <meta itemProp="price" content={String(lineCurrent)} />
          {renderPriceLine(lineCurrent, true)}
        </>
      )}

      {isBasket && (
        <p className="product-item__price-until">
          {t("basket.pricePerUnit")} {formatPriceDigits(safePrice)}{" "}
          {currencyLabel}
        </p>
      )}

      <meta
        itemProp="priceCurrency"
        content={currency}
      />
    </div>
  );
};

export default ProductPrice;
