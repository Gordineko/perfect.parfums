import { useI18n } from '@shared/i18n/use-i18n';
import React from 'react';

const PaySection = ({ formik }) => {
  const { t } = useI18n();
  
  const PAYMENT_METHODS = {
    ONLINE: 'online',
    POSTPAID: 'postpaid'
  };

  const handlePaymentSelect = (method) => {
    formik.setFieldValue('paymentMethod', method);
  };

  return (
    <div className="pay">
        <div 
          className={`pay__option ${formik.values.paymentMethod === PAYMENT_METHODS.ONLINE ? "active" : ""}`}
          onClick={() => handlePaymentSelect(PAYMENT_METHODS.ONLINE)}
        >
          <div className="delivery__header">
            <span className="pay__title">{t('checkout.paymentOnlineTitle')}</span>
          </div>
          <p className="pay__desc">
            {t('checkout.paymentOnlineDesc')}
          </p>
        </div>

        <div 
          className={`pay__option ${formik.values.paymentMethod === PAYMENT_METHODS.POSTPAID ? "active" : ""}`}
          onClick={() => handlePaymentSelect(PAYMENT_METHODS.POSTPAID)}
        >
            <span className="pay__title">{t('checkout.paymentPostpaidTitle')}</span>
          <p className="pay__desc">
            {t('checkout.paymentPostpaidDesc')}
          </p>
        </div>

      {formik.touched.paymentMethod && formik.errors.paymentMethod && (
        <div className="error-text">
          {formik.errors.paymentMethod}
        </div>
      )}
    </div>
  );
}

export default PaySection;