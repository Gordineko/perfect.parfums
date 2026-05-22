"use client";

import { forgotPassword, resetPassword } from "@shared/api/authServices";

export const useResetForm = () => {
  const requestPasswordResetEmail = async (email) => {
    return forgotPassword(email);
  };

  // const submitNewPassword = async ({ token, password }) => {
  //   return resetPassword({ token, newPassword: password });
  // };

  return { requestPasswordResetEmail,  };
};
