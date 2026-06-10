import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getPublicArticleBySlug } from '../../../shared/api/blogs.services'; // Або getAdminArticleByIdOrSlug, якщо є

export const useFetchArticle = (pathIdentifier) => {
    const [article, setArticle] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchParams] = useSearchParams();

    const isCreateMode = pathIdentifier === 'create';

    const queryParams = useMemo(() => {
        const paramsObj = {};
        for (const [key, value] of searchParams.entries()) {
            paramsObj[key] = value;
        }
        return paramsObj;
    }, [searchParams]);

    useEffect(() => {
        if (isCreateMode || !pathIdentifier) {
            setArticle(null);
            return;
        }

        const fetchArticle = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const decodedPath = decodeURIComponent(pathIdentifier);
                // Заміни на правильну API-функцію для отримання статті
                const data = await getPublicArticleBySlug(decodedPath, queryParams); 

                // Перевіряй структуру, яку повертає API. Якщо повертає саму статтю, то просто data
                if (data) {
                    // Якщо бекенд повертає об'єкт статті напряму, використовуємо data (або data.item, якщо є обгортка)
                    setArticle(data.item || data);
                } else {
                    setError("Статтю не знайдено");
                }
            } catch (err) {
                console.error("Помилка при завантаженні:", err);
                setError("Сталася помилка при завантаженні даних");
            } finally {
                setIsLoading(false);
            }
        };

        fetchArticle();
    }, [pathIdentifier, isCreateMode, queryParams]); 

    return { article, isLoading, error, isCreateMode };
};