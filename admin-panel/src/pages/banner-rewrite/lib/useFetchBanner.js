import { useState, useEffect } from 'react';
import { getAdminHomeBannerById } from '../../../shared/api/banners.services'; // Вкажи свій шлях

export const useFetchBanner = (idIdentifier) => {
    const [banner, setBanner] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Якщо передано 'create', значить ми створюємо новий банер
    const isCreateMode = idIdentifier === 'create' || !idIdentifier;

    useEffect(() => {
        if (isCreateMode) {
            setBanner(null);
            return;
        }

        const fetchBanner = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const data = await getAdminHomeBannerById(idIdentifier); 

                if (data && data.item) {
                    setBanner(data.item);
                } else {
                    setError("Банер не знайдено");
                }
            } catch (err) {
                console.error("Помилка при завантаженні:", err);
                setError("Сталася помилка при завантаженні даних");
            } finally {
                setIsLoading(false);
            }
        };

        fetchBanner();
    }, [idIdentifier, isCreateMode]); 

    return { banner, isLoading, error, isCreateMode };
};