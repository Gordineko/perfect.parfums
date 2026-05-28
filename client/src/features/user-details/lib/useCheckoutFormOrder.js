"use client"
import { DELIVERY_TYPES } from '@features/user-details/const/delivery';
import { clearCartAsync, getCartData } from "@shared";
import { localePath } from "@shared/lib/localePath";
import { createAuthorizedCheckout,createGuestCheckout } from '@shared/api/orderServices';
import { MODALS } from '@shared/config/modals';
import { useI18n } from '@shared/i18n/use-i18n';
import { useModals } from '@shared/index';
import { useFormik } from 'formik';
import Cookies from 'js-cookie';
import { useParams, useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import * as Yup from 'yup';

export const useCheckoutFormOrder = (user, cartItems = []) => {
    const router = useRouter();
    const params = useParams();
    const locale = params?.locale ?? "ua";
    const { t } = useI18n();
    const dispatch = useDispatch();
    const { setIsModalOpen, setIsTxt } = useModals();

    const requiredFieldMessage = (fieldLabel) =>
        `Поле “${fieldLabel}” повинно бути заповнено`;

    const normalizeInitialPhone = () => {
        const raw = String(user?.phone || user?.customerPhone || "").trim();
        if (!raw) return "";
        if (raw === "+380" || raw === "380") return "";
        return raw;
    };

    const formik = useFormik({
        initialValues: {
            firstName: user?.firstName || '',
            lastName: user?.lastName || '',
            email: user?.email || user?.customerEmail || '',
            phone: normalizeInitialPhone(),
            deliveryType: DELIVERY_TYPES.NOVA_POSHTA_BRANCH,
            country: user?.deliveryCountry || '',
            paymentMethod: "cod",
            area: user?.deliveryProvince || '',
            city: user?.deliveryCity || '',
            warehouse: user?.deliveryPostOffice || '',
            promoCode: "",
            comment: "",
        },
        validationSchema: Yup.object({
            firstName: Yup.string().required(requiredFieldMessage("Ім’я")),
            lastName: Yup.string().required(requiredFieldMessage("Прізвище")),
            // email: Yup.string().email(t('authorization.validation.invalidEmail')).required(t('authorization.validation.required')),
            phone: Yup.string().required(requiredFieldMessage("Номер")),
            paymentMethod: Yup.string().required(requiredFieldMessage("Оплата")),
            country: Yup.string().when('deliveryType', {
                is: DELIVERY_TYPES.MEEST_BRANCH,
                then: () => Yup.string().required(requiredFieldMessage("Країна")),
            }),
            area: Yup.string().required(requiredFieldMessage("Область")),
            city: Yup.string().required(requiredFieldMessage("Місто")),
            warehouse: Yup.string().required(requiredFieldMessage("Відділення/поштомат")),
        }),
        onSubmit: async (values) => {
            formik.setStatus(undefined);
            try {
                const token = Cookies.get('auth_token');

                const commonPayload = {
                    firstName: values.firstName,
                    lastName: values.lastName,
                    middleName: "",
                    customerPhone: values.phone,
                    customerEmail: values.email,
                    deliveryProvince: values.area,
                    deliveryCity: values.city,
                    deliveryPostOffice: values.warehouse,
                    payment: values.paymentMethod,
                    installmentMonths: 0,
                    promoCode: (values.promoCode || "").trim(),
                    comment: (values.comment || "").trim(),
                };

                if (token || user) {
                    const authPayload = {
                        ...commonPayload,
                        useBonusBalance: 0,
                        useReferralBalance: 0,
                    };

                    await createAuthorizedCheckout(authPayload, token);
                    await dispatch(clearCartAsync()).unwrap();
                } else {
                    const guestPayload = {
                        ...commonPayload,
                        items: cartItems.map(item => ({
                            offerId: item._id,
                            qty: item.quantityInCart
                        }))
                    };

                    await createGuestCheckout(guestPayload);
                    await dispatch(clearCartAsync()).unwrap();
                }

                setIsTxt({
                    title: t("txt-modal.orderSuccess.title"),
                    description: t("txt-modal.orderSuccess.desc"),
                    hideBtn: true,
                });
                setIsModalOpen(MODALS.TXTINFO);

                await new Promise((resolve) => window.setTimeout(resolve, 4000));
                setIsModalOpen(null);
                router.push(localePath(locale));

            } catch (error) {
                const message =
                    (typeof error?.message === "string" && error.message.trim()) ||
                    t("checkout.orderCreateError");
                formik.setStatus({ submitError: message });
            }
        },
    });

    return formik;
};