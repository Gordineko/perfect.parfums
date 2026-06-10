import React, { useState } from 'react'
import CatalogPagination from '../../../features/pagination'
import ProductItem from '../../../entities/product/ui/ProductItem'
import CustomSelect from '../../../shared/ui/filter/LimitSelect'
// Импортируем созданную функцию экспорта
import { exportAdminCatalogGroupsCsv } from '../../../shared/api/products.services' 
import toast from '../../../shared/lib/toast'

const ProductsList = ({ data, onDeleteClick }) => {
    const [isExporting, setIsExporting] = useState(false);
console.log(data, "products list data");
    const handleExportClick = async () => {
        if (isExporting) return;

        setIsExporting(true);
        try {
            /** * Если в этом компоненте есть доступ к текущим фильтрам 
             * (например, статус или категория), их стоит передать сюда 
             * как объект: exportAdminCatalogGroupsCsv(currentFilters)
             */
            const result = await exportAdminCatalogGroupsCsv();
            
            if (result?.error) {
                toast.error(`Помилка експорту: ${result.message || 'Невідома помилка'}`);
            }
        } catch (error) {
            console.error("CSV Export error:", error);
            toast.error("Не вдалося завантажити CSV файл");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className='admin-list'>
            <div className="admin-list__header">
                <p className="admin-list__header-info">
                    {data?.meta?.total || 0} товарів
                </p>
                <div className="admin-list__header-func">
                    <CustomSelect options={[24, 48, 72]} />
                    
                    <button 
                        onClick={handleExportClick} 
                        disabled={isExporting}
                        style={{ opacity: isExporting ? 0.7 : 1, cursor: isExporting ? 'not-allowed' : 'pointer' }}
                    >
                        {isExporting ? 'Завантаження...' : 'Експорт CSV'}
                    </button>
                </div>
            </div>

            <div className="admin-list__content">
                <ul className="admin-list__content-titles products-grid">
                    <li>Товар</li>
                    <li>Ціна</li>
                    <li>Склад</li>
                    <li>Категорія</li>
                    <li>Статус</li>
                    <li>Дія</li>
                </ul>
                <ul className="admin-list__content-items">
                    {console.log("ProductsList render with data:", data?.items)}
                    {data?.items?.length > 0 ? (
                        data.items.map((product) => (
                            <ProductItem
                                key={product.groupId}
                                product={product}
                                onDeleteClick={onDeleteClick} 
                            />
                        ))
                    ) : (
                        <li className="admin-list__empty">Товари не знайдено</li>
                    )}
                </ul>
            </div>

            <div className="admin-list__pagination">
                <CatalogPagination data={data?.meta} />
            </div>
        </div>
    )
}

export default ProductsList