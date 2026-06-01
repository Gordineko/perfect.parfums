"use client";

import { localePath } from "@shared/lib/localePath";
import "./basket.scss";

import ProductItem from "@entities/product";
import Counter from "@features/counter";
import RemoveFromCartButton from "@features/remove-from-cart";
import { clearCartAsync, formatPrice, useI18n } from "@shared";
import { MODALS } from "@shared/config/modals";
import { useModals } from "@shared/index";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

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

  const handleClearCart = useCallback(async () => {
    if (!window.confirm(t("basket.clearConfirm"))) {
      return;
    }
    try {
      await dispatch(clearCartAsync()).unwrap();
    } catch {}
  }, [dispatch, t]);

  const titleText = "КОШИК";

  const CloseIcon = () => (
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

  return (
    <>
      {isModalOpen === MODALS.BASKET && (
        <div
          className={styles.overlay}
          onClick={() => setIsModalOpen(null)}
        >
          <aside
            className={`${styles.modal} basket`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.header}>
              <h2 className={styles.title}>{titleText}</h2>

              <button
                type="button"
                className={styles.close}
                onClick={() => setIsModalOpen(null)}
                aria-label={t("basket.closeAria")}
              >
                <CloseIcon />
              </button>
            </div>

            <div className={styles.body}>
              {isEmpty ? (
                <div className={styles.empty}>
                  <p className={styles.emptyText}>{t("basket.emptyText")}</p>

                  <button
                    type="button"
                    className={styles.emptyAction}
                    onClick={() => {
                      router.push(localePath(locale, "/categories/all"));
                      setIsModalOpen(null);
                    }}
                  >
                    {t("basket.continueShopping")}
                  </button>
                </div>
              ) : (
                <>
                  <ul className={styles.list}>
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

                  <div className={styles.footer}>
                    <div className={styles.totalBox}>
                      <p className={styles.totalLabel}>
                        {t("basket.total")}
                      </p>

                      <p className={styles.totalValue}>
                        {formatPrice(cart.total)} {t("currency.uah")}
                      </p>
                    </div>

                    <div className={styles.actions}>
                      <button
                        type="button"
                        className={styles.btnOutline}
                        onClick={() => {
                          router.push(localePath(locale, "/categories/all"));
                          setIsModalOpen(null);
                        }}
                      >
                        {t("basket.continueShopping")}
                      </button>

                      <button
                        type="button"
                        className={styles.btnPrimary}
                        onClick={() => {
                          router.push(localePath(locale, "/order"));
                          setIsModalOpen(null);
                        }}
                      >
                        {t("basket.checkout")}
                      </button>
                    </div>
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
