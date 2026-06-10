"use client"

import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { handleProductFormSubmit } from '../model/useProductFormSubmit';
import { buildOfferAccessoriesPayload, normalizeAccessoryOfferId } from '../model/productFormHelpers';

const AXIS_TITLE_FALLBACKS = {
    variant: { ua: 'Варіант', en: 'Variant' },
    A1: { ua: 'Колір', en: 'Color' },
    A2: { ua: 'Розмір устілки', en: 'Insole size' },
    A3: { ua: 'Форма підборів', en: 'Heel shape' },
    A4: { ua: 'Висота підборів', en: 'Heel height' },
    A5: { ua: 'Тип підошви', en: 'Sole type' },
    A6: { ua: 'Розмір', en: 'Size' },
    A7: { ua: 'Матеріал', en: 'Material' },
};

const AXIS_META_FALLBACKS = {
    A2: { type: 'number', unit: 'cm' },
    A4: { type: 'number', unit: 'cm' },
};

const normalizePreset = (preset) => {
    if (preset && typeof preset === 'object') {
        const value = String(preset.value ?? '').trim();
        if (!value) return null;
        return {
            value,
            label: {
                ua: String(preset.label?.ua || preset.label || value).trim(),
                en: String(preset.label?.en || preset.label?.ua || preset.label || value).trim(),
            },
        };
    }

    const value = String(preset ?? '').trim();
    if (!value) return null;
    return {
        value,
        label: {
            ua: value,
            en: value,
        },
    };
};

const normalizeAxis = (axis = {}) => {
    const axisId = String(axis.axisId || '').trim();
    if (!axisId) return null;

    const titleFallback = AXIS_TITLE_FALLBACKS[axisId] || { ua: axisId, en: axisId };
    const metaFallback = AXIS_META_FALLBACKS[axisId] || {};
    const presetMap = new Map();

    (Array.isArray(axis.valuesPreset) ? axis.valuesPreset : []).forEach((preset) => {
        const normalized = normalizePreset(preset);
        if (!normalized) return;
        if (!presetMap.has(normalized.value)) {
            presetMap.set(normalized.value, normalized);
        }
    });

    return {
        axisId,
        title: {
            ua: String(axis.title?.ua || titleFallback.ua).trim(),
            en: String(axis.title?.en || axis.title?.ua || titleFallback.en).trim(),
        },
        type: axis.type || metaFallback.type || 'select',
        unit: axis.unit ?? metaFallback.unit ?? null,
        valuesPreset: [...presetMap.values()],
    };
};

const mergeVariationAxes = (...sources) => {
    const axisMap = new Map();

    sources.flat().forEach((rawAxis) => {
        const axis = normalizeAxis(rawAxis);
        if (!axis) return;

        const current = axisMap.get(axis.axisId);
        if (!current) {
            axisMap.set(axis.axisId, axis);
            return;
        }

        const presetMap = new Map(
            [...current.valuesPreset, ...axis.valuesPreset].map((preset) => [preset.value, preset])
        );

        axisMap.set(axis.axisId, {
            axisId: axis.axisId,
            title: {
                ua: current.title?.ua || axis.title?.ua || axis.axisId,
                en: current.title?.en || axis.title?.en || current.title?.ua || axis.title?.ua || axis.axisId,
            },
            type: current.type || axis.type || 'select',
            unit: current.unit ?? axis.unit ?? null,
            valuesPreset: [...presetMap.values()],
        });
    });

    return [...axisMap.values()];
};

const buildAxesFromOffers = (offers = []) => {
    const axisMap = new Map();

    offers.forEach((offer) => {
        Object.entries(offer?.optionMap || offer?.options || {}).forEach(([axisId, rawValue]) => {
            const normalizedAxis = normalizeAxis({
                axisId,
                valuesPreset: rawValue === undefined || rawValue === null || rawValue === '' ? [] : [rawValue],
            });
            if (!normalizedAxis) return;

            const current = axisMap.get(axisId);
            axisMap.set(axisId, mergeVariationAxes(current ? [current] : [], [normalizedAxis])[0]);
        });
    });

    return [...axisMap.values()];
};

const pruneUnusedOptionalAxes = (axes = [], offers = []) => {
    const usedAxisIds = new Set();

    offers.forEach((offer) => {
        Object.entries(offer?.optionMap || offer?.options || {}).forEach(([axisId, rawValue]) => {
            if (rawValue === undefined || rawValue === null || rawValue === '') return;
            usedAxisIds.add(String(axisId));
        });
    });

    return axes.filter((axis) => {
        const isOptionalEmptySelectAxis =
            axis?.type === 'select' &&
            (!Array.isArray(axis?.valuesPreset) || axis.valuesPreset.length === 0);

        if (!isOptionalEmptySelectAxis) return true;
        return usedAxisIds.has(String(axis.axisId));
    });
};

export const buildEffectiveVariationAxes = ({ initialData, variationsData, categoryAxes = [] }) => {
    return pruneUnusedOptionalAxes(mergeVariationAxes(
        initialData?.rootVariationTemplate || [],
        initialData?.variationTemplate || [],
        variationsData?.variationAxes || [],
        buildAxesFromOffers(variationsData?.items || []),
        categoryAxes || []
    ), variationsData?.items || []);
};

const DEFAULT_OFFER_STOCKS = [
    {
        warehouseId: '69c470e7475b219c3e3255a0',
        onHand: 10,
        reserved: 0,
    },
];

const normalizeOfferImage = (image) => (typeof image === 'string' ? image.trim() : '');
const normalizeOfferImages = (images) => {
    if (!Array.isArray(images)) return [];
    return images
        .map((image) => (typeof image === 'string' ? image.trim() : ''))
        .filter(Boolean)
        .slice(0, 5);
};
const normalizeGroupVideoUrl = (values = {}) => {
    const source = values || {};
    return normalizeOfferImage(source.videoURL ?? source.videoUrl ?? source.video);
};

const buildOfferComparableState = (offer = {}) => {
    const images = normalizeOfferImages(offer?.images);
    const fallbackImage = normalizeOfferImage(offer?.image ?? offer?.img);
    const accessoryPayload = buildOfferAccessoriesPayload(offer);

    return {
        sku: String(offer?.sku || '').trim(),
        price: Number(offer?.price),
        opt_price: offer?.opt_price == null || offer?.opt_price === '' ? null : Number(offer.opt_price),
        available: offer?.available ?? true,
        img: images[0] || fallbackImage,
        images: images.length ? images : (fallbackImage ? [fallbackImage] : []),
        video: normalizeOfferImage(offer?.video ?? offer?.videoUrl),
        optionMap: offer?.options || offer?.optionMap || {},
        accessories: accessoryPayload.accessories,
    };
};

const buildOfferCreatePayload = (offer = {}) => ({
    ...buildOfferComparableState(offer),
    stocks: Array.isArray(offer?.stocks) && offer.stocks.length ? offer.stocks : DEFAULT_OFFER_STOCKS,
    characteristics: Array.isArray(offer?.characteristics) ? offer.characteristics : [],
});

const buildOfferUpdatePayload = (offer = {}) => buildOfferComparableState(offer);

const areOffersEqual = (leftOffer, rightOffer) => (
    JSON.stringify(buildOfferComparableState(leftOffer)) === JSON.stringify(buildOfferComparableState(rightOffer))
);

const resolveGroupAccessoryOfferId = (offers = []) => {
    const accessoryIds = offers
        .map((offer) => normalizeAccessoryOfferId(offer))
        .filter(Boolean);

    if (!accessoryIds.length) return '';

    const uniqueIds = [...new Set(accessoryIds)];
    return uniqueIds.length === 1 ? uniqueIds[0] : '';
};

const formatPayload = (values) => {
    const effectiveAxes = mergeVariationAxes(
        values.variationAxes || [],
        buildAxesFromOffers(values.offers || [])
    );

    const categoryIds = Array.isArray(values.categoryIds)
        ? values.categoryIds.filter(Boolean)
        : [];

    return ({
    slug: values.slug,
    categoryIds,
    status: values.status || "active",
    imageURL: values.imageURL || "https://i.postimg.cc/8k2LRmzP/fallback.webp", 
    videoURL: normalizeGroupVideoUrl(values),
    title: values.title,
    subtitle: values.subtitle,
    description: values.description,
    sizeChart: {
        imageUrl: values.sizeChart?.imageUrl || ""
    },
    variationAxes: effectiveAxes.map(axis => ({
        axisId: axis.axisId,
        title: {
            ua: axis.title?.ua || "",
            en: axis.title?.en || ""
        },
        type: axis.type || "select",
        unit: axis.unit || null,
        valuesPreset: axis.valuesPreset || []
    })),
    characteristics: [],
    offers: values.offers.map((offer) => {
        const normalizedImages = normalizeOfferImages(offer.images);
        const fallbackImage = normalizeOfferImage(offer.image);
        const images = normalizedImages.length
            ? normalizedImages
            : (fallbackImage ? [fallbackImage] : []);

        return {
            ...(offer._id && { _id: offer._id }), 
            sku: offer.sku,
            price: Number(offer.price),
            opt_price: null,
            available: true,
            img: images[0] || '',
            images,
            video: normalizeOfferImage(offer.video),
            optionMap: offer.options || {},
            stocks: DEFAULT_OFFER_STOCKS,
            characteristics: []
        };
    })
    });
};

const buildGroupPatchPayload = (values) => ({
    slug: values.slug,
    categoryIds: values.categoryIds,
    status: values.status || "active",
    videoURL: normalizeGroupVideoUrl(values),
    title: values.title,
    subtitle: values.subtitle,
    description: values.description,
    sizeChart: {
        imageUrl: values.sizeChart?.imageUrl || ""
    },
});

export const useProductForm = (type, initialData, variationsData) => {
    const navigate = useNavigate();

    const defaultAxes = buildEffectiveVariationAxes({ initialData, variationsData });

    const defaultOffers = variationsData?.items?.length
        ? variationsData.items.map((offer) => {
            const normalizedImages = normalizeOfferImages(offer.images);
            const fallbackImage = normalizeOfferImage(offer.img);
            const images = normalizedImages.length
                ? normalizedImages
                : (fallbackImage ? [fallbackImage] : []);

            return {
                _id: offer._id,
                title: offer.optionKey || '',
                price: offer.price || '',
                sku: offer.sku || '',
                options: offer.optionMap || {},
                images,
                image: images[0] || '',
                video: normalizeOfferImage(offer.video),
                accessoryOfferId: normalizeAccessoryOfferId(offer),
            };
        })
        : [];
    const defaultGroupAccessoryOfferId = resolveGroupAccessoryOfferId(defaultOffers);

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
            categoryIds: Array.isArray(initialData?.categoryIds)
                ? initialData.categoryIds.map(id => String(id._id || id || '')).filter(Boolean)
                : [],
            status: initialData?.status || 'active',
            videoURL: normalizeGroupVideoUrl(initialData),
            sizeChart: {
                imageUrl: initialData?.sizeChart?.imageUrl || ''
            },
            variationAxes: defaultAxes,
            offers: defaultOffers,
            groupAccessoryOfferId: defaultGroupAccessoryOfferId,
        },
        validationSchema: Yup.object({
            slug: Yup.string()
                .matches(/^[a-z0-9-]+$/, 'Слаг може містити лише маленькі латинські літери, цифри та дефіс')
                .required("Обов'язкове поле"),
            title: Yup.object({
                ua: Yup.string().min(3, 'Мінімум 3 символи').required("Обов'язкове поле (UA)"),
                en: Yup.string().min(3, 'Мінімум 3 символи').required("Обов'язкове поле (EN)"),
            }),
            categoryIds: Yup.array()
                .of(Yup.string().required())
                .min(1, 'Виберіть хоча б одну категорію')
                .required('Виберіть хоча б одну категорію'),
            status: Yup.string().oneOf(['active', 'hidden', 'draft']).required("Обов'язкове поле"),
            subtitle: Yup.object({
                ua: Yup.string().max(200, 'Не більше 200 символів').required("Обов'язкове поле (UA)"),
                en: Yup.string().max(200, 'Не більше 200 символів').required("Обов'язкове поле (EN)"),
            }),
            description: Yup.object({
                ua: Yup.string().max(1000, 'Не більше 1000 символів').required("Обов'язкове поле (UA)"),
                en: Yup.string().max(1000, 'Не більше 1000 символів').required("Обов'язкове поле (EN)"),
            }),
            offers: Yup.array().of(
                Yup.object().shape({
                    price: Yup.number()
                        .typeError('Ціна має бути числом')
                        .required("Обов'язкове поле"),
                    sku: Yup.string().required('Введіть артикул'),
                })
            )
        }),
        onSubmit: async (values) => {
            await handleProductFormSubmit({
                type,
                values,
                initialData,
                variationsData,
                navigate,
                formatPayload,
                buildGroupPatchPayload,
                buildOfferCreatePayload,
                buildOfferUpdatePayload,
                areOffersEqual,
            });
        },
    });

    return formik;
};
