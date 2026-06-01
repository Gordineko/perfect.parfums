import { i18n } from "@shared";
import {
  getAllCategory,
  getMessages,
} from "@shared";
import Header from "@widgets/Header";
import { notFound } from "next/navigation";

import MainContent from "../MainContent";
import Providers from "../providers/index";
import ReduxProvider from "../providers/ReduxProvider";

export default async function LocaleLayout({
  children,
  params,
}) {
  const categories = await getAllCategory();
  const { locale = "ua" } = await params;

  if (!i18n.locales.includes(locale)) {
    notFound();
  }

  const messages = await getMessages(locale);

  return (
    <Providers
      locale={locale}
      messages={messages}
    >
      <ReduxProvider>
        <div className="layout">
          <Header
            locale={locale}
            categories={categories}
          />
          <MainContent locale={locale}>
            {children}
          </MainContent>
        </div>
      </ReduxProvider>
    </Providers>
  );
}