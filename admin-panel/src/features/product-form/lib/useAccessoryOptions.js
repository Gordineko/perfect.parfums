import { useEffect, useState } from 'react';
import { getAdminCatalogGroups, getAdminCatalogGroupVariationById, getAdminCatalogGroupById } from '../../../shared/api/products.services';

const accessoryOptionsCache = new Map();
const accessoryOptionsInFlight = new Map();

const getAccessoryOptionsCacheKey = (categoryId, searchQuery) => `${String(categoryId || '').trim()}::${String(searchQuery || '').trim().toLowerCase()}`;

// Вспомогательная функция для генерации label
export const getAccessoryOptionLabel = (accessory = {}) => {
    const groupTitle = accessory?.productGroup?.title?.ua
        || accessory?.productGroup?.title?.en
        || accessory?.groupTitle
        || '';
    const sku = accessory?.offer?.sku || accessory?.sku || '';

    if (groupTitle && sku) return `${groupTitle} (${sku})`;
    if (groupTitle) return groupTitle;
    if (sku) return sku;
    return String(accessory?.offerId || accessory?.offer?._id || '').trim();
};

// Хук для загрузки аксессуаров
export function useAccessoryOptions(ACCESSORY_CATEGORY_ID, accessorySearchQuery) {
    const [accessoryOptions, setAccessoryOptions] = useState([{ value: '', label: 'Без аксесуара' }]);
    const [isAccessorySearchLoading, setIsAccessorySearchLoading] = useState(false);

    useEffect(() => {
        let isCancelled = false;
        const normalizedSearchQuery = String(accessorySearchQuery || '').trim();
        const cacheKey = getAccessoryOptionsCacheKey(ACCESSORY_CATEGORY_ID, normalizedSearchQuery);

        const applyOptions = (nextOptions) => {
            if (!isCancelled) {
                setAccessoryOptions(nextOptions);
            }
        };

        const cachedOptions = accessoryOptionsCache.get(cacheKey);
        if (cachedOptions) {
            applyOptions(cachedOptions);
            setIsAccessorySearchLoading(false);
            return () => {
                isCancelled = true;
            };
        }

        const inFlightRequest = accessoryOptionsInFlight.get(cacheKey);
        if (inFlightRequest) {
            setIsAccessorySearchLoading(true);
            inFlightRequest.then(applyOptions).finally(() => {
                if (!isCancelled) setIsAccessorySearchLoading(false);
            });
            return () => {
                isCancelled = true;
            };
        }

        const loadAccessoryOptions = async (searchQuery) => {
            const nextOptionsMap = new Map();
            nextOptionsMap.set('', 'Без аксесуара');

            const addOption = (value, label) => {
                const normalizedValue = String(value || '').trim();
                if (!normalizedValue) return;
                if (!nextOptionsMap.has(normalizedValue)) {
                    nextOptionsMap.set(normalizedValue, label || normalizedValue);
                }
            };

            try {
                const queryParams = {
                    page: 1,
                    limit: 100,
                    categoryId: ACCESSORY_CATEGORY_ID,
                    q: searchQuery || undefined,
                };
                const result = await getAdminCatalogGroups(queryParams);
                const groups = result?.items || [];
                const normalizedSearchQuery = String(searchQuery || '').trim().toLowerCase();
                await Promise.all(
                    groups.map(async (group) => {
                        const groupId = String(group?.groupId || group?._id || '');
                        if (!groupId) return;
                        let offersResult = await getAdminCatalogGroupVariationById(groupId, {
                            page: 1,
                            limit: 100,
                            q: searchQuery || undefined,
                        });
                        let offerItems = offersResult?.items || offersResult?.item?.offers || [];
                        if (!offerItems.length && !searchQuery) {
                            const groupWithOffers = await getAdminCatalogGroupById(groupId, {
                                includeOffers: true,
                                offersPage: 1,
                                offersLimit: 100,
                            });
                            offerItems = groupWithOffers?.item?.offers || [];
                        }
                        offerItems.forEach((offer) => {
                            const offerId = String(offer?._id || '');
                            if (!offerId) return;
                            const optionLabel = getAccessoryOptionLabel({
                                offer,
                                productGroup: group,
                                offerId,
                            });
                            if (normalizedSearchQuery) {
                                const searchText = `${optionLabel} ${offer?.sku || ''} ${offer?.optionKey || ''}`.toLowerCase();
                                if (!searchText.includes(normalizedSearchQuery)) {
                                    return;
                                }
                            }
                            addOption(offerId, optionLabel);
                        });
                    })
                );
                return Array.from(nextOptionsMap, ([value, label]) => ({ value, label }));
            } catch (error) {
                return Array.from(nextOptionsMap, ([value, label]) => ({ value, label }));
            }
        };

        setIsAccessorySearchLoading(true);
        const requestPromise = loadAccessoryOptions(normalizedSearchQuery);
        accessoryOptionsInFlight.set(cacheKey, requestPromise);

        requestPromise
            .then((nextOptions) => {
                accessoryOptionsCache.set(cacheKey, nextOptions);
                applyOptions(nextOptions);
            })
            .finally(() => {
                accessoryOptionsInFlight.delete(cacheKey);
                if (!isCancelled) setIsAccessorySearchLoading(false);
            });

        return () => {
            isCancelled = true;
        };
    }, [ACCESSORY_CATEGORY_ID, accessorySearchQuery]);

    return { accessoryOptions, isAccessorySearchLoading };
}
