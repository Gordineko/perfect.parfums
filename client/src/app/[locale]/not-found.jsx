import NotFoundPage from "@pages/not-found-page";
import pageStyles from "@pages/not-found-page/ui/NotFoundPage.module.scss";
import { getMessages } from "@shared";

import Providers from "../providers/index";

async function resolveMessages(locale) {
  try {
    return await getMessages(locale);
  } catch {
    try {
      return await getMessages("ua");
    } catch {
      return {};
    }
  }
}

export default async function NotFound({ params }) {
  const resolvedParams = params != null ? await params : { locale: "ua" };
  const { locale = "ua" } = resolvedParams;

  const messages = await resolveMessages(locale);

  return (
    <Providers locale={locale} messages={messages}>
      <div className={`${pageStyles.shell} not-found-standalone`}>
        <NotFoundPage locale={locale} />
      </div>
    </Providers>
  );
}
