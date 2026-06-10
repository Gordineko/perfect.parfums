// useUserForm.js
"use client"

import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { createAdminUser, updateAdminUser } from '../../../shared/api/users.services';
import toast from '../../../shared/lib/toast';

const formatPayload = (values) => ({
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    email: values.email.trim().toLowerCase(),
    phone: values.phone.trim(),
    status: values.status || "active",
    role: values.role || "user",
    deliveryProvince: values.delivery?.deliveryProvince || '',
    deliveryCity: values.delivery?.deliveryCity || '',
    deliveryPostOffice: values.delivery?.deliveryPostOffice || '',
});

export const useUserForm = (type, initialData) => {
    const navigate = useNavigate();

    const formik = useFormik({
        enableReinitialize: true,
        initialValues: {
            firstName: initialData?.firstName || '',
            lastName: initialData?.lastName || '',
            email: initialData?.email || '',
            phone: initialData?.phone || '',
            status: initialData?.status || 'active',
            role: initialData?.role || 'user',
            delivery: {
                deliveryMethod: 'NovaPoshta',
                deliveryProvince: initialData?.deliveryProvince || '',
                deliveryCity: initialData?.deliveryCity || '',
                deliveryPostOffice: initialData?.deliveryPostOffice || '',
            },
        },
        validationSchema: Yup.object({

            phone: Yup.string()
               
                .required("Обов'язкове поле"),
            status: Yup.string()
                .oneOf(['active', 'blocked', 'pending'])
                .required("Обов'язкове поле"),
            role: Yup.string()
                .required("Обов'язкове поле"),
        }),
        onSubmit: async (values) => {
            try {
                const payload = formatPayload(values);

                if (type === 'create') {
                    await createAdminUser(payload);
                    toast.success('Користувача успішно створено!');
                } else {
                    const userId = initialData?._id;
                    await updateAdminUser(userId, payload);
                    toast.success('Користувача успішно оновлено!');
                }

                navigate('/users');

            } catch (error) {
                console.error('Помилка при збереженні:', error);
                toast.error(error.message || 'Сталася помилка. Спробуйте ще раз.');
            }
        },
    });

    return formik;
};