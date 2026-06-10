import React from 'react';

export const CustomCheckbox = ({ label, value, options, onChange }) => {
    if (!options) {
        return (
            <div className="custom-field">
                <label className="custom-checkbox-wrapper">
                    <input
                        type="checkbox"
                        checked={!!value}
                        onChange={(e) => onChange(e.target.checked)}
                        className="hidden-checkbox"
                    />
                    <span className="custom-checkbox-box"></span>
                    <span className="custom-checkbox-text">{label}</span>
                </label>
            </div>
        );
    }

    const selectedValues = typeof value === 'string' && value ? value.split(',') : [];

    const handleToggle = (optionValue, isChecked) => {
        let newValues;
        if (isChecked) {
            newValues = [...selectedValues, optionValue];
        } else {
            newValues = selectedValues.filter(v => v !== optionValue);
        }
        onChange(newValues.length > 0 ? newValues.join(',') : '');
    };

    return (
        <div className="custom-field">
            {label && <label className="group-label">{label}</label>}
            <div className="custom-checkbox-group">
                {options.map((opt) => (
                    <label key={opt.value} className="custom-checkbox-wrapper">
                        <input
                            type="checkbox"
                            checked={selectedValues.includes(String(opt.value))}
                            onChange={(e) => handleToggle(String(opt.value), e.target.checked)}
                            className="hidden-checkbox"
                        />
                        <span className="custom-checkbox-box"></span>
                        <span className="custom-checkbox-text">{opt.label}</span>
                    </label>
                ))}
            </div>
        </div>
    );
};