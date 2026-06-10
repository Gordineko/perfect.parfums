import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

const CustomSelect = ({ options, queryKey = 'limit', defaultValue, resetPageOnChange = true }) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const defaultOptions = [10, 20, 50, 100];
    const optionsToUse = options || defaultOptions;

    const normalizedOptions = optionsToUse.map((option) => {
        if (typeof option === 'object' && option !== null) {
            const value = String(option.value ?? '');
            return {
                value,
                label: option.label || value,
            };
        }

        const value = String(option);
        const label = queryKey === 'limit' ? `${value} на сторінці` : value;
        return { value, label };
    });

    const fallbackValue = String(defaultValue ?? normalizedOptions[0]?.value ?? '');
    const currentValue = searchParams.get(queryKey) || fallbackValue;
    const currentOption = normalizedOptions.find((option) => option.value === currentValue) || normalizedOptions[0];
    
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (value) => {
        const newParams = new URLSearchParams(searchParams);

        if (value === '' || value === undefined || value === null) {
            newParams.delete(queryKey);
        } else {
            newParams.set(queryKey, String(value));
        }

        if (resetPageOnChange) {
            newParams.set('page', '1');
        }

        setSearchParams(newParams);
        setIsOpen(false);
    };

    return (
        <div className="custom-select" ref={dropdownRef}>
            <div 
                className={`custom-select__trigger ${isOpen ? 'open' : ''}`} 
                onClick={() => setIsOpen(!isOpen)}
            >
                <span>{currentOption?.label || ''}</span>
                <svg className="arrow-icon" width="10" height="6" viewBox="0 0 10 6" fill="none">
                    <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            </div>

            {isOpen && (
                <ul className="custom-select__options">
                    {normalizedOptions.map((option) => (
                        <li 
                            key={option.value} 
                            className={`custom-select__option ${currentValue === option.value ? 'selected' : ''}`}
                            onClick={() => handleSelect(option.value)}
                        >
                            {option.label}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default CustomSelect;