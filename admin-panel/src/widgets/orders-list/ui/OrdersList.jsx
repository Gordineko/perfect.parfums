import React, { useState } from 'react'
import CatalogPagination from '../../../features/pagination'
import OrderItem from '../../../entities/order/ui/OrderItem'
import CustomSelect from '../../../shared/ui/filter/LimitSelect'
// Импортируем функцию из твоего API файла
import { exportAdminOrdersCsv } from '../../../shared/api/orders.services' 
import toast from '../../../shared/lib/toast'

const OrdersList = ({ data }) => {
    const [isExporting, setIsExporting] = useState(false);

    const handleExportCsv = async () => {
        if (isExporting) return;

        setIsExporting(true);
        try {
            // Если в будущем добавишь фильтры, передавай их сюда как объект
            const result = await exportAdminOrdersCsv();
            
            if (result?.error) {
                toast.error(`Помилка експорту: ${result.message || 'Не вдалося згенерувати файл'}`);
            }
        } catch (err) {
            console.error("Order export error:", err);
            toast.error("Сталася помилка при завантаженні CSV");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className='admin-list'>
            <div className="admin-list__header">
                <p className="admin-list__header-info">
                    {data?.meta?.total || data?.items?.length || 0} Замовлень
                </p>
                <div className="admin-list__header-func">
                    <CustomSelect options={[10, 20, 50]} />
                    
                    <button 
                        onClick={handleExportCsv}
                        disabled={isExporting}
                        className={isExporting ? 'loading' : ''}
                    >
                        {isExporting ? 'Завантаження...' : 'Експорт CSV'}
                    </button>
                </div>
            </div>

            <div className="admin-list__content">
                <ul className="admin-list__content-titles orders-grid">
                    <li>Замовлення</li>
                    <li>Час</li>
                    <li>Сума</li>
                    <li>Покупець</li>
                    <li>Доставка та оплата</li>
                    <li>Статус</li>
                    <li>Статус оплати</li>
                    <li>Дія</li>
                </ul>
                
                <ul className="admin-list__content-items">
                    {data?.items?.length > 0 ? (
                        data.items.map((order) => (
                            <OrderItem
                                key={order.id}
                                order={order}
                            />
                        ))
                    ) : (
                        <li className="admin-list__empty">Замовлення не знайдено</li>
                    )}
                </ul>
            </div>

            <div className="admin-list__pagination">
                <CatalogPagination data={data?.meta} />
            </div>
        </div>
    )
}

export default OrdersList