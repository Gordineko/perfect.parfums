"use client";

import { useI18n } from "@shared";
import {
  DeliveryIcon,
  GuaranteesIcon,
  PaymentMethodIcon,
} from "@shared/index";
import { useMemo } from "react";

const ProductBenefits = () => {
  const { t } = useI18n();

  const advantages = useMemo(
    () => [
      {
        id: 1,
        title: t("pdp.benefits.deliveryTitle"),
        text: t("pdp.benefits.deliveryText"),
        icon: <DeliveryIcon />,
      },
      {
        id: 2,
        title: t("pdp.benefits.warrantyTitle"),
        text: t("pdp.benefits.warrantyText"),
        icon: <GuaranteesIcon />,
      },
      {
        id: 3,
        title: t("pdp.benefits.paymentTitle"),
        text: t("pdp.benefits.paymentText"),
        icon: <PaymentMethodIcon />,
      },
    ],
    [t],
  );

  return (
    <section className="product-benefits section-margin">
      <ul className="product-benefits__list">
        {advantages.map((item) => (
          <li
            key={item.id}
            className="product-benefits__item"
          >
            <div className="product-benefits__icon">
              {item.icon}
            </div>

            <h3 className="product-benefits__title">
              {item.title}
            </h3>
            <p className="product-benefits__text">
              {item.text}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default ProductBenefits;
