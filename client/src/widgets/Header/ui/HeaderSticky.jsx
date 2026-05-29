"use client";

import clsx from "clsx";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import styles from "./Header.module.scss";

function detectNotFoundPage() {
  if (typeof document === "undefined") return false;

  return (
    document.documentElement.classList.contains("is-not-found-page") ||
    Boolean(document.querySelector(".not-found-standalone"))
  );
}

export default function HeaderSticky({ lightHeader, navBar }) {
  const lightRef = useRef(null);
  const navRef = useRef(null);
  const sentinelRef = useRef(null);
  const [isPinned, setIsPinned] = useState(false);
  const [navHeight, setNavHeight] = useState(0);
  const [isNotFoundPage, setIsNotFoundPage] = useState(false);

  useLayoutEffect(() => {
    setIsNotFoundPage(detectNotFoundPage());
  }, []);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || isNotFoundPage) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsPinned(!entry.isIntersecting),
      { root: null, threshold: 0 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [isNotFoundPage]);

  useEffect(() => {
    const syncNotFound = () => {
      setIsNotFoundPage(detectNotFoundPage());
    };

    syncNotFound();
    const observer = new MutationObserver(syncNotFound);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isNotFoundPage) return;

    const lightEl = lightRef.current;
    const navEl = navRef.current;
    if (!lightEl) return;

    const syncMetrics = () => {
      const lightHeight = Math.ceil(lightEl.getBoundingClientRect().height);
      const navH = navEl ? Math.ceil(navEl.getBoundingClientRect().height) : 0;

      setNavHeight(navH);
      document.documentElement.style.setProperty(
        "--header-light-height",
        `${lightHeight}px`,
      );
      document.documentElement.style.setProperty("--header-nav-height", `${navH}px`);
      document.documentElement.style.setProperty(
        "--header-offset",
        `${lightHeight + navH}px`,
      );
      document.documentElement.style.setProperty(
        "--header-offset-compact",
        `${navH}px`,
      );
    };

    syncMetrics();
    const observer = new ResizeObserver(syncMetrics);
    observer.observe(lightEl);
    if (navEl) observer.observe(navEl);

    return () => observer.disconnect();
  }, [isNotFoundPage, isPinned]);

  if (isNotFoundPage) {
    return null;
  }

  return (
    <div className={styles.siteHeader}>
      <div ref={lightRef} className={styles.lightHeader}>
        {lightHeader}
      </div>

      <div ref={sentinelRef} className={styles.sentinel} aria-hidden="true" />
      {isPinned && navHeight > 0 ? (
        <div
          className={styles.navPlaceholder}
          style={{ height: navHeight }}
          aria-hidden="true"
        />
      ) : null}
      <div
        ref={navRef}
        className={clsx(styles.burgundyBar, isPinned && styles.burgundyPinned)}
      >
        {navBar}
      </div>
    </div>
  );
}
