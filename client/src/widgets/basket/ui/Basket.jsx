"use client";

import "./basket.scss";

import ProductItem from "@entities/product";
import Counter from "@features/counter";
import RemoveFromCartButton from "@features/remove-from-cart";
import { clearCartAsync, formatPrice, useI18n } from "@shared";
import { MODALS } from "@shared/config/modals";
import { CloseBtn, useModals } from "@shared/index";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

import { useBasketCloseIconCompact } from "../lib/useBasketCloseIconCompact";
import styles from "./Basket.module.scss";

const Basket = ({ locale }) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { t } = useI18n();
  const { isModalOpen, setIsModalOpen } = useModals();
  const cart = useSelector((state) => state.cart);
  const syncPending = useSelector((state) => state.cart.syncPending);
  const items = cart.items;
  const isEmpty = items.length === 0;
  const closeIconCompact = useBasketCloseIconCompact();

  const handleClearCart = useCallback(async () => {
    if (!window.confirm(t("basket.clearConfirm"))) {
      return;
    }
    try {
      await dispatch(clearCartAsync()).unwrap();
    } catch {}
  }, [dispatch, t]);

  return (
    <>
      {isModalOpen === MODALS.BASKET && (
        <div
          className={styles.overlay}
          onClick={() => setIsModalOpen(null)}
        >
          <aside
            className={`${styles.drawer} basket`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="basket__header">
              <button
                type="button"
                onClick={() => setIsModalOpen(null)}
                aria-label={t("basket.closeAria")}
              >
                <CloseBtn
                  color="#1A1A1A"
                  size={closeIconCompact ? 8 : 13}
                />
              </button>

              <h2 className="basket__title">{t("basket.title")}</h2>

              {!isEmpty && (
                <button
                  type="button"
                  className="basket__clear"
                  disabled={syncPending}
                  aria-busy={syncPending}
                  aria-label={t("basket.clearAria")}
                  onClick={handleClearCart}
                >
                  <p>{t("basket.clearButton")}</p>
                </button>
              )}
            </div>
            <div className="basket__divider" />

            <div className="basket__body">
              {isEmpty ? (
                <div className="basket__empty">
                  <p className="basket__empty-text">{t("basket.emptyText")}</p>

                  <button
                    type="button"
                    className="basket__action"
                    onClick={() => {
                      router.push(`/${locale}/categories/all`);
                      setIsModalOpen(null);
                    }}
                  >
                    <p>{t("basket.startShopping")}</p>
                  </button>
                </div>
              ) : (
                <>
                  <ul className="basket__list">
                    {items.map((item, index) => (
                      <li key={index} className="basket__item">
                        <ProductItem
                          variant="basket"
                          locale={locale}
                          product={item}
                          actionButtons={{
                            Counter: (props) => (
                              <Counter
                                prod={props?.product || item}
                                variant="basket"
                              />
                            ),
                            RemoveButton: (props) => (
                              <RemoveFromCartButton
                                product={props?.product || item}
                              />
                            ),
                          }}
                        />
                      </li>
                    ))}
                  </ul>

                  <div className="basket__footer">
                    <div className="basket__total">
                      <p className="basket__total-label">{t("basket.total")}</p>

                      <p className="basket__total-value">
                        {formatPrice(cart.total)} {t("currency.uah")}
                      </p>
                    </div>

                    <button
                      type="button"
                      className="basket__checkout"
                      onClick={() => {
                        router.push(`/${locale}/order`);
                        setIsModalOpen(null);
                      }}
                    >
                      <p>{t("basket.checkout")}</p>
                    </button>

                    <button
                      type="button"
                      className="basket__continue"
                      onClick={() => {
                        router.push(`/${locale}/categories/all`);
                        setIsModalOpen(null);
                      }}
                    >
                      <p>{t("basket.continueShopping")}</p>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="11"
                        height="9"
                        viewBox="0 0 11 9"
                        fill="none"
                      >
                        <path
                          d="M10.7342 5.1667C10.9044 4.98989 11 4.75021 11 4.50031C11 4.25042 10.9044 4.01074 10.7342 3.83393L7.30741 0.276288C7.13692 0.0993838 6.90569 -2.63608e-09 6.66458 0C6.42347 2.63608e-09 6.19224 0.0993838 6.02175 0.276288C5.85126 0.453192 5.75548 0.693125 5.75548 0.943306C5.75548 1.19349 5.85126 1.43342 6.02175 1.61032L7.89753 3.55731L0.908806 3.55731C0.667776 3.55731 0.436618 3.65666 0.266184 3.83351C0.0957489 4.01036 0 4.25021 0 4.50031C0 4.75041 0.0957489 4.99027 0.266184 5.16712C0.436618 5.34397 0.667776 5.44332 0.908806 5.44332L7.89753 5.44332L6.02175 7.38968C5.93733 7.47727 5.87037 7.58126 5.82468 7.69571C5.779 7.81015 5.75548 7.93282 5.75548 8.05669C5.75548 8.18057 5.779 8.30324 5.82468 8.41768C5.87037 8.53213 5.93733 8.63612 6.02175 8.72371C6.10617 8.81131 6.20639 8.88079 6.31668 8.92819C6.42698 8.9756 6.5452 9 6.66458 9C6.78397 9 6.90218 8.9756 7.01248 8.92819C7.12277 8.88079 7.22299 8.81131 7.30741 8.72371L10.7342 5.1667Z"
                          fill="currentColor"
                        />
                      </svg>
                    </button>
                  </div>
                </>
              )}
            </div>
          </aside>
        </div>
      )}
    </>
  );
};

export default Basket;
