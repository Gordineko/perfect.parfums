"use client";

import {
  readProfileOrdersCountHint,
  readWishlistCountFromStorage,
} from "@widgets/profile/lib/profileListSkeletonHint";
import pageStyles from "@widgets/profile/ui/ProfilePage.module.scss";
import clsx from "clsx";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

import styles from "./ProfileContentSkeleton.module.scss";

const FORM_FIELD_COUNT = {
  form: 4,
  formExtended: 6,
};

const ORDER_DETAIL_ROW_COUNT = 4;

function pickCount(length) {
  return Array.from({ length }, (_, index) => index);
}

function FormFields({ count }) {
  return (
    <div className={styles.formGrid}>
      {pickCount(count).map((key) => (
        <div key={`field-${String(key)}`} className={styles.field}>
          <div className={styles.fieldLabel} />
          <div className={styles.fieldInput} />
        </div>
      ))}
    </div>
  );
}

function EmptyListSkeleton({ showAction = false }) {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyMessage} />
      {showAction ? <div className={styles.emptyAction} /> : null}
    </div>
  );
}

function OrdersSkeleton({ count }) {
  if (!count) {
    return <EmptyListSkeleton showAction />;
  }

  const cardCount = Math.min(count, 3);

  return (
    <div className={styles.orders}>
      {pickCount(cardCount).map((key) => (
        <div key={`order-${String(key)}`} className={styles.orderCard}>
          <div className={styles.orderHeader}>
            <div className={styles.orderTitle} />
            <div className={styles.orderStatus} />
          </div>
          <div className={clsx(styles.orderLine, styles.orderLineShort)} />
          <div className={styles.orderLine} />
          <div className={styles.orderAction} />
        </div>
      ))}
    </div>
  );
}

function WishlistSkeleton({ count }) {
  if (!count) {
    return <EmptyListSkeleton />;
  }

  const cardCount = Math.min(count, 6);

  return (
    <div className={styles.wishlistGrid}>
      {pickCount(cardCount).map((key) => (
        <div key={`wish-${String(key)}`} className={styles.productCard}>
          <div className={styles.productMedia} />
          <div className={clsx(styles.productLine, styles.productLineShort)} />
          <div className={styles.productLine} />
          <div
            className={clsx(styles.productLine, styles.productLinePrice)}
          />
        </div>
      ))}
    </div>
  );
}

function OrderDetailSkeleton() {
  return (
    <div className={styles.orderDetailCards}>
      {pickCount(2).map((cardKey) => (
        <div key={`detail-card-${String(cardKey)}`} className={styles.detailCard}>
          <div className={styles.detailCardTitle} />
          <div className={styles.detailRows}>
            {pickCount(ORDER_DETAIL_ROW_COUNT).map((rowKey) => (
              <div
                key={`row-${String(cardKey)}-${String(rowKey)}`}
                className={styles.detailRow}
              >
                <div className={styles.detailRowLabel} />
                <div className={styles.detailRowValue} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function resolveProfileSkeletonVariant(pathname) {
  if (!pathname) return "form";

  const isOrderDetail =
    /\/profile\/history\/.+/.test(pathname) &&
    !pathname.endsWith("/profile/history");

  if (isOrderDetail) return "orderDetail";
  if (pathname.includes("/profile/wishlist")) return "wishlist";
  if (pathname.includes("/profile/history")) return "orders";
  if (pathname.includes("/profile/delivery")) return "formExtended";

  return "form";
}

function useWishlistCountHint() {
  const reduxCount = useSelector((state) => state.wishlist?.items?.length ?? 0);
  const [storageCount, setStorageCount] = useState(null);

  useEffect(() => {
    setStorageCount(readWishlistCountFromStorage());
  }, []);

  if (storageCount === null) {
    return reduxCount;
  }

  return Math.max(reduxCount, storageCount);
}

function useOrdersCountHint() {
  const [ordersHint, setOrdersHint] = useState(null);

  useEffect(() => {
    setOrdersHint(readProfileOrdersCountHint());
  }, []);

  return ordersHint ?? 0;
}

export default function ProfileContentSkeleton({ variant: variantProp }) {
  const pathname = usePathname();
  const variant = variantProp ?? resolveProfileSkeletonVariant(pathname);
  const wishlistCount = useWishlistCountHint();
  const ordersCount = useOrdersCountHint();

  const formFieldCount = FORM_FIELD_COUNT[variant] ?? FORM_FIELD_COUNT.form;

  return (
    <div
      className={clsx(pageStyles.page, styles.root)}
      aria-busy="true"
      aria-live="polite"
    >
      <div className={styles.title} />

      <div className={pageStyles.body}>
        {(variant === "form" || variant === "formExtended") && (
          <>
            <FormFields count={formFieldCount} />
            <div className={styles.submit} />
          </>
        )}

        {variant === "orders" && <OrdersSkeleton count={ordersCount} />}
        {variant === "wishlist" && <WishlistSkeleton count={wishlistCount} />}
        {variant === "orderDetail" && <OrderDetailSkeleton />}
      </div>
    </div>
  );
}
