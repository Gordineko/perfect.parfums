import UserDetailsForm from "@features/user-details/ui/UserDetailsForm";
import { getCurrentUser } from "@shared/api/authServices";
import { getMessages } from "@shared/i18n/getMessages";
import { createI18nServer } from "@shared/i18n/server";
import pageStyles from "@widgets/profile/ui/ProfilePage.module.scss";
import { cookies } from "next/headers";

export default async function ProfilePage({ params }) {
  const { locale = "ua" } = await params;
  const messages = await getMessages(locale);
  const { t } = createI18nServer(messages);

  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token");

  const user = await getCurrentUser(token.value);

  const nameFromProfile = (user?.firstName || user?.name || "").trim();
  const phoneFallback = (user?.phone || user?.email || "").trim();
  const displayName =
    nameFromProfile || phoneFallback || t("profile.guestName");

  return (
    <div className={pageStyles.page}>
      <div className={pageStyles.intro}>
        <p className={pageStyles.subtitle}>
          {t("profile.subtitle-prof", { name: displayName })}
        </p>
        <h2 className={pageStyles.title}>{t("profile.title-prof")}</h2>
      </div>

      <div className={pageStyles.body}>
        <UserDetailsForm user={user} location="profile" />
      </div>
    </div>
  );
}
