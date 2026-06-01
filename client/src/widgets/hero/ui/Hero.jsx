import { localePath } from "@shared/lib/localePath";
import Link from "next/link";

import styles from "./Hero.module.scss";

const DEFAULT_MAIN = "/img/hero-perfume-main.png";
const DEFAULT_SECONDARY = "/img/hero-perfume-secondary.png";
const DEFAULT_MOBILE = "/img/hero-perfume-main-mob.png";

export default function Hero({
  locale = "ua",
  mainImage = DEFAULT_MAIN,
  secondaryImage = DEFAULT_SECONDARY,
  mobileImage = DEFAULT_MOBILE,
  eyebrow = "ОРИГІНАЛЬНА ПАРФУМЕРІЯ",
  line1 = "Для тих, хто",
  line2 = "звик залишати слід",
  ctaLabel = "Перейти в каталог",
  catalogHref = "",
}) {
  const href =
    catalogHref.trim() || localePath(locale, "/categories/all");

  return (
    <section className={styles.root} aria-label={eyebrow}>
      <div className={styles.banner}>
        <img
          className={styles.bannerMain}
          src={mainImage}
          alt=""
          fetchPriority="high"
        />
        <img
          className={styles.bannerSecondary}
          src={secondaryImage}
          alt=""
          fetchPriority="high"
        />
        <img
          className={styles.bannerMob}
          src={mobileImage}
          alt=""
          fetchPriority="high"
        />
      </div>

      <div className={styles.overlay}>
        <div className={styles.content}>
          <h1 className={styles.title}>
            <span className={styles.titleEyebrow}>{eyebrow}</span>
            <span className={styles.titleLine}>{line1}</span>
            <span className={styles.titleLine}>{line2}</span>
          </h1>

          <Link href={href} className={styles.cta}>
            {ctaLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}
