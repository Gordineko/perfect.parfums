"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import styles from "./ProductCard.module.scss";

export default function ProductCardVolumeSelect({
  id,
  volumes,
  value,
  onChange,
  ariaLabel,
}) {
  const [open, setOpen] = useState(false);
  const [menuRect, setMenuRect] = useState(null);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef(null);
  const listRef = useRef(null);

  const selected =
    volumes.find(
      (volume) => (volume.offerId ?? String(volume.ml)) === value,
    ) ?? volumes[0];

  const updateMenuRect = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    setMenuRect({
      top: rect.bottom - 1,
      left: rect.left,
      width: rect.width,
    });
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    updateMenuRect();

    const handleOutside = (event) => {
      const target = event.target;
      if (
        triggerRef.current?.contains(target) ||
        listRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("resize", updateMenuRect);
    window.addEventListener("scroll", updateMenuRect, true);
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("resize", updateMenuRect);
      window.removeEventListener("scroll", updateMenuRect, true);
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, updateMenuRect]);

  const menu =
    open && menuRect && mounted
      ? createPortal(
          <ul
            ref={listRef}
            className={styles.volumeList}
            role="listbox"
            aria-label={ariaLabel}
            style={{
              position: "fixed",
              top: menuRect.top,
              left: menuRect.left,
              width: menuRect.width,
              zIndex: 10000,
            }}
          >
            {volumes.map((volume) => {
              const optionValue =
                volume.offerId ?? String(volume.ml);
              const isSelected = optionValue === value;

              return (
                <li
                  key={optionValue}
                  role="presentation"
                  className={styles.volumeListItem}
                >
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className={[
                      styles.volumeOption,
                      isSelected ? styles.volumeOptionSelected : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={(event) => {
                      event.stopPropagation();
                      onChange(optionValue);
                      setOpen(false);
                    }}
                  >
                    {volume.label ?? `${volume.ml} мл`}
                  </button>
                </li>
              );
            })}
          </ul>,
          document.body,
        )
      : null;

  return (
    <div className={styles.volumeSelect}>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        className={styles.volumeTrigger}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={(event) => {
          event.stopPropagation();
          if (open) {
            setOpen(false);
            return;
          }
          updateMenuRect();
          setOpen(true);
        }}
      >
        <span className={styles.volumeTriggerLabel}>
          {selected?.label ?? `${selected?.ml} мл`}
        </span>
      </button>
      {menu}
    </div>
  );
}
