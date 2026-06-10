export async function getAdminOrders(params = {}) {
    try {
        const apiUrl = process.env.REACT_APP_API_URL?.trim() || process.env.NEXT_PUBLIC_API_URL?.trim();
        if (!apiUrl) {
            console.error("Error: API URL is not defined");
            return null; // или { items: [], meta: {} } в зависимости от логики вашего приложения
        }

        const queryParams = new URLSearchParams();

        // Динамически перебираем переданные параметры (q, status, payment, dateFrom, page, limit и т.д.)
        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined && value !== null && value !== '') {
                let stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
                queryParams.append(key, stringValue);
            }
        }

        const queryString = queryParams.toString();
        const url = `${apiUrl}/iam/admin/orders${queryString ? `?${queryString}` : ''}`;

        const response = await fetch(url, {
            cache: 'no-store', // Для админки всегда отключаем кеш
        });

        if (!response.ok) {
            console.error(`Failed to fetch orders. Status: ${response.status}`);
            return null;
        }

        const data = await response.json();
        return data;

    } catch (error) {
        console.error("Error fetching admin orders:", error);
        return null;
    }
}

export async function createAdminOrder(orderData) {
    try {
        const apiUrl = process.env.REACT_APP_API_URL?.trim() || process.env.NEXT_PUBLIC_API_URL?.trim();
        if (!apiUrl) {
            console.error("Error: API URL is not defined");
            return null;
        }

        const response = await fetch(`${apiUrl}/iam/admin/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // 'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(orderData),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error(`Failed to create order. Status: ${response.status}`, data);
            // Возвращаем флаг ошибки и саму ошибку, чтобы обработать в форме
            return { error: true, ...data }; 
        }

        return data; 

    } catch (error) {
        console.error("Error creating admin order:", error);
        return { error: true, message: error.message };
    }
}

export async function updateAdminOrder(orderId, orderData) {
    try {
        const apiUrl = process.env.REACT_APP_API_URL?.trim() || process.env.NEXT_PUBLIC_API_URL?.trim();
        if (!apiUrl) {
            console.error("Error: API URL is not defined");
            return null;
        }

        // Обратите внимание: согласно вашей документации, здесь используется метод PATCH
        const response = await fetch(`${apiUrl}/iam/admin/orders/${orderId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                // 'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(orderData),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error(`Failed to update order. Status: ${response.status}`, data);
            return { error: true, ...data };
        }

        return data; 

    } catch (error) {
        console.error("Error updating admin order:", error);
        return { error: true, message: error.message };
    }
}

export async function getAdminOrderByNumber(orderNumber, params = {}) {
    try {
        const apiUrl = process.env.REACT_APP_API_URL?.trim() || process.env.NEXT_PUBLIC_API_URL?.trim();
        if (!apiUrl) {
            console.error("Error: API URL is not defined");
            return null;
        }

        const queryParams = new URLSearchParams();

        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined && value !== null) {
                let stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
                queryParams.append(key, stringValue);
            }
        }

        const queryString = queryParams.toString();
        const url = `${apiUrl}/iam/admin/orders/by-number/${orderNumber}${queryString ? `?${queryString}` : ''}`;

        const response = await fetch(url, {
            cache: 'no-store',
        });

        if (!response.ok) {
            console.error(`Failed to fetch order by number. Status: ${response.status}`);
            return null;
        }

        const data = await response.json();
        return data;

    } catch (error) {
        console.error("Error fetching admin order by number:", error);
        return null;
    }
}

export async function deleteAdminOrderItem(orderId, itemIndex) {
    try {
        const apiUrl = process.env.REACT_APP_API_URL?.trim() || process.env.NEXT_PUBLIC_API_URL?.trim();
        if (!apiUrl) return null;

        const response = await fetch(`${apiUrl}/iam/admin/orders/${orderId}/items/${itemIndex}`, {
            method: 'DELETE',
            // headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();

        if (!response.ok) {
            console.error(`Failed to delete order item. Status: ${response.status}`, data);
            return { error: true, ...data };
        }

        return data; 

    } catch (error) {
        console.error("Error deleting order item:", error);
        return { error: true, message: error.message };
    }
}


export async function exportAdminOrdersCsv(params = {}) {
    try {
        const apiUrl = process.env.REACT_APP_API_URL?.trim() || process.env.NEXT_PUBLIC_API_URL?.trim();
        if (!apiUrl) {
            console.error("Error: API URL is not defined");
            return { error: true, message: "API URL is not defined" };
        }

        const queryParams = new URLSearchParams();

        // Динамически перебираем фильтры для экспорта
        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined && value !== null && value !== '') {
                // Если значение - дата или строка, приводим к строке
                let stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
                queryParams.append(key, stringValue);
            }
        }

        const queryString = queryParams.toString();
        const url = `${apiUrl}/iam/admin/orders/export.csv${queryString ? `?${queryString}` : ''}`;

        const response = await fetch(url, {
            method: 'GET',
            cache: 'no-store',
            // headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error(`Failed to export orders. Status: ${response.status}`, errorData);
            return { error: true, ...errorData };
        }

        // Получаем бинарные данные файла
        const blob = await response.blob();
        
        // Создаем ссылку в DOM и инициируем скачивание
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        
        // Генерируем имя файла: orders_export_2026-04-23.csv
        const date = new Date().toISOString().split('T')[0];
        link.setAttribute('download', `orders_export_${date}.csv`);
        
        document.body.appendChild(link);
        link.click();
        
        // Очистка ресурсов
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);

        return { ok: true };

    } catch (error) {
        console.error("Error exporting admin orders CSV:", error);
        return { error: true, message: error.message };
    }
}