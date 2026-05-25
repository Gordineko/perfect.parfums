import { SocialLinks } from "@shared";
import { localePath, pathWithoutLocale } from "@shared/lib/localePath";
import Link from "next/link";

import styles from "./Footer.module.scss";

const Footer = ({ locale, data }) => {
  const toLocalizedHref = (href) => {
    if (!href) return localePath(locale);
    if (/^https?:\/\//i.test(href)) return href;
    const raw = href.startsWith("/") ? href : `/${href}`;
    const base = pathWithoutLocale(raw);
    return localePath(locale, base === "/" ? "" : base);
  };

  const phoneHref = `tel:${data.contacts.phone.replace(/\s|\(|\)|-/g, "")}`;

  return (
    <footer className={styles.root}>
      <div className={`ds-container ${styles.inner}`}>
        <div className={styles.top}>
          <div className={styles.col}>
            <h2 className={styles.title}>{data.contacts.title}</h2>
            <div className={styles.textGroup}>
              <div className={styles.contactBlock}>
                <p className={styles.text}>{data.contacts.showroomLabel}</p>
                <p className={styles.text}>{data.contacts.showroomAddress}</p>
              </div>
              <div className={styles.contactBlock}>
                <p className={styles.text}>{data.contacts.phoneLabel}</p>
                <a className={styles.link} href={phoneHref}>
                  {data.contacts.phone}
                </a>
              </div>
              <div className={styles.contactBlock}>
                <p className={styles.text}>{data.contacts.scheduleLabel}</p>
                <p className={styles.text}>{data.contacts.scheduleValue}</p>
              </div>
            </div>
          </div>

          <div className={styles.col}>
            <h2 className={styles.title}>{data.information.title}</h2>
            <ul className={styles.list}>
              {data.information.items.map((item) => (
                <li key={item.id}>
                  <Link
                    className={styles.link}
                    href={toLocalizedHref(item.href)}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.socialCol}>
            <SocialLinks />
          </div>
        </div>

        <p className={styles.brand} aria-label={`${data.brand.perfect} ${data.brand.parfums}`}>
          <span className={styles.brandPerfect}>{data.brand.perfect}</span>{" "}
          <span className={styles.brandParfums}>{data.brand.parfums}</span>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
