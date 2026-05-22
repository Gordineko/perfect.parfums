"use client";

import "swiper/css";

import ProductItem from "@entities/product";
import WishlistButton from "@features/wish-buttons";
import { BREAKPOINTS, normalizeCatalogCardForProductItem } from "@shared";
import { CATALOG_GRID_PRIORITY_IMAGE_COUNT } from "@shared/api/productsServices";
import { useParams } from "next/navigation";
import { useId, useMemo } from "react";
import { Swiper, SwiperSlide } from "swiper/react";

const MAX_ITEMS = 6;

export default function RecommendedProducts({
  products = [],
  eyebrow,
  title,
  variant = "default",
}) {
  const params = useParams();
  const locale = params?.locale ?? "ua";
  const sectionId = useId();

  const items = useMemo(
    () =>
      (products ?? [])
        .map((p) => normalizeCatalogCardForProductItem(p) ?? p)
        .filter(Boolean)
        .slice(0, MAX_ITEMS),
    [products],
  );

  const GridWishButton = ({ product }) => (
    <WishlistButton product={product} className="wishlist-button" />
  );

  if (items.length === 0) {
    return null;
  }

  if (variant === "pdp") {
    return (
      <section
        className="viewed-products recommended-products section-margin"
        aria-labelledby={sectionId}
      >
        <div className="recommended-products__heading">
          {eyebrow ? (
            <p className="recommended-products__kicker">
              {eyebrow}
            </p>
          ) : null}
          <h2
            className="recommended-products__title"
            id={sectionId}
          >
            {title}
          </h2>
        </div>

        <Swiper
          className="viewed-products__swiper recommended-products__swiper"
          modules={[]}
          spaceBetween={16}
          slidesPerView={2}
          loop={false}
          breakpoints={{
            [BREAKPOINTS.tablet]: {
              slidesPerView: 3.9,
              spaceBetween: 16,
            },
            [BREAKPOINTS.desktop]: {
              slidesPerView: 6,
              spaceBetween: 24,
            },
          }}
        >
          {items.map((prod, index) => (
            <SwiperSlide
              key={(prod?._id || prod?.id || prod?.slug || index) + "-rec"}
              className="recommended-products__slide"
            >
              <ProductItem
                actionButtons={{
                  WishButton: GridWishButton,
                }}
                product={prod}
                location="swiper"
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </section>
    );
  }

  return (
    <section
      className="recommended-products"
      aria-labelledby={sectionId}
    >
      <div className="recommended-products__heading">
        {eyebrow ? (
          <p className="recommended-products__kicker">
            {eyebrow}
          </p>
        ) : null}
        <h2
          className="recommended-products__title"
          id={sectionId}
        >
          {title}
        </h2>
      </div>

      <Swiper
        className="recommended-products__swiper"
        slidesPerView={2}
        spaceBetween={16}
        watchOverflow
        grabCursor
        breakpoints={{
          [BREAKPOINTS.tablet]: {
            slidesPerView: 5.2,
            spaceBetween: 16,
          },
          [BREAKPOINTS.desktop]: {
            slidesPerView: 3,
            spaceBetween: 24,
          },
          1400: {
            slidesPerView: 6,
            spaceBetween: 24,
          },
        }}
      >
        {items.map((item, index) => (
          <SwiperSlide
            key={item._id ?? item.slug ?? index}
            className="recommended-products__slide"
          >
            <ProductItem
              product={item}
              locale={locale}
              imagePriority={
                index < CATALOG_GRID_PRIORITY_IMAGE_COUNT
              }
              actionButtons={{
                WishButton: GridWishButton,
              }}
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
