import { useState } from 'react';
import { BOOLEAN_VISIBILITY_OPTIONS } from '../../../shared/lib/statuses';

export const useBlogsFilters = () => {
    const [filters] = useState([
        { 
            key: 'isPublished', 
            type: 'select', 
            label: 'Статус',
            options: BOOLEAN_VISIBILITY_OPTIONS 
        }
    ]);

    return filters;
};