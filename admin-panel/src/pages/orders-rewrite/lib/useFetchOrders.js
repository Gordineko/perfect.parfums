import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getAdminOrderByNumber } from '../../../shared/api/orders.services'; // Вкажи правильний шлях

export const useFetchOrder = (pathIdentifier) => {
    const [order, setOrder] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const [searchParams] = useSearchParams();

    // Якщо передано 'create', значить ми створюємо нове замовлення
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
            setOrder(null);
            return;
        }

        const fetchOrder = async () => {
            setIsLoading(true);
            setError(null);

            try {
                // Отримуємо замовлення за номером
                const decodedNumber = decodeURIComponent(pathIdentifier);
                const data = await getAdminOrderByNumber(decodedNumber, queryParams); 

                if (data && data.item) {
                    setOrder(data.item);
                } else {
                    setError("Замовлення не знайдено");
                }
            } catch (err) {
                console.error("Помилка при завантаженні:", err);
                setError("Сталася помилка при завантаженні даних замовлення");
            } finally {
                setIsLoading(false);
            }
        };

        fetchOrder();
    }, [pathIdentifier, isCreateMode, queryParams]); 

    return { order, isLoading, error, isCreateMode };
};