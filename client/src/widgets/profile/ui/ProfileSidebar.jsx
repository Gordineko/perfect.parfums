"use client";

import { localePath } from "@shared/lib/localePath";
import { MODALS } from "@shared/config/modals";
import { useI18n } from "@shared/i18n/use-i18n";
import { useModals } from "@shared/index";
import clsx from "clsx";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";

import styles from "./ProfileSidebar.module.scss";

const NAV_ITEMS = [
  { path: "/profile/info", labelKey: "profile.link1" },
  { path: "/profile/delivery", labelKey: "profile.link4" },
  { path: "/profile/wishlist", labelKey: "profile.link5" },
  { path: "/profile/history", labelKey: "profile.link2" },
];

const ProfileSidebar = () => {
  const { setIsModalOpen } = useModals();
  const { t } = useI18n();
  const pathname = usePathname();
  const params = useParams();
  const locale = params?.locale ?? "ua";

  const isActive = (path) => {
    const localized = localePath(locale, path);
    if (path === "/profile/history") {
      return pathname.includes("/profile/history");
    }
    return pathname === localized || pathname.endsWith(path);
  };

  return (
    <aside className={styles.sidebar}>
      <nav className={styles.nav} aria-label={t("profile.title-header")}>
        {NAV_ITEMS.map(({ path, labelKey }) => (
          <Link
            key={path}
            className={clsx(
              styles.navItem,
              isActive(path) && styles.navItemActive,
            )}
            href={localePath(locale, path)}
          >
            {t(labelKey)}
          </Link>
        ))}
      </nav>

      <button
        type="button"
        className={styles.logout}
        onClick={() => setIsModalOpen(MODALS.LOGOUT)}
      >
        {t("profile.link3")}
      </button>
    </aside>
  );
};

export default ProfileSidebar;
