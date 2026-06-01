"use client";

import ProductItem from "@entities/product";
import WishlistButton from "@features/wish-buttons";
import { BREAKPOINTS, getViewedProducts, useI18n } from "@shared";
import { useEffect, useMemo, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";

const ViewedProducts = ({ title }) => {
  const { t } = useI18n();
  const [items, setItems] = useState([]);

  useEffect(() => {
    setItems(getViewedProducts());
  }, []);

  const products = useMemo(() => items.filter(Boolean), [items]);
  const heading = title ?? t("pdp.viewedProductsTitle");

  if (!products.length) return null;

  return (
    <section
      className="viewed-products recommended-products"
      aria-label={t("pdp.viewedProductsSectionAria")}
    >
      <div className="recommended-products__heading">
        <h2 className="recommended-products__title">{heading}</h2>
      </div>

      <Swiper
        className="viewed-products__swiper recommended-products__swiper"
        modules={[]}
        spaceBetween={16}
        slidesPerView={2}
        loop={false}
        breakpoints={{
          [BREAKPOINTS.tablet]: {
            slidesPerView: 3,
            spaceBetween: 16,
          },
          [BREAKPOINTS.desktop]: {
            slidesPerView: 5,
            spaceBetween: 24,
          },
        }}
      >
        {products.map((prod, index) => (
          <SwiperSlide
            key={(prod?._id || prod?.id || prod?.slug || index) + "-viewed"}
            className="recommended-products__slide"
          >
            <ProductItem
              actionButtons={{
                WishButton: () => (
                  <WishlistButton product={prod} className="wishlist-button" />
                ),
              }}
              product={prod}
              location="swiper"
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
};

export default ViewedProducts;

