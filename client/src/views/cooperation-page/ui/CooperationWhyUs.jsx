"use client";

import "swiper/css";

import { BREAKPOINTS, useI18n } from "@shared";
import { useEffect, useMemo, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";

const WHY_SLIDES_DESKTOP = 3;
const WHY_SLIDES_TABLET = 1.85;
const WHY_SLIDES_MOBILE = 1;

function WhyCard({ item, active }) {
  return (
    <article
      className={`cooperation-why__card${active ? " is-active" : ""}`}
    >
      <p className="cooperation-why__index">{item.index}</p>
      <h3 className="cooperation-why__title">{item.title}</h3>
      <p className="cooperation-why__desc">{item.desc}</p>
    </article>
  );
}

export default function CooperationWhyUs() {
  const { t } = useI18n();
  const [activeIndex, setActiveIndex] = useState(0);
  const [swiperInstance, setSwiperInstance] = useState(null);
  const [viewportBand, setViewportBand] = useState(() => {
    if (typeof window === "undefined") {
      return "tablet";
    }
    const w = window.innerWidth;
    if (w >= BREAKPOINTS.desktop) {
      return "desktop";
    }
    if (w >= BREAKPOINTS.tablet) {
      return "tablet";
    }
    return "mobile";
  });

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      setViewportBand(
        w >= BREAKPOINTS.desktop
          ? "desktop"
          : w >= BREAKPOINTS.tablet
            ? "tablet"
            : "mobile",
      );
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const items = useMemo(
    () => [
      {
        id: "why-1",
        index: t("cooperationPage.why1Index"),
        title: t("cooperationPage.why1Title"),
        desc: t("cooperationPage.why1Desc"),
      },
      {
        id: "why-2",
        index: t("cooperationPage.why2Index"),
        title: t("cooperationPage.why2Title"),
        desc: t("cooperationPage.why2Desc"),
      },
      {
        id: "why-3",
        index: t("cooperationPage.why3Index"),
        title: t("cooperationPage.why3Title"),
        desc: t("cooperationPage.why3Desc"),
      },
      {
        id: "why-4",
        index: t("cooperationPage.why4Index"),
        title: t("cooperationPage.why4Title"),
        desc: t("cooperationPage.why4Desc"),
      },
      {
        id: "why-5",
        index: t("cooperationPage.why5Index"),
        title: t("cooperationPage.why5Title"),
        desc: t("cooperationPage.why5Desc"),
      },
    ],
    [t],
  );

  const sliderPageCount = useMemo(() => {
    if (viewportBand === "desktop") {
      return Math.max(1, items.length - WHY_SLIDES_DESKTOP + 1);
    }
    if (viewportBand === "mobile") {
      return items.length;
    }
    return Math.max(
      1,
      items.length - Math.ceil(WHY_SLIDES_TABLET) + 1,
    );
  }, [viewportBand, items.length]);

  const highlightedCardIndex = useMemo(() => {
    if (viewportBand === "desktop") {
      return Math.min(
        activeIndex + Math.floor(WHY_SLIDES_DESKTOP / 2),
        items.length - 1,
      );
    }
    return activeIndex;
  }, [viewportBand, activeIndex, items.length]);

  return (
    <section
      className="cooperation-why"
      aria-labelledby="cooperation-why-heading"
    >
      <div className="container">
        <h2
          id="cooperation-why-heading"
          className="cooperation-why__heading"
        >
          {t("cooperationPage.whyTitle")}
        </h2>

        <Swiper
          id="cooperation-why-slider"
          className="cooperation-why__swiper"
          slidesPerView={WHY_SLIDES_MOBILE}
          slidesPerGroup={1}
          spaceBetween={24}
          speed={500}
          grabCursor
          watchOverflow
          breakpoints={{
            [BREAKPOINTS.tablet]: {
              slidesPerView: WHY_SLIDES_TABLET,
              spaceBetween: 24,
            },
            [BREAKPOINTS.desktop]: {
              slidesPerView: WHY_SLIDES_DESKTOP,
              spaceBetween: 24,
            },
          }}
          onSwiper={(swiper) => {
            setSwiperInstance(swiper);
            setActiveIndex(
              swiper?.realIndex ?? swiper?.activeIndex ?? 0,
            );
          }}
          onSlideChange={(swiper) => {
            const i =
              swiper?.realIndex ?? swiper?.activeIndex ?? 0;
            setActiveIndex(i);
          }}
        >
          {items.map((item, i) => (
            <SwiperSlide key={item.id}>
              <WhyCard
                item={item}
                active={i === highlightedCardIndex}
              />
            </SwiperSlide>
          ))}
        </Swiper>

        <div
          className="cooperation-why__pagination"
          role="tablist"
          aria-label={t(
            "cooperationPage.whyPaginationAria",
          )}
        >
          {Array.from({ length: sliderPageCount }, (_, page) => (
            <button
              key={`why-bullet-${page}`}
              type="button"
              role="tab"
              aria-selected={activeIndex === page}
              aria-controls="cooperation-why-slider"
              className={`cooperation-why__bullet${activeIndex === page ? " is-active" : ""}`}
              onClick={() => {
                swiperInstance?.slideTo?.(page);
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
