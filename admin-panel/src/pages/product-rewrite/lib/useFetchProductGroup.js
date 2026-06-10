import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom'; // 1. Добавляем импорт
import { getAdminCatalogGroupById, getAdminCatalogGroupVariationById } from '../../../shared/api/products.services';

export const useFetchProductGroup = (id) => {
    const [productGroup, setProductGroup] = useState(null);
    const [productVariation, setProductVariation] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const [searchParams] = useSearchParams(); // 2. Достаем параметры из URL

    const isCreateMode = id === 'create';
    const queryString = searchParams.toString();

    // 3. Собираем все параметры из URL в объект
    const queryParams = useMemo(() => {
        const paramsObj = {};
        const params = new URLSearchParams(queryString);
        for (const [key, value] of params.entries()) {
            paramsObj[key] = value;
        }
        return paramsObj;
    }, [queryString]);

    useEffect(() => {
        if (isCreateMode || !id) {
            setProductGroup(null);
            setProductVariation(null);
            return;
        }

        let isCurrent = true;

        const fetchProductGroup = async () => {
            setIsLoading(true);
            setError(null);

            try {
                // Основная инфа группы (обычно ей пагинация не нужна, но если нужно — добавь queryParams)
                const data = await getAdminCatalogGroupById(id); 
                
                // 4. ПЕРЕДАЕМ ПАРАМЕТРЫ в запрос вариаций (офферов)
                const productData = await getAdminCatalogGroupVariationById(id, queryParams);

                if (!isCurrent) return;

                if (data && data.item) {
                    setProductGroup(data.item);
                }
                
                if (productData) {
                    setProductVariation(productData);
                } else {
                    setError("Варіації товару не знайдено");
                }
            } catch (err) {
                if (!isCurrent) return;
                console.error("Помилка при завантаженні:", err);
                setError("Сталася помилка при завантаженні даних");
            } finally {
                if (isCurrent) {
                    setIsLoading(false);
                }
            }
        };

        fetchProductGroup();

        return () => {
            isCurrent = false;
        };
    // 5. Добавляем queryParams в зависимости. Теперь при смене page или opt запрос улетит заново!
    }, [id, isCreateMode, queryParams]); 

    return { productGroup, productVariation, isLoading, error, isCreateMode };
};
