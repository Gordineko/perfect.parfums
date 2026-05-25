import { getOrderItemCategoryLabel } from "@entities/order-item/lib/getOrderItemCategoryLabel";
import { localePath } from "@shared/lib/localePath";
import { getCities, getWarehouses } from "@shared/api/Nova-poshta";
import { getMessages } from "@shared/i18n/getMessages";
import { createI18nServer } from "@shared/i18n/server";
import { pickLocalizedString } from "@shared/lib/pickLocalized";
import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import pageStyles from "@widgets/profile/ui/ProfilePage.module.scss";

import ordStyles from "./OrderDetail.module.scss";

function resolveOrderSlug(slug) {
  if (Array.isArray(slug)) {
    return slug.filter(Boolean).join("/");
  }
  return String(slug ?? "");
}

export default async function OrderPage({ params }) {
  const { locale = "ua", slug: slugParam } = await params;
  const orderSlug = resolveOrderSlug(slugParam);
  const messages = await getMessages(locale);
  const { t } = createI18nServer(messages);

  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token");
  if (!token?.value) redirect("/");

  async function parseJsonSafe(response) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  async function fetchUserOrdersOrThrow(authToken) {
    const base = process.env.NEXT_PUBLIC_API_URL || "";
    const response = await fetch(`${base}/iam/user/orders`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      cache: "no-store",
    });

    const data = await parseJsonSafe(response);
    if (!response.ok) {
      const err = new Error(data?.message || "Failed to fetch orders");
      err.status = response.status;
      throw err;
    }
    return Array.isArray(data) ? data : [];
  }

  let orders = [];
  try {
    orders = await fetchUserOrdersOrThrow(token.value);
  } catch (e) {
    const status = Number(e?.status);
    if (status === 401) {
      redirect("/api/auth/clear");
    }
    orders = [];
  }

  const foundOrder = orders.find(
    (order) =>
      String(order?.order_number ?? order?.orderNumber ?? "") === orderSlug,
  );

  if (!foundOrder) {
    return (
      <div className={pageStyles.page}>
        <div className={pageStyles.introRelative}>
          <p className={pageStyles.subtitle}>{t("profile.order-detail-subtitle")}</p>
          <h2 className={pageStyles.title}>
            {t("profile.order-title")} #{orderSlug}
          </h2>
        </div>

        <div className={`${ordStyles.card} ${ordStyles.empty}`}>
          <p>{t("profile.orderNotFound")}</p>
          <Link href={localePath(locale, "/profile/history")} className="basket__action">
            <p>{t("profile.backToOrders")}</p>
          </Link>
        </div>
      </div>
    );
  }

  const currentOrder = foundOrder;

  let displayCity = currentOrder.deliveryCity;
  let displayWarehouse = currentOrder.deliveryPostOffice;

  try {
    if (
      currentOrder.deliveryProvince &&
      currentOrder.deliveryCity?.includes("-")
    ) {
      const cities = await getCities(currentOrder.deliveryProvince);
      const foundCity = cities.find((c) => c.Ref === currentOrder.deliveryCity);
      if (foundCity) displayCity = foundCity.Description;
    }

    if (
      currentOrder.deliveryCity &&
      currentOrder.deliveryPostOffice?.includes("-")
    ) {
      const branches = await getWarehouses(currentOrder.deliveryCity, "branch");
      const foundBranch = branches.find(
        (b) => b.Ref === currentOrder.deliveryPostOffice,
      );
      if (foundBranch) {
        displayWarehouse = foundBranch.Description;
      } else {
        const postomats = await getWarehouses(
          currentOrder.deliveryCity,
          "postomat",
        );
        const foundPostomat = postomats.find(
          (p) => p.Ref === currentOrder.deliveryPostOffice,
        );
        if (foundPostomat) displayWarehouse = foundPostomat.Description;
      }
    }
  } catch {}

  return (
    <div className={pageStyles.page}>
      <div className={pageStyles.introRelative}>
        <p className={pageStyles.subtitle}>{t("profile.order-detail-subtitle")}</p>
        <h2 className={pageStyles.title}>
          {t("profile.order-title")} #{orderSlug}
        </h2>
      </div>

      <div className={ordStyles.card}>
        <p className={ordStyles.cardHeader}>{t("profile.order-data")}</p>
        <div className={ordStyles.details}>
          <div className={ordStyles.row}>
            <p className={ordStyles.label}>{t("profile.order-stats1")}</p>
            <p className={ordStyles.value}>{currentOrder.status}</p>
          </div>
          <div className={ordStyles.row}>
            <p className={ordStyles.label}>{t("profile.order-stats2")}</p>
            <p className={ordStyles.value}>
              {currentOrder.firstName} {currentOrder.lastName}
            </p>
          </div>
          <div className={ordStyles.row}>
            <p className={ordStyles.label}>{t("profile.order-stats3")}</p>
            <p className={ordStyles.value}>{currentOrder.customerEmail}</p>
          </div>
          <div className={ordStyles.row}>
            <p className={ordStyles.label}>{t("profile.order-stats4")}</p>
            <p className={ordStyles.value}>{currentOrder.customerPhone}</p>
          </div>
          <div className={ordStyles.row}>
            <p className={ordStyles.label}>{t("profile.order-stats5")}</p>
            <p className={ordStyles.value}>Нова пошта</p>
          </div>
          <div className={ordStyles.row}>
            <p className={ordStyles.label}>{t("profile.order-stats6")}</p>
            <p className={ordStyles.value}>{displayCity}</p>
          </div>
          <div className={ordStyles.row}>
            <p className={ordStyles.label}>{t("profile.order-stats7")}</p>
            <p className={ordStyles.value}>{displayWarehouse}</p>
          </div>
        </div>
      </div>

      <div className={ordStyles.card}>
        <p className={ordStyles.cardHeader}>{t("profile.order-t")}</p>
        <div className={ordStyles.productList}>
          {(Array.isArray(currentOrder.items) ? currentOrder.items : []).map((el, index) => (
            <div key={index} className={ordStyles.productItem}>
              <div className={ordStyles.productMain}>
                <Image
                  src={el.imgSnapshot || el.offerId?.img || "/no-image.png"}
                  alt="prod"
                  width={50}
                  height={50}
                />
                <p className={ordStyles.productInfo}>
                  <span className={ordStyles.productTitle}>
                    {pickLocalizedString(el.titleSnapshot, locale) ||
                      el.offerId?.sku ||
                      ""}
                  </span>
                  <span className={ordStyles.productCategory}>
                    ({getOrderItemCategoryLabel(el, locale)})
                  </span>
                </p>
              </div>
              <div className={ordStyles.productMeta}>
                <p className={ordStyles.productQty}>{el.qty} шт</p>
                <p className={ordStyles.productPrice}>{el.pricePerUnit} ₴</p>
              </div>
            </div>
          ))}
        </div>
        <div className={ordStyles.total}>
          <p className={ordStyles.totalLabel}>{t("profile.order-all")}</p>
          <p className={ordStyles.totalAmount}>{currentOrder.totalToPay} ₴</p>
        </div>
      </div>

      <button type="button" className={ordStyles.repeat}>
        {t("profile.repeatOrder")}
      </button>
    </div>
  );
}
