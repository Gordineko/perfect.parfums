"use client";

import { isNavLinkActive } from "@shared/lib/isNavLinkActive";
import { localePath } from "@shared/lib/localePath";
import { useI18n } from "@shared/i18n/use-i18n";
import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { HEADER_CATEGORY_NAV } from "../config/headerNavConfig";
import styles from "./Header.module.scss";

export default function HeaderCategoryNav({ locale }) {
  const { t } = useI18n();
  const pathname = usePathname();

  return (
    <nav className={styles.categoryNav} aria-label={t("header.categoryNavAria")}>
      <div className="container">
        <ul className={styles.categoryList}>
          {HEADER_CATEGORY_NAV.map(({ id, slug, labelKey }) => {
            const href = localePath(locale, `/categories/${slug}`);
            const isActive = isNavLinkActive(pathname, href);

            return (
              <li key={id} className={styles.categoryItem}>
                <Link
                  href={href}
                  className={clsx(
                    styles.categoryLink,
                    isActive && styles.categoryLinkActive,
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  {t(labelKey)}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
