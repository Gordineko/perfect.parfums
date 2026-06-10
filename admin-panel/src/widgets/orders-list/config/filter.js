import { useState } from 'react';
import { getStatusOptions } from '../../../shared/lib/statuses';

export const useCategoryFilters = () => {
    const [filters] = useState([
        {
            key: 'status',
            type: 'select',
            label: 'Статус замовлення',
            options: getStatusOptions(['new', 'processing', 'shipped', 'delivered', 'cancelled'], { includeAll: true })
        },
        {
            key: 'paymentStatus',
            type: 'select',
            label: 'Статус оплати',
            options: getStatusOptions(['unpaid', 'pending', 'paid', 'partially_paid', 'failed', 'refunded', 'waiting_for_client', 'waiting_for_store_confirm'], { includeAll: true })
        }
    ]);

    return filters;
};