import { getAllCategory, getLocalizedFooter } from "@shared";
import { getCurrentUser } from "@shared/api/authServices";
import { getMessages } from "@shared/i18n/getMessages";
import { createI18nServer } from "@shared/i18n/server";
import Footer from "@widgets/Footer";
import ProfileSidebar from "@widgets/profile";
import ProfilePageHeader from "@widgets/profile/ui/ProfilePageHeader";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import layoutStyles from "./ProfileLayout.module.scss";

export default async function ProfileLayout({ children, params }) {
  const { locale } = await params;
  
  
  const messages = await getMessages(locale);
  const { t } = createI18nServer(messages);
  const categories = await getAllCategory();
  const footerData = getLocalizedFooter(t);

  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token");
  
  if (!token?.value) {
    redirect(`/`);
  }

  try {
    await getCurrentUser(token.value);
  } catch (e) {
    const status = Number(e?.status);
    if (status === 401) {
      redirect("/api/auth/clear");
    }
  }

  return (
    <div className={layoutStyles.shell}>
      <ProfilePageHeader
        locale={locale}
        breadcrumbsLabels={{
          home: t("breadcrumbs.home"),
          page: t("breadcrumbs.page"),
        }}
        copy={{
          prof: t("breadcrumbs.prof"),
          history: t("profile.link2"),
          orderTitle: t("profile.order-title"),
          titleProf: t("profile.title-header"),
        }}
      />

      <div className={layoutStyles.container}>
        <ProfileSidebar />

        <div className={layoutStyles.content}>{children}</div>
      </div>

      <section className="products-layout-wrapper products-layout-wrapper--footer">
        <div className="container products-layout-wrapper__inner" />
        <Footer
          categories={categories}
          locale={locale}
          data={footerData}
        />
      </section>
    </div>
  );
}