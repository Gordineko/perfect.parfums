import { useEffect, useMemo, useState } from 'react';
import toast from '../../../shared/lib/toast';
import { getAxisPresetLabel, getAxisPresetValue } from './presetUtils';
import { generateSku } from './generateSku';

const buildOfferKey = (optionMap = {}) => JSON.stringify(
    Object.entries(optionMap)
        .filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== '')
        .sort(([left], [right]) => left.localeCompare(right))
);

export const useBulkOffersModal = ({
    selectableAxes,
    offers,
    isOpen,
    onClose,
    setFieldValue,
}) => {
    const [bulkOfferSelections, setBulkOfferSelections] = useState({});
    const [bulkGeneratedOffers, setBulkGeneratedOffers] = useState([]);
    const [bulkStep, setBulkStep] = useState('selection');

    useEffect(() => {
        if (!isOpen) {
            setBulkOfferSelections({});
            setBulkGeneratedOffers([]);
            setBulkStep('selection');
            return;
        }

        const nextSelections = selectableAxes.reduce((accumulator, axis) => {
            accumulator[axis.axisId] = [];
            return accumulator;
        }, {});

        setBulkOfferSelections(nextSelections);
        setBulkGeneratedOffers([]);
        setBulkStep('selection');
    }, [isOpen, selectableAxes]);

    const buildNewOffers = () => {
        const activeAxes = selectableAxes.filter(
            (axis) => (bulkOfferSelections[axis.axisId] || []).length > 0
        );

        if (activeAxes.length === 0) {
            return { error: 'Оберіть хоча б одну характеристику для генерації офферів', newOffers: [] };
        }

        const existingKeys = new Set(
            offers.map((offer) => buildOfferKey(offer?.options || offer?.optionMap || {}))
        );
        const combinations = [];

        const walk = (axisIndex, currentOptionMap, currentLabels) => {
            if (axisIndex >= activeAxes.length) {
                combinations.push({ optionMap: currentOptionMap, labels: currentLabels });
                return;
            }

            const axis = activeAxes[axisIndex];
            const selectedValues = bulkOfferSelections[axis.axisId] || [];

            selectedValues.forEach((value) => {
                const preset = axis.valuesPreset.find(
                    (item) => getAxisPresetValue(item) === value
                );

                walk(
                    axisIndex + 1,
                    { ...currentOptionMap, [axis.axisId]: value },
                    [...currentLabels, getAxisPresetLabel(preset || value)]
                );
            });
        };

        walk(0, {}, []);

        const newOffers = combinations.reduce((accumulator, combination) => {
            const offerKey = buildOfferKey(combination.optionMap);
            if (existingKeys.has(offerKey)) {
                return accumulator;
            }

            existingKeys.add(offerKey);
            const skuIndex = offers.length + accumulator.length + 1;
            accumulator.push({
                title: combination.labels.join(' / '),
                price: '',
                sku: generateSku('offer', ...combination.labels, skuIndex),
                options: combination.optionMap,
                image: null,
            });
            return accumulator;
        }, []);

        return { error: null, newOffers };
    };

    const toggleBulkOfferSelection = (axisId, value) => {
        setBulkOfferSelections((prevState) => {
            const currentValues = prevState[axisId] || [];
            const hasValue = currentValues.includes(value);

            return {
                ...prevState,
                [axisId]: hasValue
                    ? currentValues.filter((item) => item !== value)
                    : [...currentValues, value],
            };
        });
    };

    const bulkCreateCount = useMemo(() => {
        const selectedCounts = selectableAxes
            .map((axis) => (bulkOfferSelections[axis.axisId] || []).length)
            .filter((count) => count > 0);

        if (selectedCounts.length === 0) {
            return 0;
        }

        return selectedCounts.reduce((total, count) => total * count, 1);
    }, [bulkOfferSelections, selectableAxes]);

    const handleBulkCreateOffers = () => {
        const { error, newOffers } = buildNewOffers();

        if (error) {
            toast.error(error);
            return;
        }

        if (newOffers.length === 0) {
            toast.error('Усі вибрані комбінації вже існують');
            return;
        }

        setBulkGeneratedOffers(newOffers);
        setBulkStep('pricing');
    };

    const handleBulkPriceChange = (offerIndex, nextPrice) => {
        setBulkGeneratedOffers((prevState) => prevState.map((offer, index) => {
            if (index !== offerIndex) {
                return offer;
            }

            return {
                ...offer,
                price: nextPrice,
            };
        }));
    };

    const handleBackToSelection = () => {
        setBulkStep('selection');
    };

    const handleConfirmBulkCreateOffers = () => {
        if (bulkGeneratedOffers.length === 0) {
            toast.error('Немає підготовлених офферів для додавання');
            return;
        }

        const hasEmptyPrice = bulkGeneratedOffers.some((offer) => String(offer?.price ?? '').trim() === '');
        if (hasEmptyPrice) {
            toast.error('Заповніть ціну для кожного оффера');
            return;
        }

        setFieldValue('offers', [...offers, ...bulkGeneratedOffers]);
        toast.success(`Створено ${bulkGeneratedOffers.length} офферів`);
        onClose();
    };

    return {
        bulkOfferSelections,
        toggleBulkOfferSelection,
        bulkCreateCount,
        bulkGeneratedOffers,
        bulkStep,
        handleBulkPriceChange,
        handleBackToSelection,
        handleBulkCreateOffers,
        handleConfirmBulkCreateOffers,
    };
};