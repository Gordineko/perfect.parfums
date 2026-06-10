import React, { useState, useRef, useEffect } from 'react';

export const CustomSelect = ({ label, value, options, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectRef = useRef(null);

    const selectedOption = options?.find(opt => opt.value === value);
    const displayValue = selectedOption ? selectedOption.label : 'Оберіть...';

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (selectRef.current && !selectRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (selectedValue) => {
        onChange(selectedValue);
        setIsOpen(false);
    };

    return (
        <div className="custom-field custom-select-container" ref={selectRef}>
            {label && <label>{label}</label>}

            <div
                className={`custom-select-header ${isOpen ? 'open' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={!value ? 'placeholder' : ''}>{displayValue}</span>
                <span className="custom-select-arrow">
                    {isOpen ? <svg xmlns="http://www.w3.org/2000/svg" width="6" height="3" viewBox="0 0 6 3" fill="none">
                        <path fillRule="evenodd" clipRule="evenodd" d="M3.33328 0.119281L6 2.42394L5.33344 3L3 0.983374L0.666562 3L0 2.42394L2.66672 0.119281C2.75512 0.0429053 2.875 0 3 0C3.125 0 3.24488 0.0429053 3.33328 0.119281Z" fill="currentColor" />
                    </svg> : <svg xmlns="http://www.w3.org/2000/svg" width="6" height="3" viewBox="0 0 6 3" fill="none">
                        <path fillRule="evenodd" clipRule="evenodd" d="M2.66672 2.88072L0 0.576062L0.666562 0L3 2.01663L5.33344 0L6 0.576062L3.33328 2.88072C3.24488 2.95709 3.125 3 3 3C2.875 3 2.75512 2.95709 2.66672 2.88072Z" fill="currentColor" />
                    </svg>}
                </span>
            </div>

            {isOpen && (
                <ul className="custom-select-list">
                    <li
                        className={`custom-select-item ${!value ? 'active' : ''}`}
                        onClick={() => handleSelect('')}
                    >
                        Оберіть...
                    </li>

                    {options?.map((opt) => (
                        <li
                            key={opt.value}
                            className={`custom-select-item ${value === opt.value ? 'active' : ''}`}
                            onClick={() => handleSelect(opt.value)}
                        >
                            {opt.label}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};