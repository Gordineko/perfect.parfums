export async function getAdminCatalogGroups(params = {}) {
    try {
        const apiUrl = process.env.REACT_APP_API_URL?.trim() || process.env.NEXT_PUBLIC_API_URL?.trim();
        if (!apiUrl) {
            return getDefaultEmptyResponse(params);
        }

        const queryParams = new URLSearchParams();

        // Динамически перебираем абсолютно все переданные параметры
        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined && value !== null) {
                let stringValue;
                if (typeof value === 'object') {
                    stringValue = JSON.stringify(value);
                } else {
                    stringValue = String(value);
                }
                queryParams.append(key, stringValue);
            }
        }

        const url = `${apiUrl}/catalog/admin/catalog/groups?${queryParams.toString()}`;

        const response = await fetch(url, {
            cache: 'no-store', // Для админки всегда отключаем кэш
        });

        if (!response.ok) {
            return getDefaultEmptyResponse(params);
        }

        const data = await response.json();
        return data;

    } catch (error) {
        console.error("Error fetching admin catalog groups:", error);
        return getDefaultEmptyResponse(params);
    }
}

// НОВИЙ ЗАПИТ: Отримання однієї групи товару за ID
export async function getAdminCatalogGroupById(groupId, params = {}) {
    if (!groupId) {
        console.error("Error: groupId is required to fetch an admin catalog group");
        return null;
    }

    try {
        const apiUrl = process.env.REACT_APP_API_URL?.trim() || process.env.NEXT_PUBLIC_API_URL?.trim();
        if (!apiUrl) {
            return null;
        }

        const queryParams = new URLSearchParams();

        // Додаємо query-параметри (includeOffers, offersPage, offersLimit)
        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined && value !== null) {
                let stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
                queryParams.append(key, stringValue);
            }
        }

        const queryString = queryParams.toString();
        const url = `${apiUrl}/catalog/admin/catalog/groups/${groupId}${queryString ? `?${queryString}` : ''}`;

        const response = await fetch(url, {
            cache: 'no-store', // Для адмінки завжди відключаємо кеш
        });

        if (!response.ok) {
            // Якщо статус 400 або 404, повертаємо null або можна додати обробку помилок
            console.error(`Failed to fetch group ${groupId}. Status: ${response.status}`);
            return null;
        }

        const data = await response.json();
        return data; // Поверне об'єкт { item: { ... } } згідно з вашою схемою

    } catch (error) {
        console.error(`Error fetching admin catalog group by ID (${groupId}):`, error);
        return null;
    }
}
// НОВИЙ ЗАПИТ: Отримання однієї групи товару за ID
export async function getAdminCatalogGroupVariationById(groupId, params = {}) {
    if (!groupId) {
        console.error("Error: groupId is required to fetch an admin catalog group");
        return null;
    }

    try {
        const apiUrl = process.env.REACT_APP_API_URL?.trim() || process.env.NEXT_PUBLIC_API_URL?.trim();
        if (!apiUrl) {
            return null;
        }

        const queryParams = new URLSearchParams();

        // Додаємо query-параметри (includeOffers, offersPage, offersLimit)
        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined && value !== null) {
                let stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
                queryParams.append(key, stringValue);
            }
        }

        const queryString = queryParams.toString();
        const url = `${apiUrl}/catalog/admin/catalog/groups/${groupId}/offers${queryString ? `?${queryString}` : ''}`;

        const response = await fetch(url, {
            cache: 'no-store', // Для адмінки завжди відключаємо кеш
        });

        if (!response.ok) {
            // Якщо статус 400 або 404, повертаємо null або можна додати обробку помилок
            console.error(`Failed to fetch group ${groupId}. Status: ${response.status}`);
            return null;
        }

        const data = await response.json();
        return data; // Поверне об'єкт { item: { ... } } згідно з вашою схемою

    } catch (error) {
        console.error(`Error fetching admin catalog group by ID (${groupId}):`, error);
        return null;
    }
}

export async function createAdminCatalogGroup(payload) {
    try {
        const apiUrl = process.env.REACT_APP_API_URL?.trim() || process.env.NEXT_PUBLIC_API_URL?.trim();
        if (!apiUrl) {
            throw new Error("API URL is not defined");
        }

        const url = `${apiUrl}/catalog/admin/catalog/groups`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Якщо ваша адмінка захищена токеном, розкоментуйте і додайте його сюди:
                // 'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        // Якщо сервер повернув помилку (наприклад, 400 Bad Request)
        if (!response.ok) {
            throw new Error(data.message || `Failed to create group. Status: ${response.status}`);
        }

        return data;

    } catch (error) {
        console.error("Error creating admin catalog group:", error);
        // Викидаємо помилку далі, щоб Formik міг її перехопити в `catch` і показати alert()
        throw error; 
    }
}
export async function updateAdminCatalogGroup(groupId, payload) {
    if (!groupId) {
        throw new Error("groupId is required for update");
    }

    try {
        const apiUrl = process.env.REACT_APP_API_URL?.trim() || process.env.NEXT_PUBLIC_API_URL?.trim();
        if (!apiUrl) {
            throw new Error("API URL is not defined");
        }

        const url = `${apiUrl}/catalog/admin/catalog/groups/${groupId}`;

        const response = await fetch(url, {
            method: 'PUT', // Используем PUT для полной перезаписи
            headers: {
                'Content-Type': 'application/json',
                // 'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || `Failed to update group. Status: ${response.status}`);
        }

        return data;

    } catch (error) {
        console.error(`Error updating admin catalog group (${groupId}):`, error);
        throw error;
    }
}

export async function patchAdminCatalogGroup(groupId, payload) {
    if (!groupId) {
        throw new Error("groupId is required for patch");
    }

    try {
        const apiUrl = process.env.REACT_APP_API_URL?.trim() || process.env.NEXT_PUBLIC_API_URL?.trim();
        if (!apiUrl) {
            throw new Error("API URL is not defined");
        }

        const url = `${apiUrl}/catalog/admin/catalog/groups/${groupId}`;

        const response = await fetch(url, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || `Failed to patch group. Status: ${response.status}`);
        }

        return data;

    } catch (error) {
        console.error(`Error patching admin catalog group (${groupId}):`, error);
        throw error;
    }
}

export async function createAdminCatalogOffer(groupId, payload) {
    if (!groupId) {
        throw new Error("groupId is required for offer creation");
    }

    try {
        const apiUrl = process.env.REACT_APP_API_URL?.trim() || process.env.NEXT_PUBLIC_API_URL?.trim();
        if (!apiUrl) {
            throw new Error("API URL is not defined");
        }

        const url = `${apiUrl}/catalog/admin/catalog/groups/${groupId}/offers`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || `Failed to create offer. Status: ${response.status}`);
        }

        return data;

    } catch (error) {
        console.error(`Error creating admin catalog offer for group (${groupId}):`, error);
        throw error;
    }
}

export async function patchAdminCatalogOffer(offerId, payload) {
    if (!offerId) {
        throw new Error("offerId is required for offer patch");
    }

    try {
        const apiUrl = process.env.REACT_APP_API_URL?.trim() || process.env.NEXT_PUBLIC_API_URL?.trim();
        if (!apiUrl) {
            throw new Error("API URL is not defined");
        }

        const url = `${apiUrl}/catalog/admin/catalog/offers/${offerId}`;

        const response = await fetch(url, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || `Failed to patch offer. Status: ${response.status}`);
        }

        return data;

    } catch (error) {
        console.error(`Error patching admin catalog offer (${offerId}):`, error);
        throw error;
    }
}

export async function patchAdminCatalogOfferAccessories(offerId, payload) {
    if (!offerId) {
        throw new Error("offerId is required for offer accessories patch");
    }

    try {
        const apiUrl = process.env.REACT_APP_API_URL?.trim() || process.env.NEXT_PUBLIC_API_URL?.trim();
        if (!apiUrl) {
            throw new Error("API URL is not defined");
        }

        const url = `${apiUrl}/catalog/admin/catalog/offers/${offerId}/accessories`;

        const response = await fetch(url, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || `Failed to patch offer accessories. Status: ${response.status}`);
        }

        return data;

    } catch (error) {
        console.error(`Error patching admin catalog offer accessories (${offerId}):`, error);
        throw error;
    }
}

export async function deleteAdminCatalogOffer(offerId) {
    if (!offerId) {
        throw new Error("offerId is required for offer delete");
    }

    try {
        const apiUrl = process.env.REACT_APP_API_URL?.trim() || process.env.NEXT_PUBLIC_API_URL?.trim();
        if (!apiUrl) {
            throw new Error("API URL is not defined");
        }

        const url = `${apiUrl}/catalog/admin/catalog/offers/${offerId}`;

        const response = await fetch(url, {
            method: 'DELETE',
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || `Failed to delete offer. Status: ${response.status}`);
        }

        return data;

    } catch (error) {
        console.error(`Error deleting admin catalog offer (${offerId}):`, error);
        throw error;
    }
}

export async function uploadAdminImages(files) {
    try {
        const apiUrl = process.env.REACT_APP_API_URL?.trim() || process.env.NEXT_PUBLIC_API_URL?.trim();
        if (!apiUrl) {
            throw new Error("API URL is not defined");
        }

        const url = `${apiUrl}/admin/uploads/images`;

        const uploadOne = async (file) => {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(url, {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `Failed to upload images. Status: ${response.status}`);
            }

            const uploadedFile = data?.file || null;

            return {
                ok: Boolean(data?.ok),
                file: uploadedFile,
                files: uploadedFile ? [uploadedFile] : [],
                data: uploadedFile ? [uploadedFile] : [],
                url: uploadedFile?.url || null,
            };
        };

        if (Array.isArray(files) || files instanceof FileList) {
            const uploadedItems = [];
            for (const file of Array.from(files)) {
                uploadedItems.push(await uploadOne(file));
            }

            const flatFiles = uploadedItems.flatMap((item) => item.files || []);
            return {
                ok: uploadedItems.every((item) => item.ok),
                files: flatFiles,
                data: flatFiles,
                url: flatFiles[0]?.url || null,
            };
        }

        return await uploadOne(files);

    } catch (error) {
        console.error("Error uploading admin images:", error);
        throw error;
    }
}

export async function uploadAdminVideo(file, { transcode = false } = {}) {
    try {
        const apiUrl = process.env.REACT_APP_API_URL?.trim() || process.env.NEXT_PUBLIC_API_URL?.trim();
        if (!apiUrl) {
            throw new Error("API URL is not defined");
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('transcode', transcode ? 'true' : 'false');

        const response = await fetch(`${apiUrl}/admin/uploads/videos`, {
            method: 'POST',
            body: formData,
        });

        const rawResponse = await response.text();
        let data = {};
        try {
            data = rawResponse ? JSON.parse(rawResponse) : {};
        } catch {
            data = {
                message: rawResponse || `Failed to upload video. Status: ${response.status}`,
            };
        }
        console.log('uploadAdminVideo raw backend response:', data);

        if (!response.ok) {
            throw new Error(data.message || `Failed to upload video. Status: ${response.status}`);
        }

        const uploadedFile = data?.file || null;

        return {
            ok: Boolean(data?.ok),
            file: uploadedFile,
            files: uploadedFile ? [uploadedFile] : [],
            data: uploadedFile ? [uploadedFile] : [],
            url: uploadedFile?.url || null,
        };
    } catch (error) {
        console.error("Error uploading admin video:", error);
        throw error;
    }
}

// НОВИЙ ЗАПИТ: Отримання доступних фільтрів для груп товарів
export async function getAdminCatalogGroupFilters(params = {}) {
    try {
        const apiUrl = process.env.REACT_APP_API_URL?.trim() || process.env.NEXT_PUBLIC_API_URL?.trim();
        if (!apiUrl) {
            console.error("API URL is not defined");
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
        const url = `${apiUrl}/catalog/admin/catalog/groups/filters${queryString ? `?${queryString}` : ''}`;

        const response = await fetch(url, {
            cache: 'no-store', // Відключаємо кеш для актуальних даних
        });

        if (!response.ok) {
            console.error(`Failed to fetch filters. Status: ${response.status}`);
            return null;
        }

        const data = await response.json();
        return data;

    } catch (error) {
        console.error("Error fetching admin catalog group filters:", error);
        return null;
    }
}

export const deleteAdminCatalogGroup = async (groupId) => {
    
    const response = await fetch(`${process.env.REACT_APP_API_URL}/catalog/admin/catalog/groups/${groupId}`, {
        method: 'DELETE',
        
    });

    if (!response.ok) {
        throw new Error('Помилка при видаленні товару');
    }

    return response.json(); // Поверне { "ok": true }
};


/**
 * Экспорт групп каталога и офферов в CSV
 * Поддерживает фильтры: q, status, categoryId, char, offerChar, opt, available, priceMin, priceMax
 */
export async function exportAdminCatalogGroupsCsv(params = {}) {
    try {
        const apiUrl = process.env.REACT_APP_API_URL?.trim() || process.env.NEXT_PUBLIC_API_URL?.trim();
        if (!apiUrl) {
            console.error("Error: API URL is not defined");
            return { error: true, message: "API URL is not defined" };
        }

        const queryParams = new URLSearchParams();

        // Динамически добавляем все переданные фильтры в запрос
        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined && value !== null && value !== '') {
                let stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
                queryParams.append(key, stringValue);
            }
        }

        const queryString = queryParams.toString();
        const url = `${apiUrl}/catalog/admin/catalog/groups/export.csv${queryString ? `?${queryString}` : ''}`;

        const response = await fetch(url, {
            method: 'GET',
            cache: 'no-store',
            // headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error(`Failed to export catalog groups. Status: ${response.status}`, errorData);
            return { error: true, ...errorData };
        }

        // Получаем бинарные данные (Blob)
        const blob = await response.blob();
        
        // Создаем ссылку для скачивания
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        
        // Генерируем имя файла: catalog_groups_2026-04-23.csv
        const date = new Date().toISOString().split('T')[0];
        link.setAttribute('download', `catalog_groups_${date}.csv`);
        
        document.body.appendChild(link);
        link.click();
        
        // Удаляем временные элементы
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);

        return { ok: true };

    } catch (error) {
        console.error("Error exporting admin catalog groups CSV:", error);
        return { error: true, message: error.message };
    }
}

function getDefaultEmptyResponse(params) {
    return {
        items: [],
        meta: {
            page: params.page || 1,
            limit: params.limit || 20,
            total: 0,
            pages: 0
        }
    };
}
