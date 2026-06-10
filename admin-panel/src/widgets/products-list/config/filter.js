import { useState, useEffect } from 'react';
// Підстав правильний шлях до твоїх запитів
import { getAdminCategoriesTree } from '../../../shared/api/categories.services';
import { getStatusOptions } from '../../../shared/lib/statuses';
// Тимчасово приховуємо імпорт фільтрів з БД
// import { getAdminCatalogGroupFilters } from '../../../shared/api/products.services';

const PRODUCT_STATUS_OPTIONS = getStatusOptions(['active', 'draft', 'hidden'], { labelType: 'filter' });

export const useProductFilters = () => {
    // Базовий стейт
    const [filters, setFilters] = useState([
        { 
            key: 'status', 
            type: 'select', 
            label: 'Статус', 
            options: PRODUCT_STATUS_OPTIONS 
        },
        { 
            key: 'categoryId', 
            type: 'select', 
            label: 'Категорія', 
            options: [] 
        },
        { 
            key: 'available', 
            type: 'checkbox', 
            label: 'Наявність' ,
            options: [
                { label: 'Тільки в наявності', value: true },
                { label: 'Немає в наявності', value: false },
            ] 
        },
        { key: 'priceMin', type: 'input', label: 'Мін. ціна', placeholder: 'Від' },
        { key: 'priceMax', type: 'input', label: 'Макс. ціна', placeholder: 'До' }
    ]);

    useEffect(() => {
        const fetchFiltersData = async () => {
            try {
                // Виконуємо ТІЛЬКИ запит за категоріями
                const treeData = await getAdminCategoriesTree();
                
                // === 1. ОБРОБКА КАТЕГОРІЙ ===
                const categoriesArray = treeData?.items || treeData?.data || (Array.isArray(treeData) ? treeData : []);
                const categoryOptions = [];

                const walkTree = (nodes, depth = 0) => {
                    nodes.forEach((cat) => {
                        const categoryId = String(cat._id || cat.id || '');
                        if (!categoryId) return;

                        categoryOptions.push({
                            value: categoryId,
                            label: `${'— '.repeat(depth)}${cat.title?.ua || cat.name?.ua || cat.title || 'Без назви'}`
                        });

                        walkTree(cat.children || [], depth + 1);
                    });
                };

                walkTree(categoriesArray);

                // Збираємо базові масиви з уже підтягнутими категоріями
                const baseFilters = [
                    { key: 'status', type: 'select', label: 'Статус', options: PRODUCT_STATUS_OPTIONS },
                    { key: 'categoryId', type: 'select', label: 'Категорія', options: categoryOptions },
                    { key: 'available', type: 'checkbox', label: 'Наявність', options: [{ label: 'Тільки в наявності', value: true }, { label: 'Немає в наявності', value: false }] },
                    { key: 'priceMin', type: 'input', label: 'Мін. ціна', placeholder: 'Від' },
                    { key: 'priceMax', type: 'input', label: 'Макс. ціна', placeholder: 'До' }
                ];

                // Встановлюємо тільки базові фільтри
                setFilters(baseFilters);

            } catch (error) {
                console.error("Помилка завантаження даних для фільтрів:", error);
            }
        };

        fetchFiltersData();
    }, []);

    return filters;
};