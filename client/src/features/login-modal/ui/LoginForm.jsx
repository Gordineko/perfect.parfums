"use client";

import { AuthEmailIcon, MODALS, useModals } from "@shared/index";
import AuthCheckboxMark from "@shared/ui/icons/AuthCheckboxMark";
import { useI18n } from "@shared/i18n/use-i18n";
import React, { useState } from "react";

import { useLoginForm } from "../lib/useLoginForm";

const LoginForm = ({ onClose }) => {
  const { t } = useI18n();
  const { setIsModalOpen } = useModals();
  const [showPassword, setShowPassword] = useState(false);
  const formik = useLoginForm();

  const submitError = formik?.status?.submitError;

  return (
    <form onSubmit={formik.handleSubmit} className="auth-form">
      <div className="form-group">
        <label htmlFor="email">{t("authorization.emailLabel")}</label>
        <div className="auth-input-wrap">
          <span className="auth-input-icon">
            <AuthEmailIcon />
          </span>
          <input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.email}
            className="auth-input"
            placeholder={t("authorization.regEmailPlaceholder")}
          />
        </div>
        {formik.touched.email && formik.errors.email ? (
          <div className="error-text">{formik.errors.email}</div>
        ) : null}
      </div>

      <div className="form-group">
        <label htmlFor="password">{t("authorization.passwordLabel")}</label>
        <div className="auth-input-wrap">
          <span className="auth-input-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="19"
              viewBox="0 0 16 19"
              fill="none"
            >
              <path
                d="M7.83547 9.92288C7.51303 9.92416 7.19993 10.0337 6.94431 10.2346C6.68868 10.4355 6.50467 10.7168 6.42057 11.035C6.33647 11.3533 6.35693 11.691 6.47881 11.9962C6.60069 12.3014 6.81724 12.5572 7.09517 12.7244V14.8705H8.59382V12.7244C8.81371 12.5914 8.9962 12.4025 9.12355 12.176C9.2509 11.9496 9.31877 11.6933 9.32057 11.4321C9.32057 11.2331 9.2821 11.0361 9.20735 10.8524C9.13261 10.6687 9.02307 10.5019 8.88505 10.3616C8.74703 10.2214 8.58324 10.1104 8.40311 10.0351C8.22298 9.9598 8.03007 9.92166 7.83547 9.92288Z"
                stroke="#0D0D0D"
                strokeWidth="0.666667"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M13.3832 6.45801H2.2833C1.20632 6.45801 0.333252 7.35066 0.333252 8.45181V16.3393C0.333252 17.4405 1.20632 18.3331 2.2833 18.3331H13.3832C14.4602 18.3331 15.3333 17.4405 15.3333 16.3393V8.45181C15.3333 7.35066 14.4602 6.45801 13.3832 6.45801Z"
                stroke="#0D0D0D"
                strokeWidth="0.666667"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M3.02808 6.45749V5.2529C3.02808 3.94807 3.53504 2.69667 4.43745 1.77401C5.33986 0.851352 6.56379 0.333008 7.83999 0.333008C9.11619 0.333008 10.3401 0.851352 11.2425 1.77401C12.1449 2.69667 12.6519 3.94807 12.6519 5.2529V6.45749"
                stroke="#0D0D0D"
                strokeWidth="0.666667"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.password}
            className="auth-input auth-input--with-eye"
            placeholder={t("authorization.passwordPlaceholder")}
          />
          <button
            type="button"
            className="auth-eye-btn"
            aria-label={showPassword ? "Приховати пароль" : "Показати пароль"}
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="17"
                viewBox="0 0 20 17"
                fill="none"
              >
                <path
                  d="M10 3C6.3 3 3.35 5.31 1.58 8c1.77 2.69 4.72 5 8.42 5s6.65-2.31 8.42-5C16.65 5.31 13.7 3 10 3Zm0 8.2A3.2 3.2 0 1 1 10 4.8a3.2 3.2 0 0 1 0 6.4Zm0-1.9a1.3 1.3 0 1 0 0-2.6 1.3 1.3 0 0 0 0 2.6Z"
                  fill="#999999"
                  fillOpacity="0.5"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="17"
                viewBox="0 0 20 17"
                fill="none"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M16.8661 0.283885C17.2682 -0.0946732 17.9201 -0.0945836 18.3222 0.283885L18.4374 0.392284C18.8395 0.770887 18.8395 1.38477 18.4374 1.76338L16.5956 3.49678C16.6253 3.52224 16.6562 3.54635 16.6854 3.57197C18.3102 4.99074 19.3967 6.69107 19.914 7.8581C20.0284 8.11624 20.0284 8.40367 19.914 8.66181C19.3967 9.82884 18.3102 11.5259 16.6854 12.9479C15.0502 14.3798 12.8033 15.5827 9.99795 15.5827C8.13039 15.5827 6.5119 15.0472 5.15518 14.2683L3.41006 15.9128C3.00796 16.2913 2.35608 16.2914 1.95401 15.9128L1.83877 15.8044C1.43682 15.4258 1.43678 14.8119 1.83877 14.4333L3.36611 12.9938C3.34809 12.9783 3.3293 12.9636 3.31143 12.9479C1.68657 11.5292 0.599685 9.82888 0.0858409 8.66181C-0.0286057 8.40367 -0.0286215 8.11624 0.0858409 7.8581C0.599685 6.69103 1.68657 4.99076 3.31143 3.57197C4.94665 2.14021 7.19283 0.937268 9.99795 0.937205C11.847 0.937205 13.4522 1.46189 14.8007 2.22822L16.8661 0.283885ZM12.994 6.8874C13.0847 7.06378 13.161 7.24977 13.2167 7.44599C13.6923 9.11977 12.6369 10.8429 10.8593 11.2907C10.0538 11.4937 9.23895 11.3971 8.54287 11.0788L7.31826 12.2321C8.09312 12.6968 9.01201 12.9674 9.99795 12.9675C12.7571 12.9675 14.9977 10.8584 14.998 8.26045C14.998 7.33207 14.7102 6.46664 14.2167 5.73701L12.994 6.8874ZM9.99795 3.55244C7.23871 3.55255 4.99893 5.66237 4.99893 8.26045C4.99902 9.17275 5.27581 10.0242 5.75381 10.7458L6.9794 9.59248C6.89719 9.4272 6.82813 9.25341 6.77627 9.07099C6.71032 8.84549 6.67537 8.61974 6.66494 8.39424C6.658 8.20468 6.88027 8.09331 7.07119 8.15205C7.2934 8.2207 7.52976 8.26045 7.77627 8.26045C9.0018 8.26038 9.99795 7.32163 9.99795 6.16767C9.99794 5.93576 9.9565 5.71366 9.88369 5.50459C9.8212 5.32152 9.93916 5.11524 10.1405 5.12178C10.587 5.13929 11.0192 5.24193 11.414 5.4167L12.6386 4.26338C11.8721 3.81319 10.9671 3.55244 9.99795 3.55244Z"
                  fill="#999999"
                  fillOpacity="0.5"
                />
              </svg>
            )}
          </button>
        </div>
        {formik.touched.password && formik.errors.password ? (
          <div className="error-text">{formik.errors.password}</div>
        ) : null}
      </div>

      <div className="form-checkbox__wrapper">
        <div className="form-checkbox">
          <label className="custom-checkbox-label">
            <input
              type="checkbox"
              name="rememberMe"
              onChange={(e) => {
                formik.setStatus(undefined);
                formik.handleChange(e);
              }}
              checked={formik.values.rememberMe}
              className="custom-checkbox-input"
            />
            <div
              className={`custom-checkbox-box ${formik.values.rememberMe ? "checked" : ""}`}
            >
              {formik.values.rememberMe ? <AuthCheckboxMark /> : null}
            </div>
            <span className="custom-checkbox-text">{t("authorization.rememberMe")}</span>
          </label>
        </div>
        <p className="new-password" onClick={() => setIsModalOpen(MODALS.RESET)}>
          {t("authorization.forgotPassword")}
        </p>
      </div>

      {submitError ? (
        <div className="error-text" role="alert" aria-live="polite">
          {submitError}
        </div>
      ) : null}

      <button
        className="auth-submit"
        type="submit"
        disabled={!formik.isValid || !formik.dirty || formik.isSubmitting}
      >
        {t("authorization.loginBtn")}
      </button>
    </form>
  );
};

export default LoginForm;
