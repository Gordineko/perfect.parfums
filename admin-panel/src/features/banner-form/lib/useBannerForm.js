"use client"

import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { createAdminHomeBanner, updateAdminHomeBanner } from '../../../shared/api/banners.services';
import toast from '../../../shared/lib/toast';

// Допоміжна функція для дати
const formatToISO = (dateString) => dateString ? new Date(dateString).toISOString() : null;

// Допоміжна функція для input type="datetime-local" (YYYY-MM-DDTHH:mm)
const formatDateForInput = (isoString) => isoString ? new Date(isoString).toISOString().slice(0, 16) : '';

const formatPayload = (values) => ({
    slug: values.slug || "",
    title: {
        ua: values.title?.ua || "",
        en: values.title?.en || ""
    },
    subtitle: {
        ua: values.subtitle?.ua || "",
        en: values.subtitle?.en || ""
    },
    description: {
        ua: values.description?.ua || "",
        en: values.description?.en || ""
    },
    imageURL: values.imageURL || "",
    mobileImageURL: values.mobileImageURL || "",
    buttonText: {
        ua: values.buttonText?.ua || "",
        en: values.buttonText?.en || ""
    },
    link: values.link || "",
    categoryId: values.categoryId || null,
    backgroundColor: values.backgroundColor || "",
    textColor: values.textColor || "",
    status: values.status || "active",
    position: Number(values.position) || 0,
    startsAt: formatToISO(values.startsAt),
    endsAt: formatToISO(values.endsAt)
});

export const useBannerForm = (type, initialData) => {
    const navigate = useNavigate();

    const formik = useFormik({
        enableReinitialize: true,
        initialValues: {
            slug: initialData?.slug || '',
            title: {
                ua: initialData?.title?.ua || '',
                en: initialData?.title?.en || ''
            },
            subtitle: {
                ua: initialData?.subtitle?.ua || '',
                en: initialData?.subtitle?.en || ''
            },
            description: {
                ua: initialData?.description?.ua || '',
                en: initialData?.description?.en || ''
            },
            imageURL: initialData?.imageURL || '',
            mobileImageURL: initialData?.mobileImageURL || '',
            buttonText: {
                ua: initialData?.buttonText?.ua || '',
                en: initialData?.buttonText?.en || ''
            },
            link: initialData?.link || '',
            categoryId: initialData?.categoryId || '',
            backgroundColor: initialData?.backgroundColor || '#ffffff',
            textColor: initialData?.textColor || '#000000',
            status: initialData?.status || 'active',
            position: initialData?.position !== undefined ? initialData.position : 0,
            startsAt: formatDateForInput(initialData?.startsAt),
            endsAt: formatDateForInput(initialData?.endsAt)
        },
        validationSchema: Yup.object({
            slug: Yup.string()
                .matches(/^[a-z0-9-]+$/, 'Слаг може містити лише маленькі латинські літери, цифри та дефіс')
                .required("Обов'язкове поле"),
            title: Yup.object({
                ua: Yup.string().required("Обов'язкове поле (UA)")
            }),
     
            status: Yup.string().oneOf(['active', 'hidden', 'draft']).required("Обов'язкове поле"),
            position: Yup.number().typeError('Має бути числом'),
        }),
        onSubmit: async (values) => {
            try {
                const payload = formatPayload(values);
                
                if (type === 'create') {
                    const response = await createAdminHomeBanner(payload);
                    if (response?.error) throw new Error(response.message || 'Помилка при створенні');
                    toast.success('Банер успішно створено!');
                } else {
                    const bannerId = initialData?._id || initialData?.id; 
                    const response = await updateAdminHomeBanner(bannerId, payload);
                    if (response?.error) throw new Error(response.message || 'Помилка при оновленні');
                    toast.success('Банер успішно оновлено!');
                }
                
                navigate('/banners'); 

            } catch (error) {
                console.error('Помилка при збереженні:', error);
                toast.error(error.message || 'Сталася помилка. Спробуйте ще раз.');
            }
        },
    });

    return formik;
};