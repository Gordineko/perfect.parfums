"use client";

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
            const href = `/${locale}/categories/${slug}`;
            const isActive =
              typeof pathname === "string" &&
              (pathname === href || pathname.startsWith(`${href}/`));

            return (
              <li key={id} className={styles.categoryItem}>
                <Link
                  href={href}
                  className={clsx(
                    styles.categoryLink,
                    isActive && styles.categoryLinkActive,
                  )}
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
