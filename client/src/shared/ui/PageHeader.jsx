"use client";

import Breadcrumbs from "@widgets/brad-crumps";

export default function PageHeader({
  locale,
  breadcrumbsItems,
  breadcrumbsItemsCompact,
  breadcrumbsLabels,
  title,
  showBreadcrumbs = true,
}) {
  const breadcrumbProps = {
    embedInPage: true,
    locale,
    labels: breadcrumbsLabels,
  };

  return (
    <header className="page-header">
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

      <div className="container">
        <div className="page-header__header">
          <h1 className="page-header__title t-page-title">
            {title}
          </h1>
        </div>
      </div>
    </header>
  );
}
