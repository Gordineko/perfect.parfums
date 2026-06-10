// ==========================================
// API для работы с отзывами в админке
// ==========================================

const getApiUrl = () => {
    const apiUrl = process.env.REACT_APP_API_URL?.trim() || process.env.NEXT_PUBLIC_API_URL?.trim();
    if (!apiUrl) {
        console.error("Error: API URL is not defined");
    }
    return apiUrl;
};

/**
 * Получить список отзывов (с пагинацией, поиском, фильтрами и сортировкой)
 * GET /reviews
 */
export async function getAdminReviews(params = {}) {
    try {
        const apiUrl = getApiUrl();
        if (!apiUrl) {
            return { items: [], total: 0, page: 1, limit: 20, totalPages: 0 };
        }

        const queryParams = new URLSearchParams();

        // Поддерживает reviewId, comment, q, productId, status,
        // isVisibleProduct, isVisibleMainPage, minRating, maxRating, page, limit, sort, select
        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined && value !== null && value !== '') {
                const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
                queryParams.append(key, stringValue);
            }
        }

        const queryString = queryParams.toString();
        const url = `${apiUrl}/reviews${queryString ? `?${queryString}` : ''}`;

        const response = await fetch(url, {
            cache: 'no-store',
        });

        if (!response.ok) {
            console.error(`Failed to fetch reviews. Status: ${response.status}`);
            return { items: [], total: 0, page: 1, limit: 20, totalPages: 0 };
        }

        return await response.json();
    } catch (error) {
        console.error("Error fetching admin reviews:", error);
        return { items: [], total: 0, page: 1, limit: 20, totalPages: 0 };
    }
}

/**
 * Создать новый отзыв
 * POST /reviews
 */
export async function createAdminReview(reviewData) {
    try {
        const apiUrl = getApiUrl();
        if (!apiUrl) {
            return null;
        }

        const response = await fetch(`${apiUrl}/reviews`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(reviewData),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error(`Failed to create review. Status: ${response.status}`, data);
            return { error: true, ...data };
        }

        return data;
    } catch (error) {
        console.error("Error creating admin review:", error);
        return { error: true, message: error.message };
    }
}

/**
 * Получить отзыв по id
 * GET /reviews/{id}
 */
export async function getAdminReviewById(reviewId) {
    try {
        const apiUrl = getApiUrl();
        if (!apiUrl) {
            return null;
        }

        const response = await fetch(`${apiUrl}/reviews/${reviewId}`, {
            cache: 'no-store',
        });

        if (!response.ok) {
            console.error(`Failed to fetch review by id. Status: ${response.status}`);
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error("Error fetching admin review by id:", error);
        return null;
    }
}

/**
 * Обновить отзыв (частичное обновление)
 * PATCH /reviews/{id}
 */
export async function updateAdminReview(reviewId, reviewData) {
    try {
        const apiUrl = getApiUrl();
        if (!apiUrl) {
            return null;
        }

        const response = await fetch(`${apiUrl}/reviews/${reviewId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(reviewData),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error(`Failed to update review. Status: ${response.status}`, data);
            return { error: true, ...data };
        }

        return data;
    } catch (error) {
        console.error("Error updating admin review:", error);
        return { error: true, message: error.message };
    }
}

/**
 * Удалить отзыв
 * DELETE /reviews/{id}
 */
export async function deleteAdminReview(reviewId) {
    try {
        const apiUrl = getApiUrl();
        if (!apiUrl) {
            return null;
        }

        const response = await fetch(`${apiUrl}/reviews/${reviewId}`, {
            method: 'DELETE',
        });

        const data = await response.json();

        if (!response.ok) {
            console.error(`Failed to delete review. Status: ${response.status}`, data);
            return { error: true, ...data };
        }

        return data;
    } catch (error) {
        console.error("Error deleting admin review:", error);
        return { error: true, message: error.message };
    }
}

/**
 * Отменить отзыв
 * POST /reviews/{id}/cancel
 */
export async function cancelAdminReview(reviewId) {
    try {
        const apiUrl = getApiUrl();
        if (!apiUrl) {
            return null;
        }

        const response = await fetch(`${apiUrl}/reviews/${reviewId}/cancel`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();

        if (!response.ok) {
            console.error(`Failed to cancel review. Status: ${response.status}`, data);
            return { error: true, ...data };
        }

        return data;
    } catch (error) {
        console.error("Error canceling admin review:", error);
        return { error: true, message: error.message };
    }
}