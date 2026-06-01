import styles from "./Bestsellers.module.scss";

function SkeletonCard() {
  return (
    <div className={styles.skeletonCard}>
      <div className={`${styles.skeleton} ${styles.skeletonCardMedia}`} />
      <div className={`${styles.skeleton} ${styles.skeletonCardStars}`} />
      <div className={styles.skeletonCardBody}>
        <div className={`${styles.skeleton} ${styles.skeletonLine}`} />
        <div className={`${styles.skeleton} ${styles.skeletonLine}`} />
        <div
          className={`${styles.skeleton} ${styles.skeletonLine} ${styles.skeletonLinePrice}`}
        />
        <div className={`${styles.skeleton} ${styles.skeletonVolume}`} />
        <div className={`${styles.skeleton} ${styles.skeletonButton}`} />
      </div>
    </div>
  );
}

export default function ProductCarouselSkeleton() {
  return (
    <div className={styles.skeletonCarousel} aria-hidden="true">
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
}
