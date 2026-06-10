
export async function getAdminCategoriesTree(params = {}) {
    try {
        const apiUrl = process.env.REACT_APP_API_URL?.trim() || process.env.NEXT_PUBLIC_API_URL?.trim();
        if (!apiUrl) {
            console.error("Error: API URL is not defined");

            return [];
        }

        const queryParams = new URLSearchParams();

        // Динамічно перебираємо передані параметри
        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined && value !== null) {
                let stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
                queryParams.append(key, stringValue);
            }
        }

        const queryString = queryParams.toString();
        const url = `${apiUrl}/catalog/admin/categories/tree${queryString ? `?${queryString}` : ''}`;

        const response = await fetch(url, {
            cache: 'no-store', // Для адмінки завжди відключаємо кеш
        });

        if (!response.ok) {
            console.error(`Failed to fetch categories tree. Status: ${response.status}`);
            return [];
        }

        const data = await response.json();
        return data;

    } catch (error) {
        console.error("Error fetching admin categories tree:", error);
        return [];
    }
}

export async function getAdminCategoryByFullSlug(fullSlug, params = {}) {
    try {
        const apiUrl = process.env.REACT_APP_API_URL?.trim() || process.env.NEXT_PUBLIC_API_URL?.trim();
        if (!apiUrl) {
            console.error("Error: API URL is not defined");
            return null;
        }

        const queryParams = new URLSearchParams();

        // Обязательный параметр: по документации это fullSlug, а не slug
        if (fullSlug) {
            queryParams.append('fullSlug', fullSlug);
        }

        // Динамически перебираем остальные параметры (например, status)
        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined && value !== null) {
                let stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
                queryParams.append(key, stringValue);
            }
        }

        const queryString = queryParams.toString();
        const url = `${apiUrl}/catalog/admin/categories/by-fullslug${queryString ? `?${queryString}` : ''}`;

        const response = await fetch(url, {
            cache: 'no-store', // Для админки всегда отключаем кеш
        });

        if (!response.ok) {
            console.error(`Failed to fetch category by fullSlug. Status: ${response.status}`);
            return null;
        }

        const data = await response.json();
        return data;

    } catch (error) {
        console.error("Error fetching admin category by fullSlug:", error);
        return null;
    }
}
export async function createAdminCategory(categoryData) {
    try {
        const apiUrl = process.env.REACT_APP_API_URL?.trim() || process.env.NEXT_PUBLIC_API_URL?.trim();
        if (!apiUrl) {
            console.error("Error: API URL is not defined");
            return null;
        }

        const response = await fetch(`${apiUrl}/catalog/admin/categories`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // 'Authorization': `Bearer ${token}` // Раскомментируй и добавь токен, если эндпоинт защищен
            },
            body: JSON.stringify(categoryData),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error(`Failed to create category. Status: ${response.status}`, data);
            // Возвращаем флаг ошибки и саму ошибку, чтобы обработать в форме
            return { error: true, ...data }; 
        }

        return data; // { ok: true, item: { ... } }

    } catch (error) {
        console.error("Error creating admin category:", error);
        return { error: true, message: error.message };
    }
}

export async function updateAdminCategory(categoryId, categoryData) {
    try {
        const apiUrl = process.env.REACT_APP_API_URL?.trim() || process.env.NEXT_PUBLIC_API_URL?.trim();
        if (!apiUrl) {
            console.error("Error: API URL is not defined");
            return null;
        }

        const response = await fetch(`${apiUrl}/catalog/admin/categories/${categoryId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                // 'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(categoryData),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error(`Failed to update category. Status: ${response.status}`, data);
            return { error: true, ...data };
        }

        return data; // { ok: true, item: { ... } }

    } catch (error) {
        console.error("Error updating admin category:", error);
        return { error: true, message: error.message };
    }
}

export async function deleteAdminCategory(categoryId) {
    try {
        const apiUrl = process.env.REACT_APP_API_URL?.trim() || process.env.NEXT_PUBLIC_API_URL?.trim();
        if (!apiUrl) {
            console.error("Error: API URL is not defined");
            return null;
        }

        const response = await fetch(`${apiUrl}/catalog/admin/categories/${categoryId}`, {
            method: 'DELETE',
            // headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();

        if (!response.ok) {
            console.error(`Failed to delete category. Status: ${response.status}`, data);
            return { error: true, ...data };
        }

        return data; // { ok: true }

    } catch (error) {
        console.error("Error deleting admin category:", error);
        return { error: true, message: error.message };
    }
}
export async function exportAdminCategoriesCsv(params = {}) {
    try {
        const apiUrl = process.env.REACT_APP_API_URL?.trim() || process.env.NEXT_PUBLIC_API_URL?.trim();
        if (!apiUrl) {
            console.error("Error: API URL is not defined");
            return null;
        }

        const queryParams = new URLSearchParams();
        
        // Фильтр по статусу (active/hidden), если передан
        if (params.status) {
            queryParams.append('status', params.status);
        }

        const queryString = queryParams.toString();
        const url = `${apiUrl}/catalog/admin/categories/export.csv${queryString ? `?${queryString}` : ''}`;

        const response = await fetch(url, {
            method: 'GET',
            cache: 'no-store',
            // headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            // Если экспорт не удался, пробуем прочитать JSON с ошибкой
            const errorData = await response.json().catch(() => ({}));
            console.error(`Failed to export CSV. Status: ${response.status}`, errorData);
            return { error: true, ...errorData };
        }

        // Получаем данные как Blob (Binary Large Object)
        const blob = await response.blob();
        
        // Создаем временную ссылку для скачивания файла
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        
        // Формируем имя файла (можно добавить дату)
        link.setAttribute('download', `categories_export_${new Date().toISOString().split('T')[0]}.csv`);
        
        document.body.appendChild(link);
        link.click();
        
        // Очистка
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);

        return { ok: true };

    } catch (error) {
        console.error("Error exporting admin categories CSV:", error);
        return { error: true, message: error.message };
    }
}