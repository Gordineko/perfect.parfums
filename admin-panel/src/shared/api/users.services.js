// shared/api/users.services.js

const getBaseUrl = () => {
    const apiUrl = process.env.REACT_APP_API_URL?.trim() || process.env.NEXT_PUBLIC_API_URL?.trim();
    if (!apiUrl) {
        console.error("Error: API URL is not defined");
    }
    return apiUrl;
};

// Вспомогательная функция для добавления токена авторизации
const getAuthHeaders = () => {
    // ВНИМАНИЕ: Замени 'token' на свой ключ из localStorage, если он называется иначе!
    const token = localStorage.getItem('token'); 
    
    const headers = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
};

const handleResponse = async (response) => {
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        throw new Error(`Ожидался JSON, но получено: ${text.substring(0, 50)}...`);
    }

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `API Error: Status ${response.status}`);
    }

    return response.json();
};

export const fetchAdminUsers = async (searchQuery = '') => {
    try {
        const apiUrl = getBaseUrl();
        if (!apiUrl) return [];

        const queryParams = new URLSearchParams();
        if (searchQuery) {
            queryParams.append('q', searchQuery);
        }
        queryParams.append('limit', '20');
        queryParams.append('status', 'active');

        const url = `${apiUrl}/iam/admin/users?${queryParams.toString()}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: getAuthHeaders(),
            cache: 'no-store',
        });

        const data = await handleResponse(response);
        return data || []; 

    } catch (error) {
        console.error("Ошибка при поиске пользователей:", error.message);
        return []; 
    }
};

export const fetchAdminUserById = async (id) => {
    try {
        const apiUrl = getBaseUrl();
        if (!apiUrl) return null;

        const response = await fetch(`${apiUrl}/iam/admin/users/${id}`, {
            method: 'GET',
            headers: getAuthHeaders(),
            cache: 'no-store',
        });

        return await handleResponse(response);
    } catch (error) {
        console.error(`Ошибка при получении пользователя ${id}:`, error.message);
        throw error;
    }
};

export const createAdminUser = async (userData) => {
    try {
        const apiUrl = getBaseUrl();
        if (!apiUrl) throw new Error("API URL is not defined");

        const response = await fetch(`${apiUrl}/iam/admin/users`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(userData),
        });

        return await handleResponse(response);
    } catch (error) {
        console.error("Ошибка при создании пользователя:", error.message);
        throw error;
    }
};

export const updateAdminUser = async (id, userData) => {
    try {
        const apiUrl = getBaseUrl();
        if (!apiUrl) throw new Error("API URL is not defined");

        const response = await fetch(`${apiUrl}/iam/admin/users/${id}`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify(userData),
        });

        return await handleResponse(response);
    } catch (error) {
        console.error(`Ошибка при обновлении пользователя ${id}:`, error.message);
        throw error;
    }
};

export const deleteAdminUser = async (id) => {
    try {
        const apiUrl = getBaseUrl();
        if (!apiUrl) throw new Error("API URL is not defined");

        const response = await fetch(`${apiUrl}/iam/admin/users/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
        });

        return await handleResponse(response);
    } catch (error) {
        console.error(`Ошибка при удалении пользователя ${id}:`, error.message);
        throw error;
    }
};

export const exportAdminUsersCsv = async (searchQuery = '') => {
    try {
        const apiUrl = getBaseUrl();
        if (!apiUrl) return;

        const queryParams = new URLSearchParams();
        if (searchQuery) {
            queryParams.append('q', searchQuery);
        }

        const url = `${apiUrl}/customers/admin/customers/export.csv?${queryParams.toString()}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                // Получаем токен, но Content-Type здесь не нужен, так как это GET
                'Authorization': getAuthHeaders()['Authorization']
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            // Если ошибка, пытаемся прочитать текст ошибки (обычно JSON)
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Ошибка экспорта: ${response.status}`);
        }

        // Получаем данные как Blob (Binary Large Object)
        const blob = await response.blob();
        
        // Создаем временную ссылку для скачивания
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        
        // Генерируем имя файла с текущей датой
        const date = new Date().toISOString().split('T')[0];
        link.setAttribute('download', `customers_export_${date}.csv`);
        
        document.body.appendChild(link);
        link.click();
        
        // Удаляем ссылку и освобождаем память
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);

        return { success: true };

    } catch (error) {
        console.error("Ошибка при экспорте пользователей в CSV:", error.message);
        throw error;
    }
};