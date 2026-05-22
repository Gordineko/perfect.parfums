"use client";

import { createReview, useI18n } from "@shared";
import { useFormik } from "formik";
import * as Yup from "yup";

export const useWriteReviewForm = (productId, { onSuccess } = {}) => {
  const { t } = useI18n();

  const formik = useFormik({
    initialValues: {
      name: "",
      text: "",
      rating: 5,
    },
    validationSchema: Yup.object({
      name: Yup.string().required(t("reviews.validation.required")),
      text: Yup.string()
        .min(10, t("reviews.validation.minText"))
        .required(t("reviews.validation.required")),
      rating: Yup.number().min(1, t("reviews.validation.ratingRequired")),
    }),
    onSubmit: async (values, { resetForm, setStatus }) => {
      setStatus(undefined);
      if (!productId || String(productId).trim() === "") {
        setStatus(t("reviews.submitErrorMissingProduct"));
        return;
      }
      try {
        await createReview({
          name: values.name,
          text: values.text,
          rating: values.rating,
          product: String(productId).trim(),
        });
        resetForm();
        if (typeof onSuccess === "function") {
          onSuccess();
        }
      } catch (error) {
        const message =
          error instanceof Error && error.message
            ? error.message
            : t("reviews.submitError");
        setStatus(message);
      }
    },
  });

  return formik;
};
