"use client"
import { getAreas, getCities, getWarehouses } from "@shared/api/Nova-poshta";
import {
    getMeestAreas,
    getMeestBranches,
    getMeestCities,
    getMeestCountries,
} from "@shared/api/Meest";
import { useEffect, useRef, useState } from "react";

import { DELIVERY_TYPES } from "../const/delivery";

export const useDeliveryLogic = (values, setFieldValue, t) => {
    const [countries, setCountries] = useState([]);
    const [areas, setAreas] = useState([]);
    const [cities, setCities] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    
    const [isLoading, setIsLoading] = useState(false);
    const [apiError, setApiError] = useState(null);

    const prevAreaRef = useRef(values.area);
    const prevCityRef = useRef(values.city);
    const prevCountryRef = useRef(values.country);
    const prevDeliveryTypeRef = useRef(values.deliveryType);

    const isMeestDelivery = values.deliveryType === DELIVERY_TYPES.MEEST_BRANCH;

    const shouldLoadDeliveryData = () => {
        return Object.values(DELIVERY_TYPES).includes(values.deliveryType);
    };

    useEffect(() => {
        if (!shouldLoadDeliveryData()) {
            setCountries([]);
            setAreas([]);
            setCities([]);
            setWarehouses([]);
            setApiError(null);
            return;
        }

        if (!isMeestDelivery) {
            setCountries([]);
            return;
        }

        setIsLoading(true);
        setApiError(null);

        getMeestCountries()
            .then((next) => {
                console.info("[Meest] countries loaded", {
                    total: Array.isArray(next) ? next.length : 0,
                    items: next,
                });
                setCountries(next);
                if (!values.country) {
                    const defaultCountry = next.find((item) => item.Ref === "UA") || next[0];
                    if (defaultCountry?.Ref) {
                        setFieldValue("country", defaultCountry.Ref);
                    }
                }
            })
            .catch(() => {
                setApiError((prev) => (countries?.length ? prev : t("delivery.meestCountriesErrorMessage")));
            })
            .finally(() => setIsLoading(false));
    }, [values.deliveryType, values.country, setFieldValue, t]);

    useEffect(() => {
        if (!shouldLoadDeliveryData()) {
            setAreas([]);
            return;
        }

        const selectedCountry = values.country || "UA";
        if (isMeestDelivery && !selectedCountry) {
            setAreas([]);
            return;
        }

        setIsLoading(true);
        setApiError(null);

        if (isMeestDelivery) {
            getMeestAreas(selectedCountry)
                .then((next) => {
                    console.info("[Meest] areas loaded", {
                        selectedCountry,
                        total: Array.isArray(next) ? next.length : 0,
                        items: next,
                    });
                    setAreas(next);
                    setApiError(null);
                })
                .catch(() => {
                    setApiError((prev) => (areas?.length ? prev : t("delivery.meestAreasErrorMessage")));
                })
                .finally(() => setIsLoading(false));
            return;
        }

        getAreas()
            .then((next) => {
                setAreas(next);
                setApiError(null);
            })
            .catch(() => {
                setApiError((prev) => (areas?.length ? prev : t("delivery.novaPoshtaAreasErrorMessage")));
            })
            .finally(() => setIsLoading(false));
    }, [values.deliveryType, values.country, t]);

    useEffect(() => {
        if (!values.area || !shouldLoadDeliveryData()) return;

        const isCountryChanged = prevCountryRef.current !== values.country;
        const isAreaChanged = prevAreaRef.current !== values.area;
        const isDeliveryTypeChanged = prevDeliveryTypeRef.current !== values.deliveryType;

        if (isCountryChanged || isAreaChanged || isDeliveryTypeChanged) {
            setFieldValue("city", "");
            setFieldValue("warehouse", "");
            setCities([]);
            setWarehouses([]);
        }

        prevCountryRef.current = values.country;
        prevAreaRef.current = values.area;
        prevDeliveryTypeRef.current = values.deliveryType;

        setApiError(null);
        setIsLoading(true);

        if (isMeestDelivery) {
            getMeestCities(values.area, { countryRef: values.country })
                .then((next) => {
                    console.info("[Meest] cities loaded", {
                        selectedArea: values.area,
                        selectedCountry: values.country,
                        total: Array.isArray(next) ? next.length : 0,
                        items: next,
                    });
                    setCities(next);
                    setApiError(null);
                })
                .catch(() => {
                    setApiError((prev) => (cities?.length ? prev : t("delivery.meestCitiesErrorMessage")));
                })
                .finally(() => setIsLoading(false));
            return;
        }

        getCities(values.area)
            .then((next) => {
                setCities(next);
                setApiError(null);
            })
            .catch(() => {
                setApiError((prev) => (cities?.length ? prev : t("delivery.novaPoshtaCitiesErrorMessage")));
            })
            .finally(() => setIsLoading(false));
    }, [values.area, values.deliveryType, setFieldValue, t]);

    useEffect(() => {
        if (!values.city || !shouldLoadDeliveryData()) return;

        const isCityChanged = prevCityRef.current !== values.city;
        const isDeliveryTypeChanged = prevDeliveryTypeRef.current !== values.deliveryType;

        if (isCityChanged || isDeliveryTypeChanged) {
            setFieldValue("warehouse", ""); 
            setWarehouses([]);
        }

        prevCityRef.current = values.city;

        setApiError(null);
        setIsLoading(true);

        if (isMeestDelivery) {
            getMeestBranches(values.city, {
                areaRef: values.area,
                countryRef: values.country,
            })
                .then((next) => {
                    console.info("[Meest] branches loaded", {
                        selectedCity: values.city,
                        selectedArea: values.area,
                        selectedCountry: values.country,
                        total: Array.isArray(next) ? next.length : 0,
                        items: next,
                    });
                    setWarehouses(next);
                    setApiError(null);
                })
                .catch(() => {
                    setApiError((prev) => (warehouses?.length ? prev : t("delivery.meestWarehousesErrorMessage")));
                })
                .finally(() => setIsLoading(false));
            return;
        }

        const type = values.deliveryType === DELIVERY_TYPES.NOVA_POSHTA_POSTOMAT ? "postomat" : "branch";
        getWarehouses(values.city, type)
            .then((next) => {
                setWarehouses(next);
                setApiError(null);
            })
            .catch(() => {
                setApiError((prev) => (warehouses?.length ? prev : t("delivery.novaPoshtaWarehousesErrorMessage")));
            })
            .finally(() => setIsLoading(false));
    }, [values.city, values.deliveryType, setFieldValue, t]);

    const formatOptions = (data) => data?.map(item => ({ value: item.Ref, label: item.Description })) || [];

    return {
        isLoading,
        apiError,
        shouldLoadDeliveryData,
        countryOptions: formatOptions(countries),
        areaOptions: formatOptions(areas),
        cityOptions: formatOptions(cities),
        warehouseOptions: formatOptions(warehouses),
    };
};