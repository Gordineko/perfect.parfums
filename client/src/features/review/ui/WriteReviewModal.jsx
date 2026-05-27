"use client";

import { StarCounter } from "@features/stars";
import { useI18n, useModals } from "@shared";
import clsx from "clsx";
import React from "react";

import { useWriteReviewForm } from "../lib/useWriteReviewForm";

import styles from "./WriteReviewModal.module.scss";

function ModalCloseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="21"
      viewBox="0 0 20 21"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M1.74414 1.0215L18.9778 19.0212"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M0.977539 19.0213L18.2111 1.02157"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

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
            <div className={styles.header}>
              <h2 className={styles.title} id="write-review-sent-title">
                {t("reviews.sentTitle")}
              </h2>

              <button
                type="button"
                className={styles.close}
                onClick={closeModal}
                ref={successCloseBtnRef}
                aria-label={t("common.close")}
              >
                <ModalCloseIcon />
              </button>
            </div>

            <div
              className={styles.success}
              role="status"
              aria-live="polite"
            >
              <p className={styles.successText}>{t("reviews.sentText")}</p>
            </div>
          </>
        ) : (
          <>
            <div className={styles.header}>
              <h2 className={styles.title} id="write-review-modal-title">
                {t("reviews.modalTitle")}
              </h2>

              <button
                type="button"
                className={styles.close}
                onClick={closeModal}
                aria-label={t("common.close")}
              >
                <ModalCloseIcon />
              </button>
            </div>

            <form className={styles.body} onSubmit={handleSubmit}>
              <div className={styles.rating}>
                <p className={styles.ratingTitle}>
                  {t("reviews.ratingTitle")}
                </p>
                <div className={styles.stars}>
                  <StarCounter
                    appearance="outline"
                    rating={values.rating}
                    onSelect={(val) => setFieldValue("rating", val)}
                  />
                </div>
                {touched.rating && errors.rating ? (
                  <div className="error-text">{errors.rating}</div>
                ) : null}
              </div>

              <div className={styles.field}>
                <label htmlFor="name" className={styles.label}>
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
                <label htmlFor="text" className={styles.label}>
                  {t("reviews.commentLabel")}
                </label>
                <textarea
                  id="text"
                  name="text"
                  className={clsx(
                    styles.textarea,
                    touched.text && errors.text && "error",
                  )}
                  placeholder={t("reviews.commentPlaceholder")}
                  rows={4}
                  {...formik.getFieldProps("text")}
                />
                {touched.text && errors.text ? (
                  <div className="error-text">{errors.text}</div>
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
                {t("reviews.publishBtn")}
              </button>
            </form>
          </>
        )}
      </aside>
    </div>
  );
};

export default WriteReviewModal;
