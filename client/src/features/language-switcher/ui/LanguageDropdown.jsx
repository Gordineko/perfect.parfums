// src/features/changeLanguage/ui/LanguageDropdown.jsx
"use client";

import { useI18n } from "@shared/i18n/use-i18n";
import { UKFlag, UkrFlag } from "@shared/index";
import { useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";

import { useLanguageSwitcher } from "../model/useLanguageSwitcher";

const LANGS = [
  {
    locale: "ua",
    labelKey: "language.ukrainian",
    code: "UA",
    Icon: UkrFlag,
  },
  {
    locale: "en",
    labelKey: "language.english",
    code: "EN",
    Icon: UKFlag,
  },
];

const LanguageDropdown = () => {
  const { t } = useI18n();
  const { currentLocale, isOpen, onSelect, close } =
    useLanguageSwitcher();
  const [portalReady, setPortalReady] = useState(false);

  useLayoutEffect(() => {
    setPortalReady(true);
  }, []);

  if (!isOpen) return null;

  const backdrop =
    portalReady &&
    createPortal(
      <div
        className="lang-backdrop"
        aria-hidden
        onPointerDown={(e) => {
          e.preventDefault();
          close();
        }}
      />,
      document.body,
    );

  return (
    <>
      {backdrop}
      <ul className="lang" role="menu">
        {LANGS.map(
          ({ locale, labelKey, code, Icon }) => (
            <li key={locale} className="lang__item">
              <button
                type="button"
                className="lang__button"
                role="menuitem"
                onClick={() => onSelect(locale)}
                aria-current={
                  locale === currentLocale
                    ? "true"
                    : "false"
                }
              >
                <Icon />
                <span className="lang__text">
                  {t(labelKey)}
                </span>
                <span className="lang__text">
                  {code}
                </span>
              </button>
            </li>
          ),
        )}
      </ul>
    </>
  );
};

export default LanguageDropdown;
