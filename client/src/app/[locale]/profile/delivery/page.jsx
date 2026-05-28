import UserDetailsForm from "@features/user-details/ui/UserDetailsForm";
import { getCurrentUser } from "@shared/api/authServices";
import { getMessages } from "@shared/i18n/getMessages";
import { createI18nServer } from "@shared/i18n/server";
import pageStyles from "@widgets/profile/ui/ProfilePage.module.scss";
import { cookies } from "next/headers";

export default async function ProfileDeliveryPage({ params }) {
  const { locale = "ua" } = await params;
  const messages = await getMessages(locale);
  const { t } = createI18nServer(messages);

  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token");
  const user = await getCurrentUser(token.value);

  return (
    <div className={pageStyles.page}>
      <h2 className={pageStyles.sectionTitle}>{t("profile.titleDelivery")}</h2>

      <div className={pageStyles.body}>
        <UserDetailsForm
          user={user}
          location="profile"
          profileSection="delivery"
        />
      </div>
    </div>
  );
}
