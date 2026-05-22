"use client";

import PageHeader from "@shared/ui/PageHeader";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

function getProfileRouteState(pathname) {
  const segments = String(pathname || "")
    .split("/")
    .filter(Boolean);
  const profileIndex = segments.indexOf("profile");
  if (profileIndex === -1) {
    return { section: null, orderNumber: null };
  }

  const section = segments[profileIndex + 1] ?? null;
  const afterHistory = segments[profileIndex + 2] ?? null;

  if (section === "history" && afterHistory) {
    return { section: "history", orderNumber: afterHistory };
  }

  return { section, orderNumber: null };
}

export default function ProfilePageHeader({
  locale,
  breadcrumbsLabels,
  copy,
}) {
  const pathname = usePathname();

  const breadcrumbsItemsCompact = useMemo(
    () => [{ label: copy.prof }],
    [copy.prof],
  );

  const breadcrumbsItems = useMemo(() => {
    const { section, orderNumber } = getProfileRouteState(pathname);
    const profPath = `/${locale}/profile/info`;
    const historyPath = `/${locale}/profile/history`;

    if (section === "history" && orderNumber) {
      return [
        { label: copy.prof, path: profPath },
        { label: copy.history, path: historyPath },
        { label: `${copy.orderTitle} #${orderNumber}` },
      ];
    }

    if (section === "history") {
      return [
        { label: copy.prof, path: profPath },
        { label: copy.history },
      ];
    }

    return [{ label: copy.prof }];
  }, [pathname, locale, copy]);

  return (
    <PageHeader
      locale={locale}
      breadcrumbsLabels={breadcrumbsLabels}
      breadcrumbsItems={breadcrumbsItems}
      breadcrumbsItemsCompact={breadcrumbsItemsCompact}
      title={copy.titleProf}
    />
  );
}
