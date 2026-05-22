"use client";

import { StarCounter } from "@features/stars";
import { useI18n, useModals } from "@shared";
import clsx from "clsx";
import React from "react";

import { useWriteReviewForm } from "../lib/useWriteReviewForm";

import styles from "./WriteReviewModal.module.scss";

function getLocalizedProductTitle(product, locale) {
  return (
    product?.title?.[locale] ??
    product?.title?.ua ??
    product?.title?.uk ??
    product?.title?.en ??
    product?.title ??
    ""
  );
}

const WRITE_REVIEW_MODAL_CLOSE_PATH =
  "M8.01335 9.52277L14.1589 15.6683C14.3638 15.8662 14.6382 15.9757 14.9231 15.9733C15.2079 15.9708 15.4804 15.8565 15.6818 15.6551C15.8832 15.4537 15.9975 15.1812 16 14.8964C16.0024 14.6115 15.8929 14.3371 15.695 14.1322L9.54947 7.98665L15.695 1.84108C15.8929 1.63619 16.0024 1.36177 16 1.07693C15.9975 0.792085 15.8832 0.519611 15.6818 0.31819C15.4804 0.116769 15.2079 0.00251626 14.9231 4.10675e-05C14.6382 -0.00243413 14.3638 0.107065 14.1589 0.304956L8.01335 6.45053L1.86778 0.304956C1.66196 0.111957 1.38914 0.00660217 1.10703 0.0111832C0.824916 0.0157641 0.555655 0.129922 0.356217 0.329501C0.156779 0.52908 0.0428113 0.798422 0.0384299 1.08054C0.0340485 1.36265 0.139597 1.6354 0.332741 1.84108L6.47723 7.98665L0.331654 14.1322C0.227895 14.2324 0.145134 14.3523 0.0881987 14.4849C0.0312633 14.6174 0.00129449 14.7599 4.1018e-05 14.9042C-0.00121245 15.0484 0.0262742 15.1915 0.0808977 15.325C0.135521 15.4585 0.216187 15.5798 0.318189 15.6818C0.420191 15.7838 0.541486 15.8645 0.674996 15.9191C0.808507 15.9737 0.951559 16.0012 1.09581 16C1.24005 15.9987 1.38261 15.9687 1.51515 15.9118C1.64769 15.8549 1.76756 15.7721 1.86778 15.6683L8.01335 9.52277Z";

const WriteReviewModal = ({ product, locale }) => {
  const { t } = useI18n();
  const { isModalOpen, setIsModalOpen } = useModals();
  const [isSent, setIsSent] = React.useState(false);
  const modalRef = React.useRef(null);
  const nameInputRef = React.useRef(null);
  const successCloseBtnRef = React.useRef(null);
  const previouslyFocusedElRef = React.useRef(null);
  const isOpen = isModalOpen === "write-review";

  const groupId = product?.offers?.[0]?.groupId;

  const formik = useWriteReviewForm(groupId, {
    onSuccess: () => {
      setIsSent(true);
      if (groupId != null && String(groupId).trim() !== "") {
        window.dispatchEvent(
          new CustomEvent("product-reviews-refetch", {
            detail: { groupId: String(groupId).trim() },
          }),
        );
      }
    },
  });

  const {
    values,
    setFieldValue,
    touched,
    errors,
    handleSubmit,
    isSubmitting,
    status,
  } = formik;

  const restoreFocus = () => {
    const el = previouslyFocusedElRef.current;
    if (el && typeof el.focus === "function" && document.contains(el)) {
      requestAnimationFrame(() => el.focus());
    }
  };

  const closeModal = () => {
    setIsModalOpen(null);
    setIsSent(false);
    restoreFocus();
  };

  const getFocusableElements = (container) => {
    if (!container) return [];
    const selectors = [
      "a[href]",
      "button:not([disabled])",
      "input:not([disabled]):not([type=\"hidden\"])",
      "textarea:not([disabled])",
      "select:not([disabled])",
      "[tabindex]:not([tabindex=\"-1\"])",
    ];

    return Array.from(container.querySelectorAll(selectors.join(","))).filter(
      (el) =>
        !el.hasAttribute("disabled") &&
        el.getAttribute("aria-hidden") !== "true",
    );
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      closeModal();
      return;
    }

    if (e.key !== "Tab") return;

    const focusables = getFocusableElements(modalRef.current);
    if (focusables.length === 0) {
      e.preventDefault();
      return;
    }

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;

    if (e.shiftKey) {
      if (active === first || !modalRef.current.contains(active)) {
        e.preventDefault();
        last.focus();
      }
      return;
    }

    if (active === last) {
      e.preventDefault();
      first.focus();
    }
  };

  React.useEffect(() => {
    if (!isOpen) return;

    previouslyFocusedElRef.current = document.activeElement;
    return () => restoreFocus();
  }, [isOpen]);

  React.useEffect(() => {
    if (!isOpen) return;

    if (isSent) {
      requestAnimationFrame(() => {
        successCloseBtnRef.current?.focus?.();
      });
      return;
    }

    requestAnimationFrame(() => {
      nameInputRef.current?.focus?.();
    });
  }, [isOpen, isSent]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={closeModal}>
      <aside
        className={clsx(styles.modal, isSent && styles.modalSent)}
        onClick={(e) => e.stopPropagation()}
        aria-labelledby={
          isSent ? "write-review-sent-title" : "write-review-modal-title"
        }
        role="dialog"
        aria-modal="true"
        ref={modalRef}
        onKeyDown={handleKeyDown}
      >
        {isSent ? (
          <>
            <button
              type="button"
              className={styles.close}
              onClick={closeModal}
              ref={successCloseBtnRef}
              aria-label={t("common.close")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d={WRITE_REVIEW_MODAL_CLOSE_PATH}
                  fill="currentColor"
                />
              </svg>
            </button>
            <div className={styles.success} role="status" aria-live="polite">
              <p className={styles.successTitle} id="write-review-sent-title">
                {t("reviews.sentTitle")}
              </p>
              <p className={styles.successText}>{t("reviews.sentText")}</p>
            </div>
          </>
        ) : (
          <>
            <div className={styles.header}>
              <div className={styles.heading}>
                <h2 className={styles.title} id="write-review-modal-title">
                  {getLocalizedProductTitle(product, locale)}
                </h2>
                <p className={styles.subtitle}>{t("reviews.modalSubtitle")}</p>
              </div>

              <button
                type="button"
                className={styles.close}
                onClick={closeModal}
                aria-label={t("common.close")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d={WRITE_REVIEW_MODAL_CLOSE_PATH}
                    fill="currentColor"
                  />
                </svg>
              </button>
            </div>

            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.field}>
                <label
                  htmlFor="name"
                  className={clsx(styles.label, styles.labelAccent)}
                >
                  {t("reviews.nameLabel")}
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  className={clsx(
                    styles.input,
                    touched.name && errors.name && "error",
                  )}
                  placeholder={t("reviews.namePlaceholder")}
                  {...formik.getFieldProps("name")}
                  ref={nameInputRef}
                />
                {touched.name && errors.name ? (
                  <div className="error-text">{errors.name}</div>
                ) : null}
              </div>

              <div className={styles.field}>
                <label
                  htmlFor="text"
                  className={clsx(styles.label, styles.labelText)}
                >
                  {t("reviews.textLabel")}
                </label>
                <textarea
                  id="text"
                  name="text"
                  className={clsx(
                    styles.textarea,
                    touched.text && errors.text && "error",
                  )}
                  placeholder={t("reviews.textPlaceholder")}
                  rows={1}
                  {...formik.getFieldProps("text")}
                />
                {touched.text && errors.text ? (
                  <div className="error-text">{errors.text}</div>
                ) : null}
              </div>

              <div className={styles.rating}>
                <p
                  className={clsx(
                    styles.ratingTitle,
                    styles.ratingTitleAccent,
                  )}
                >
                  {t("reviews.ratingTitle")}
                </p>
                <div className={styles.stars}>
                  <StarCounter
                    rating={values.rating}
                    onSelect={(val) => setFieldValue("rating", val)}
                  />
                </div>
                {touched.rating && errors.rating ? (
                  <div className="error-text">{errors.rating}</div>
                ) : null}
              </div>

              {status ? (
                <div className="error-text" role="alert">
                  {status}
                </div>
              ) : null}

              <button
                type="submit"
                className={styles.submitButton}
                disabled={isSubmitting}
              >
                {t("reviews.submitBtn")}
              </button>
            </form>
          </>
        )}
      </aside>
    </div>
  );
};

export default WriteReviewModal;
