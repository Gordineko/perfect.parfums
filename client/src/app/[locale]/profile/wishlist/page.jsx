import { getMessages } from "@shared/i18n/getMessages";
import { createI18nServer } from "@shared/i18n/server";
import ProfileWishlistContent from "@widgets/profile/ui/ProfileWishlistContent";
import pageStyles from "@widgets/profile/ui/ProfilePage.module.scss";

export default async function ProfileWishlistPage({ params }) {
  const { locale = "ua" } = await params;
  const messages = await getMessages(locale);
  const { t } = createI18nServer(messages);

  return (
    <div className={pageStyles.page}>
      <h2 className={pageStyles.sectionTitle}>{t("profile.titleWishlist")}</h2>

      <div className={pageStyles.body}>
        <ProfileWishlistContent />
      </div>
    </div>
  );
}
