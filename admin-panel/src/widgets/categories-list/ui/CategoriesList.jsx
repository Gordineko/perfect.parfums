import React, { useState } from 'react'
import CatalogPagination from '../../../features/pagination'
import ProductItem from '../../../entities/product/ui/ProductItem'
import CategoryItem from '../../../entities/category/ui/CategoryItem'
// Импортируй функцию (проверь путь к файлу api)
import { exportAdminCategoriesCsv } from '../../../shared/api/categories.services' 
import toast from '../../../shared/lib/toast'

const CategoriesList = ({ data }) => {
    const [isExporting, setIsExporting] = useState(false);

    const flattenCategories = (nodes = [], depth = 0) => {
        const result = [];
        nodes.forEach((node) => {
            result.push({ category: node, depth });
            if (Array.isArray(node.children) && node.children.length > 0) {
                result.push(...flattenCategories(node.children, depth + 1));
            }
        });
        return result;
    };

    const flatCategories = flattenCategories(data?.items || []);

    const handleExportCsv = async () => {
        if (isExporting) return;

        setIsExporting(true);
        try {
            // Можно передать { status: 'active' }, если нужен фильтр
            const result = await exportAdminCategoriesCsv();
            
            if (result?.error) {
                toast.error(`Помилка при експорті: ${result.message || 'Невідома помилка'}`);
            }
        } catch (err) {
            console.error("Export failed", err);
            toast.error("Сталася критична помилка при завантаженні файлу");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className='admin-list'>
            <div className="admin-list__header">
                <p className="admin-list__header-info">
                    {flatCategories.length} Категорій
                </p>
                <div className="admin-list__header-func">
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
                <ul className="admin-list__content-titles categories-grid">
                    <li>Назва</li>
                    <li>Назва (англ)</li>
                    <li>Видимість</li>
                    <li>Дія</li>
                </ul>
                <ul className="admin-list__content-items">
                    {flatCategories.length > 0 ? (
                        flatCategories.map(({ category, depth }) => (
                            <CategoryItem
                                key={category._id || category.id || category.slug}
                                category={category}
                                depth={depth}
                            />
                        ))
                    ) : (
                        <li className="admin-list__empty">Дані відсутні</li>
                    )}
                </ul>
            </div>
            
            <div className="admin-list__pagination">
                {/* <CatalogPagination data={data.meta} /> */}
            </div>
        </div>
    )
}

export default CategoriesList