"use client";
import { useI18n } from "@shared/i18n/use-i18n";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useMemo, useState } from "react";

import { formatOrderDate } from "../lib/formatOrderDate";

const OrderItem = ({ order, locale }) => {
  const fallback = "/img/fallback.png";

  const { t } = useI18n();
  const router = useRouter();
  const getStatusVariant = (status) => {
    const s = String(status ?? "")
      .trim()
      .toLowerCase();
    if (
      s.includes("скасовано") ||
      s.includes("cancel") ||
      s.includes("cancelled")
    ) {
      return "cancelled";
    }
    if (
      s.includes("виконано") ||
      s.includes("delivered") ||
      s.includes("completed") ||
      s.includes("paid")
    ) {
      return "done";
    }
    if (
      s.includes("оброб") ||
      s.includes("processing") ||
      s.includes("pending") ||
      s.includes("new")
    ) {
      return "processing";
    }
    return "processing";
  };

  const statusVariant = getStatusVariant(order?.status);

  const getItemCategoryLabel = (item) => {
    const category =
      item?.offerId?.category?.title?.ua ??
      item?.offerId?.category?.title?.uk ??
      item?.offerId?.category?.title?.en ??
      item?.offerId?.category?.title ??
      item?.offerId?.categoryTitle?.ua ??
      item?.offerId?.categoryTitle?.uk ??
      item?.offerId?.categoryTitle?.en ??
      item?.offerId?.categoryTitle ??
      item?.offerId?.category?.ua ??
      item?.offerId?.category?.uk ??
      item?.offerId?.category?.en ??
      item?.offerId?.category ??
      item?.categoryTitle ??
      item?.category;

    const label = typeof category === "string" ? category.trim() : "";
    return label.length ? label : "Взуття";
  };
  const items = Array.isArray(order?.items) ? order.items : [];
  const hasMoreThanTwoItems = items.length > 2;
  const [isExpanded, setIsExpanded] = useState(false);

  const visibleItems = useMemo(() => {
    if (!hasMoreThanTwoItems) return items;
    return isExpanded ? items : items.slice(0, 2);
  }, [hasMoreThanTwoItems, isExpanded, items]);

  return (
    <div className="order">
      <div className="order__header">
        <div className="order__header-txt">
          <p>{t("profile.orderNumber", { number: order.orderNumber })}</p>
          <p>{formatOrderDate(order.createdAt, locale)}</p>
        </div>
        <div
          className={`order__header-status order__header-status--${statusVariant}`}
        >
          {order.status}
        </div>
      </div>
      <div className="order__list">
        {visibleItems.map((item, index) => (
          <div key={index} className="order-item">
            <div className="order-item__wrapper">
              <Image src={fallback} alt="404" width={50} height={50} />
              <p className="t">
                <span className="order-item__title">
                  {item?.titleSnapshot?.[locale] ??
                    item?.titleSnapshot ??
                    item?.offerId?.sku ??
                    item?.sku ??
                    ""}
                </span>
                <span className="order-item__category">
                  ({getItemCategoryLabel(item)})
                </span>
              </p>
            </div>
            <div className="order-item__wrapper">
              <p className="order-item__quantity">{item.qty} шт</p>
              <p className="order-item__cost">{item.pricePerUnit} ₴</p>
            </div>
          </div>
        ))}

        {hasMoreThanTwoItems ? (
          <button
            type="button"
            className="order__items-toggle"
            onClick={() => setIsExpanded((v) => !v)}
          >
            {isExpanded ? t("profile.collapseItems") : t("profile.viewAllItems")}
            <span
              className={`order__items-toggle-icon${isExpanded ? " is-open" : ""}`}
              aria-hidden="true"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="11"
                height="7"
                viewBox="0 0 11 7"
                fill="none"
              >
                <path
                  d="M9.66406 0.74707L5.16406 4.74707L0.664063 0.74707"
                  stroke="#0D0D0D"
                  strokeWidth="2"
                />
              </svg>
            </span>
          </button>
        ) : null}
      </div>
      <div className="order__func">
        <p>{order.totalToPay} ₴</p>
        <button
          onClick={() =>
            router.push(`/${locale}/profile/history/${order.orderNumber}`)
          }
        >
          {t("profile.orderDetails")}
        </button>
      </div>
    </div>
  );
};

export default OrderItem;