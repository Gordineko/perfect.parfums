import Image from "next/image";

import styles from "./Header.module.scss";

export default function TemplateLogo({ tagline }) {
  return (
    <span className={styles.logoBrand}>
      <Image
        src="/img/perfect-parfums-logo.svg"
        alt=""
        width={171}
        height={60}
        className={styles.logoSvg}
        priority
      />
      {tagline ? <span className={styles.logoTagline}>{tagline}</span> : null}
    </span>
  );
}
