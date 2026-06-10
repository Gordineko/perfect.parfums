import React, { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { useNavigate } from "react-router-dom";
import { formValue, validationSchema } from "../config/authConstants";
import { handleSubmit } from "../lib/authFormSubmit";

const AuthForm = ({ onSubmit, style2, styleTXT }) => {
  const navigate = useNavigate();
  const [isFocused, setIsFocused] = useState(null);

  return (
    <div className="auth-form" style={style2}>
      <div className="auth-form__container">
        <h2 className="auth-form__title" style={styleTXT}>
          Вхід в адмін-панель
        </h2>

        <Formik
          initialValues={formValue}
          validationSchema={validationSchema}
          onSubmit={(values, helpers) =>
            handleSubmit(values, helpers, navigate, onSubmit)
          }
        >
          {({ isSubmitting, status, errors, touched }) => (
            <Form className="auth-form__form" noValidate>

              {/* Поле Email/Login */}
              <div className="form-group">

                <Field
                  type="email"
                  name="email"
                  id="email"
                  className="form-control"
                  placeholder="Введіть ваш email"
                  style={{ marginBottom: "0" }}
                  onFocus={() => setIsFocused(1)}
                  onBlur={() => setIsFocused(null)}
                  autoComplete="username"
                />
                <ErrorMessage name="email" component="div" className="error-text" />
              </div>

              {/* Поле Пароль */}
              <div className="form-group">

                <Field
                  type="password"
                  name="password"
                  id="password"
                  className="form-control"
                  placeholder="Введіть ваш пароль"
                  style={{ marginBottom: "0" }}
                  onFocus={() => setIsFocused(2)}
                  onBlur={() => setIsFocused(null)}
                  autoComplete="current-password"
                />
                <ErrorMessage name="password" component="div" className="error-text" />
              </div>

              {/* Вивід помилки від сервера */}
              {status && <div className="auth-form__status-error">{status}</div>}

              <button
                type="submit"
                className="auth-form__button"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  "Зачекайте..."
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                    Увійти в адмін-панель
                    <svg width="12" height="11" viewBox="0 0 12 11" fill="none">
                      <path
                        d="M6.13462 0.75L10.75 5.25L6.13462 9.75M10.109 5.25H0.75"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                )}
              </button>
              {status && (
                <div className="auth-form__status-error" style={{
                  color: "var(--color-danger-soft)",
                  fontSize: "14px",
                  marginTop: "10px",
                  textAlign: "center",
                  fontWeight: "500"
                }}>
                  {status}
                </div>
              )}
            </Form>

          )}
        </Formik>
      </div>
    </div>
  );
};

export default AuthForm;