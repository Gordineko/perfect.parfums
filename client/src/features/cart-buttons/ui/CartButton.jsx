"use client";
import { MODALS, useI18n, useModals } from "@shared";
import {
  addToCartAsync,
  incrementQuantityAsync,
} from "@shared";
import { usePathname } from "next/navigation";
import React from "react";
import { useDispatch, useSelector } from "react-redux";

const cartLineId = (item) =>
  item?._id != null ? String(item._id) : item?.id != null ? String(item.id) : "";

const CartButton = ({
  className: _className,
  location,
  children: _children,
  product,
  activeOffer,
  isQuantity,
  style,
  label,
  companionCartItems = [],
  getCompanionCartItems,
}) => {
  const { isModalOpen: _isModalOpen, setIsModalOpen, setIsProdModalId } =
    useModals();
  const dispatch = useDispatch();
  const pathname = usePathname();
  const { t } = useI18n();

  const cartItems = useSelector((state) => state.cart.items);
  const syncPending = useSelector((state) => state.cart.syncPending);

  const hasVariationAxes = (product?.variationAxes?.length ?? 0) > 0;
  const pdpOffer =
    location === "prod-page"
      ? hasVariationAxes
        ? (activeOffer ?? null)
        : (activeOffer ?? product?.offers?.[0] ?? null)
      : null;

  const isPdp = location === "prod-page";

  const productId =
    isPdp && hasVariationAxes
      ? pdpOffer?._id ?? null
      : pdpOffer?._id ||
        product?._id ||
        product?.id ||
        product?.offers?.[0]?._id;

  const isFind =
    productId != null
      ? cartItems?.find(
          (i) =>
            String(i?._id || i?.id || i?.offers?.[0]?._id || "") ===
            String(productId),
        )
      : undefined;

  const offerForStock = pdpOffer ?? product?.offers?.[0];
  const onHand = offerForStock?.stocks?.[0]?.onHand;
  const isOutOfStock = isPdp
    ? !pdpOffer
      ? true
      : pdpOffer.available === false
    : onHand === 0 ||
      product?.availability?.hasAvailable === false ||
      product?.variations?.variations?.[0]?.quantity === 0;

  const pdpVariantClass = isPdp
    ? isOutOfStock
      ? "pdp-info__add-to-cart--disabled"
      : "pdp-info__add-to-cart--enabled"
    : "";

  const pdpPrimaryLabel = () => {
    if (!isPdp) return "";
    if (!pdpOffer) {
      if (hasVariationAxes) return t("commerce.cartButton.chooseVariant");
      return (product?.offers?.length ?? 0) === 0
        ? t("commerce.cartButton.priceOnRequest")
        : t("commerce.cartButton.outOfStock");
    }
    if (pdpOffer.available === false) return t("commerce.cartButton.outOfStock");
    return t("commerce.cartButton.addToCart");
  };

  const resolveCompanionLines = async () => {
    if (typeof getCompanionCartItems === "function") {
      try {
        const rows = await getCompanionCartItems();
        return Array.isArray(rows) ? rows : [];
      } catch (e) {
        console.warn(
          "[cart] getCompanionCartItems failed; main item was already added.",
          e,
        );
        return [];
      }
    }
    return Array.isArray(companionCartItems) ? companionCartItems : [];
  };

  const addCompanionLines = async (lines, qtyEach) => {
    if (!lines?.length) return;

    const mainId = String(productId);
    const qty = Math.max(1, Math.floor(Number(qtyEach)) || 1);

    for (const line of lines) {
      const oid = cartLineId(line);
      if (!oid || oid === mainId) continue;
      try {
        await dispatch(
          addToCartAsync({
            ...line,
            quantityInCart: qty,
          }),
        ).unwrap();
      } catch (e) {
        console.warn(
          `[cart] companion offer ${oid} add failed; continuing with the rest.`,
          e,
        );
      }
    }
  };

  const CartHandler = async () => {
    if (isPdp && !pdpOffer) return;
    if (syncPending) return;

    if (!productId) {
      console.error(t("commerce.cartButton.missingProductId"), product);
      return;
    }

    setIsProdModalId(productId);

    const mainQty = Math.max(
      1,
      Math.floor(
        Number(product?.quantityInCart || isQuantity || 1),
      ) || 1,
    );

    try {
      if (!isFind) {
        const payload =
          pdpOffer != null
            ? {
                ...product,
                _id: productId,
                offers: [pdpOffer],
                quantityInCart: mainQty,
              }
            : {
                ...product,
                _id: productId,
                quantityInCart: mainQty,
              };

        await dispatch(addToCartAsync(payload)).unwrap();
        const companions = await resolveCompanionLines();
        await addCompanionLines(companions, mainQty);
      } else {
        await dispatch(incrementQuantityAsync(productId)).unwrap();
        const companions = await resolveCompanionLines();
        await addCompanionLines(companions, 1);
      }
    } catch (err) {
      console.error(err);
    }

    const path = pathname || "";
    if (!path.includes("/cart")) {
      setIsModalOpen(MODALS.BASKET);
    }
  };

  const disabledBase = isPdp
    ? isOutOfStock
    : product?.variations?.variations?.[0]?.quantity === 0;
  const disabledPrimary = isPdp
    ? isOutOfStock || syncPending
    : (product?.pricing?.min === 0 || product?.pricing?.max === 0) ||
      syncPending;

  const catalogLabel = () => {
    if (label) return label;
    if (onHand === 0) return t("commerce.cartButton.restock");
    return t("commerce.cartButton.addToCartShort");
  };

  return (
    <>
      {isFind ? (
        <button
          type="button"
          className={
            isPdp
              ? `${style || ""} ${pdpVariantClass}`.trim()
              : (style || "product-item__button active")
          }
          disabled={disabledPrimary}
          onClick={(e) => {
            e.stopPropagation();
            if (isPdp && isOutOfStock) return;
            CartHandler();
          }}
        >
          <p>
            {isPdp
              ? isOutOfStock
                ? pdpPrimaryLabel()
                : t("commerce.cartButton.inCart")
              : (onHand === 0
                  ? t("commerce.cartButton.restock")
                  : (label || t("commerce.cartButton.inCart")))}
          </p>
        </button>
      ) : (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (isPdp && isOutOfStock) return;
            CartHandler();
          }}
          className={
            isPdp
              ? `${style || ""} ${pdpVariantClass}`.trim()
              : `product-item__button  ${
                  product?.variations?.variations?.[0]?.quantity === 0
                    ? "productItem__button-waiting"
                    : ""
                } ${style || ""}`
          }
          disabled={disabledBase || syncPending}
        >
          <p>
            {isPdp
              ? isOutOfStock
                ? pdpPrimaryLabel()
                : t("commerce.cartButton.addToCart")
              : catalogLabel()}
          </p>
        </button>
      )}
    </>
  );
};

export default CartButton;
