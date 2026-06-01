"use client"
import { useI18n } from '@shared';
import React, { useEffect, useMemo } from 'react';

import { DELIVERY_TYPES } from '../../const/delivery';
import { useDeliveryLogic } from '../../lib/useDeliveryLogic';
import AutoCompleteSelect from './AutoCompleteSelect';

const DeliverySection = ({ formik, variant = "checkout" }) => {
    const { t } = useI18n();
    const { values, errors, touched, setFieldValue, handleChange, handleBlur } = formik;
    const isSubmitting = Boolean(formik?.isSubmitting);
    
    const { 
        isLoading, 
        apiError, 
        shouldLoadDeliveryData, 
        countryOptions,
        areaOptions, 
        cityOptions, 
        warehouseOptions 
    } = useDeliveryLogic(values, setFieldValue, t);

    const deliveryTypeOptions = useMemo(() => [
        { value: DELIVERY_TYPES.NOVA_POSHTA_BRANCH, label: t('checkout.npBranch') },
        { value: DELIVERY_TYPES.MEEST_BRANCH, label: t('checkout.meestBranch') },
    ], [t]);

    useEffect(() => {
        if (!values.deliveryType) {
            setFieldValue("deliveryType", DELIVERY_TYPES.NOVA_POSHTA_BRANCH);
        }
    }, [values.deliveryType, setFieldValue]);

    const handleDeliveryTypeSelect = (selectedOption) => {
        const type = selectedOption ? selectedOption.value : "";
        setFieldValue("deliveryType", type);
        if (type !== DELIVERY_TYPES.MEEST_BRANCH) {
            setFieldValue("country", "");
        }
        setFieldValue("area", "");
        setFieldValue("city", "");
        setFieldValue("warehouse", "");
    };

    const handleSelect = (fieldName) => (selectedOption) => {
        const value = selectedOption ? selectedOption.value : "";
        setFieldValue(fieldName, value);

        if (fieldName === "country") {
            setFieldValue("area", "");
            setFieldValue("city", "");
            setFieldValue("warehouse", "");
        }
        if (fieldName === "area") {
            setFieldValue("city", "");
            setFieldValue("warehouse", "");
        }
        if (fieldName === "city") {
            setFieldValue("warehouse", "");
        }
    };

    const isProfile = variant === "profile";
    const formGroupClass = isProfile ? "form-group form-group--no-label" : "form-group";
    const spanTabletClass = isProfile ? " form-group--span-tablet" : "";

    return (
        <>
            <div className={formGroupClass}>
                <AutoCompleteSelect
                    variant={variant}
                    isSearchable={false}
                    uiVariant={variant === "checkout" ? "order" : "default"}
                    id="delivery-type-select"
                    label={t('checkout.deliveryMethod')}
                    name="deliveryType"
                    value={values.deliveryType}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onSelectOption={handleDeliveryTypeSelect}
                    options={deliveryTypeOptions}
                    error={errors.deliveryType}
                    touched={touched.deliveryType}
                    placeholder={t('checkout.chooseDeliveryMethod')}
                />
            </div>

            {shouldLoadDeliveryData() && (
                <>
                    {apiError && (areaOptions.length === 0 || cityOptions.length === 0 || warehouseOptions.length === 0) ? (
                        <div className="error-text" role="alert" aria-live="polite">
                            {apiError}
                        </div>
                    ) : null}

                    {values.deliveryType === DELIVERY_TYPES.MEEST_BRANCH && (
                        <div className={formGroupClass}>
                            <AutoCompleteSelect
                                variant={variant}
                                isSearchable={false}
                                uiVariant={variant === "checkout" ? "order" : "default"}
                                id="country-select"
                                label={t('checkout.country')}
                                name="country"
                                value={values.country || ''}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                onSelectOption={handleSelect("country")}
                                disabled={countryOptions.length === 0 || isLoading || isSubmitting}
                                options={countryOptions}
                                error={errors.country}
                                touched={touched.country}
                                placeholder={countryOptions.length === 0 ? t('checkout.loading') : t('checkout.chooseCountry')}
                            />
                        </div>
                    )}

                    <div className={formGroupClass}>
                        <AutoCompleteSelect
                            variant={variant}
                            isSearchable={false}
                            uiVariant={variant === "checkout" ? "order" : "default"}
                            id="area-select" 
                            label={t('checkout.region')} 
                            name="area"
                            value={values.area} 
                            onChange={handleChange} 
                            onBlur={handleBlur}
                            onSelectOption={handleSelect("area")}
                            disabled={
                                !values.deliveryType ||
                                areaOptions.length === 0 ||
                                isLoading ||
                                isSubmitting ||
                                (values.deliveryType === DELIVERY_TYPES.MEEST_BRANCH && !values.country)
                            }
                            options={areaOptions} 
                            error={errors.area} 
                            touched={touched.area}
                            placeholder={
                                values.deliveryType === DELIVERY_TYPES.MEEST_BRANCH && !values.country
                                    ? t('checkout.chooseCountryFirst')
                                    : areaOptions.length === 0
                                        ? t('checkout.loading')
                                        : t('checkout.chooseRegion')
                            }
                        />
                    </div>

                    <div className={formGroupClass}>
                        <AutoCompleteSelect
                            variant={variant}
                            isSearchable={false}
                            uiVariant={variant === "checkout" ? "order" : "default"}
                            id="city-select" 
                            label={t('checkout.city')} 
                            name="city"
                            value={values.city} 
                            onChange={handleChange} 
                            onBlur={handleBlur}
                            onSelectOption={handleSelect("city")}
                            disabled={!values.area || cityOptions.length === 0 || isLoading || isSubmitting}
                            options={cityOptions} 
                            error={errors.city} 
                            touched={touched.city}
                            placeholder={!values.area ? t('checkout.chooseRegionFirst') : t('checkout.chooseCity')}
                        />
                    </div>

                    <div className={`${formGroupClass}${spanTabletClass}`}>
                        <AutoCompleteSelect
                            variant={variant}
                            isSearchable={false}
                            uiVariant={variant === "checkout" ? "order" : "default"}
                            id="warehouse-select" 
                            label={t('checkout.branch')} 
                            name="warehouse"
                            value={values.warehouse} 
                            onChange={handleChange} 
                            onBlur={handleBlur}
                            onSelectOption={handleSelect("warehouse")}
                            disabled={!values.city || warehouseOptions.length === 0 || isLoading || isSubmitting}
                            options={warehouseOptions} 
                            error={errors.warehouse} 
                            touched={touched.warehouse}
                            placeholder={!values.city ? t('checkout.chooseCityFirst') : t('checkout.chooseBranch')}
                        />
                    </div>
                </>
            )}
        </>
    );
};

export default DeliverySection;