import {
  toggleWishlistAsync,
  wishlistContainsGroupForProduct,
} from "@shared";
import debounce from "lodash.debounce";
import { useParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useDispatch, useSelector, useStore } from "react-redux";

import { getWishlistProductId } from "../lib/getWishlistProductId";
import { useWishlistAddSuccess } from "../lib/wishlistAddSuccessContext";

const WISHLIST_CLICK_DEBOUNCE_MS = 400;

export function useToggleWishlistButton({
  product,
  productId: productIdProp,
  isActive,
  onToggle,
}) {
  const dispatch = useDispatch();
  const store = useStore();
  const { notifyAddedToWishlist } = useWishlistAddSuccess();
  const params = useParams();
  const locale = params?.locale ?? "ua";
  const wishlistItems = useSelector(
    (state) => state?.wishlist?.items ?? [],
  );
  const syncPending = useSelector((state) => state?.wishlist?.syncPending);
  const status = useSelector((state) => state?.wishlist?.status);
  const wishlistBusy =
    !onToggle && (Boolean(syncPending) || status === "loading");

  const [mounted, setMounted] = useState(false);
  const [localBusy, setLocalBusy] = useState(false);
  const inFlightRef = useRef(false);
  const debouncedToggleRef = useRef(null);

  const resolvedProductId = useMemo(() => {
    if (productIdProp != null) return String(productIdProp);
    const enriched =
      product && typeof product === "object"
        ? { ...product, __locale: locale }
        : product;
    const id = getWishlistProductId(enriched);
    return id != null ? String(id) : null;
  }, [locale, product, productIdProp]);

  const payloadProduct = useMemo(() => {
    if (!product || typeof product !== "object") {
      return null;
    }
    if (resolvedProductId == null) {
      return null;
    }
    return { ...product, _id: resolvedProductId };
  }, [product, resolvedProductId]);

  const derivedIsActive = useMemo(() => {
    if (typeof isActive === "boolean") {
      return isActive;
    }
    if (!payloadProduct) {
      return false;
    }
    return wishlistContainsGroupForProduct(wishlistItems, payloadProduct);
  }, [isActive, payloadProduct, wishlistItems]);

  const runToggle = useCallback(
    async (payload) => {
      if (inFlightRef.current) {
        return;
      }
      inFlightRef.current = true;
      setLocalBusy(true);
      try {
        const beforeIn = wishlistContainsGroupForProduct(
          store.getState().wishlist.items,
          payload,
        );
        await dispatch(toggleWishlistAsync(payload)).unwrap();
        const afterIn = wishlistContainsGroupForProduct(
          store.getState().wishlist.items,
          payload,
        );
        if (!beforeIn && afterIn) {
          notifyAddedToWishlist();
        }
      } catch {
        void 0;
      } finally {
        inFlightRef.current = false;
        setLocalBusy(false);
      }
    },
    [dispatch, notifyAddedToWishlist, store],
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

  const handleClick = useCallback(
    (e) => {
      e?.preventDefault?.();
      e?.stopPropagation?.();

      if (
        inFlightRef.current ||
        buttonBusy ||
        !resolvedProductId ||
        !payloadProduct
      ) {
        return;
      }

      if (onToggle) {
        onToggle(resolvedProductId);
        return;
      }

      debouncedToggleRef.current?.(payloadProduct);
    },
    [buttonBusy, onToggle, payloadProduct, resolvedProductId],
  );

  return {
    derivedIsActive: mounted && derivedIsActive,
    buttonBusy,
    handleClick,
  };
}
