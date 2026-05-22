"use client";

import { MODALS } from "@shared/config/modals";
import { useI18n } from "@shared/i18n/use-i18n";
import { useModals } from "@shared/index";
import clsx from "clsx";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";

import { IconOrderHistory, IconPersonalInfo } from "./ProfileSidebarIcons";
import ProfileSidebarLogo from "./ProfileSidebarLogo";
import styles from "./ProfileSidebar.module.scss";

const ProfileSidebar = () => {
  const { setIsModalOpen } = useModals();
  const { t } = useI18n();
  const pathname = usePathname();
  const params = useParams();
  const locale = params?.locale ?? "ua";

  const isActive = (path) => pathname.includes(path);

  return (
    <aside className={styles.sidebar}>
      <nav className={styles.nav}>
        <div className={styles.logoWrap}>
          <ProfileSidebarLogo className={styles.logo} />
        </div>

        <Link
          className={clsx(
            styles.navItem,
            isActive("/profile/info") && styles.navItemActive,
          )}
          href={`/${locale}/profile/info`}
        >
          <IconPersonalInfo className={styles.navIcon} />
          {t("profile.link1")}
        </Link>

        <Link
          className={clsx(
            styles.navItem,
            isActive("/profile/history") && styles.navItemActive,
          )}
          href={`/${locale}/profile/history`}
        >
          <IconOrderHistory className={styles.navIcon} />
          {t("profile.link2")}
        </Link>
      </nav>
      <p
        className={clsx(styles.navItem, styles.navItemLogout)}
        onClick={() => setIsModalOpen(MODALS.LOGOUT)}
      >
        <span className={styles.logoutArrow}>→</span> {t("profile.link3")}
      </p>
    </aside>
  );
};

export default ProfileSidebar;
