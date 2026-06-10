"use client"

import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { createAdminReview, updateAdminReview } from '../../../shared/api/reviews.services';
import toast from '../../../shared/lib/toast';

const formatPayload = (values) => ({
    name: (values.name || '').trim(),
    product: (values.product || '').trim() || null,
    photoUrl: (values.photoUrl || '').trim(),
    text: (values.text || '').trim(),
    rating: Number(values.rating) || 1,
    status: values.status || 'draft',
    position: Number(values.position) || 0,
    isVisibleProduct: Boolean(values.isVisibleProduct),
    isVisibleMainPage: Boolean(values.isVisibleMainPage),
});

export const useReviewForm = (type, initialData) => {
    const navigate = useNavigate();

    const formik = useFormik({
        enableReinitialize: true,
        initialValues: {
            name: initialData?.name || '',
            product: initialData?.product?._id || initialData?.product || '',
            photoUrl: initialData?.photoUrl || '',
            text: initialData?.text || '',
            rating: initialData?.rating ?? 5,
            status: initialData?.status || 'draft',
            position: initialData?.position ?? 0,
            isVisibleProduct: Boolean(initialData?.isVisibleProduct),
            isVisibleMainPage: Boolean(initialData?.isVisibleMainPage),
        },
        validationSchema: Yup.object({
            name: Yup.string().required("Обов'язкове поле"),
            product: type === 'create'
                ? Yup.string().required("Оберіть товар")
                : Yup.string().nullable(),
            text: Yup.string().required("Обов'язкове поле"),
            rating: Yup.number().min(1).max(5).required("Обов'язкове поле"),
            status: Yup.string().oneOf(['published', 'draft', 'archived']).required("Обов'язкове поле"),
            position: Yup.number().typeError('Має бути числом'),
        }),
        onSubmit: async (values) => {
            try {
                const payload = formatPayload(values);

                if (type === 'create') {
                    const response = await createAdminReview(payload);
                    if (response?.error) throw new Error(response.message || 'Помилка при створенні');
                    toast.success('Відгук успішно створено!');
                } else {
                    const reviewId = initialData?._id;
                    const response = await updateAdminReview(reviewId, payload);
                    if (response?.error) throw new Error(response.message || 'Помилка при оновленні');
                    toast.success('Відгук успішно оновлено!');
                }

                navigate('/reviews');
            } catch (error) {
                console.error('Помилка при збереженні відгуку:', error);
                toast.error(error.message || 'Сталася помилка. Спробуйте ще раз.');
            }
        },
    });

    return formik;
};
