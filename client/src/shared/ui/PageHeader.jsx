"use client";

import Breadcrumbs from "@widgets/brad-crumps";

export default function PageHeader({
  locale,
  breadcrumbsItems,
  breadcrumbsItemsCompact,
  breadcrumbsLabels,
  title,
  showBreadcrumbs = true,
  showTitle = true,
  plainBreadcrumbs = false,
}) {
  const breadcrumbProps = {
    embedInPage: true,
    plain: plainBreadcrumbs,
    locale,
    labels: breadcrumbsLabels,
  };

  return (
    <header
      className={[
        "page-header",
        !showTitle ? "page-header--breadcrumbs-only" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {showBreadcrumbs ? (
        <div className="page-header__breadcrumbs">
          {breadcrumbsItemsCompact ? (
            <>
              <div className="page-header__breadcrumbs-full">
                <Breadcrumbs {...breadcrumbProps} items={breadcrumbsItems} />
              </div>
              <div className="page-header__breadcrumbs-compact">
                <Breadcrumbs
                  {...breadcrumbProps}
                  items={breadcrumbsItemsCompact}
                />
              </div>
            </>
          ) : (
            <Breadcrumbs {...breadcrumbProps} items={breadcrumbsItems} />
          )}
        </div>
      ) : null}

      {showTitle && title ? (
        <div className="container">
          <div className="page-header__header">
            <h1 className="page-header__title t-h1">{title}</h1>
          </div>
        </div>
      ) : null}
    </header>
  );
}
