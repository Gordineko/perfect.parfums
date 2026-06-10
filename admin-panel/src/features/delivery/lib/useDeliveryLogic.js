
import { getAreas, getCities, getWarehouses } from "../../../shared/api/Nova-poshta";
import {
    getAreasUkrPoshta, getBranchesUkrPoshta,
    getCitiesUkrPoshta, getStaticAreasUkrPoshta, getStaticBranchesUkrPoshta,
    getStaticCitiesUkrPoshta,
} from "../../../shared/api/Urk-poshta";
import { useEffect, useRef, useState } from "react";

import { DELIVERY_TYPES } from "../const/delivery";

export const useDeliveryLogic = (values, setFieldValue, t) => {
    const [areas, setAreas] = useState([]);
    const [cities, setCities] = useState([]);
    const [warehouses, setWarehouses] = useState([]);

    const [isLoading, setIsLoading] = useState(false);
    const [apiError, setApiError] = useState(null);

    // Додаємо рефи, щоб запам'ятати попередні значення.
    // При першому рендері сюди запишуться дані з бази юзера.
    const prevAreaRef = useRef(values.area);
    const prevCityRef = useRef(values.city);
    const prevDeliveryTypeRef = useRef(values.deliveryType);

    const shouldLoadDeliveryData = () => {
        return Object.values(DELIVERY_TYPES).includes(values.deliveryType);
    };

    // 1. Загрузка Областей
    useEffect(() => {
        if (!shouldLoadDeliveryData()) {
            setAreas([]); setCities([]); setWarehouses([]); setApiError(null);
            return;
        }

        setIsLoading(true); setApiError(null);

        if (values.deliveryType === DELIVERY_TYPES.UKR_POSHTA) {
            getAreasUkrPoshta()
                .then((areasData) => areasData?.length ? setAreas(areasData) : getStaticAreasUkrPoshta().then(setAreas))
                .catch(() => getStaticAreasUkrPoshta().then(setAreas))
                .finally(() => setIsLoading(false));
        } else {
            getAreas()
                .then(setAreas)
                .catch((error) => setApiError(t('delivery.novaPoshtaAreasErrorMessage')))
                .finally(() => setIsLoading(false));
        }
    }, [values.deliveryType, t]);

    // 2. Загрузка Городов
    useEffect(() => {
        if (!values.area || !shouldLoadDeliveryData()) return;

        // Перевіряємо, чи область або тип доставки РЕАЛЬНО змінилися
        const isAreaChanged = prevAreaRef.current !== values.area;
        const isDeliveryTypeChanged = prevDeliveryTypeRef.current !== values.deliveryType;

        // Скидаємо поля ТІЛЬКИ якщо це дія користувача, а не перше завантаження
        if (isAreaChanged || isDeliveryTypeChanged) {
            setFieldValue("city", "");
            setFieldValue("warehouse", "");
            setCities([]);
            setWarehouses([]);
        }

        // Оновлюємо "пам'ять" рефів поточними значеннями
        prevAreaRef.current = values.area;
        prevDeliveryTypeRef.current = values.deliveryType;

        setApiError(null); setIsLoading(true);

        if (values.deliveryType === DELIVERY_TYPES.UKR_POSHTA) {
            getCitiesUkrPoshta(values.area)
                .then((citiesData) => citiesData?.length ? setCities(citiesData) : getStaticCitiesUkrPoshta(values.area).then(setCities))
                .catch(() => getStaticCitiesUkrPoshta(values.area).then(setCities))
                .finally(() => setIsLoading(false));
        } else {
            getCities(values.area)
                .then(setCities)
                .catch(() => setApiError(t('delivery.novaPoshtaCitiesErrorMessage')))
                .finally(() => setIsLoading(false));
        }
    }, [values.area, values.deliveryType, setFieldValue, t]);

    // 3. Загрузка Отделений
    useEffect(() => {
        if (!values.city || !shouldLoadDeliveryData()) return;

        // Перевіряємо, чи місто РЕАЛЬНО змінилося
        const isCityChanged = prevCityRef.current !== values.city;
        const isDeliveryTypeChanged = prevDeliveryTypeRef.current !== values.deliveryType;

        if (isCityChanged || isDeliveryTypeChanged) {
            setFieldValue("warehouse", "");
            setWarehouses([]);
        }

        prevCityRef.current = values.city;

        setApiError(null); setIsLoading(true);

        if (values.deliveryType === DELIVERY_TYPES.UKR_POSHTA) {
            getBranchesUkrPoshta(values.city, "branch")
                .then((branchesData) => branchesData?.length ? setWarehouses(branchesData) : getStaticBranchesUkrPoshta(values.city, "branch").then(setWarehouses))
                .catch(() => getStaticBranchesUkrPoshta(values.city, "branch").then(setWarehouses))
                .finally(() => setIsLoading(false));
        } else {
            const type = values.deliveryType === DELIVERY_TYPES.NOVA_POSHTA_POSTOMAT ? "postomat" : "branch";
            getWarehouses(values.city, type)
                .then(setWarehouses)
                .catch(() => setApiError(t('delivery.novaPoshtaWarehousesErrorMessage')))
                .finally(() => setIsLoading(false));
        }
    }, [values.city, values.deliveryType, setFieldValue, t]);

    // Форматирование для AutoCompleteSelect
    const formatOptions = (data) => data?.map(item => ({ value: item.Ref, label: item.Description })) || [];

    return {
        isLoading,
        apiError,
        shouldLoadDeliveryData,
        areaOptions: formatOptions(areas),
        cityOptions: formatOptions(cities),
        warehouseOptions: formatOptions(warehouses),
    };
};