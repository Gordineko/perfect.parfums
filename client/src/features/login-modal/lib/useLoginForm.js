"use client";

import { getCartData, getWishlistData } from "@shared";
import { loginUser } from "@shared/api/authServices";
import { MODALS } from "@shared/config/modals";
import { useI18n } from "@shared/i18n/use-i18n";
import { useModals } from "@shared/index";
import { useFormik } from "formik";
import { useDispatch } from "react-redux";
import * as Yup from "yup";

export const useLoginForm = () => {
  const dispatch = useDispatch();
  const { t } = useI18n();
  const { setIsModalOpen, setIsTxt } = useModals();

  const formik = useFormik({
    initialValues: { email: "", password: "", rememberMe: false },
    validationSchema: Yup.object({
      email: Yup.string()
        .email(t("authorization.validation.invalidEmail"))
        .required(t("authorization.validation.required")),
      password: Yup.string().required(t("authorization.validation.required")),
    }),
    onSubmit: async (values) => {
      try {
        formik.setStatus(undefined);
        await loginUser({
          email: String(values.email || "").trim(),
          password: values.password,
          rememberMe: values.rememberMe,
        });

        await dispatch(getCartData()).unwrap();
        await dispatch(getWishlistData()).unwrap();
        setIsTxt({
          title: t("txt-modal.login.title"),
          description: t("txt-modal.login.desc"),
          btn: t("txt-modal.login.btn"),
        });
        setIsModalOpen(MODALS.TXTINFO);
      } catch (error) {
        const status = Number(error?.status);
        if (status === 401 || status === 403) {
          formik.setStatus({
            submitError: t("Auth.errors.invalidCredentials"),
          });
          return;
        }
        const message =
          (typeof error?.message === "string" && error.message.trim()) ||
          "Сталася помилка входу. Спробуйте ще раз.";
        formik.setStatus({ submitError: message });
      }
    },
  });

  return formik;
};
