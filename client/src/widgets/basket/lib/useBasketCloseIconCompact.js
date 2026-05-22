"use client";

import { BREAKPOINTS } from "@shared";
import { useSyncExternalStore } from "react";

export function useBasketCloseIconCompact() {
  return useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener("resize", onStoreChange);
      return () =>
        window.removeEventListener("resize", onStoreChange);
    },
    () => window.innerWidth < BREAKPOINTS.tablet,
    () => false,
  );
}
