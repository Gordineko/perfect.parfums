// ==========================================
// API для работы со статьями (Блог)
// ==========================================

/**
 * Получить список статей (с поддержкой пагинации, поиска, фильтров и сортировки)
 * GET /articles
 */
export async function getAdminArticles(params = {}) {
    try {
        const apiUrl = process.env.REACT_APP_API_URL?.trim() || process.env.NEXT_PUBLIC_API_URL?.trim();
        if (!apiUrl) {
            console.error("Error: API URL is not defined");
            return { items: [], total: 0 };
        }

        const queryParams = new URLSearchParams();

        // Динамически перебираем переданные параметры (page, limit, q, sort, isPublished и т.д.)
        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined && value !== null) {
                let stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
                queryParams.append(key, stringValue);
            }
        }

        const queryString = queryParams.toString();
        const url = `${apiUrl}/articles${queryString ? `?${queryString}` : ''}`;

        const response = await fetch(url, {
            cache: 'no-store', // Отключаем кеш для админки/актуальных данных
        });

        if (!response.ok) {
            console.error(`Failed to fetch articles. Status: ${response.status}`);
            return { items: [], total: 0 };
        }

        return await response.json();

    } catch (error) {
        console.error("Error fetching articles:", error);
        return { items: [], total: 0 };
    }
}

/**
 * Создать новую статью
 * POST /articles
 */
export async function createAdminArticle(articleData) {
    try {
        const apiUrl = process.env.REACT_APP_API_URL?.trim() || process.env.NEXT_PUBLIC_API_URL?.trim();
        if (!apiUrl) {
            console.error("Error: API URL is not defined");
            return null;
        }

        const response = await fetch(`${apiUrl}/articles`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // 'Authorization': `Bearer ${token}` // Добавьте токен, если нужно
            },
            body: JSON.stringify(articleData),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error(`Failed to create article. Status: ${response.status}`, data);
            return { error: true, ...data }; 
        }

        return data; // Возвращает созданную статью

    } catch (error) {
        console.error("Error creating article:", error);
        return { error: true, message: error.message };
    }
}

/**
 * Обновить статью (частичное обновление)
 * PATCH /articles/{idOrSlug}
 */
export async function updateAdminArticle(idOrSlug, articleData) {
    try {
        const apiUrl = process.env.REACT_APP_API_URL?.trim() || process.env.NEXT_PUBLIC_API_URL?.trim();
        if (!apiUrl) {
            console.error("Error: API URL is not defined");
            return null;
        }

        const response = await fetch(`${apiUrl}/articles/${idOrSlug}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                // 'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(articleData),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error(`Failed to update article. Status: ${response.status}`, data);
            return { error: true, ...data };
        }

        return data; // Возвращает обновленную статью

    } catch (error) {
        console.error("Error updating article:", error);
        return { error: true, message: error.message };
    }
}

/**
 * Удалить статью
 * DELETE /articles/{id}
 */
export async function deleteAdminArticle(articleId) {
    try {
        const apiUrl = process.env.REACT_APP_API_URL?.trim() || process.env.NEXT_PUBLIC_API_URL?.trim();
        if (!apiUrl) {
            console.error("Error: API URL is not defined");
            return null;
        }

        const response = await fetch(`${apiUrl}/articles/${articleId}`, {
            method: 'DELETE',
            // headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();

        if (!response.ok) {
            console.error(`Failed to delete article. Status: ${response.status}`, data);
            return { error: true, ...data };
        }

        return data; // { ok: true }

    } catch (error) {
        console.error("Error deleting article:", error);
        return { error: true, message: error.message };
    }
}

// ==========================================
// Публичные эндпоинты
// ==========================================

/**
 * Получить опубликованную статью по slug (публичный доступ)
 * GET /articles/{slug}
 */
export async function getPublicArticleBySlug(slug) {
    try {
        const apiUrl = process.env.REACT_APP_API_URL?.trim() || process.env.NEXT_PUBLIC_API_URL?.trim();
        if (!apiUrl) {
            console.error("Error: API URL is not defined");
            return null;
        }

        // Для публичного метода кэширование можно настраивать в зависимости от нужд SEO (например: 'force-cache', 'no-store' или { next: { revalidate: 60 } })
        const response = await fetch(`${apiUrl}/articles/${slug}`, {
            cache: 'no-store', 
        });

        if (!response.ok) {
            if (response.status === 404) {
                console.warn(`Article with slug "${slug}" not found.`);
            } else {
                console.error(`Failed to fetch article by slug. Status: ${response.status}`);
            }
            return null;
        }

        return await response.json();

    } catch (error) {
        console.error("Error fetching public article by slug:", error);
        return null;
    }
}