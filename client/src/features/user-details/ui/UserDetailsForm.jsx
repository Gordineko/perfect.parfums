"use client"
import 'react-phone-input-2/lib/style.css';

import OrderStatus from "@features/order-status";
import { useI18n } from '@shared/i18n/use-i18n';
import React from 'react'
import PhoneInput from 'react-phone-input-2';
import { useSelector } from 'react-redux';

import { useCheckoutForm } from '../lib/useCheckoutForm';
import { useCheckoutFormOrder } from '../lib/useCheckoutFormOrder';
import DeliverySection from './common/DeliverySection';
import PaySection from './common/PaySection';

const ProfileFormActions = ({
    submitError,
    showSubmitSuccess,
    submitSuccess,
    isSubmitting,
    formik,
    t,
}) => (
    <div className="user-details__profile-actions">
        {submitError ? (
            <div className="error-text" role="alert" aria-live="polite">
                {submitError}
            </div>
        ) : null}

        <div className="user-details__profile-actions-row">
            <button
                type="submit"
                className="user-details__profile-submit"
                disabled={formik.isSubmitting}
                aria-busy={formik.isSubmitting}
            >
                {isSubmitting
                    ? `${t("profile.saveChanges")}...`
                    : t("profile.saveChanges")}
            </button>
            <div
                className="user-details__profile-status-slot"
                aria-live="polite"
            >
                {showSubmitSuccess && submitSuccess ? (
                    <p className="user-details__profile-status" role="status">
                        {submitSuccess}
                    </p>
                ) : null}
            </div>
        </div>
    </div>
);

const UserDetailsForm = ({ location, user, profileSection = "personal" }) => {
    const { t } = useI18n();
    const cart = useSelector((state) => state.cart);
    let formik;
    
    if (location === "profile") {
        formik = useCheckoutForm(user, { profileSection });
    } else {
        formik = useCheckoutFormOrder(user, cart.items);
    }

    const submitError = formik?.status?.submitError;
    const submitSuccess = formik?.status?.submitSuccess;
    const isSubmitting = Boolean(formik?.isSubmitting);

    const [showSubmitSuccess, setShowSubmitSuccess] =
        React.useState(false);

    React.useEffect(() => {
        if (!submitSuccess) {
            setShowSubmitSuccess(false);
            return;
        }

        setShowSubmitSuccess(true);
        const timerId = window.setTimeout(
            () => setShowSubmitSuccess(false),
            3800,
        );

        return () => window.clearTimeout(timerId);
    }, [submitSuccess]);

    return (
        <>
        <div className={`user-details${
                location === "profile"
                    ? " user-details--profile user-details--profile-cabinet"
                    : location === "order"
                      ? " user-details--order"
                      : ""
            }`}>
            <form id="prof-checkout-form" onSubmit={formik.handleSubmit}>
                {location === "profile" ? (
                    <>
                        {profileSection === "personal" ? (
                            <div className="user-details__form-group user-details__form-group--cabinet">
                                <div className="form-group">
                                    <label htmlFor="firstName" className="user-details__field-label">{t('checkout.firstName')}</label>
                                    <input
                                        id="firstName"
                                        name="firstName"
                                        type="text"
                                        disabled={isSubmitting}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        value={formik.values.firstName}
                                    />
                                    {formik.touched.firstName && formik.errors.firstName && (
                                        <div className="error-text">{formik.errors.firstName}</div>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="lastName" className="user-details__field-label">{t('checkout.lastName')}</label>
                                    <input
                                        id="lastName"
                                        name="lastName"
                                        type="text"
                                        disabled={isSubmitting}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        value={formik.values.lastName}
                                    />
                                    {formik.touched.lastName && formik.errors.lastName && (
                                        <div className="error-text">{formik.errors.lastName}</div>
                                    )}
                                </div>

                                <div className="form-group form-group--no-label">
                                    <PhoneInput
                                        country={'ua'}
                                        value={formik.values.phone}
                                        onChange={(phone) => formik.setFieldValue('phone', `+${phone}`)}
                                        onBlur={() => formik.setFieldTouched('phone', true)}
                                        placeholder={t('authorization.phonePlaceholder')}
                                        inputProps={{
                                            id: 'phone',
                                            name: 'phone',
                                            required: true,
                                            disabled: isSubmitting,
                                            'aria-label': t('checkout.phone'),
                                        }}
                                        containerClass="phone-input-container"
                                        inputClass="phone-input-field"
                                        buttonClass="phone-input-button"
                                    />
                                    {formik.touched.phone && formik.errors.phone && (
                                        <div className="error-text">{formik.errors.phone}</div>
                                    )}
                                </div>

                                <div className="form-group form-group--no-label">
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder={t('checkout.email')}
                                        disabled={isSubmitting}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        value={formik.values.email}
                                        aria-label={t('checkout.email')}
                                    />
                                    {formik.touched.email && formik.errors.email && (
                                        <div className="error-text">{formik.errors.email}</div>
                                    )}
                                </div>
                            </div>
                        ) : null}

                        {profileSection === "delivery" ? (
                            <div className="user-details__form-group user-details__form-group--cabinet user-details__form-group--delivery">
                                <DeliverySection formik={formik} variant="profile" />
                            </div>
                        ) : null}

                        <ProfileFormActions
                            submitError={submitError}
                            showSubmitSuccess={showSubmitSuccess}
                            submitSuccess={submitSuccess}
                            isSubmitting={isSubmitting}
                            formik={formik}
                            t={t}
                        />
                    </>
                ) : (
                    <>
                        <div className="user-details__group">
                            <div className="user-details__head">
                                <div className="num"><p>1</p></div>
                                <span>{t('checkout.contactData')}</span>
                            </div>

                            <div className="user-details__form-group">
                                <div className="form-group">
                                    <label htmlFor="firstName" className="user-details__field-label">{t('checkout.firstName')}</label>
                                    <input
                                        id="firstName"
                                        name="firstName"
                                        type="text"
                                        disabled={isSubmitting}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        value={formik.values.firstName}
                                    />
                                    {formik.touched.firstName && formik.errors.firstName && (
                                        <div className="error-text">{formik.errors.firstName}</div>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="lastName" className="user-details__field-label">{t('checkout.lastName')}</label>
                                    <input
                                        id="lastName"
                                        name="lastName"
                                        type="text"
                                        disabled={isSubmitting}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        value={formik.values.lastName}
                                    />
                                    {formik.touched.lastName && formik.errors.lastName && (
                                        <div className="error-text">{formik.errors.lastName}</div>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="email" className="user-details__field-label">{t('checkout.email')}</label>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        disabled={isSubmitting}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        value={formik.values.email}
                                    />
                                    {formik.touched.email && formik.errors.email && (
                                        <div className="error-text">{formik.errors.email}</div>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="phone" className="user-details__field-label">{t('checkout.phone')}</label>
                                    <PhoneInput
                                        country={'ua'}
                                        value={formik.values.phone}
                                        onChange={(phone) => formik.setFieldValue('phone', `+${phone}`)}
                                        onBlur={() => formik.setFieldTouched('phone', true)}
                                        inputProps={{
                                            id: 'phone',
                                            name: 'phone',
                                            required: true,
                                            disabled: isSubmitting,
                                        }}
                                        containerClass="phone-input-container"
                                        inputClass="phone-input-field"
                                        buttonClass="phone-input-button"
                                    />
                                    {formik.touched.phone && formik.errors.phone && (
                                        <div className="error-text">{formik.errors.phone}</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="user-details__group">
                            <div className="user-details__head">
                                <div className="num"><p>2</p></div>
                                <span>{t('checkout.delivery')}</span>
                            </div>

                            <div className="user-details__form-group">
                                <DeliverySection formik={formik} variant="profile" />
                            </div>
                        </div>
                    </>
                )}

                {location === "order" &&
                    <div className="user-details__group">
                        <div className="user-details__head">
                            <div className="num"><p>3</p></div>
                            <span>{t('checkout.payment')}</span>
                        </div>

                        <div className="user-details__form-group width">
                            <PaySection formik={formik} />
                        </div>
                    </div>
                }
            </form>
        </div>
        {location === "order" && <OrderStatus formik={formik} />}
        </>
    )
}

export default UserDetailsForm;