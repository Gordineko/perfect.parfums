import { useState } from 'react';
import { getStatusOptions } from '../../../shared/lib/statuses';

export const useReviewFilters = () => {
    const [filters] = useState([
        { 
            key: 'status', 
            type: 'checkbox', 
            label: 'Статуси',
            options: getStatusOptions(['published', 'draft', 'archived'])
        }
    ]);

    return filters;
};