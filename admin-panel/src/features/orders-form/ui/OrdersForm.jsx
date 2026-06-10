import React, { useState } from 'react';
import CustomInput from '../../../shared/ui/input-form/CustomInput';
import UserAutocomplete from '../../../features/orders-form/ui/UserAutocomplete';
import { useOrdersForm } from '../lib/useOrdersForm';
import AdminDeliverySection from '../../delivery/ui/AdminDeliverySection';
import ProductSelectionModal from './ProductSelectionModal';

const OrderForm = ({ type, initialData }) => {
    const formik = useOrdersForm(type, initialData);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);

    // Вспомогательная функция для вложенных полей
    const handleNestedChange = (field) => (e) => {
        const value = e?.target !== undefined ? e.target.value : e;
        formik.setFieldValue(field, value);
    };

    // Выбор пользователя из автокомплита
    const handleUserSelect = (user) => {
        const nameParts = (user.name || '').trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        formik.setValues({
            ...formik.values,
            customer: {
                ...formik.values.customer,
                firstName: firstName,
                lastName: lastName,
                customerEmail: user.email || formik.values.customer.customerEmail,
                customerPhone: user.phone || formik.values.customer.customerPhone,
            }
        });
    };

    // Добавление товара из модалки
    const handleAddProduct = (product) => {
        const currentItems = formik.values.items || [];
        const newItem = {
            offerId: product._id,
            sku: product.sku,
            titleSnapshot: { ua: product.title?.ua || product.title },
            imgSnapshot: product.img,
            qty: 1,
            pricePerUnit: product.pricing?.min || product.price,
            subtotal: product.pricing?.min || product.price
        };

        formik.setFieldValue('items', [...currentItems, newItem]);
        setIsProductModalOpen(false);
    };

    // Удаление товара
    const handleRemoveProduct = (indexToRemove) => {
        const currentItems = formik.values.items || [];
        const newItems = currentItems.filter((_, index) => index !== indexToRemove);
        formik.setFieldValue('items', newItems);
    };

    // Изменение количества (инпут и кнопки)
    const handleQtyChange = (index, newQty) => {
        const qty = Math.max(1, Number(newQty));
        const currentItems = [...(formik.values.items || [])];

        currentItems[index].qty = qty;
        currentItems[index].subtotal = currentItems[index].pricePerUnit * qty;

        formik.setFieldValue('items', currentItems);
    };

    const updateQtyStep = (index, delta) => {
        const currentItems = [...(formik.values.items || [])];
        const currentQty = Number(currentItems[index].qty || 1);
        handleQtyChange(index, currentQty + delta);
    };

    // Расчеты
    const currentItems = formik.values.items || [];
    const totalProductsCount = currentItems.length;
    const dynamicSubtotal = currentItems.reduce((sum, item) => sum + (Number(item.pricePerUnit || 0) * Number(item.qty || 1)), 0);
    const adminDiscount = Number(formik.values.discount?.adminDiscount || 0);
    const finalPrice = Math.max(0, dynamicSubtotal - adminDiscount);

    return (
        <>
            <ProductSelectionModal
                isOpen={isProductModalOpen}
                onClose={() => setIsProductModalOpen(false)}
                onSelect={handleAddProduct}
            />
            <form id="order-create-form" onSubmit={formik.handleSubmit} className="product-form">
                <div className="order-form__grid">
                    {/* ЛЕВАЯ КОЛОНКА: ТОВАРЫ */}
                    <div className="order-form__items">
                        <div className="order-form__items-list">
                            {currentItems.map((item, index) => (
                                <div key={index} className="order-form__item">
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveProduct(index)}
                                        className="order-form__remove-btn"
                                        aria-label="Видалити товар"
                                    >
                                        &times;
                                    </button>

                                    <img src={item.imgSnapshot} alt='product' className="order-form__item-image" />

                                    <div className="order-form__item-txt">
                                        <p>{item.titleSnapshot?.ua || item.titleSnapshot}</p>
                                        <span>SKU: {item.sku}</span>
                                    </div>

                                    {/* УПРАВЛЕНИЕ КОЛИЧЕСТВОМ */}
                                    <div className="order-form__qty-block">
                                        <span className="order-form__qty-label">Кількість</span>
                                        <div className="order-form__qty-control">
                                            <button
                                                type="button"
                                                onClick={() => updateQtyStep(index, -1)}
                                                className="order-form__qty-btn"
                                                aria-label="Зменшити кількість"
                                            >
                                                –
                                            </button>
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                value={item.qty}
                                                onChange={(e) => handleQtyChange(index, e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (['e', 'E', '+', '-', '.', ','].includes(e.key)) {
                                                        e.preventDefault();
                                                    }
                                                }}
                                                className="order-form__qty-input"
                                                aria-label="Кількість товару"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => updateQtyStep(index, 1)}
                                                className="order-form__qty-btn"
                                                aria-label="Збільшити кількість"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>

                                    <div className="order-form__price-block">
                                        <p>{item.subtotal || (item.pricePerUnit * item.qty)} грн</p>
                                        <span>{item.pricePerUnit} / шт</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button
                            className="order-form__items-btn"
                            type="button"
                            onClick={() => setIsProductModalOpen(true)}
                        >
                            Додати товар
                        </button>
                    </div>

                    {/* ПРАВАЯ КОЛОНКА: ИТОГИ */}
                    <div className="order-form__data">
                        <h4>Всього</h4>
                        <div className="order-form__data-item">
                            <p>{totalProductsCount} товари</p>
                            <p>{dynamicSubtotal} грн</p>
                        </div>
                        <div className="order-form__data-item">
                            <p>Знижка</p>
                            <p>{adminDiscount} грн</p>
                        </div>
                        <div className="order-form__data-under">
                            <p>Всього до сплати:</p>
                            <p><strong>{finalPrice} грн</strong></p>
                        </div>
                    </div>
                </div>

                {/* СЕКЦИИ ДАННЫХ */}
                <div className="order-form__functions">
                    <h4>Покупець</h4>
                    <div className="form-wrapper-2-column">
                        <div style={{ gridColumn: '1 / -1' }}>
                            <UserAutocomplete
                                label="Пошук існуючого користувача"
                                onSelectUser={handleUserSelect}
                            />
                        </div>
                        <CustomInput
                            id="customer.firstName" name="customer.firstName" label="Ім'я"
                            value={formik.values.customer?.firstName || ''}
                            onChange={handleNestedChange('customer.firstName')}
                            onBlur={formik.handleBlur}
                            error={formik.errors.customer?.firstName} touched={formik.touched.customer?.firstName}
                        />
                        <CustomInput
                            id="customer.lastName" name="customer.lastName" label="Прізвище"
                            value={formik.values.customer?.lastName || ''}
                            onChange={handleNestedChange('customer.lastName')}
                            onBlur={formik.handleBlur}
                        />
                        <CustomInput
                            id="customer.customerPhone" name="customer.customerPhone" label="Телефон"
                            value={formik.values.customer?.customerPhone || ''}
                            onChange={handleNestedChange('customer.customerPhone')}
                            onBlur={formik.handleBlur}
                            error={formik.errors.customer?.customerPhone} touched={formik.touched.customer?.customerPhone}
                        />
                        <CustomInput
                            id="customer.customerEmail" name="customer.customerEmail" label="Email"
                            value={formik.values.customer?.customerEmail || ''}
                            onChange={handleNestedChange('customer.customerEmail')}
                            onBlur={formik.handleBlur}
                        />
                    </div>
                </div>

                <div className="order-form__functions">
                    <h4>Доставка</h4>
                    <div className="form-wrapper-2-column">
                        <AdminDeliverySection formik={formik} />
                    </div>
                </div>

                <div className="order-form__functions">
                    <h4>Додатково</h4>
                    <div className="form-wrapper-2-column">
                        <CustomInput
                            id="discount.adminDiscount" name="discount.adminDiscount" label="Знижка менеджера (сума)"
                            type="number"
                            value={formik.values.discount?.adminDiscount || ''}
                            onChange={handleNestedChange('discount.adminDiscount')}
                            onBlur={formik.handleBlur}
                        />
                        <CustomInput
                            id="discount.adminDiscountComment" name="discount.adminDiscountComment" label="Коментар до знижки"
                            value={formik.values.discount?.adminDiscountComment || ''}
                            onChange={handleNestedChange('discount.adminDiscountComment')}
                            onBlur={formik.handleBlur}
                        />
                    </div>

                    <CustomInput
                        id="adminComment" name="adminComment" label="Коментар менеджера (внутрішній)"
                        value={formik.values.adminComment || ''}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                    />
                </div>

                {/* === ДЕБАГ: ПОМИЛКИ ФОРМИ === */}
                {Object.keys(formik.errors).length > 0 && (
                    <div style={{ marginTop: '24px', padding: '16px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px' }}>
                        <strong style={{ color: '#DC2626', fontSize: '13px' }}>Помилки форми (чому не зберігається):</strong>
                        <pre style={{ marginTop: '8px', fontSize: '12px', color: '#7F1D1D', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                            {JSON.stringify(formik.errors, null, 2)}
                        </pre>
                    </div>
                )}

            </form>


        </>
    );
};

export default OrderForm;