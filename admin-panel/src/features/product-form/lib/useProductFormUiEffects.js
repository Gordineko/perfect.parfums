import { useCallback, useEffect, useMemo, useState } from 'react';
import { getAdminCategoriesTree } from '../../../shared/api/categories.services';
import { buildEffectiveVariationAxes } from './useProductForm';
import { generateSlug } from './generateSlug';
import { generateSku } from '../../bulk-offers-modal/lib/generateSku';
import { getAccessoryOptionLabel } from './useAccessoryOptions';
import { normalizeAccessoryOfferId } from '../model/productFormHelpers';

export function useCategoryOptions() {
    const [categoryOptions, setCategoryOptions] = useState([]);
    const [categoryMetaById, setCategoryMetaById] = useState({});

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const treeData = await getAdminCategoriesTree();
                const categoriesArray = treeData?.items || treeData?.data || (Array.isArray(treeData) ? treeData : []);

                const categoryMap = {};
                const formattedOptions = [];

                const walkTree = (nodes, depth = 0) => {
                    nodes.forEach((cat) => {
                        const categoryId = String(cat._id || cat.id || '');
                        if (!categoryId) return;

                        const title = cat.title?.ua || cat.name?.ua || cat.title || 'Без назви';

                        formattedOptions.push({
                            value: categoryId,
                            label: `${'— '.repeat(depth)}${title}`,
                        });

                        categoryMap[categoryId] = {
                            variationTemplate: Array.isArray(cat.variationTemplate) ? cat.variationTemplate : [],
                            rootVariationTemplate: Array.isArray(cat.rootVariationTemplate) ? cat.rootVariationTemplate : [],
                            isVariationTemplateOwner: Boolean(cat.isVariationTemplateOwner),
                        };

                        walkTree(cat.children || [], depth + 1);
                    });
                };

                walkTree(categoriesArray);
                setCategoryOptions(formattedOptions);
                setCategoryMetaById(categoryMap);
            } catch (error) {
                console.error('Помилка завантаження категорій:', error);
            }
        };

        fetchCategories();
    }, []);

    return {
        categoryOptions,
        categoryMetaById,
    };
}

export function useProductFormUiEffects({ formik, categoryMetaById, initialData, variationsData, offers }) {
    useEffect(() => {
        const selectedCategoryId = formik.values.categoryIds?.[0] || '';
        const selectedCategoryMeta = categoryMetaById[selectedCategoryId];

        if (!selectedCategoryId || !selectedCategoryMeta) return;

        const rawAxes = selectedCategoryMeta.rootVariationTemplate?.length
            ? selectedCategoryMeta.rootVariationTemplate
            : selectedCategoryMeta.variationTemplate || [];

        const normalizedAxes = buildEffectiveVariationAxes({
            initialData,
            variationsData,
            categoryAxes: Array.isArray(rawAxes) ? rawAxes : [],
        });

        const prevAxes = formik.values.variationAxes || [];
        if (JSON.stringify(prevAxes) !== JSON.stringify(normalizedAxes)) {
            formik.setFieldValue('variationAxes', normalizedAxes);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formik.values.categoryIds, categoryMetaById, initialData, variationsData]);

    useEffect(() => {
        const titleUa = formik.values.title?.ua;

        if (titleUa) {
            const newSlug = generateSlug(titleUa);
            formik.setFieldValue('slug', newSlug);
        } else if (!titleUa && !initialData?.slug) {
            formik.setFieldValue('slug', '');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formik.values.title?.ua]);

    useEffect(() => {
        const offersWithSku = (offers || []).map((offer, index) => {
            if (String(offer?.sku || '').trim()) {
                return offer;
            }

            const optionValues = Object.values(offer?.options || {});
            const baseTitle = formik.values.title?.ua || formik.values.title?.en || initialData?.title?.ua || initialData?.title?.en || 'product';

            return {
                ...offer,
                sku: generateSku(baseTitle, ...optionValues, index + 1),
            };
        });

        if (JSON.stringify(offersWithSku) !== JSON.stringify(offers)) {
            formik.setFieldValue('offers', offersWithSku, false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formik.values.title?.ua, formik.values.title?.en, offers, initialData?.title?.ua, initialData?.title?.en]);

    useEffect(() => {
        const accessoryIds = offers
            .map((offer) => normalizeAccessoryOfferId(offer))
            .filter(Boolean);

        const nextGroupAccessoryValue = accessoryIds.length
            ? ([...new Set(accessoryIds)].length === 1 ? accessoryIds[0] : '')
            : '';

        if ((formik.values.groupAccessoryOfferId || '') !== nextGroupAccessoryValue) {
            formik.setFieldValue('groupAccessoryOfferId', nextGroupAccessoryValue, false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [offers, formik.values.groupAccessoryOfferId]);
}

export function useAccessoryBindings({ loadedAccessoryOptions, offers, setFieldValue }) {
    const accessoryOptions = useMemo(() => {
        const optionMap = new Map((loadedAccessoryOptions || []).map((option) => [String(option.value || ''), option.label]));
        optionMap.set('', 'Без аксесуара');

        offers.forEach((offer) => {
            const accessoryOfferId = normalizeAccessoryOfferId(offer);
            if (!accessoryOfferId || optionMap.has(accessoryOfferId)) return;

            const firstAccessory = Array.isArray(offer?.accessories) ? offer.accessories[0] : null;
            optionMap.set(accessoryOfferId, getAccessoryOptionLabel(firstAccessory || { offerId: accessoryOfferId }));
        });

        return Array.from(optionMap, ([value, label]) => ({ value, label }));
    }, [loadedAccessoryOptions, offers]);

    const applyAccessoryToAllOffers = useCallback((accessoryOfferId) => {
        const normalizedAccessoryOfferId = String(accessoryOfferId || '').trim();
        setFieldValue('groupAccessoryOfferId', normalizedAccessoryOfferId);

        const nextOffers = (offers || []).map((offer) => ({
            ...offer,
            accessoryOfferId: normalizedAccessoryOfferId,
        }));

        setFieldValue('offers', nextOffers);
    }, [offers, setFieldValue]);

    return {
        accessoryOptions,
        applyAccessoryToAllOffers,
    };
}
