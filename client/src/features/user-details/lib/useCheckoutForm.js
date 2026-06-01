"use client"
import { updateProfile } from '@shared/api/authServices';
import { useI18n } from '@shared/i18n/use-i18n';
import { useFormik } from 'formik';
import Cookies from 'js-cookie';
import { useRouter } from "next/navigation";
import * as Yup from 'yup'; 

import { DELIVERY_TYPES } from '../const/delivery';

export const useCheckoutForm = (user, options = {}) => {
    const { profileSection } = options;

    const token = Cookies.get("auth_token");
    const { t } = useI18n();
    const router = useRouter();

    const requiredFieldMessage = (fieldLabel) =>
        `Поле “${fieldLabel}” повинно бути заповнено`;

    const getInitialEmail = () => {
        const email = (user?.email || user?.customerEmail || "").trim();
        return email.includes("@") ? email : "";
    };

    const getInitialPhone = () => {
        const phone = (user?.phone || user?.customerPhone || "").trim();
        return phone;
    };

    const formik = useFormik({
        initialValues: {
            firstName: user?.firstName || '',
            lastName: user?.lastName || '',
            email: getInitialEmail(),
            phone: getInitialPhone(),
            deliveryType: DELIVERY_TYPES.NOVA_POSHTA_BRANCH,
            country: user?.deliveryCountry || '',
            area: user?.deliveryProvince || '',
            city: user?.deliveryCity || '',
            warehouse: user?.deliveryPostOffice || ''
        },
        validationSchema: (() => {
            const personalFields = {
                firstName: Yup.string().required(requiredFieldMessage("Ім’я")),
                lastName: Yup.string().required(requiredFieldMessage("Прізвище")),
                email: Yup.string()
                    .email(t('validation.invalidEmail'))
                    .required(requiredFieldMessage("Email")),
                phone: Yup.string()
                    .required(requiredFieldMessage("Номер"))
                    .test("e164-phone", requiredFieldMessage("Номер"), (value) => {
                        const raw = String(value || "").trim();
                        const digits = raw.replace(/\D/g, "");
                        return raw.startsWith("+") && digits.length >= 10;
                    }),
            };

            const deliveryFields = {
                deliveryType: Yup.string().required(requiredFieldMessage("Спосіб доставки")),
                country: Yup.string().when('deliveryType', {
                    is: DELIVERY_TYPES.MEEST_BRANCH,
                    then: () => Yup.string().required(requiredFieldMessage("Країна"))
                }),
                area: Yup.string().when('deliveryType', {
                    is: (val) => val && val !== '',
                    then: () => Yup.string().required(requiredFieldMessage("Область"))
                }),
                city: Yup.string().when('area', {
                    is: (val) => val && val !== '',
                    then: () => Yup.string().required(requiredFieldMessage("Місто"))
                }),
                warehouse: Yup.string().when('city', {
                    is: (val) => val && val !== '',
                    then: () => Yup.string().required(requiredFieldMessage("Відділення/поштомат"))
                }),
            };

            if (profileSection === "personal") {
                return Yup.object(personalFields);
            }

            if (profileSection === "delivery") {
                return Yup.object(deliveryFields);
            }

            return Yup.object({ ...personalFields, ...deliveryFields });
        })(),
        onSubmit: async (values) => {
            formik.setStatus(undefined);
            const result = {
                firstName: values.firstName || "",
                lastName: values.lastName || "",
                email: values.email || "",
                phone: values.phone || "",
                deliveryProvince: values.area || "",
                deliveryCity: values.city || "",
                deliveryPostOffice: values.warehouse || "",
            }
            try {
                await updateProfile(token, result);
                formik.setStatus({ submitSuccess: t("profile.updateSuccess") });
                // router.refresh(); // debug: do not refresh to inspect PATCH payload/status in Network
            } catch (e) {
                const message =
                    (typeof e?.message === "string" && e.message.trim()) ||
                    t("profile.updateError");
                formik.setStatus({ submitError: message });
            }
        },
    });

    return formik;
};