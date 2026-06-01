import OrderItem from "@entities/order-item/ui/OrderItem";
import { localePath } from "@shared/lib/localePath";
import { getCurrentUser } from "@shared/api/authServices";
import { getUserOrders } from "@shared/api/orderServices";
import { getMessages } from "@shared/i18n/getMessages";
import { createI18nServer } from "@shared/i18n/server";
import pageStyles from "@widgets/profile/ui/ProfilePage.module.scss";
import { cookies } from "next/headers";
import Link from "next/link";

import ProfileOrdersCountHint from "@widgets/profile/ui/ProfileOrdersCountHint";

import historyStyles from "./ProfileHistory.module.scss";

export default async function HistoryPage({ params }) {
  const { locale = "ua" } = await params;
  const messages = await getMessages(locale);
  const { t } = createI18nServer(messages);

  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token");
  await getCurrentUser(token.value);
  const orders = await getUserOrders(token.value);
  const normalizedOrders = Array.isArray(orders) ? orders : [];

  return (
    <div className={pageStyles.page}>
      <ProfileOrdersCountHint count={normalizedOrders.length} />
      <h2 className={pageStyles.sectionTitle}>{t("profile.title-history")}</h2>

      {normalizedOrders.length === 0 ? (
        <div className={historyStyles.empty}>
          <p>{t("profile.noOrders")}</p>
          <Link
            href={localePath(locale, "/categories/all")}
            className={historyStyles.emptyAction}
          >
            {t("basket.startShopping")}
          </Link>
        </div>
      ) : (
        <div className={historyStyles.root}>
          {normalizedOrders.map((order, index) => (
            <OrderItem
              order={order}
              key={order?.orderNumber ?? order?.order_number ?? index}
              locale={locale}
              variant="profile"
            />
          ))}
        </div>
      )}
    </div>
  );
}
