import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getAdminCategoryByFullSlug } from '../../../shared/api/categories.services'; // Укажи правильный путь к API

export const useFetchCategory = (pathIdentifier) => {
    const [category, setCategory] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const [searchParams] = useSearchParams();

    // Если передан 'create', значит мы создаем новую категорию
    const isCreateMode = pathIdentifier === 'create';
    const queryString = searchParams.toString();

    const queryParams = useMemo(() => {
        const paramsObj = {};
        const params = new URLSearchParams(queryString);
        for (const [key, value] of params.entries()) {
            paramsObj[key] = value;
        }
        return paramsObj;
    }, [queryString]);

    useEffect(() => {
        if (isCreateMode || !pathIdentifier) {
            setCategory(null);
            return;
        }

        let isCurrent = true;

        const fetchCategory = async () => {
            setIsLoading(true);
            setError(null);

            try {
                // Если path передается через URL, его может потребоваться декодировать
                const decodedPath = decodeURIComponent(pathIdentifier);
                
                const data = await getAdminCategoryByFullSlug(decodedPath, queryParams); 

                if (!isCurrent) return;

                if (data && data.item) {
                    setCategory(data.item);
                } else {
                    setError("Категорію не знайдено");
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

        fetchCategory();

        return () => {
            isCurrent = false;
        };
    }, [pathIdentifier, isCreateMode, queryParams]); 

    return { category, isLoading, error, isCreateMode };
};
