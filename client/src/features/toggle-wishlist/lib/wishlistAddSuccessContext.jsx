"use client";

import { BREAKPOINTS } from "@shared";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

import WishlistAddSuccessPopup from "../ui/WishlistAddSuccessPopup";

const AUTO_DISMISS_MS = 5000;
const MOBILE_MAX_MQ = `(max-width: ${BREAKPOINTS.mobileMax}px)`;

const subscribeMobileViewport = (onStoreChange) => {
  if (typeof window === "undefined") return () => {};
  const mq = window.matchMedia(MOBILE_MAX_MQ);
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
};

const getMobileViewportSnapshot = () => {
  if (typeof window === "undefined") return false;
  return window.matchMedia(MOBILE_MAX_MQ).matches;
};

const getServerMobileViewportSnapshot = () => false;

const WishlistAddSuccessContext = createContext({
  notifyAddedToWishlist: () => {},
});

export function WishlistAddSuccessProvider({ children, locale }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [showCycle, setShowCycle] = useState(0);

  const isMobileViewport = useSyncExternalStore(
    subscribeMobileViewport,
    getMobileViewportSnapshot,
    getServerMobileViewportSnapshot,
  );

  const closePopup = useCallback(() => {
    setExiting(false);
    setOpen(false);
  }, []);

  const notifyAddedToWishlist = useCallback(() => {
    if (isMobileViewport) return;
    setExiting(false);
    setOpen(true);
    setShowCycle((c) => c + 1);
  }, [isMobileViewport]);

  const goToWishlist = useCallback(() => {
    closePopup();
    const loc = locale ?? "ua";
    const hasToken = Boolean(Cookies.get("auth_token"));
    const path = hasToken ? "profile/wishlist" : "wishlist";
    router.push(`/${loc}/${path}`);
  }, [closePopup, locale, router]);

  useEffect(() => {
    if (isMobileViewport) {
      closePopup();
    }
  }, [closePopup, isMobileViewport]);

  useEffect(() => {
    if (!open) return;
    setExiting(false);
    const id = window.setTimeout(() => {
      setExiting(true);
    }, AUTO_DISMISS_MS);
    return () => window.clearTimeout(id);
  }, [open, showCycle]);

  const value = useMemo(
    () => ({ notifyAddedToWishlist }),
    [notifyAddedToWishlist],
  );

  return (
    <WishlistAddSuccessContext.Provider value={value}>
      {children}
      {open && (
        <WishlistAddSuccessPopup
          exiting={exiting}
          onExitTransitionEnd={closePopup}
          onNavigate={goToWishlist}
        />
      )}
    </WishlistAddSuccessContext.Provider>
  );
}

export function useWishlistAddSuccess() {
  return useContext(WishlistAddSuccessContext);
}
