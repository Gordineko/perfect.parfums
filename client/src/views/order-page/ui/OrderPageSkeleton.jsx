"use client";

import OrderStatusSkeleton from "@features/order-status/ui/OrderStatusSkeleton";
import clsx from "clsx";
import { useSelector } from "react-redux";

import styles from "./OrderPageSkeleton.module.scss";

function pickCount(length) {
  return Array.from({ length }, (_, index) => index);
}

function FormFields({ count, fullWidth = false }) {
  return pickCount(count).map((key) => (
    <div
      key={`field-${String(key)}`}
      className={clsx(
        "form-group",
        fullWidth && count === 1 && "form-group--span-2",
      )}
    >
      <div className={styles.fieldLabel} />
      <div className={styles.fieldInput} />
    </div>
  ));
}

function FormSection({ fieldCount = 4, fullWidth = false, textarea = false }) {
  return (
    <div className="user-details__group">
      <div className="user-details__head">
        <div className={styles.sectionTitle} />
      </div>

      <div
        className={clsx(
          "user-details__form-group",
          textarea && "user-details__form-group--full",
        )}
      >
        {textarea ? (
          <div className="form-group form-group--span-2">
            <div className={styles.fieldLabel} />
            <div className={styles.textarea} />
          </div>
        ) : (
          <FormFields count={fieldCount} fullWidth={fullWidth} />
        )}
      </div>
    </div>
  );
}

export default function OrderPageSkeleton({
  showBreadcrumbs = false,
  showSidebar = true,
}) {
  const cartItemCount = useSelector((state) => state.cart?.items?.length ?? 0);

  return (
    <>
      {showBreadcrumbs ? (
        <div className={styles.breadcrumbs}>
          <div className="container">
            <div className={styles.breadcrumbLine} />
          </div>
        </div>
      ) : null}

      <div className={clsx("order__wrapper", styles.root)} aria-busy="true">
        <div
          className={clsx(
            "user-details user-details--order",
            styles.formColumn,
          )}
        >
          <FormSection fieldCount={4} />
          <FormSection fieldCount={4} />
          <FormSection fieldCount={1} fullWidth />
          <FormSection textarea />
        </div>

        {showSidebar ? (
          <div className="order__sidebar">
            <OrderStatusSkeleton itemCount={cartItemCount} />
            <div className={styles.submitBtn} />
          </div>
        ) : null}
      </div>
    </>
  );
}
