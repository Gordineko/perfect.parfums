"use client";
import { getCartData, getWishlistData } from "@shared";
import { registerUser } from "@shared/api/authServices";
import { MODALS } from "@shared/config/modals";
import { useI18n } from "@shared/i18n/use-i18n";
import { useModals } from "@shared/index";
import { useFormik } from "formik";
import { useDispatch } from 'react-redux';
import * as Yup from 'yup';

export const useRegForm = () => {
     const dispatch = useDispatch();
    const { t } = useI18n();
    const { setIsModalOpen, setIsTxt } = useModals();

    const formik = useFormik({
        initialValues: {
            name: "",
            email: "",
            password: "",
            newsletter: false,
            terms: false,
        },
        validationSchema: Yup.object({
            name: Yup.string()
                .required(t("authorization.validation.required")),
            email: Yup.string()
                .email(t("authorization.validation.invalidEmail"))
                .required(t("authorization.validation.required")),
            password: Yup.string()
                .min(6, t("authorization.validation.minPassword"))
                .required(t("authorization.validation.required")),
            terms: Yup.boolean()
                .oneOf([true], t("authorization.validation.acceptTerms"))
                .required(t("authorization.validation.required")),
        }),
        onSubmit: async (values) => {
            try {
                formik.setStatus(undefined);
                await registerUser({
                    email: String(values.email || "").trim(),
                    password: values.password,
                    firstName: values.name,
                });
                 await dispatch(getCartData()).unwrap();
                 await dispatch(getWishlistData()).unwrap();
                setIsTxt({ title: t("txt-modal.reg.title"), description: t("txt-modal.reg.desc"), btn: t("txt-modal.reg.btn") })
                setIsModalOpen(MODALS.TXTINFO)
            
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
                    "Сталася помилка реєстрації. Спробуйте ще раз.";
                formik.setStatus({ submitError: message });
            }
        },
    });

    return formik;
};