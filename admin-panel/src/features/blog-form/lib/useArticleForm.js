"use client"

import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { createAdminArticle, updateAdminArticle } from '../../../shared/api/blogs.services'; 
import toast from '../../../shared/lib/toast';

const formatPayload = (values) => ({
    title: {
        ua: values.title?.ua || "",
        en: values.title?.en || ""
    },
    slug: values.slug,
    excerpt: {
        ua: values.excerpt?.ua || "",
        en: values.excerpt?.en || ""
    },
    body: {
        ua: values.body?.ua || "",
        en: values.body?.en || ""
    },
    cover: {
        url: values.cover?.url || "",
        alt: {
            ua: values.cover?.alt?.ua || "",
            en: values.cover?.alt?.en || ""
        }
    },
    isPublished: values.isPublished === 'true' || values.isPublished === true,
    // Перетворюємо рядок "тег1, тег2" на масив ["тег1", "тег2"]
    tags: typeof values.tags === 'string' 
        ? values.tags.split(',').map(tag => tag.trim()).filter(Boolean) 
        : values.tags,
    seo: {
        title: {
            ua: values.seo?.title?.ua || "",
            en: values.seo?.title?.en || ""
        },
        description: {
            ua: values.seo?.description?.ua || "",
            en: values.seo?.description?.en || ""
        }
    }
});

export const useArticleForm = (type, initialData) => {
    const navigate = useNavigate();

    const formik = useFormik({
        enableReinitialize: true,
        initialValues: {
            title: {
                ua: initialData?.title?.ua || '',
                en: initialData?.title?.en || ''
            },
            slug: initialData?.slug || '',
            excerpt: {
                ua: initialData?.excerpt?.ua || '',
                en: initialData?.excerpt?.en || ''
            },
            body: {
                ua: initialData?.body?.ua || '',
                en: initialData?.body?.en || ''
            },
            cover: {
                url: initialData?.cover?.url || '',
                alt: {
                    ua: initialData?.cover?.alt?.ua || '',
                    en: initialData?.cover?.alt?.en || ''
                }
            },
            isPublished: initialData?.isPublished !== undefined ? String(initialData.isPublished) : 'false',
            // Перетворюємо масив тегів у рядок для текстового інпуту
            tags: Array.isArray(initialData?.tags) ? initialData.tags.join(', ') : '',
            seo: {
                title: {
                    ua: initialData?.seo?.title?.ua || '',
                    en: initialData?.seo?.title?.en || ''
                },
                description: {
                    ua: initialData?.seo?.description?.ua || '',
                    en: initialData?.seo?.description?.en || ''
                }
            }
        },
        validationSchema: Yup.object({
            title: Yup.object({
                ua: Yup.string().min(2, 'Мінімум 2 символи').required("Обов'язкове поле (UA)"),
            }),
            slug: Yup.string()
                .matches(/^[a-z0-9-]+$/, 'Слаг може містити лише маленькі латинські літери, цифри та дефіс'),
            isPublished: Yup.string().required("Обов'язкове поле")
        }),
        onSubmit: async (values) => {
            try {
                const payload = formatPayload(values);
                
                if (type === 'create') {
                    const response = await createAdminArticle(payload);
                    if (response?.error) throw new Error(response.message || 'Помилка при створенні');
                    toast.success('Статтю успішно створено!');
                } else {
                    const articleIdOrSlug = initialData?._id || initialData?.slug; 
                    const response = await updateAdminArticle(articleIdOrSlug, payload);
                    if (response?.error) throw new Error(response.message || 'Помилка при оновленні');
                    toast.success('Статтю успішно оновлено!');
                }
                
                navigate('/blogs'); 

            } catch (error) {
                console.error('Помилка при збереженні:', error);
                toast.error(error.message || 'Сталася помилка. Спробуйте ще раз.');
            }
        },
    });

    return formik;
};