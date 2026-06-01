"use client";

import { localePath } from "@shared/lib/localePath";
import LoginForm from "@features/login-modal";
import RegForm from "@features/registration-modal";
import ResetForm from "@features/reset-modal";
import {
  clearCart,
  clearWishlist,
  logoutUser,
  MODALS,
  resetCartMergeSession,
  useI18n,
  useModals,
  useToast,
} from "@shared";
import clsx from "clsx";
import Cookies from "js-cookie";
import { usePathname, useRouter } from "next/navigation";
import React from "react";
import { useDispatch } from "react-redux";

import styles from "./AuthModal.module.scss";

const AuthModal = () => {
  const { t } = useI18n();
  const { isModalOpen, setIsModalOpen, isTxt } = useModals();
  const toast = useToast();
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();

  if (
    isModalOpen !== MODALS.LOGIN &&
    isModalOpen !== MODALS.RESET &&
    isModalOpen !== MODALS.REGISTRATION &&
    isModalOpen !== MODALS.TXTINFO &&
    isModalOpen !== MODALS.LOGOUT
  ) {
    return null;
  }

  const ModalClose = () => {
    setIsModalOpen(null);
  };

  const getLocaleFromPathname = () => {
    const seg = (pathname || "").split("/").filter(Boolean)[0];
    return seg === "en" || seg === "ua" ? seg : "ua";
  };

  const onTxtPrimaryAction = () => {
    setIsModalOpen(null);
    const token = Cookies.get("auth_token");
    const locale = getLocaleFromPathname();
    if (token) {
      router.push(localePath(locale, "/profile/info"));
    } else {
      router.push(localePath(locale));
    }
  };

  const onLogoutConfirm = async () => {
    try {
      await logoutUser();
    } catch {
      toast.error(t("auth.logoutError"));
    } finally {
      resetCartMergeSession();
      Cookies.remove("auth_token", { path: "/" });
      Cookies.remove("auth_id", { path: "/" });
      Cookies.remove("profile_id", { path: "/" });
      dispatch(clearCart());
      dispatch(clearWishlist());
      setIsModalOpen(null);
      router.push(`/${getLocaleFromPathname()}`);
      router.refresh();
    }
  };

  const isTxtInfo = isModalOpen === MODALS.TXTINFO;
  const isLogin = isModalOpen === MODALS.LOGIN;
  const isRegistration = isModalOpen === MODALS.REGISTRATION;
  const isReset = isModalOpen === MODALS.RESET;
  const isLogout = isModalOpen === MODALS.LOGOUT;

  return (
    <>
      <div
        className={styles.overlay}
        onClick={() => setIsModalOpen(null)}
      />

      <div
        className={clsx(
          styles.root,
          isTxtInfo && styles.rootTxtInfo,
          isLogin && styles.rootLogin,
          isRegistration && styles.rootRegistration,
          isReset && styles.rootReset,
          isLogout && styles.rootLogout,
        )}
      >
        <button
          type="button"
          className={styles.close}
          onClick={() => ModalClose()}
          aria-label={t("common.close")}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 15 15"
            fill="none"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M7.51252 8.9276L13.274 14.6891C13.4661 14.8746 13.7233 14.9773 13.9904 14.9749C14.2574 14.9726 14.5129 14.8655 14.7017 14.6767C14.8905 14.4878 14.9976 14.2324 15 13.9654C15.0023 13.6983 14.8996 13.441 14.7141 13.249L8.95263 7.48748L14.7141 1.72601C14.8996 1.53392 15.0023 1.27666 15 1.00962C14.9976 0.742579 14.8905 0.487135 14.7017 0.298303C14.5129 0.10947 14.2574 0.002359 13.9904 3.85008e-05C13.7233 -0.002282 13.4661 0.100374 13.274 0.285896L7.51252 6.04737L1.75104 0.285896C1.55809 0.10496 1.30232 0.00618954 1.03784 0.0104842C0.773359 0.0147789 0.520926 0.121802 0.333953 0.308907C0.14698 0.496013 0.0401356 0.748521 0.036028 1.013C0.0319205 1.27748 0.130872 1.53319 0.311944 1.72601L6.0724 7.48748L0.310926 13.249C0.213652 13.3429 0.136063 13.4553 0.0826862 13.5795C0.0293093 13.7038 0.00121358 13.8375 3.84544e-05 13.9727C-0.00113667 14.1079 0.0246321 14.242 0.0758416 14.3672C0.127051 14.4924 0.202676 14.6061 0.298302 14.7017C0.393929 14.7973 0.507643 14.8729 0.632809 14.9242C0.757975 14.9754 0.892086 15.0011 1.02732 15C1.16255 14.9988 1.29619 14.9707 1.42045 14.9173C1.54471 14.8639 1.65709 14.7863 1.75104 14.6891L7.51252 8.9276Z"
              fill="currentColor"
            />
          </svg>
        </button>

        {isModalOpen === MODALS.LOGOUT ? (
          <div className="auth-txt">
            <h4 className="auth-txt__title">{t("txt-modal.logout.title")}</h4>
            <p className="auth-txt__desc">{t("txt-modal.logout.desc")}</p>

            <div className="auth-txt__actions">
              <button
                className="auth-submit auth-submit--secondary"
                type="button"
                onClick={() => setIsModalOpen(null)}
              >
                {t("txt-modal.logout.btn")}
              </button>
              <button
                className="auth-submit red"
                type="button"
                onClick={onLogoutConfirm}
              >
                {t("txt-modal.logout.btn2")}
              </button>
            </div>
          </div>
        ) : isTxtInfo ? (
          <div className="auth-txt auth-txt--info">
            <h4 className="auth-txt__title">
              {isTxt?.title || t("txt-modal.reg.title")}
            </h4>
            <p className="auth-txt__desc">
              {isTxt?.description || t("txt-modal.reg.desc")}
            </p>
            {!isTxt?.hideBtn ? (
              <button
                className="auth-submit"
                type="button"
                onClick={onTxtPrimaryAction}
              >
                {isTxt?.btn || t("txt-modal.reg.btn")}
              </button>
            ) : null}
          </div>
        ) : (
          <>
            <h4>
              {isModalOpen === MODALS.REGISTRATION
                ? t("authorization.regTitle")
                : isModalOpen === MODALS.RESET
                  ? t("authorization.resetTitle")
                  : t("authorization.loginTitle")}
            </h4>

            {isModalOpen === MODALS.REGISTRATION ? (
              <RegForm />
            ) : isModalOpen === MODALS.RESET ? (
              <ResetForm />
            ) : (
              <LoginForm />
            )}

            <div className={styles.links}>
              {isModalOpen === MODALS.REGISTRATION ? (
                <p>
                  {t("authorization.alreadyHaveAccount")}{" "}
                  <b onClick={() => setIsModalOpen(MODALS.LOGIN)}>
                    {t("authorization.loginLink")}
                  </b>
                </p>
              ) : isModalOpen === MODALS.RESET ? (
                <p>
                  <b onClick={() => setIsModalOpen(MODALS.LOGIN)}>
                    {t("authorization.backToLogin")}
                  </b>
                </p>
              ) : (
                <p>
                  {t("authorization.noAccount")}{" "}
                  <b onClick={() => setIsModalOpen(MODALS.REGISTRATION)}>
                    {t("authorization.regLink")}
                  </b>
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default AuthModal;
