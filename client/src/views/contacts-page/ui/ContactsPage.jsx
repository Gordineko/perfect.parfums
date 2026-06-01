"use client";

import {
  formatUaPhone,
  MQ,
  normalizeUaPhoneDigits,
  PageHeader,
  useI18n,
} from "@shared";
import {
  contactsSocialLinkIds,
  socialLinks,
} from "@shared/config/socialLinks";
import clsx from "clsx";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

const SOURCE_OPTIONS = [
  { value: "ads", labelKey: "contactsPage.sourceAds" },
  { value: "coach_reco", labelKey: "contactsPage.sourceCoach" },
  { value: "friend_reco", labelKey: "contactsPage.sourceFriend" },
  { value: "self_found", labelKey: "contactsPage.sourceSelf" },
];

export default function ContactsPage() {
  const params = useParams();
  const locale = params?.locale ?? "ua";
  const { t } = useI18n();

  const title = t("navigation.header.contacts");

  const breadcrumbsLabels = useMemo(
    () => ({
      home: t("breadcrumbs.home"),
      page: t("breadcrumbs.page"),
    }),
    [t],
  );

  const breadcrumbsItems = useMemo(() => [{ label: title }], [title]);

  const sourceOptions = useMemo(
    () =>
      SOURCE_OPTIONS.map((option) => ({
        value: option.value,
        label: t(option.labelKey),
      })),
    [t],
  );

  const [form, setForm] = useState({
    name: "",
    phone: "",
    source: "",
    message: "",
  });

  const onChange = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const onPhoneChange = (e) => {
    const next = formatUaPhone(e.target.value);
    setForm((prev) => ({ ...prev, phone: next }));
  };

  const sourceLabel = useMemo(
    () => sourceOptions.find((o) => o.value === form.source)?.label ?? "",
    [form.source, sourceOptions],
  );

  const [isSourceOpen, setIsSourceOpen] = useState(false);
  const [isSourceFieldHidden, setIsSourceFieldHidden] = useState(false);
  const sourceRef = useRef(null);

  useEffect(() => {
    const mq = window.matchMedia(MQ.belowTablet);
    const sync = () => setIsSourceFieldHidden(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (isSourceFieldHidden) setIsSourceOpen(false);
  }, [isSourceFieldHidden]);

  useEffect(() => {
    if (!isSourceOpen) return;
    const onDocMouseDown = (e) => {
      if (!sourceRef.current) return;
      if (!sourceRef.current.contains(e.target)) {
        setIsSourceOpen(false);
      }
    };
    const onDocKeyDown = (e) => {
      if (e.key === "Escape") setIsSourceOpen(false);
    };
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onDocKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onDocKeyDown);
    };
  }, [isSourceOpen]);

  const onPickSource = (value) => {
    setForm((prev) => ({ ...prev, source: value }));
    setIsSourceOpen(false);
  };

  const isPhoneFilled = useMemo(() => {
    const phoneDigits = normalizeUaPhoneDigits(form.phone);
    return phoneDigits.length > 3;
  }, [form.phone]);

  const isFormValid = useMemo(() => {
    const nameOk = form.name.trim().length > 0;
    const phoneDigits = normalizeUaPhoneDigits(form.phone);
    const phoneOk =
      phoneDigits.length === 12 && phoneDigits.startsWith("380");
    const sourceOk = isSourceFieldHidden || form.source.trim().length > 0;
    const messageOk = form.message.trim().length > 0;
    return nameOk && phoneOk && sourceOk && messageOk;
  }, [form, isSourceFieldHidden]);

  const onSubmit = (e) => {
    e.preventDefault();
  };

  return (
    <div className="contacts-page">
      <PageHeader
        locale={locale}
        breadcrumbsLabels={breadcrumbsLabels}
        breadcrumbsItems={breadcrumbsItems}
        showTitle={false}
        plainBreadcrumbs
      />

      <div className="contacts-page__shell">
        <div className="container">
          <div className="contacts-page__grid">
          <section className="contacts-page__card contacts-page__card--form">
            <h2 className="contacts-page__card-title">
              {t("contactsPage.formTitle")}
            </h2>

            <form className="contacts-form" onSubmit={onSubmit}>
              <div className="contacts-form__row">
                <div className="contacts-form__field">
                  <label className="contacts-form__label" htmlFor="contacts-name">
                    {t("contactsPage.nameLabel")}
                  </label>
                  <input
                    id="contacts-name"
                    className={clsx(
                      "contacts-form__input",
                      form.name.trim() && "contacts-form__input--filled",
                    )}
                    type="text"
                    value={form.name}
                    onChange={onChange("name")}
                  />
                </div>

                <div className="contacts-form__field">
                  <label className="contacts-form__label" htmlFor="contacts-phone">
                    {t("contactsPage.phoneLabel")}
                  </label>
                  <input
                    id="contacts-phone"
                    className={clsx(
                      "contacts-form__input",
                      isPhoneFilled && "contacts-form__input--filled",
                    )}
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={formatUaPhone(form.phone)}
                    onChange={onPhoneChange}
                  />
                </div>
              </div>

              <div className="contacts-form__field contacts-form__field--source">
                <label className="contacts-form__label" htmlFor="contacts-source">
                  {t("contactsPage.sourceLabel")}
                </label>
                <div className="contacts-form__dropdown" ref={sourceRef}>
                  <select
                    id="contacts-source"
                    className="contacts-form__select contacts-form__select--sr"
                    value={form.source}
                    onChange={onChange("source")}
                    aria-hidden="true"
                    tabIndex={-1}
                  >
                    <option value="" disabled>
                      {t("contactsPage.sourcePlaceholder")}
                    </option>
                    {sourceOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    className={clsx(
                      "contacts-form__select contacts-form__select--custom",
                      form.source && "contacts-form__select--custom--filled",
                    )}
                    aria-haspopup="listbox"
                    aria-expanded={isSourceOpen}
                    onClick={() => setIsSourceOpen((v) => !v)}
                  >
                    {sourceLabel || t("contactsPage.sourcePlaceholder")}
                    <span className="contacts-form__select-icon" aria-hidden="true" />
                  </button>

                  {isSourceOpen && (
                    <ul
                      className="contacts-form__options"
                      role="listbox"
                      aria-label={t("contactsPage.sourceAria")}
                    >
                      {sourceOptions.map((o) => (
                        <li
                          key={o.value}
                          role="option"
                          aria-selected={form.source === o.value}
                        >
                          <button
                            type="button"
                            className="contacts-form__option"
                            onClick={() => onPickSource(o.value)}
                          >
                            {o.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div className="contacts-form__field">
                <label
                  className="contacts-form__label contacts-form__label--message"
                  htmlFor="contacts-message"
                >
                  {t("contactsPage.messageLabel")}
                </label>
                <textarea
                  id="contacts-message"
                  className={clsx(
                    "contacts-form__textarea",
                    form.message.trim() && "contacts-form__textarea--filled",
                  )}
                  rows={4}
                  value={form.message}
                  onChange={onChange("message")}
                  placeholder={t("contactsPage.messagePlaceholder")}
                />
              </div>

              <button
                type="submit"
                className="contacts-form__submit"
                disabled={!isFormValid}
              >
                {t("contactsPage.submit")}
              </button>
            </form>
          </section>

          <section className="contacts-page__right">
            <div className="contacts-page__contact-stack">
            <a
              className="contacts-page__card contacts-page__card--wide contacts-page__card--link"
              href={`mailto:${t("contactsPage.email")}`}
            >
              <div className="contacts-info">
                <span className="contacts-info__chip">
                  {t("contactsPage.chipEmail")}
                </span>
                <p className="contacts-info__value">
                  {t("contactsPage.email")}
                </p>
                <p className="contacts-info__hint">
                  {t("contactsPage.emailHint")}
                </p>
              </div>
            </a>

            <a
              className="contacts-page__card contacts-page__card--wide contacts-page__card--link"
              href="tel:+380679670163"
            >
              <div className="contacts-info">
                <span className="contacts-info__chip">
                  {t("contactsPage.chipPhone")}
                </span>
                <p className="contacts-info__value">{t("contactsPage.phone")}</p>
                <p className="contacts-info__hint">
                  {t("contactsPage.phoneHint")}
                </p>
              </div>
            </a>
            </div>

            <div className="contacts-page__social-grid">
              {contactsSocialLinkIds.map((id) => {
                const link = socialLinks.find((item) => item.id === id);
                if (!link) return null;

                const Icon = link.Icon;

                return (
                  <a
                    key={link.id}
                    className="contacts-page__card contacts-page__card--social contacts-page__card--link"
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${link.label} ${t("contactsPage.socialHandle")}`}
                  >
                    <div className="contacts-social">
                      <span className="contacts-social__icon">
                        <Icon label={link.label} />
                      </span>
                      <p className="contacts-social__handle">
                        {t("contactsPage.socialHandle")}
                      </p>
                    </div>
                  </a>
                );
              })}
            </div>
          </section>
          </div>
        </div>
      </div>
    </div>
  );
}
