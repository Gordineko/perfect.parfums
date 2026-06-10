import React from 'react';

const CustomInput = ({
    id,
    name,
    label,
    type = "text",
    value,
    onChange,
    onBlur,
    placeholder,
    error,
    touched,
    isTextarea = false, // Додаємо прапорець для textarea
    readOnly = false,
    disabled = false,
}) => {
    const InputElement = isTextarea ? "textarea" : "input";
    const hasError = Boolean(touched && error);

    return (
        <div className="form-group">
            {label && <label htmlFor={id}>{label}</label>}
            
            <div className="input-wrapper">
                <InputElement
                    id={id}
                    name={name}
                    type={isTextarea ? undefined : type}
                    onChange={onChange}
                    onBlur={onBlur}
                    value={value}
                    readOnly={readOnly}
                    disabled={disabled}
                    className={`form-control ${hasError ? 'error' : ''}`}
                    placeholder={placeholder}
                />
            </div>
            
            {/* Відображення помилки */}
            {touched && error ? (
                <div className="error-text">
                    {error}
                </div>
            ) : null}
        </div>
    );
};

export default CustomInput;