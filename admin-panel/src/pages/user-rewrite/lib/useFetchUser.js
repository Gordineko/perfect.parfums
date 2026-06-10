import { useState, useEffect } from 'react';
import { fetchAdminUserById } from '../../../shared/api/users.services'; // Вкажи правильний шлях до API

export const useFetchUser = (userId) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Якщо передано 'create', значить ми створюємо нового користувача
    const isCreateMode = userId === 'create';

    useEffect(() => {
        if (isCreateMode || !userId) {
            setUser(null);
            return;
        }

        const fetchUser = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const data = await fetchAdminUserById(userId); 

                // Відштовхуючись від Swagger, API повертає об'єкт користувача напряму
                if (data && data._id) {
                    setUser(data);
                } else {
                    setError("Користувача не знайдено");
                }
            } catch (err) {
                console.error("Помилка при завантаженні:", err);
                setError("Сталася помилка при завантаженні даних");
            } finally {
                setIsLoading(false);
            }
        };

        fetchUser();
    }, [userId, isCreateMode]); 

    return { user, isLoading, error, isCreateMode };
};