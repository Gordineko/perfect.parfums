"use client";

import React, { useState } from 'react';
import { useReviewForm } from '../lib/useReviewForm';
import CustomSelect from '../../../shared/ui/select-form/CustomSelect';
import CustomInput from '../../../shared/ui/input-form/CustomInput';
import ReviewProductSelectionModal from './ReviewProductSelectionModal';

const STATUS_OPTIONS = [
    { value: 'published', label: 'Опубліковано' },
    { value: 'draft', label: 'Чернетка' },
    { value: 'archived', label: 'Архівовано' },
];

const ReviewForm = ({ type, initialData, isEditMode = false }) => {
    const formik = useReviewForm(type, initialData);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(() => ({
        _id: initialData?.product?._id || initialData?.product || '',
        title: initialData?.product?.title?.ua || initialData?.product?.title?.en || '',
        sku: '',
    }));

    const handleSelectProduct = (product) => {
        formik.setFieldValue('product', product?._id || '');
        setSelectedProduct(product || null);
        formik.setFieldTouched('product', true, false);
        setIsProductModalOpen(false);
    };

    return (
        <>
            <ReviewProductSelectionModal
                isOpen={isProductModalOpen}
                onClose={() => setIsProductModalOpen(false)}
                onSelect={handleSelectProduct}
            />

            <form id="review-create-form" onSubmit={formik.handleSubmit} className="product-form">
                <h1>Дані відгуку</h1>

                <div className="form-wrapper-2-column">
                    <CustomInput
                        id="name"
                        name="name"
                        label="Ім'я автора"
                        value={formik.values.name || ''}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        placeholder="Анна"
                        error={formik.errors.name}
                        touched={formik.touched.name}
                    />

                    <div className="form-group">
                        <label htmlFor="review-product-trigger">Товар</label>
                        <button
                            id="review-product-trigger"
                            type="button"
                            className="order-form__items-btn"
                            onClick={() => setIsProductModalOpen(true)}
                        >
                            Обрати товар
                        </button>
                        {formik.values.product ? (
                            <p style={{ marginTop: '8px' }}>
                                Обрано: {selectedProduct?.title || formik.values.product}
                                {selectedProduct?.sku ? ` (SKU: ${selectedProduct.sku})` : ''}
                            </p>
                        ) : (
                            <p style={{ marginTop: '8px' }}>Товар не обрано</p>
                        )}
                        {(formik.touched.product || formik.submitCount > 0) && formik.errors.product ? (
                            <div className="error-text">{formik.errors.product}</div>
                        ) : null}
                    </div>
                </div>

                <div className="form-wrapper-2-column">
                    <CustomInput
                        id="rating"
                        name="rating"
                        type="number"
                        label="Оцінка (1-5)"
                        value={formik.values.rating}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.errors.rating}
                        touched={formik.touched.rating}
                    />
                    <CustomInput
                        id="photoUrl"
                        name="photoUrl"
                        label="Фото URL"
                        value={formik.values.photoUrl || ''}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        placeholder="https://example.com/photo.jpg"
                    />
                </div>

                <div className="form-wrapper-2-column">
                    <div className="form-group">
                        <label htmlFor="status">Статус</label>
                        <div className="input-wrapper">
                            <CustomSelect
                                options={STATUS_OPTIONS}
                                value={formik.values.status}
                                onChange={(value) => formik.setFieldValue('status', value)}
                                onBlur={formik.handleBlur}
                                name="status"
                                id="status"
                                error={formik.errors.status}
                                touched={formik.touched.status}
                                placeholder="Виберіть статус"
                            />
                        </div>
                    </div>

                    <CustomInput
                        id="position"
                        name="position"
                        type="number"
                        label="Позиція"
                        value={formik.values.position}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.errors.position}
                        touched={formik.touched.position}
                    />
                </div>

                <CustomInput
                    id="text"
                    name="text"
                    label="Коментар"
                    value={formik.values.text || ''}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="Текст відгуку"
                    error={formik.errors.text}
                    touched={formik.touched.text}
                    isTextarea
                />

                <div className="form-wrapper-2-column">
                    <div className="form-group">
                        <label className="review-checkbox" htmlFor="isVisibleProduct">
                            <input
                                id="isVisibleProduct"
                                name="isVisibleProduct"
                                type="checkbox"
                                className="review-checkbox__input"
                                checked={Boolean(formik.values.isVisibleProduct)}
                                onChange={formik.handleChange}
                            />
                            <span className="review-checkbox__box" aria-hidden="true" />
                            <span className="review-checkbox__text">Показувати на сторінці товару</span>
                        </label>
                    </div>

                    {/* <div className="form-group">
                        <label className="review-checkbox" htmlFor="isVisibleMainPage">
                            <input
                                id="isVisibleMainPage"
                                name="isVisibleMainPage"
                                type="checkbox"
                                className="review-checkbox__input"
                                checked={Boolean(formik.values.isVisibleMainPage)}
                                onChange={formik.handleChange}
                            />
                            <span className="review-checkbox__box" aria-hidden="true" />
                            <span className="review-checkbox__text">Показувати на головній сторінці</span>
                        </label>
                    </div> */}
                </div>
            </form>
        </>
    );
};

export default ReviewForm;
