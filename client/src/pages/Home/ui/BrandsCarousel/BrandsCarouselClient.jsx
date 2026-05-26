"use client";

import "swiper/css";

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

export default function BrandsCarouselClient({ brands }) {
  return (
    <section className={styles.brandsCarousel} aria-labelledby="brands-carousel-title">
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
            touchEventsTarget="container"
            breakpoints={{
              768: {
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
        </div>
      </div>
    </section>
  );
}
