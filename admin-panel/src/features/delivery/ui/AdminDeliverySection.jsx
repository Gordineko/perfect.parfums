import React, { useEffect, useMemo, useCallback } from 'react';
import AdminAutoCompleteSelect from './AdminAutoCompleteSelect';
import { DELIVERY_TYPES } from '../const/delivery'; 
import { useDeliveryLogic } from '../lib/useDeliveryLogic';

const dummyT = (key) => key;

// Умная функция, которая ищет ID по тексту, если в базе сохранен текст вместо ID
const resolveToId = (val, options) => {
    if (!val || !options || options.length === 0) return val;
    // Если это уже правильный ID
    if (options.some(opt => String(opt.value) === String(val))) return val;
    
    // Поиск совпадения текста (например, "Київська обл." -> "Київська")
    const lowerVal = String(val).toLowerCase();
    const match = options.find(opt => {
        const lowerLabel = String(opt.label).toLowerCase();
        return lowerVal.includes(lowerLabel) || lowerLabel.includes(lowerVal);
    });
    
    return match ? match.value : val;
};

const AdminDeliverySection = ({ formik }) => {
    const { values, errors, touched, setFieldValue, handleChange, handleBlur } = formik;
    
    // БЛОКИРУЕМ хуку возможность затирать данные при автоматическом переводе текста в ID
    const setHookFieldValue = useCallback((field, val) => {
        if (val === "" && (field === "city" || field === "warehouse" || field === "area")) {
            return; // Игнорируем автоматическую очистку от хука
        }
        const fieldMap = {
            'deliveryType': 'delivery.deliveryMethod',
            'area': 'delivery.deliveryProvince',
            'city': 'delivery.deliveryCity',
            'warehouse': 'delivery.deliveryPostOffice'
        };
        setFieldValue(fieldMap[field] || field, val);
    }, [setFieldValue]);

    const hookValues = useMemo(() => ({
        deliveryType: values.delivery?.deliveryMethod,
        area: values.delivery?.deliveryProvince,
        city: values.delivery?.deliveryCity,
        warehouse: values.delivery?.deliveryPostOffice
    }), [
        values.delivery?.deliveryMethod,
        values.delivery?.deliveryProvince,
        values.delivery?.deliveryCity,
        values.delivery?.deliveryPostOffice
    ]);

    const { 
        isLoading, 
        shouldLoadDeliveryData, 
        areaOptions, 
        cityOptions, 
        warehouseOptions 
    } = useDeliveryLogic(hookValues, setHookFieldValue, dummyT);

    const deliveryTypeOptions = useMemo(() => [
        { value: DELIVERY_TYPES?.NOVA_POSHTA_BRANCH || 'nova_poshta_branch', label: 'Нова Пошта (Відділення)' },
        { value: DELIVERY_TYPES?.UKR_POSHTA || 'ukrposhta', label: 'Укрпошта' }
    ], []);

    // Устанавливаем дефолтный метод доставки, если база прислала пустоту
    useEffect(() => {
        if (!values.delivery?.deliveryMethod && deliveryTypeOptions.length > 0) {
            setFieldValue("delivery.deliveryMethod", deliveryTypeOptions[0].value);
        }
    }, [values.delivery?.deliveryMethod, deliveryTypeOptions, setFieldValue]);

    // --- МАГИЯ АВТО-КОРРЕКЦИИ (ТЕКСТ -> ID) ---
    useEffect(() => {
        const val = values.delivery?.deliveryProvince;
        if (val && areaOptions?.length > 0) {
            const resolved = resolveToId(val, areaOptions);
            if (resolved !== val) setFieldValue("delivery.deliveryProvince", resolved);
        }
    }, [values.delivery?.deliveryProvince, areaOptions, setFieldValue]);

    useEffect(() => {
        const val = values.delivery?.deliveryCity;
        if (val && cityOptions?.length > 0) {
            const resolved = resolveToId(val, cityOptions);
            if (resolved !== val) setFieldValue("delivery.deliveryCity", resolved);
        }
    }, [values.delivery?.deliveryCity, cityOptions, setFieldValue]);

    useEffect(() => {
        const val = values.delivery?.deliveryPostOffice;
        if (val && warehouseOptions?.length > 0) {
            const resolved = resolveToId(val, warehouseOptions);
            if (resolved !== val) setFieldValue("delivery.deliveryPostOffice", resolved);
        }
    }, [values.delivery?.deliveryPostOffice, warehouseOptions, setFieldValue]);
    // ------------------------------------------

    const handleDeliveryTypeSelect = (selectedOption) => {
        const type = selectedOption ? selectedOption.value : "";
        setFieldValue("delivery.deliveryMethod", type);
        setFieldValue("delivery.deliveryProvince", "");
        setFieldValue("delivery.deliveryCity", "");
        setFieldValue("delivery.deliveryPostOffice", "");
    };

    const handleSelect = (fieldName) => (selectedOption) => {
        setFieldValue(fieldName, selectedOption ? selectedOption.value : "");
        
        // Ручная очистка зависимых полей (сработает только когда юзер сам кликает в селект)
        if (fieldName === "delivery.deliveryProvince") {
            setFieldValue("delivery.deliveryCity", "");
            setFieldValue("delivery.deliveryPostOffice", "");
        }
        if (fieldName === "delivery.deliveryCity") {
            setFieldValue("delivery.deliveryPostOffice", "");
        }
    };

    const getError = (field) => errors.delivery?.[field];
    const getTouched = (field) => touched.delivery?.[field];

    return (
        <>
            <AdminAutoCompleteSelect
                id="delivery-method-select"
                label="Метод доставки"
                name="delivery.deliveryMethod"
                value={values.delivery?.deliveryMethod}
                onChange={handleChange}
                onBlur={handleBlur}
                onSelectOption={handleDeliveryTypeSelect}
                options={deliveryTypeOptions}
                error={getError('deliveryMethod')}
                touched={getTouched('deliveryMethod')}
                placeholder="Оберіть метод доставки"
            />

            {shouldLoadDeliveryData() && (
                <>
                    <AdminAutoCompleteSelect
                        id="area-select" 
                        label="Область" 
                        name="delivery.deliveryProvince"
                        value={values.delivery?.deliveryProvince} 
                        onChange={handleChange} 
                        onBlur={handleBlur}
                        onSelectOption={handleSelect("delivery.deliveryProvince")}
                        disabled={!values.delivery?.deliveryMethod || isLoading}
                        options={areaOptions} 
                        error={getError('deliveryProvince')} 
                        touched={getTouched('deliveryProvince')}
                        placeholder={isLoading ? "Завантаження..." : "Оберіть область"}
                    />

                    <AdminAutoCompleteSelect
                        id="city-select" 
                        label="Місто" 
                        name="delivery.deliveryCity"
                        value={values.delivery?.deliveryCity} 
                        onChange={handleChange} 
                        onBlur={handleBlur}
                        onSelectOption={handleSelect("delivery.deliveryCity")}
                        disabled={!values.delivery?.deliveryProvince || isLoading}
                        options={cityOptions} 
                        error={getError('deliveryCity')} 
                        touched={getTouched('deliveryCity')}
                        placeholder={!values.delivery?.deliveryProvince ? "Спочатку оберіть область" : "Оберіть місто"}
                    />

                    <AdminAutoCompleteSelect
                        id="warehouse-select" 
                        label="Відділення / Адреса" 
                        name="delivery.deliveryPostOffice"
                        value={values.delivery?.deliveryPostOffice} 
                        onChange={handleChange} 
                        onBlur={handleBlur}
                        onSelectOption={handleSelect("delivery.deliveryPostOffice")}
                        disabled={!values.delivery?.deliveryCity || isLoading}
                        options={warehouseOptions} 
                        error={getError('deliveryPostOffice')} 
                        touched={getTouched('deliveryPostOffice')}
                        placeholder={!values.delivery?.deliveryCity ? "Спочатку оберіть місто" : "Оберіть відділення"}
                    />
                </>
            )}
        </>
    );
};

export default AdminDeliverySection;