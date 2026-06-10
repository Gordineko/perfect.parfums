import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import OrderForm from '../../features/orders-form/ui/OrdersForm'; // Вкажи правильний шлях
import { useFetchOrder } from './lib/useFetchOrders';

export default function OrderRewritePage() {
    const navigate = useNavigate();
    // Витягуємо orderNumber з URL. Якщо це створення, там буде слово "create"
    const { id: orderIdentifier } = useParams();
    const { order, isLoading, error, isCreateMode } = useFetchOrder(orderIdentifier);

    return (
        <>
            <section className="section-admin section-form for-order">
                <div className="section-form__header for-order">
                    <h2>{isCreateMode ? 'Створення замовлення' : `Редагування замовлення #${order?.orderNumber || ''}`}</h2>
                    <button onClick={() => navigate(-1)}>Повернутися</button>
                </div>

                <div className="section-form__content for-order">
                    {isLoading && <p>Завантаження...</p>}
                    {error && <p className="error-text">{error}</p>}

                    {!isLoading && !error && (
                        <OrderForm
                            type={isCreateMode ? 'create' : 'edit'}
                            initialData={order}
                        />
                    )}
                </div>
            </section>

            <button form="order-create-form" className="product-form__submit" type="submit">
                {order ? 'Зберегти зміни' : 'Створити замовлення'}
            </button>
        </>
    );
}