// lib/authFormSubmit.js
import { loginAdmin } from "../../../shared/api/auth.services";
import Cookies from "js-cookie";

export const handleSubmit = async (values, { setSubmitting, setStatus }, navigate, onSubmit) => {
  setSubmitting(true);
  setStatus(null); // Очищуємо попередні помилки

  try {
    const result = await loginAdmin({
      email: values.email,
      password: values.password,
    });
    console.log("Login result:", result); 
    console.log("Login result:", values.email, values.password); 
    // // Перевірка на помилку від сервісу
    if (!result || result.error) {
      // Встановлюємо статус, який відобразиться під кнопкою
      setStatus(result?.message || "Невірний логін або пароль");
      return; 
    }

    if (result.token) {
      Cookies.set("admin_auth_token", result.token, { expires: 7, path: '/' });
      if (onSubmit) onSubmit(result.user);
      navigate("/admin");
    }
  } catch (err) {
    console.error("Auth submit error:", err);
    setStatus("Сталася помилка. Перевірте з'єднання з сервером.");
  } finally {
    setSubmitting(false);
  }
};