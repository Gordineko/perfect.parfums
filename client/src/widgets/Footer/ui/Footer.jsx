import { SocialLinks } from "@shared";
import Link from "next/link";

import styles from "./Footer.module.scss";
import TemplateFooterLogo from "./TemplateFooterLogo";

const Footer = ({ locale, data }) => {
  const toLocalizedHref = (href) => {
    if (!href) return `/${locale}`;
    if (/^https?:\/\//i.test(href)) return href;
    if (href.startsWith(`/${locale}`)) return href;
    return href.startsWith("/")
      ? `/${locale}${href}`
      : `/${locale}/${href}`;
  };

  const [catalogColumn, companyColumn] = data.columns;

  return (
    <footer className={styles.root}>
      <div className={`ds-container ${styles.inner}`}>
        <div className={styles.top}>
          <div className={styles.brand}>
            <div className={styles.logo} aria-hidden="true">
              <TemplateFooterLogo className={styles.logoSvg} />
            </div>
            <p className={styles.desc}>{data.description}</p>
            <SocialLinks />
          </div>

          <div className={styles.col}>
            <p className={styles.kicker}>{catalogColumn.title}</p>
            <ul className={styles.list}>
              {catalogColumn.items.map((item) => (
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

          <div className={styles.col}>
            <p className={styles.kicker}>{companyColumn.title}</p>
            <ul className={styles.list}>
              {companyColumn.items.map((item) => (
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

          <div className={styles.col}>
            <p className={styles.kicker}>{data.contacts.title}</p>
            <ul className={styles.list}>
              <li>
                <a
                  className={styles.link}
                  href={`mailto:${data.contacts.email}`}
                >
                  {data.contacts.email}
                </a>
              </li>
              <li>
                <a
                  className={styles.link}
                  href={`tel:${data.contacts.phone.replace(/\s|\(|\)|-/g, "")}`}
                >
                  {data.contacts.phone}
                </a>
              </li>
              <li>
                <button
                  type="button"
                  className={`${styles.link} ${styles.linkButton}`}
                >
                  {data.contacts.callbackText}
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className={styles.divider} />

      <div className={styles.subfooter}>
        <div className={`ds-container ${styles.bottom}`}>
          <p className={styles.copy}>{data.bottom.copyright}</p>
          <div className={styles.bottomLinks}>
            <button type="button" className={styles.bottomLink}>
              {data.bottom.offer}
            </button>
            <button type="button" className={styles.bottomLink}>
              {data.bottom.privacy}
            </button>
            <span className={styles.bottomLink}>{data.bottom.madeBy}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
