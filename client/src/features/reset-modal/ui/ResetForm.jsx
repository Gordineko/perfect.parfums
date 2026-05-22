"use client";

import { AuthEmailIcon, MODALS, useModals } from "@shared/index";
import { useI18n } from "@shared/i18n/use-i18n";
import { useFormik } from "formik";
import React from "react";
import * as Yup from "yup";

import { useResetForm } from "../lib/useResetForm";

const ResetForm = () => {
  const { t } = useI18n();
  const { setIsModalOpen, setIsTxt } = useModals();
  const { requestPasswordResetEmail } = useResetForm();

  const formik = useFormik({
    initialValues: { email: "" },
    validationSchema: Yup.object({
      email: Yup.string()
        .email(t("authorization.validation.invalidEmail"))
        .required(t("authorization.validation.required")),
    }),
    validateOnMount: true,
    onSubmit: async (values) => {
      try {
        formik.setStatus(undefined);
        await requestPasswordResetEmail(String(values.email || "").trim());
        setIsTxt({
          title: t("txt-modal.forgotEmailSent.title"),
          description: t("txt-modal.forgotEmailSent.desc"),
          btn: t("txt-modal.forgotEmailSent.btn"),
        });
        setIsModalOpen(MODALS.TXTINFO);
      } catch (err) {
        const message =
          (typeof err?.message === "string" && err.message.trim()) ||
          t("authorization.resetEmailError") ||
          "Не вдалося надіслати лист. Спробуйте ще раз.";
        formik.setStatus({ submitError: message });
      }
    },
  });

  const submitError = formik?.status?.submitError;

  return (
    <form onSubmit={formik.handleSubmit} className="auth-form">
      <div className="form-group">
        <label htmlFor="reset-email">{t("authorization.emailLabel")}</label>
        <div className="auth-input-wrap">
          <span className="auth-input-icon" aria-hidden="true">
            <AuthEmailIcon />
          </span>
          <input
            id="reset-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            className="auth-input"
            placeholder={t("authorization.regEmailPlaceholder")}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.email}
          />
        </div>
        {formik.touched.email && formik.errors.email ? (
          <div className="error-text">{formik.errors.email}</div>
        ) : null}
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
        {t("authorization.restoreBtn")}
      </button>
    </form>
  );
};

export default ResetForm;
