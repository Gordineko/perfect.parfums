"use client";

import "swiper/css";

import { BREAKPOINTS, MQ } from "@shared";
import { useEffect, useState } from "react";
import { FreeMode } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import styles from "./BrandsCarousel.module.scss";

function BrandLogo({ brand }) {
  return (
    <div className={styles.brandsCarousel__logo} aria-label={brand.name}>
      {brand.svg ? (
        <span
          className={styles.brandsCarousel__logoSvg}
          dangerouslySetInnerHTML={{ __html: brand.svg }}
        />
      ) : (
        <span className={styles.brandsCarousel__logoSvg} aria-hidden />
      )}
    </div>
  );
}

function BrandsRow({ brands, className, ...rest }) {
  return (
    <div className={className} {...rest}>
      {brands.map((brand) => (
        <div key={brand.id} className={styles.brandsCarousel__item}>
          <BrandLogo brand={brand} />
        </div>
      ))}
    </div>
  );
}

export default function BrandsCarouselClient({ brands }) {
  const [isMounted, setIsMounted] = useState(false);
  const [isBelowDesktop, setIsBelowDesktop] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    const mediaQuery = window.matchMedia(MQ.belowDesktop);
    const syncViewport = () => setIsBelowDesktop(mediaQuery.matches);

    syncViewport();
    mediaQuery.addEventListener("change", syncViewport);

    return () => mediaQuery.removeEventListener("change", syncViewport);
  }, []);

  const showCarousel = isMounted && isBelowDesktop;

  return (
    <section
      className={styles.brandsCarousel}
      aria-labelledby="brands-carousel-title"
    >
      <div className="container">
        <h2
          className={`${styles.brandsCarousel__title} t-h2`}
          id="brands-carousel-title"
        >
          ПРЕДСТАВЛЕНІ БРЕНДИ
        </h2>

        <ul className={styles.brandsCarousel__list}>
          {brands.map((brand) => (
            <li key={brand.id} className={styles.brandsCarousel__item}>
              <BrandLogo brand={brand} />
            </li>
          ))}
        </ul>

        <div className={styles.brandsCarousel__carousel}>
          {showCarousel ? (
            <Swiper
              className={styles.brandsCarousel__swiper}
              modules={[FreeMode]}
              slidesPerView="auto"
              spaceBetween={24}
              freeMode={{
                enabled: true,
                momentum: true,
                momentumRatio: 0.35,
              }}
              grabCursor
              allowTouchMove
              touchEventsTarget="container"
              observer
              observeParents
              breakpoints={{
                [BREAKPOINTS.tablet]: {
                  spaceBetween: 48,
                },
              }}
            >
              {brands.map((brand) => (
                <SwiperSlide
                  key={brand.id}
                  className={styles.brandsCarousel__slide}
                >
                  <div className={styles.brandsCarousel__item}>
                    <BrandLogo brand={brand} />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            <BrandsRow
              brands={brands}
              className={styles.brandsCarousel__placeholder}
              aria-hidden="true"
            />
          )}
        </div>
      </div>
    </section>
  );
}
