// ==========================================
// API для работы с баннерами главной страницы (Home Banners Admin)
// ==========================================

const getApiUrl = () => {
    const url = process.env.REACT_APP_API_URL?.trim() || process.env.NEXT_PUBLIC_API_URL?.trim();
    if (!url) {
        console.error("Error: API URL is not defined");
    }
    return url;
};

/**
 * Получить список баннеров (с поддержкой пагинации, поиска и фильтров)
 * GET /banner/admin/home-banners
 * @param {Object} params - Параметры запроса (page, limit, q, status)
 */
export async function getAdminHomeBanners(params = {}) {
    try {
        const apiUrl = getApiUrl();
        if (!apiUrl) return { items: [], meta: { total: 0 } };

        const queryParams = new URLSearchParams();

        // Динамически перебираем переданные параметры
        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined && value !== null && value !== '') {
                let stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
                queryParams.append(key, stringValue);
            }
        }

        const queryString = queryParams.toString();
        const url = `${apiUrl}/banner/admin/home-banners${queryString ? `?${queryString}` : ''}`;

        const response = await fetch(url, {
            cache: 'no-store', // Отключаем кеш для админки
        });

        if (!response.ok) {
            console.error(`Failed to fetch home banners. Status: ${response.status}`);
            return { items: [], meta: { total: 0 } };
        }

        return await response.json();

    } catch (error) {
        console.error("Error fetching home banners:", error);
        return { items: [], meta: { total: 0 } };
    }
}

/**
 * Получить баннер по ID
 * GET /banner/admin/home-banners/{id}
 * @param {string} id - ID баннера
 */
export async function getAdminHomeBannerById(id) {
    try {
        const apiUrl = getApiUrl();
        if (!apiUrl || !id) return null;

        const response = await fetch(`${apiUrl}/banner/admin/home-banners/${id}`, {
            cache: 'no-store',
        });

        if (!response.ok) {
            console.error(`Failed to fetch banner by id. Status: ${response.status}`);
            return null;
        }

        return await response.json(); // Возвращает { item: { ... } }

    } catch (error) {
        console.error("Error fetching banner by id:", error);
        return null;
    }
}

/**
 * Создать новый баннер
 * POST /banner/admin/home-banners
 * @param {Object} bannerData - Данные баннера
 */
export async function createAdminHomeBanner(bannerData) {
    try {
        const apiUrl = getApiUrl();
        if (!apiUrl) return null;

        const response = await fetch(`${apiUrl}/banner/admin/home-banners`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // 'Authorization': `Bearer ${token}` // Раскомментируйте, если нужна авторизация
            },
            body: JSON.stringify(bannerData),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error(`Failed to create banner. Status: ${response.status}`, data);
            return { error: true, ...data };
        }

        return data; // Возвращает { ok: true, item: { ... } }

    } catch (error) {
        console.error("Error creating banner:", error);
        return { error: true, message: error.message };
    }
}

/**
 * Обновить баннер (полное или частичное обновление в зависимости от API, используется PUT)
 * PUT /banner/admin/home-banners/{id}
 * @param {string} id - ID баннера
 * @param {Object} bannerData - Обновленные данные баннера
 */
export async function updateAdminHomeBanner(id, bannerData) {
    try {
        const apiUrl = getApiUrl();
        if (!apiUrl || !id) return null;

        const response = await fetch(`${apiUrl}/banner/admin/home-banners/${id}`, {
            method: 'PUT', // Согласно документации здесь PUT
            headers: {
                'Content-Type': 'application/json',
                // 'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(bannerData),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error(`Failed to update banner. Status: ${response.status}`, data);
            return { error: true, ...data };
        }

        return data; // Возвращает { ok: true, item: { ... } }

    } catch (error) {
        console.error("Error updating banner:", error);
        return { error: true, message: error.message };
    }
}

/**
 * Удалить баннер
 * DELETE /banner/admin/home-banners/{id}
 * @param {string} id - ID баннера
 */
export async function deleteAdminHomeBanner(id) {
    try {
        const apiUrl = getApiUrl();
        if (!apiUrl || !id) return null;

        const response = await fetch(`${apiUrl}/banner/admin/home-banners/${id}`, {
            method: 'DELETE',
            // headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();

        if (!response.ok) {
            console.error(`Failed to delete banner. Status: ${response.status}`, data);
            return { error: true, ...data };
        }

        return data; // Возвращает { ok: true }

    } catch (error) {
        console.error("Error deleting banner:", error);
        return { error: true, message: error.message };
    }
}