"use client";

import "swiper/css";

import ReviewCard from "@entities/review-card";
import {
  BREAKPOINTS,
  fetchProductReviews,
  useI18n,
  useModals,
} from "@shared";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Swiper,
  SwiperSlide,
} from "swiper/react";

const ReviewSwiper = ({ product }) => {
  const { setIsModalOpen } = useModals();
  const { t } = useI18n();

  const groupId = product?.offers?.[0]?.groupId;
  const groupIdStr =
    groupId != null && String(groupId).trim() !== ""
      ? String(groupId).trim()
      : "";

  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!groupIdStr) {
      setReviews([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const list = await fetchProductReviews(groupIdStr);
      setReviews(Array.isArray(list) ? list : []);
    } catch {
      setReviews([]);
      setError(t("reviews.listLoadError"));
    } finally {
      setIsLoading(false);
    }
  }, [groupIdStr, t]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const handler = (e) => {
      if (String(e?.detail?.groupId) === groupIdStr) {
        void load();
      }
    };
    window.addEventListener("product-reviews-refetch", handler);
    return () => window.removeEventListener("product-reviews-refetch", handler);
  }, [groupIdStr, load]);

  const items = reviews;
  const count = items.length;
  const canLoop = !isLoading && !error && items.length >= 4;
  const [activeIndex, setActiveIndex] = useState(0);
  const [swiperInstance, setSwiperInstance] = useState(null);
  const [slidesPerGroup, setSlidesPerGroup] = useState(1);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < BREAKPOINTS.tablet);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const syncSlidesPerGroup = useCallback((swiper) => {
    const g = swiper?.params?.slidesPerGroup;
    setSlidesPerGroup(typeof g === "number" && g > 0 ? g : 1);
  }, []);

  const pageCount = useMemo(() => {
    if (!items.length) return 0;
    const g = slidesPerGroup || 1;
    return Math.max(1, Math.ceil(items.length / g));
  }, [items.length, slidesPerGroup]);

  const loopEnabled = canLoop && !isMobile;

  const activePage = useMemo(() => {
    const g = slidesPerGroup || 1;
    return Math.min(pageCount - 1, Math.floor(activeIndex / g));
  }, [activeIndex, pageCount, slidesPerGroup]);

  const pageIndices = useMemo(
    () => Array.from({ length: pageCount }, (_, i) => i),
    [pageCount],
  );

  const showSwiper = !isLoading && !error && items.length > 0;
  const showEmpty = !isLoading && !error && items.length === 0;
  const showError = !isLoading && Boolean(error);
  const showSkeleton = isLoading && Boolean(groupIdStr);

  const countLabel = isLoading && groupIdStr ? "…" : String(count);

  return (
    <section className="pdp-reviews section-margin" aria-label={t("reviews.sectionAria")}>
      <header className="pdp-reviews__top">
        <div className="pdp-reviews__heading">
          <p className="pdp-reviews__kicker">REAL FEEDBACK</p>
          <h2 className="pdp-reviews__title">
            {t("reviews.sectionTitle")}{" "}
            <span className="pdp-reviews__count">
              ({countLabel})
            </span>
          </h2>
        </div>

        <button
          type="button"
          className="pdp-reviews__leave"
          onClick={() => setIsModalOpen("write-review")}
        >
          {t("reviews.leaveReview")}
        </button>
      </header>

      {showSkeleton ? (
        <div className="pdp-reviews__skeleton" aria-hidden="true">
          <div className="pdp-reviews__skeleton-card" />
          <div className="pdp-reviews__skeleton-card" />
          <div className="pdp-reviews__skeleton-card" />
        </div>
      ) : null}

      {showError ? (
        <p className="pdp-reviews__state-text" role="alert">
          {error}
        </p>
      ) : null}

      {showEmpty ? (
        <div className="pdp-reviews__state">
          <p className="pdp-reviews__state-text">{t("reviews.listEmpty")}</p>
          <button
            type="button"
            className="pdp-reviews__state-action"
            onClick={() => setIsModalOpen("write-review")}
          >
            {t("reviews.leaveReview")}
          </button>
        </div>
      ) : null}

      {showSwiper ? (
        <>
          <Swiper
            id="pdp-reviews-slider"
            className="pdp-reviews__slider"
            slidesPerView={1}
            slidesPerGroup={1}
            spaceBetween={24}
            grabCursor={true}
            watchOverflow={true}
            loop={loopEnabled}
            loopAdditionalSlides={loopEnabled ? items.length : 0}
            speed={650}
            onSwiper={(swiper) => {
              setSwiperInstance(swiper);
              syncSlidesPerGroup(swiper);
            }}
            onBreakpoint={(swiper) => {
              syncSlidesPerGroup(swiper);
            }}
            onResize={(swiper) => {
              syncSlidesPerGroup(swiper);
            }}
            onSlideChange={(swiper) => {
              const i = swiper?.realIndex ?? swiper?.activeIndex ?? 0;
              setActiveIndex(i);
              syncSlidesPerGroup(swiper);
            }}
            breakpoints={{
              0: {
                slidesPerView: 1,
                slidesPerGroup: 1,
                spaceBetween: 24,
              },
              [BREAKPOINTS.tablet]: {
                slidesPerView: 2.15,
                slidesPerGroup: 2,
                spaceBetween: 24,
              },
              [BREAKPOINTS.desktop]: {
                slidesPerView: 3,
                slidesPerGroup: 3,
                spaceBetween: 32,
              },
            }}
          >
            {items.map((review, index) => (
              <SwiperSlide
                key={review?._id ?? review?.id ?? `review-${index}`}
                className="pdp-reviews__slide"
              >
                <ReviewCard review={review} />
              </SwiperSlide>
            ))}
          </Swiper>

          {pageCount > 1 ? (
            <div
              className="pdp-reviews__pagination"
              role="tablist"
              aria-label={t("reviews.paginationAria")}
            >
              {pageIndices.map((page) => (
                <button
                  key={`review-page-${page}`}
                  type="button"
                  role="tab"
                  aria-selected={page === activePage}
                  aria-controls="pdp-reviews-slider"
                  className={`pdp-reviews__bullet ${page === activePage ? "is-active" : ""}`}
                  onClick={() => {
                    if (!swiperInstance) return;
                    const g = slidesPerGroup || 1;
                    const target = Math.min(page * g, items.length - 1);
                    if (loopEnabled && typeof swiperInstance.slideToLoop === "function") {
                      swiperInstance.slideToLoop(target);
                      return;
                    }
                    swiperInstance.slideTo(target);
                  }}
                />
              ))}
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
};

export default ReviewSwiper;
