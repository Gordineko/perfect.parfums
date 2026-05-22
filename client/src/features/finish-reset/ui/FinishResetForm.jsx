"use client";

import { MODALS, useModals } from "@shared/index";
import { useI18n } from "@shared/i18n/use-i18n";
import { useFormik } from "formik";
import React from "react";
import * as Yup from "yup";

import styles from "./FinishResetForm.module.scss";
import { resetPassword } from "@shared/api/authServices";

const FinishResetForm = ({ token }) => {
    const { t } = useI18n();
    const { setIsModalOpen, setIsTxt } = useModals();

    const formik = useFormik({
        initialValues: {
            password: "",
            confirmPassword: "",
        },
        validationSchema: Yup.object({
            password: Yup.string()
                .min(6, t("authorization.validation.minPassword"))
                .required(t("authorization.validation.required")),
            confirmPassword: Yup.string()
                .oneOf([Yup.ref("password")], t("authorization.validation.passwordsMustMatch"))
                .required(t("authorization.validation.required")),
        }),
        validateOnMount: true,
        onSubmit: async (values) => {
            formik.setStatus(undefined);

            if (!token) {
                formik.setStatus({
                    submitError: t("authorization.resetTokenMissing"),
                });
                return;
            }
           
            try {
                await resetPassword({
                    token,
                    newPassword: String(values.password || ""),
                });

                setIsTxt({
                    title: t("txt-modal.reset.title"),
                    description: t("txt-modal.reset.desc"),
                    btn: t("txt-modal.reset.btn"),
                });
                setIsModalOpen(MODALS.TXTINFO);
                formik.resetForm();
            } catch (err) {
                const message =
                    (typeof err?.message === "string" && err.message.trim()) ||
                    t("authorization.resetPasswordError");
                formik.setStatus({ submitError: message });
            }
        },
    });

    const submitError = formik?.status?.submitError;

    return (
        <form onSubmit={formik.handleSubmit} className={`${styles.form} auth-form`}>
            <h2 className={styles.title}>{t("authorization.resetBtn")}</h2>

            <div className={`${styles.group} form-group`}>
                <label htmlFor="reset-password">{t("authorization.newPasswordLabel")}</label>
                <input
                    id="reset-password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    className={`${styles.input} auth-input`}
                    placeholder={t("authorization.newPasswordPlaceholder")}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.password}
                />
                {formik.touched.password && formik.errors.password ? (
                    <div className="error-text">{formik.errors.password}</div>
                ) : null}
            </div>

            <div className={`${styles.group} form-group`}>
                <label htmlFor="reset-confirm-password">{t("authorization.confirmPasswordLabel")}</label>
                <input
                    id="reset-confirm-password"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    className={`${styles.input} auth-input`}
                    placeholder={t("authorization.confirmPasswordPlaceholder")}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.confirmPassword}
                />
                {formik.touched.confirmPassword && formik.errors.confirmPassword ? (
                    <div className="error-text">{formik.errors.confirmPassword}</div>
                ) : null}
            </div>

            {submitError ? (
                <div className="error-text" role="alert" aria-live="polite">
                    {submitError}
                </div>
            ) : null}

            <button
                className={`${styles.submit} auth-submit`}
                type="submit"
                disabled={!formik.isValid || !formik.dirty || formik.isSubmitting}
            >
                {t("authorization.savePasswordBtn")}
            </button>
        </form>
    );
};

export default FinishResetForm;
