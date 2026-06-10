// ==========================================
// WAREHOUSES (Склады)
// ==========================================

export async function getAdminWarehouses(params = {}) {
    try {
        const apiUrl = process.env.REACT_APP_API_URL?.trim() || process.env.NEXT_PUBLIC_API_URL?.trim();
        if (!apiUrl) {
            console.error("Error: API URL is not defined");
            return { items: [], meta: {} };
        }

        const queryParams = new URLSearchParams();


        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined && value !== null) {
                let stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
                queryParams.append(key, stringValue);
            }
        }

        const queryString = queryParams.toString();
        const url = `${apiUrl}/inventory/admin/warehouses${queryString ? `?${queryString}` : ''}`;

        const response = await fetch(url, {
            cache: 'no-store', 
        });

        if (!response.ok) {
            console.error(`Failed to fetch warehouses. Status: ${response.status}`);
            return { items: [], meta: {} };
        }

        const data = await response.json();
        return data;

    } catch (error) {
        console.error("Error fetching admin warehouses:", error);
        return { items: [], meta: {} };
    }
}

export async function createAdminWarehouse(warehouseData) {
    try {
        const apiUrl = process.env.REACT_APP_API_URL?.trim() || process.env.NEXT_PUBLIC_API_URL?.trim();
        if (!apiUrl) {
            console.error("Error: API URL is not defined");
            return null;
        }

        const response = await fetch(`${apiUrl}/inventory/admin/warehouses`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                 
            },
            body: JSON.stringify(warehouseData),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error(`Failed to create warehouse. Status: ${response.status}`, data);
            return { error: true, ...data }; 
        }

        return data; 

    } catch (error) {
        console.error("Error creating admin warehouse:", error);
        return { error: true, message: error.message };
    }
}

export async function updateAdminWarehouse(warehouseId, warehouseData) {
    try {
        const apiUrl = process.env.REACT_APP_API_URL?.trim() || process.env.NEXT_PUBLIC_API_URL?.trim();
        if (!apiUrl) {
            console.error("Error: API URL is not defined");
            return null;
        }

     
        const response = await fetch(`${apiUrl}/inventory/admin/warehouses/${warehouseId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                
            },
            body: JSON.stringify(warehouseData),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error(`Failed to update warehouse. Status: ${response.status}`, data);
            return { error: true, ...data };
        }

        return data; 

    } catch (error) {
        console.error("Error updating admin warehouse:", error);
        return { error: true, message: error.message };
    }
}


// ==========================================
// INVENTORY OPERATIONS (Движение остатков)
// ==========================================

export async function intakeAdminInventory(intakeData) {
    try {
        const apiUrl = process.env.REACT_APP_API_URL?.trim() || process.env.NEXT_PUBLIC_API_URL?.trim();
        if (!apiUrl) {
            console.error("Error: API URL is not defined");
            return null;
        }

        const response = await fetch(`${apiUrl}/inventory/admin/inventory/intake`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                
            },
            body: JSON.stringify(intakeData),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error(`Failed to intake inventory. Status: ${response.status}`, data);
            return { error: true, ...data };
        }

        return data; 

    } catch (error) {
        console.error("Error during inventory intake:", error);
        return { error: true, message: error.message };
    }
}

export async function stocktakeAdminInventory(stocktakeData) {
    try {
        const apiUrl = process.env.REACT_APP_API_URL?.trim() || process.env.NEXT_PUBLIC_API_URL?.trim();
        if (!apiUrl) {
            console.error("Error: API URL is not defined");
            return null;
        }

        const response = await fetch(`${apiUrl}/inventory/admin/inventory/stocktake`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                
            },
            body: JSON.stringify(stocktakeData),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error(`Failed to stocktake inventory. Status: ${response.status}`, data);
            return { error: true, ...data };
        }

        return data;

    } catch (error) {
        console.error("Error during inventory stocktake:", error);
        return { error: true, message: error.message };
    }
}

export async function transferAdminInventory(transferData) {
    try {
        const apiUrl = process.env.REACT_APP_API_URL?.trim() || process.env.NEXT_PUBLIC_API_URL?.trim();
        if (!apiUrl) {
            console.error("Error: API URL is not defined");
            return null;
        }

        const response = await fetch(`${apiUrl}/inventory/admin/inventory/transfer`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                
            },
            body: JSON.stringify(transferData),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error(`Failed to transfer inventory. Status: ${response.status}`, data);
            return { error: true, ...data };
        }

        return data; 

    } catch (error) {
        console.error("Error during inventory transfer:", error);
        return { error: true, message: error.message };
    }
}

// ==========================================
// INVENTORY OFFERS (Остатки по офферам)
// ==========================================

export async function getAdminInventory(params = {}) {
    try {
        const apiUrl = process.env.REACT_APP_API_URL?.trim() || process.env.NEXT_PUBLIC_API_URL?.trim();
        if (!apiUrl) {
            console.error("Error: API URL is not defined");
            return { items: [], warehouses: [], meta: {} }; 
        }

        const queryParams = new URLSearchParams();

        // Динамически перебираем переданные параметры (q, priceMin, priceMax, available, page, limit)
        for (const [key, value] of Object.entries(params)) {
            // Игнорируем undefined, null и пустые строки, чтобы не засорять URL
            if (value !== undefined && value !== null && value !== '') {
                let stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
                queryParams.append(key, stringValue);
            }
        }

        const queryString = queryParams.toString();
        const url = `${apiUrl}/inventory/admin/inventory${queryString ? `?${queryString}` : ''}`;

        const response = await fetch(url, {
            cache: 'no-store', //
            
        });

        if (!response.ok) {
            console.error(`Failed to fetch inventory offers. Status: ${response.status}`);
            return { items: [], warehouses: [], meta: {} };
        }

        const data = await response.json();
        return data;

    } catch (error) {
        console.error("Error fetching admin inventory offers:", error);
        return { items: [], warehouses: [], meta: {} };
    }
}

export async function auditAdminInventory(auditData) {
    try {
        const apiUrl = process.env.REACT_APP_API_URL?.trim() || process.env.NEXT_PUBLIC_API_URL?.trim();
        
        // Шлях до ендпоінту інвентаризації зі скриншоту
        const response = await fetch(`${apiUrl}/inventory/admin/inventory/stocktake`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Тут може бути ваш токен авторизації
                // 'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(auditData),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error(`Помилка інвентаризації. Статус: ${response.status}`, data);
            return { error: true, ...data };
        }

        return data; 
    } catch (error) {
        console.error("Error during inventory audit:", error);
        return { error: true, message: error.message };
    }
}