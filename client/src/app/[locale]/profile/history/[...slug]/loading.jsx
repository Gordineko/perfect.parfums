"use client";

import pageStyles from "@widgets/profile/ui/ProfilePage.module.scss";

import ordStyles from "./OrderDetail.module.scss";
import styles from "../../loading.module.scss";

export default function Loading() {
  return (
    <div className={pageStyles.page} aria-busy="true" aria-live="polite">
      <div className={pageStyles.introRelative}>
        <div className={`${styles.skeleton} ${styles.kicker}`} />
        <div className={`${styles.skeleton} ${styles.titleSkeleton}`} />
      </div>

      <div className={ordStyles.card}>
        <div className={`${styles.skeleton} ${styles.card}`} />
      </div>
      <div className={ordStyles.card}>
        <div className={`${styles.skeleton} ${styles.card}`} />
      </div>
    </div>
  );
}
