"use client";

import {
  FavoriteHeart,
  toggleWishlistAsync,
  wishlistContainsGroupForProduct,
  wishlistItemGroupId,
} from "@shared";
import debounce from "lodash.debounce";
import { useParams } from "next/navigation";
import { useTranslation } from "next-i18next";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";

const WISHLIST_CLICK_DEBOUNCE_MS = 400;

const WishlistButton = ({ className, product }) => {
  const { t } = useTranslation("common");
  const dispatch = useDispatch();
  const params = useParams();
  const locale = params?.locale ?? "ua";

  const wishlistItems = useSelector((state) => state.wishlist.items);
  const syncPending = useSelector((state) => state.wishlist.syncPending);
  const status = useSelector((state) => state.wishlist.status);
  const wishlistBusy = Boolean(syncPending) || status === "loading";

  const [mounted, setMounted] = useState(false);
  const [localBusy, setLocalBusy] = useState(false);
  const inFlightRef = useRef(false);
  const debouncedToggleRef = useRef(null);

  const payloadProduct = useMemo(() => {
    if (!product || typeof product !== "object") {
      return null;
    }
    const enriched = { ...product, __locale: locale };
    const mongo = wishlistItemGroupId(enriched);
    const fallback =
      product._id ?? product.id ?? product.groupId ?? product.slug;
    const id = mongo ?? (fallback != null ? String(fallback) : null);
    if (id == null || String(id).trim() === "") {
      return null;
    }
    return { ...enriched, _id: String(id) };
  }, [locale, product]);

  const isInWishlist = useMemo(
    () =>
      payloadProduct
        ? wishlistContainsGroupForProduct(wishlistItems, payloadProduct)
        : false,
    [payloadProduct, wishlistItems],
  );

  const runToggle = useCallback(
    async (payload) => {
      if (inFlightRef.current) {
        return;
      }
      inFlightRef.current = true;
      setLocalBusy(true);
      try {
        await dispatch(toggleWishlistAsync(payload)).unwrap();
      } catch {} finally {
        inFlightRef.current = false;
        setLocalBusy(false);
      }
    },
    [dispatch],
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    debouncedToggleRef.current = debounce(
      (payload) => {
        void runToggle(payload);
      },
      WISHLIST_CLICK_DEBOUNCE_MS,
      { leading: true, trailing: false },
    );
    return () => {
      debouncedToggleRef.current?.cancel?.();
    };
  }, [runToggle]);

  const buttonBusy = localBusy || wishlistBusy;

  const WishlistHandler = useCallback(
    (e) => {
      e.stopPropagation();
      if (
        inFlightRef.current ||
        buttonBusy ||
        !payloadProduct
      ) {
        return;
      }
      debouncedToggleRef.current?.(payloadProduct);
    },
    [buttonBusy, payloadProduct],
  );

  if (!product) return null;

  return (
    <button
      type="button"
      className={`product-item__favorite ${mounted && isInWishlist ? "active" : ""} ${className || ""}`}
      onClick={WishlistHandler}
      aria-label={
        isInWishlist
          ? t("wishlist.removeFromWishlist")
          : t("wishlist.addToWishlist")
      }
      aria-busy={buttonBusy}
      disabled={buttonBusy}
    >
      <FavoriteHeart />
    </button>
  );
};

export default WishlistButton;
