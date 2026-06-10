import { useEffect, useState } from 'react';
import toast from '../../lib/toast';
import './toast.scss';

const ICONS = {
    success: '✓',
    error: '✕',
};

const DURATION = 4000;

const ToastContainer = () => {
    const [toasts, setToasts] = useState([]);

    useEffect(() => {
        const unsub = toast.subscribe((item) => {
            setToasts(prev => [...prev, item]);
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== item.id));
            }, DURATION);
        });
        return unsub;
    }, []);

    const dismiss = (id) => setToasts(prev => prev.filter(t => t.id !== id));

    if (!toasts.length) return null;

    return (
        <div className="toast-container">
            {toasts.map(t => (
                <div key={t.id} className={`toast toast--${t.type}`}>
                    <span className="toast__icon">{ICONS[t.type]}</span>
                    <span className="toast__message">{t.message}</span>
                    <button className="toast__close" onClick={() => dismiss(t.id)} aria-label="Закрити">×</button>
                </div>
            ))}
        </div>
    );
};

export default ToastContainer;
