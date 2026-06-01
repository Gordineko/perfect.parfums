"use client";

import { isNavLinkActive } from "@shared/lib/isNavLinkActive";
import { localePath } from "@shared/lib/localePath";
import { useI18n } from "@shared/i18n/use-i18n";
import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { HEADER_TOP_LINKS } from "../config/headerNavConfig";
import styles from "./Header.module.scss";

export default function HeaderTopNav({ locale }) {
  const { t } = useI18n();
  const pathname = usePathname();

  return (
    <nav className={styles.topNav} aria-label={t("header.topNavAria")}>
      <ul className={styles.topList}>
        {HEADER_TOP_LINKS.map(({ id, path, labelKey }) => {
          const href = localePath(locale, path);
          const isActive = isNavLinkActive(pathname, href);

          return (
            <li key={id}>
              <Link
                href={href}
                className={clsx(styles.topLink, isActive && styles.topLinkActive)}
                aria-current={isActive ? "page" : undefined}
              >
                {t(labelKey)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
