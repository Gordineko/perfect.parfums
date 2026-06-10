import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getAdminReviewById } from '../../../shared/api/reviews.services';

export const useFetchReview = (reviewId) => {
    const [review, setReview] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const [searchParams] = useSearchParams();
    const isCreateMode = reviewId === 'create';

    const queryParams = useMemo(() => {
        const paramsObj = {};
        for (const [key, value] of searchParams.entries()) {
            paramsObj[key] = value;
        }
        return paramsObj;
    }, [searchParams]);

    useEffect(() => {
        if (isCreateMode || !reviewId) {
            setReview(null);
            return;
        }

        const fetchReview = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const data = await getAdminReviewById(reviewId, queryParams);

                if (data) {
                    setReview(data.item || data);
                } else {
                    setError('Відгук не знайдено');
                }
            } catch (err) {
                console.error('Помилка при завантаженні відгуку:', err);
                setError('Сталася помилка при завантаженні даних');
            } finally {
                setIsLoading(false);
            }
        };

        fetchReview();
    }, [reviewId, isCreateMode, queryParams]);

    return { review, isLoading, error, isCreateMode };
};
