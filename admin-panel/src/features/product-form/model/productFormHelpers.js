// Вспомогательные функции для ProductForm

const resolveAccessoryIdValue = (value) => {
    if (!value) return '';

    if (typeof value === 'object') {
        return String(value._id || value.offerId || value.id || value.value || '').trim();
    }

    return String(value).trim();
};

export const normalizeAccessoryOfferId = (offer = {}) => {
    if (offer?.accessoryOfferId !== undefined) {
        return resolveAccessoryIdValue(offer.accessoryOfferId);
    }
    const firstAccessory = Array.isArray(offer?.accessories) ? offer.accessories[0] : null;
    return resolveAccessoryIdValue(firstAccessory?.offerId);
};

export const buildOfferAccessoriesPayload = (offer = {}) => {
    const accessoryOfferId = normalizeAccessoryOfferId(offer);
    if (!accessoryOfferId) {
        return { accessories: [] };
    }

    return {
        accessories: [
            {
                offerId: accessoryOfferId,
                selectedByDefault: true,
            },
        ],
    };
};

export const areOfferAccessoriesEqual = (leftOffer = {}, rightOffer = {}) => (
    normalizeAccessoryOfferId(leftOffer) === normalizeAccessoryOfferId(rightOffer)
);

export const buildOfferOptionKey = (offer = {}) => JSON.stringify(
    Object.entries(offer?.optionMap || offer?.options || {})
        .filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== '')
        .sort(([left], [right]) => left.localeCompare(right))
);
