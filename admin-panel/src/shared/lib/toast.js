// Simple event-bus toast — no external dependencies needed
// Usage: import toast from '../shared/lib/toast'
//        toast.success('Збережено!') | toast.error('Помилка!')

let _listeners = [];

const notify = (message, type) => {
    const id = Date.now() + Math.random();
    _listeners.forEach(fn => fn({ id, message, type }));
};

const toast = {
    success: (message) => notify(message, 'success'),
    error:   (message) => notify(message, 'error'),
    /** @returns {Function} unsubscribe */
    subscribe: (fn) => {
        _listeners.push(fn);
        return () => { _listeners = _listeners.filter(l => l !== fn); };
    },
};

export default toast;
