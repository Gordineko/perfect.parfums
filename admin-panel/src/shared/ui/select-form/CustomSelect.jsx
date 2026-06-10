import React, { useState, useRef, useEffect, useMemo } from 'react';

const CustomSelect = ({
    options,
    value,
    onChange,
    onInputChange,
    placeholder,
    error,
    touched,
    onBlur,
    name,
    id,
    isDisabled = false,
    isMulti = false,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const selectRef = useRef(null);
    const hasError = Boolean(touched && error);

    const selectedOption = useMemo(() => 
        options.find(opt => opt.value === value), 
    [options, value]);

    const selectedOptions = useMemo(() => {
        if (!isMulti) return [];
        const selectedValues = Array.isArray(value) ? value : [];
        const filtered = options.filter((opt) => selectedValues.includes(opt.value));
        if (name === 'categoryIds' && filtered.length === 0 && selectedValues.length > 0) {
            console.log('CustomSelect - categoryIds mismatch detected:', { selectedValues, options: options.map(o => o.value) });
        }
        return filtered;
    }, [isMulti, options, value, name]);

    const getMultiDisplayValue = () => selectedOptions.map((opt) => opt.label).join(', ');

    // Синхронізуємо текст в інпуті з вибраним значенням при ініціалізації або зміні ззовні
    useEffect(() => {
        if (isMulti) {
            if (!isOpen) {
                setInputValue(getMultiDisplayValue());
            }
            return;
        }

        if (isOpen) {
            return;
        }

        if (selectedOption) {
            setInputValue(selectedOption.label);
        } else {
            setInputValue('');
        }
    }, [isMulti, selectedOption, selectedOptions, isOpen]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (selectRef.current && !selectRef.current.contains(event.target)) {
                setIsOpen(false);
                if (isMulti) {
                    setInputValue(getMultiDisplayValue());
                } else {
                    setInputValue(selectedOption ? selectedOption.label : '');
                }
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isMulti, selectedOption, selectedOptions]);

    const filteredOptions = useMemo(() => {
        if (isMulti) {
            if (!inputValue || inputValue === getMultiDisplayValue()) {
                return options;
            }

            return options.filter((option) =>
                option.label.toLowerCase().includes(inputValue.toLowerCase())
            );
        }

        // Якщо інпут порожній або текст збігається з вибраним — показуємо все
        if (!inputValue || (selectedOption && inputValue === selectedOption.label)) {
            return options;
        }
        return options.filter(option => 
            option.label.toLowerCase().includes(inputValue.toLowerCase())
        );
    }, [isMulti, options, inputValue, selectedOption, selectedOptions]);

    const handleInputChange = (e) => {
        if (isDisabled) return;
        const nextValue = e.target.value;
        setInputValue(nextValue);
        if (typeof onInputChange === 'function') {
            onInputChange(nextValue);
        }
        if (!isOpen) setIsOpen(true);
    };

    const handleOptionClick = (option) => {
        if (isDisabled) return;

        if (isMulti) {
            const selectedValues = Array.isArray(value) ? value : [];
            const isSelected = selectedValues.includes(option.value);
            const nextValues = isSelected
                ? selectedValues.filter((item) => item !== option.value)
                : [...selectedValues, option.value];

            onChange(nextValues);
            setInputValue('');
            return;
        }

        onChange(option.value);
        setInputValue(option.label);
        setIsOpen(false);
    };

    return (
        <div ref={selectRef} className={`custom-select-wrapper ${isOpen ? 'is-open' : ''} ${hasError ? 'has-error' : ''} ${isDisabled ? 'is-disabled' : ''}`}>
            <div className="custom-select-trigger-input-wrapper">
                <input
                    id={id}
                    name={name}
                    type="text"
                    className={`custom-select-input ${hasError ? 'error' : ''}`}
                    placeholder={placeholder}
                    value={inputValue}
                    onChange={handleInputChange}
                    onFocus={() => {
                        if (isDisabled) return;
                        if (isMulti) setInputValue('');
                        setIsOpen(true);
                    }}
                    onBlur={onBlur}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                        }
                    }}
                    disabled={isDisabled}
                />
                <svg 
                    className={`custom-select-icon ${isOpen ? 'rotated' : ''}`}
                    width="12" height="12" viewBox="0 0 24 24" fill="none" 
                    stroke="currentColor" strokeWidth="2"
                    onClick={() => !isDisabled && setIsOpen(!isOpen)}
                >
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </div>

            {isOpen && (
                <div className="custom-select-dropdown">
                    <div className="custom-select-options-list">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option) => (
                                <div
                                    key={option.value}
                                    className={`custom-select-option ${(isMulti ? (Array.isArray(value) && value.includes(option.value)) : value === option.value) ? 'selected' : ''}`}
                                    onClick={() => handleOptionClick(option)}
                                >
                                    {option.label}
                                </div>
                            ))
                        ) : (
                            <div className="custom-select-no-results">Нічого не знайдено</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomSelect;