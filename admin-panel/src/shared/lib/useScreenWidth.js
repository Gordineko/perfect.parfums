"use client";

import { useSyncExternalStore } from "react";

// eslint-disable-next-line boundaries/element-types
import { BREAKPOINTS } from "../config/BREAKPOINTS";

const subscribe = (callback) => {
  window.addEventListener("resize", callback);
  return () =>
    window.removeEventListener(
      "resize",
      callback,
    );
};

const getSnapshot = () =>
  window.innerWidth <= BREAKPOINTS.mobileMax;
const getServerSnapshot = () => false;

export const useIsMobile = () => {
  return useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
};
