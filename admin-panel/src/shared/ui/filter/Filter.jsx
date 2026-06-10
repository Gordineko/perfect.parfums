import { useModals } from '../../../app/context/modals-context';
import { useSearchParams } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { CustomInput } from './FilterInput';
import { CustomCheckbox } from './FilterCheckBox';
import { CustomSelect } from './FilterSelect';

const Filter = ({ fields = [] }) => {
    const { isModalOpen, setIsModalOpen } = useModals();
    const [searchParams, setSearchParams] = useSearchParams();
    const [filterValues, setFilterValues] = useState({});

    const getParamsWithoutFilters = () => {
        const nextParams = new URLSearchParams(searchParams);

        fields.forEach((field) => {
            nextParams.delete(field.key);
        });

        return nextParams;
    };

    useEffect(() => {
        const initialValues = {};
        fields.forEach(field => {
            const param = searchParams.get(field.key);
            if (param !== null) {
                initialValues[field.key] = (field.type === 'checkbox' && !field.options) 
                    ? param === 'true' 
                    : param;
            }
        });
        setFilterValues(initialValues);
    }, [searchParams, fields]);

    const handleFieldChange = (key, value) => {
        setFilterValues(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const applyFilters = () => {
        const currentParams = getParamsWithoutFilters();

        Object.entries(filterValues).forEach(([key, value]) => {
            if (value === '' || value === false || value === null || value === undefined) {
                currentParams.delete(key);
            } else {
                currentParams.set(key, String(value));
            }
        });

        setSearchParams(currentParams);
        setIsModalOpen(null);
    };

    const clearFilters = () => {
        setFilterValues({});
        setSearchParams(getParamsWithoutFilters());
        setIsModalOpen(null);
    };

    if (isModalOpen !== 'filter') {
        return null;
    }

    return (
        <>
            <div
                className="overlay"
                onClick={() => setIsModalOpen(null)}
            />

            <div className='filter-modal'>
                <div className="filter-modal__header">
                    <h3>Фільтри</h3>
                    <button className='gr' onClick={() => setIsModalOpen(null)}>Закрити</button>
                </div>

                <div className="filter-modal__body">
                    {fields.map((field) => {
                        const commonProps = {
                            label: field.label,
                            value: filterValues[field.key],
                            onChange: (val) => handleFieldChange(field.key, val)
                        };

                        const renderField = () => {
                            switch (field.type) {
                                case 'input':
                                    return <CustomInput {...commonProps} placeholder={field.placeholder} />;
                                case 'checkbox':
                                    return <CustomCheckbox {...commonProps} options={field.options} />;
                                case 'select':
                                    return <CustomSelect {...commonProps} options={field.options} />;
                                default:
                                    return null;
                            }
                        };

                        return (
                            <div key={field.key} className="filter-modal__item">
                                {renderField()}
                            </div>
                        );
                    })}
                </div>

                <div className="filter-actions">
                    <button onClick={applyFilters}>Застосувати</button>
                    <button className='gr' onClick={clearFilters} >Скинути</button>
                    
                </div>
            </div>
        </>
    );
};

export default Filter;