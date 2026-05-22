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
  window.innerWidth < BREAKPOINTS.desktop;
const getTabletSnapshot = () =>
  window.innerWidth < BREAKPOINTS.tablet;
const getServerSnapshot = () => false;

export const useIsMobile = () => {
  return useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
};

export const useIsTabletDown = () => {
  return useSyncExternalStore(
    subscribe,
    getTabletSnapshot,
    getServerSnapshot,
  );
};
