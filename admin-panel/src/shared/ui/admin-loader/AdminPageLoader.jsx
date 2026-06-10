import React from 'react';
import { createPortal } from 'react-dom';

export default function AdminPageLoader({
    label = 'Завантаження...',
    fullScreen = false,
}) {
    const loader = (
        <div
            className={`admin-page-loader${fullScreen ? ' admin-page-loader--fullscreen' : ''}`}
            role="status"
            aria-live="polite"
            aria-busy="true"
        >
            <div className="admin-page-loader__mark">WOH</div>
            <div className="admin-page-loader__ring" aria-hidden="true" />
            <p className="admin-page-loader__label">{label}</p>
        </div>
    );

    if (fullScreen && typeof document !== 'undefined') {
        return createPortal(loader, document.body);
    }

    return loader;
}
