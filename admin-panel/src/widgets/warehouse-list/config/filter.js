import { useState } from 'react';

export const useWarehouseFilters = () => {
    // Встановлюємо тільки ті параметри, які є в документації
    const [filters] = useState([
        { 
            key: 'q', 
            type: 'input', 
            label: 'Пошук', 
            placeholder: 'Пошук за SKU...' 
        },
        { 
            key: 'available', 
            type: 'select', 
            label: 'Наявність', 
            options: [
                { label: 'Всі', value: '' },
                { label: 'Тільки в наявності', value: 'true' },
                { label: 'Немає в наявності', value: 'false' },
            ] 
        },
        { 
            key: 'priceMin', 
            type: 'input', 
            label: 'Ціна від', 
            placeholder: 'Мін.' 
        },
        { 
            key: 'priceMax', 
            type: 'input', 
            label: 'Ціна до', 
            placeholder: 'Макс.' 
        }
    ]);

    // Оскільки запитів до БД тут більше немає, useEffect не потрібен
    return filters;
};