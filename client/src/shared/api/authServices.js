const API_URL = process.env.NEXT_PUBLIC_API_URL;

import Cookies from "js-cookie";

function cookieOptionsFromRememberMe(rememberMe) {
  return rememberMe ? { expires: 30, path: "/" } : { path: "/" };
}

function resolveAuthToken(explicitToken) {
  if (explicitToken) return explicitToken;
  if (typeof window === "undefined") return null;
  return Cookies.get("auth_token") || null;
}

async function parseJsonSafe(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function httpError(status, message, data) {
  const err = new Error(message);
  err.status = status;
  if (data !== undefined) err.data = data;
  return err;
}

export async function registerUser({ email, password, firstName, ref }) {
  const response = await fetch(`${API_URL}/iam/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, firstName, ref }),
    credentials: "include",
  });

  const data = await parseJsonSafe(response);

  if (!response.ok) {
    throw httpError(
      response.status,
      data?.message || "Не вдалося зареєструватися",
      data,
    );
  }

  if (data?.token) {
    Cookies.set("auth_token", data.token, cookieOptionsFromRememberMe(true));
  }
  if (data?.user?.id) {
    Cookies.set("auth_id", data.user.id, cookieOptionsFromRememberMe(true));
  }

  return data;
}

export async function loginUser({ email, password, rememberMe = false }) {
  const response = await fetch(`${API_URL}/iam/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    credentials: "include",
  });

  const data = await parseJsonSafe(response);

  if (!response.ok) {
    throw httpError(response.status, data?.message || "Не вдалося увійти", data);
  }

  const cookieOptions = cookieOptionsFromRememberMe(rememberMe);
  if (data?.token) {
    Cookies.set("auth_token", data.token, cookieOptions);
  }
  if (data?.user?.id) {
    Cookies.set("auth_id", data.user.id, cookieOptions);
  }

  return data;
}

export async function requestPhoneAuthCode({ phone }) {
  const response = await fetch(`${API_URL}/iam/auth/phone/request-code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone }),
    credentials: "include",
  });

  const data = await parseJsonSafe(response);

  if (!response.ok) {
    throw httpError(
      response.status,
      data?.message || "Не вдалося надіслати SMS-код",
      data,
    );
  }

  return data;
}

export async function verifyPhoneAuthCode({
  phone,
  code,
  rememberMe = false,
  persistAuth = true,
}) {
  const response = await fetch(`${API_URL}/iam/auth/phone/verify-code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, code }),
    credentials: "include",
  });

  const data = await parseJsonSafe(response);

  if (!response.ok) {
    throw httpError(
      response.status,
      data?.message || "Не вдалося підтвердити SMS-код",
      data,
    );
  }

  if (persistAuth) {
    const cookieOptions = cookieOptionsFromRememberMe(rememberMe);
    if (data?.token) {
      Cookies.set("auth_token", data.token, cookieOptions);
    }
    if (data?.user?.id) {
      Cookies.set("auth_id", data.user.id, cookieOptions);
    }
  }

  return data;
}

export async function getCurrentUser(token) {
  const resolvedToken = resolveAuthToken(token);
  if (!resolvedToken) {
    throw httpError(401, "Потрібна авторизація");
  }

  const response = await fetch(`${API_URL}/iam/auth/me`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${resolvedToken}`,
    },
  });

  if (!response.ok) {
    const errorData = await parseJsonSafe(response);
    throw httpError(
      response.status,
      errorData?.message || "Помилка авторизації",
      errorData,
    );
  }

  return await parseJsonSafe(response);
}

export async function updateProfile(token, updateData) {
  const resolvedToken = resolveAuthToken(token);
  if (!resolvedToken) {
    throw httpError(401, "Потрібна авторизація");
  }

  const response = await fetch(`${API_URL}/iam/user`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${resolvedToken}`,
    },
    body: JSON.stringify(updateData),
  });

  if (!response.ok) {
    const errorData = await parseJsonSafe(response);
    const err = httpError(
      response.status,
      errorData?.message || "Не вдалося оновити профіль",
    );
    err.data = errorData;
    throw err;
  }

  return await parseJsonSafe(response);
}

export async function forgotPassword(email) {
  const response = await fetch(`${API_URL}/iam/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
    credentials: "include",
  });
  if (!response.ok) {
    const errorData = await parseJsonSafe(response);
    throw httpError(
      response.status,
      errorData?.message || "Не вдалося запросити відновлення паролю",
    );
  }
  return await parseJsonSafe(response);
}


export async function resetPassword({ token, newPassword }) {
  const response = await fetch(`${API_URL}/iam/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password: newPassword }),
    credentials: "include",
  });
  if (!response.ok) {
    const errorData = await parseJsonSafe(response);
    throw httpError(
      response.status,
      errorData?.message || "Не вдалося скинути пароль",
    );
  }
  return await parseJsonSafe(response);
}

export async function logoutUser() {
  const response = await fetch(`${API_URL}/iam/auth/logout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  if (!response.ok) {
    const errorData = await parseJsonSafe(response);
    throw httpError(response.status, errorData?.message || "Не вдалося вийти");
  }
  return await parseJsonSafe(response);
}