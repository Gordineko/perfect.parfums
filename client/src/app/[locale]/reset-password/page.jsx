import FinishReset from "@features/finish-reset/ui/FinishResetForm";
import { getMessages } from "@shared/i18n/getMessages";
import { createI18nServer } from "@shared/i18n/server";
import PageHeader from "@shared/ui/PageHeader";

import styles from "./reset-password.module.scss";

const normalizeToken = (value) => {
  const raw = String(value || "").trim();
  const hashMatch = raw.match(/[a-fA-F0-9]{64}/);
  return hashMatch ? hashMatch[0] : raw;
};

const resolveToken = (searchParams) => {
  const tokenValue = searchParams?.token || searchParams?.resetToken;
  if (Array.isArray(tokenValue)) return normalizeToken(tokenValue[0]);
  return normalizeToken(tokenValue);
};

const ResetPage = async ({ params, searchParams }) => {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const locale = resolvedParams?.locale || "ua";

  const messages = await getMessages(locale);
  const { t } = createI18nServer(messages);
  const token = resolveToken(resolvedSearchParams);
  const pageTitle = t("authorization.resetTitle");

  return (
    <div className={styles.pageShell}>
      <PageHeader
        locale={locale}
        breadcrumbsLabels={{
          home: t("breadcrumbs.home"),
          page: t("breadcrumbs.page"),
        }}
        breadcrumbsItems={[{ label: t("breadcrumbs.reset") }]}
        title={pageTitle}
      />

      <div className="container">
        <section className={styles.shell}>
          <div className={styles.card}>
            <FinishReset token={token} />
          </div>
        </section>
      </div>

    </div>
  );
};

export default ResetPage;
