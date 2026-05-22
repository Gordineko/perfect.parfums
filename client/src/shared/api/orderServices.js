export async function createAuthorizedCheckout(orderData,token) {
    try {
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/iam/checkout`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    // Если нужна авторизация, раскомментируйте строку ниже:
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(orderData),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            // Возвращаем сообщение об ошибке из API (например, "Cart is empty")
            throw new Error(data.message || "Failed to create checkout");
        }

        return data; // Возвращает объект созданного заказа
    } catch (e) {
        console.error("Error creating authorized checkout:", e);
        throw e;
    }
}export async function createGuestCheckout(guestOrderData) {
    try {
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/iam/guest-checkout`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(guestOrderData),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to create guest checkout");
        }

        return data;
    } catch (e) {
        console.error("Error creating guest checkout:", e);
        throw e;
    }
}

export async function getUserOrders(token) {
    try {
        if (!process.env.NEXT_PUBLIC_API_URL) {
            throw new Error("API URL is not defined");
        }

        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/iam/user/orders`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                // Рекомендуется для Next.js, если данные заказов часто меняются
                cache: 'no-store' 
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to fetch user orders");
        }

        return data; // Возвращает массив объектов заказов [ { _id, orderNumber, createdAt, ... }, ... ]
    } catch (e) {
        console.error("Error fetching user orders:", e);
        // Возвращаем пустой массив, чтобы не "ломать" .map() в компонентах
        return [];
    }
}