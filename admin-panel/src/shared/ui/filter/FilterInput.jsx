import React from 'react';

// --- Custom Input ---
export const CustomInput = ({ label, value, onChange, placeholder }) => (
    <div className="custom-field">
        {label && <label>{label}</label>}
        <input 
            type="text" 
            value={value || ''} 
            onChange={(e) => onChange(e.target.value)} 
            placeholder={placeholder}
            className="custom-input"
        />
    </div>
);