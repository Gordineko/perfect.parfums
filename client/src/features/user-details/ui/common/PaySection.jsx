import { useI18n } from '@shared/i18n/use-i18n';
import React, { useMemo } from 'react';

import AutoCompleteSelect from './AutoCompleteSelect';

const PaySection = ({ formik, variant = "checkout" }) => {
  const { t } = useI18n();
  
  const options = useMemo(
    () => [
      { value: "online", label: t("checkout.paymentOnlineTitle") },
      { value: "cod", label: t("checkout.paymentPostpaidTitle") },
    ],
    [t],
  );

  return (
    <AutoCompleteSelect
      variant={variant}
      isSearchable={false}
      uiVariant={variant === "checkout" ? "order" : "default"}
      id="payment-method-select"
      label={t("checkout.paymentMethodLabel")}
      name="paymentMethod"
      value={formik.values.paymentMethod}
      onChange={formik.handleChange}
      onBlur={formik.handleBlur}
      options={options}
      error={formik.errors.paymentMethod}
      touched={formik.touched.paymentMethod}
      placeholder={t("checkout.choosePaymentMethod")}
    />
  );
}

export default PaySection;