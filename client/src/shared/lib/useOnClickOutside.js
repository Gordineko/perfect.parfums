"use client";

import { useEffect, useRef } from "react";

export function useOnClickOutside(ref, handler, enabled = true) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!enabled) return undefined;

    const onPointerDown = (event) => {
      const root = ref.current;
      if (!root || root.contains(event.target)) return;
      handlerRef.current?.(event);
    };

    document.addEventListener("mousedown", onPointerDown, true);
    document.addEventListener("touchstart", onPointerDown, true);
    return () => {
      document.removeEventListener("mousedown", onPointerDown, true);
      document.removeEventListener("touchstart", onPointerDown, true);
    };
  }, [ref, enabled]);
}
