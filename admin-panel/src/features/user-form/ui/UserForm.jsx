// UserForm.jsx
"use client";
import React from 'react';
import { useUserForm } from '../lib/useUserForm';
import CustomSelect from '../../../shared/ui/select-form/CustomSelect';
import CustomInput from '../../../shared/ui/input-form/CustomInput';
import { getStatusOptions } from '../../../shared/lib/statuses';
import AdminDeliverySection from '../../delivery/ui/AdminDeliverySection';

const STATUS_OPTIONS = getStatusOptions(['active', 'blocked', 'pending'], { labelType: 'form' });

const ROLE_OPTIONS = [
    { value: 'user', label: 'Користувач (User)' },
    { value: 'admin', label: 'Адміністратор (Admin)' },
];

const UserForm = ({ type, initialData }) => {
    const formik = useUserForm(type, initialData);

    return (
        <form id="user-create-form" onSubmit={formik.handleSubmit} className="product-form">

            {/* === АДРЕСА ДОСТАВКИ === */}
            <h1>Адреса доставки</h1>
            <div className="form-wrapper-2-column">
                <AdminDeliverySection formik={formik} />
            </div>

            <h1>Дані користувача</h1>

            {/* === СТАТУС ТА РОЛЬ === */}
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
                        {formik.touched.status && formik.errors.status && (
                            <div className="error-text">{formik.errors.status}</div>
                        )}
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="role">Роль</label>
                    <div className="input-wrapper">
                        <CustomSelect
                            options={ROLE_OPTIONS}
                            value={formik.values.role}
                            onChange={(value) => formik.setFieldValue('role', value)}
                            onBlur={formik.handleBlur}
                            name="role"
                            id="role"
                            error={formik.errors.role}
                            touched={formik.touched.role}
                            placeholder="Виберіть роль"
                        />
                        {formik.touched.role && formik.errors.role && (
                            <div className="error-text">{formik.errors.role}</div>
                        )}
                    </div>
                </div>
            </div>

            {/* === ІМ'Я ТА ПРІЗВИЩЕ === */}
            <div className="form-wrapper-2-column">
                <CustomInput
                    id="firstName" name="firstName" label="Ім'я"
                    value={formik.values.firstName || ''}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="Іван"
                    error={formik.errors.firstName}
                    touched={formik.touched.firstName}
                />
                <CustomInput
                    id="lastName" name="lastName" label="Прізвище"
                    value={formik.values.lastName || ''}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="Петров"
                    error={formik.errors.lastName}
                    touched={formik.touched.lastName}
                />
            </div>

            {/* === EMAIL ТА ТЕЛЕФОН === */}
            <div className="form-wrapper-2-column">
                <CustomInput
                    id="email" name="email" label="Електронна пошта (Email)"
                    type="email"
                    value={formik.values.email || ''}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="ivan@example.com"
                    error={formik.errors.email}
                    touched={formik.touched.email}
                />
                <CustomInput
                    id="phone" name="phone" label="Номер телефону"
                    type="tel"
                    value={formik.values.phone || ''}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="+380XXXXXXXXX"
                    error={formik.errors.phone}
                    touched={formik.touched.phone}
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
    );
};

export default UserForm;