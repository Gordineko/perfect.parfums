"use client";

import pageStyles from "@widgets/profile/ui/ProfilePage.module.scss";

import styles from "./loading.module.scss";

export default function Loading() {
  return (
    <div className={pageStyles.page}>
      <div className={pageStyles.intro} aria-busy="true" aria-live="polite">
        <div className={`${styles.skeleton} ${styles.kicker}`} />
        <div className={`${styles.skeleton} ${styles.titleSkeleton}`} />
      </div>

      <div className="user-details user-details--profile">
        <div className="user-details__groups">
          <div className={`${styles.skeleton} ${styles.card}`} />
          <div className={`${styles.skeleton} ${styles.card}`} />
        </div>
      </div>
    </div>
  );
}
