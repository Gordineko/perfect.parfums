import UserDetailsForm from "@features/user-details/ui/UserDetailsForm";
import {
    createI18nServer,
    getAllCategory,
    getLocalizedFooter,
    getMessages,
} from "@shared";
import { getCurrentUser } from "@shared/api/authServices";
import PageHeader from "@shared/ui/PageHeader";
import Footer from "@widgets/Footer";
import InstagramFeed from "@widgets/instagram-feed";
import { cookies } from "next/headers";

export default async function OrderPage({ params }) {
    const { locale = "ua" } = await params;
    const messages = await getMessages(locale);
    const { t } = createI18nServer(messages);

    const categories = await getAllCategory();
    const footerData = getLocalizedFooter(t);

    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token");

    let user = null;
    if (token) {
        user = await getCurrentUser(token.value);
    }

    const orderTitle = t("breadcrumbs.order");

    return (
        <div className="order-page-shell">
            <div className="order-page">
                <PageHeader
                    locale={locale}
                    breadcrumbsLabels={{
                        home: t("breadcrumbs.home"),
                        page: t("breadcrumbs.page"),
                    }}
                    breadcrumbsItems={[{ label: orderTitle }]}
                    showTitle={false}
                    plainBreadcrumbs
                />
                <div className="container">
                    <div className="order__wrapper">
                        <UserDetailsForm user={user} location={"order"} />
                    </div>
                </div>
            </div>

            <InstagramFeed variant="afterCatalog" />

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
