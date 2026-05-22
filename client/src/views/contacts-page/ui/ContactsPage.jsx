"use client";

import {
  formatUaPhone,
  normalizeUaPhoneDigits,
  PageHeader,
  useI18n,
} from "@shared";
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
    const mq = window.matchMedia("(max-width: 767.98px)");
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
        title={title}
      />

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
                    className="contacts-form__input"
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
                    className="contacts-form__input"
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
                    className="contacts-form__select contacts-form__select--custom"
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
                  className="contacts-form__textarea"
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
            <a
              className="contacts-page__card contacts-page__card--wide contacts-page__card--link"
              href="mailto:maloe_support@gmail.com"
            >
              <div className="contacts-info">
                <span className="contacts-info__chip">
                  {t("contactsPage.chipEmail")}
                </span>
                <p className="contacts-info__value">maloe_support@gmail.com</p>
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
                <p className="contacts-info__value">+38 (067) 967 01 63</p>
                <p className="contacts-info__hint">
                  {t("contactsPage.phoneHint")}
                </p>
              </div>
            </a>

            <div className="contacts-page__social-grid">
              <a
                className="contacts-page__card contacts-page__card--social contacts-page__card--link"
                href="https://www.instagram.com/world.of_heels/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="contacts-info">
                  <span className="contacts-info__chip">Instagram</span>
                  <p className="contacts-info__value">@world.of_heels</p>
                </div>
              </a>
              <a
                className="contacts-page__card contacts-page__card--social contacts-page__card--link"
                href="https://t.me/woh_support"
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="contacts-info">
                  <span className="contacts-info__chip">Telegram</span>
                  <p className="contacts-info__value">@woh.support</p>
                </div>
              </a>
              <a
                className="contacts-page__card contacts-page__card--social contacts-page__card--link"
                href="https://www.tiktok.com/@world.of_heels?_r=1&_t=ZS-95mPRroZ0Dw"
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="contacts-info">
                  <span className="contacts-info__chip">TikTok</span>
                  <p className="contacts-info__value">world.of.heels</p>
                </div>
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
