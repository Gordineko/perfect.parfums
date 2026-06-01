import {
  createI18nServer,
  formatPrice,
  getMessages,
} from "@shared";
import PaymentFailedIcon from "@shared/ui/icons/PaymentFailedIcon";
import { localePath } from "@shared/lib/localePath";
import Image from "next/image";
import Link from "next/link";

import styles from "./failed-order.module.scss";

const MOCK_ORDER = {
  number: "7721-98",
  placedAt: "15 травня, 2026 • 13:50",
  placedAtEn: "May 15, 2026 • 1:50 PM",
  items: [
    {
      id: "1",
      title: "Лляний сет 'Sable'",
      titleEn: "Linen set 'Sable'",
      category: "Костюм",
      categoryEn: "Suit",
      quantity: 1,
      price: 1150,
      image: "/img/product-1.png",
    },
    {
      id: "mock-2",
      title: "Лляний сет 'Sable'",
      titleEn: "Linen set 'Sable'",
      category: "Костюм",
      categoryEn: "Suit",
      quantity: 1,
      price: 1150,
      image: "/img/product-1.png",
    },
  ],
  deliveryLabel: "За тарифами перевізника",
  deliveryLabelEn: "Per carrier rates",
  total: 5300,
};

export default async function FailedOrderPage({ params, searchParams }) {
  const { locale = "ua" } = await params;
  const resolvedSearchParams = await searchParams;
  const messages = await getMessages(locale);
  const { t } = createI18nServer(messages);
  const isUa = locale === "ua";

  const orderNumber = resolvedSearchParams?.orderNumber
    ? String(resolvedSearchParams.orderNumber)
    : MOCK_ORDER.number;

  const placedAt = isUa ? MOCK_ORDER.placedAt : MOCK_ORDER.placedAtEn;
  const deliveryText = isUa
    ? MOCK_ORDER.deliveryLabel
    : MOCK_ORDER.deliveryLabelEn;

  return (
    <div className={styles.pageShell}>
      <div className="container">
        <section className={styles.shell} aria-labelledby="failed-order-title">
          <div className={styles.hero}>
            <div className={styles.icon}>
              <PaymentFailedIcon />
            </div>

            <h1 id="failed-order-title" className={styles.title}>
              {t("failedOrderPage.titlePrefix")}{" "}
              <span className={styles.titleAccent}>
                {t("failedOrderPage.titleAccent")}
              </span>
            </h1>

            <p className={styles.subtitle}>{t("failedOrderPage.subtitle")}</p>
          </div>

          <article className={styles.card}>
            <header className={styles.cardHeader}>
              <p className={styles.orderNumber}>
                {t("failedOrderPage.orderLabel", { number: orderNumber })}
              </p>
              <p className={styles.orderMeta}>
                {t("failedOrderPage.placedAt", { date: placedAt })}
              </p>
            </header>

            <ul className={styles.productList}>
              {MOCK_ORDER.items.map((item) => {
                const title = isUa ? item.title : item.titleEn;
                const category = isUa ? item.category : item.categoryEn;

                return (
                  <li key={item.id} className={styles.productItem}>
                    <div className={styles.productMain}>
                      <Image
                        className={styles.productImage}
                        src={item.image}
                        alt=""
                        width={56}
                        height={56}
                      />
                      <p className={styles.productInfo}>
                        <span className={styles.productNameLine}>
                          <span className={styles.productTitle}>{title}</span>
                          <span className={styles.productCategory}>
                            ({category})
                          </span>
                        </span>
                      </p>
                    </div>
                    <span className={styles.productMeta}>
                      {t("failedOrderPage.itemQty", { qty: item.quantity })}{" "}
                      <span className={styles.productPrice}>
                        {formatPrice(item.price)} ₴
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>

            <div className={styles.summary}>
              <p className={styles.summaryRow}>
                <span className={styles.summaryLabel}>
                  {t("failedOrderPage.delivery")}
                </span>
                <span className={styles.summaryValue}>{deliveryText}</span>
              </p>
              <p className={styles.summaryRowTotal}>
                <span className={styles.summaryLabel}>
                  {t("failedOrderPage.total")}
                </span>
                <span className={styles.summaryValue}>
                  {formatPrice(MOCK_ORDER.total)} ₴
                </span>
              </p>
            </div>
          </article>

          <div className={styles.retry}>
            <Link className={styles.retryButton} href={localePath(locale, "/order")}>
              {t("failedOrderPage.retryButton")}
            </Link>
          </div>

          <footer className={styles.footer}>
            <div className={styles.support}>
              <p className={styles.supportLabel}>
                {t("failedOrderPage.supportLabel")}
              </p>
              <a
                className={styles.supportLink}
                href={`mailto:${t("failedOrderPage.supportEmail")}`}
              >
                {t("failedOrderPage.supportEmail")}
              </a>
            </div>

            <nav className={styles.actions} aria-label={t("failedOrderPage.actionsAria")}>
              <Link className={styles.actionLink} href={localePath(locale)}>
                {t("failedOrderPage.homeLink")}
              </Link>
              <Link
                className={styles.actionLink}
                href={localePath(locale, "/categories/all")}
              >
                {t("failedOrderPage.catalogLink")}
              </Link>
            </nav>
          </footer>
        </section>
      </div>
    </div>
  );
}
