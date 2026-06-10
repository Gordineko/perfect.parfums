import * as Yup from "yup";


export const validationSchema = Yup.object({
  email: Yup.string().required("Обов'язкове поле"),
  password: Yup.string()
    .min(2, "Мінімум 2 символи")
    .required("Обов'язкове поле"),
});

export const formValue = { email: "", password: "" };
