export const getAxisPresetLabel = (preset) => {
    if (preset && typeof preset === 'object') {
        if (typeof preset.label === 'string') return preset.label;
        if (preset.label?.ua) return preset.label.ua;
        if (preset.label?.en) return preset.label.en;
        if (typeof preset.value !== 'undefined') return String(preset.value);
    }
    return String(preset ?? '');
};

export const getAxisPresetValue = (preset) => {
    if (preset && typeof preset === 'object' && typeof preset.value !== 'undefined') {
        return String(preset.value);
    }
    return String(preset ?? '');
};