"use client";

import { useEffect, useState } from "react";

import styles from "./Header.module.scss";

export default function HeaderSticky({ children }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isNotFoundPage, setIsNotFoundPage] = useState(false);

  useEffect(() => {
    const update = () => setIsScrolled(window.scrollY > 4);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  useEffect(() => {
    const syncNotFound = () => {
      setIsNotFoundPage(
        document.documentElement.classList.contains("is-not-found-page"),
      );
    };

    syncNotFound();
    const observer = new MutationObserver(syncNotFound);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  return (
    <header
      className={[
        styles.root,
        isScrolled ? styles.scrolled : "",
        isNotFoundPage ? styles.rootNotFound : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </header>
  );
}

