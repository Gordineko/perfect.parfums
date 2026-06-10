// shared/ui/input-form/UserAutocomplete.jsx
import React, { useState, useEffect, useRef } from 'react';
import { fetchAdminUsers } from '../../../shared/api/users.services';

const UserAutocomplete = ({ label, onSelectUser, error, touched }) => {
    const [query, setQuery] = useState('');
    const [options, setOptions] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    const wrapperRef = useRef(null);

    // Закрытие выпадающего списка при клике вне компонента
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Поиск с Debounce (задержкой), чтобы не спамить API на каждую букву
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (query.trim().length > 1) {
                setIsLoading(true);
                const users = await fetchAdminUsers(query);
                console.log(users)
                setOptions(users);
                setIsOpen(true);
                setIsLoading(false);
            } else {
                setOptions([]);
                setIsOpen(false);
            }
        }, 500); // Задержка 500мс

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    const handleInputChange = (e) => {
        setQuery(e.target.value);
    };

    const handleSelect = (user) => {
        setQuery(user.name); // Показываем имя в инпуте после выбора
        setIsOpen(false);
        onSelectUser(user);  // Передаем весь объект пользователя наверх
    };

    return (
        // Используем комбинацию классов, чтобы подтянуть стили лейбла, инпута и позиционирования
        <div 
            className="custom-field custom-select-container" 
            ref={wrapperRef}
        >
            <label>{label}</label>
            <input
                type="text"
                value={query}
                onChange={handleInputChange}
                onFocus={() => options.length > 0 && setIsOpen(true)}
                placeholder="Почніть вводити email або ім'я..."
                className={error && touched ? 'input-error' : ''} 
            />
            
            {/* Отрисовка выпадающего списка стилизована под custom-select */}
            {isOpen && (
                <ul className="custom-select-list">
                    {isLoading && (
                        <li className="custom-select-item">Завантаження...</li>
                    )}
                    
                    {!isLoading && options.length === 0 && (
                        <li className="custom-select-item">Нічого не знайдено</li>
                    )}
                    
                    {!isLoading && options.map((user) => (
                        <li 
                            key={user._id} 
                            onClick={() => handleSelect(user)}
                            className="custom-select-item"
                        >
                            <strong>{user.name}</strong> <br/>
                            <span style={{ opacity: 0.7, fontSize: '10px' }}>{user.email}</span>
                        </li>
                    ))}
                </ul>
            )}
            
            {error && touched && <span className="error-message">{error}</span>}
        </div>
    );
};

export default UserAutocomplete;