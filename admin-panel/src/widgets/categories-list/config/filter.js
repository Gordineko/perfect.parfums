import { useState } from 'react';
import { getStatusOptions } from '../../../shared/lib/statuses';

export const useCategoryFilters = () => {
    const [filters] = useState([
        { 
            key: 'status', 
            type: 'select', 
            label: 'Статус',
            options: getStatusOptions(['active', 'hidden', 'draft'], { includeAll: true })
        }
    ]);

    return filters;
};