import React from "react";
import Select from "react-select";

export default function AdminAutoCompleteSelect({
    id,
    label,
    name,
    value,
    onChange,
    onBlur,
    disabled,
    options,
    error,
    touched,
    onSelectOption,
    placeholder
}) {
    const handleChange = (selectedOption) => {
        if (onSelectOption) {
            onSelectOption(selectedOption);
        } else {
            onChange({
                target: {
                    name,
                    value: selectedOption ? selectedOption.value : "",
                },
            });
        }
    };

    let selectedOption = options?.find((opt) => String(opt.value) === String(value));

    // Если опция не найдена, но у нас есть какое-то значение в форме
    if (!selectedOption && value) {
        // Проверяем: это похоже на ID (цифры или GUID) или это обычный текст?
        const isLikelyId = /^[0-9a-fA-F-]+$/.test(value); 
        
        selectedOption = { 
            value: value, 
            // Если это текст (Київ), просто показываем его! Иначе пишем загрузку.
            label: isLikelyId ? (options?.length ? "Оберіть зі списку..." : "Завантаження даних...") : value
        };
    }

    return (
        <div className="custom-select-wrapper form-group" style={{ width: '100%', marginBottom: '15px' }}>
            {label && (
                <label htmlFor={id} className="custom-select-label" style={{ display: 'block', marginBottom: '8px' }}>
                    {label}
                </label>
            )}
            <Select
                instanceId={id} 
                inputId={id}
                name={name}
                className="select-new-post"
                classNamePrefix="react-select"
                options={options || []}
                value={selectedOption || null}
                onChange={handleChange}
                onBlur={onBlur}
                isDisabled={!!disabled}
                placeholder={placeholder || "Оберіть..."}
                styles={{
                    control: (base, state) => ({
                        ...base,
                        borderRadius: "8px",
                        background: state.isDisabled ? "var(--color-border-soft)" : "var(--color-white)",
                        padding: "2px",
                        minHeight: "44px",
                        borderColor: state.isFocused ? "var(--color-sidebar-bg)" : "var(--color-border-soft)",
                        boxShadow: state.isFocused ? "0 0 0 1px var(--color-sidebar-bg)" : "none",
                        cursor: state.isDisabled ? "not-allowed" : "pointer",
                        "&:hover": { 
                            borderColor: state.isDisabled ? "var(--color-border-soft)" : "var(--color-sidebar-bg)",
                        },
                    }),
                    menu: (base) => ({
                        ...base,
                        borderRadius: "8px",
                        zIndex: 99999,
                        position: "absolute",
                    }),
                    option: (base, state) => ({
                        ...base,
                        backgroundColor: state.isSelected 
                            ? "var(--color-sidebar-bg)" 
                            : state.isFocused 
                                ? "var(--color-info-surface)" 
                                : "transparent",
                        color: state.isSelected ? "var(--color-white)" : "var(--color-text)",
                        cursor: "pointer",
                    }),
                }}
            />
            {error && touched && <div className="error-text" style={{ color: 'var(--color-danger)', fontSize: '12px', marginTop: '4px' }}>{error}</div>}
        </div>
    );
}