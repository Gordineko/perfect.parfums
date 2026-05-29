"use client";

import clsx from "clsx";

import styles from "./OrderStatusSkeleton.module.scss";

function pickCount(length) {
  return Array.from({ length }, (_, index) => index);
}

export default function OrderStatusSkeleton({ itemCount = 0 }) {
  const count = Math.min(Math.max(itemCount, 0), 5);

  return (
    <div
      className={clsx("order__status", styles.root)}
      aria-busy="true"
      aria-live="polite"
    >
      <div className={styles.title} />

      {count === 0 ? (
        <div className={styles.emptyMessage} />
      ) : (
      <div className="order__status__list">
        {pickCount(count).map((key) => (
          <div key={`cart-item-${String(key)}`} className={styles.item}>
            <div className={styles.itemImage} />
            <div className={styles.itemBody}>
              <div className={styles.itemLine} />
              <div className={styles.itemLineShort} />
              <div className={styles.itemLineMuted} />
              <div className={styles.itemCost} />
            </div>
          </div>
        ))}
      </div>
      )}

      <div className={clsx("order__status__data", styles.data)}>
        <div className={styles.totalRow}>
          <div className={styles.totalLabel} />
          <div className={styles.totalValue} />
        </div>
      </div>
    </div>
  );
}
