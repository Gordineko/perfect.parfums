// В самом верху файла с API
const API_URL = (
  "https://worldofheels.com.ua/v1"
).trim();

export async function loginAdmin(credentials) {
    try {
        // Теперь используем общую константу API_URL
        const response = await fetch(`${API_URL}/staff/admin/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                login: credentials.email,
                password: credentials.password,
            }),
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error during admin login:", error);
        return { error: true, message: error.message };
    }
}

export async function getAdminArticles(params = {}) {
    try {
        // Используем ту же константу API_URL
        const queryParams = new URLSearchParams(params).toString();
        const url = `${API_URL}/articles${queryParams ? `?${queryParams}` : ''}`;
        
        const response = await fetch(url, { cache: 'no-store' });
        return await response.json();
    } catch (error) {
        console.error("Error fetching articles:", error);
        return { items: [], total: 0 };
    }
}