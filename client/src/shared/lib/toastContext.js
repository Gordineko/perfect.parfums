"use client";

import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

const ToastContext = createContext(null);

const DEFAULT_AUTO_HIDE_MS = 3000;

export function ToastProvider({ children }) {
  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "info",
    autoHideDuration: DEFAULT_AUTO_HIDE_MS,
  });

  const close = useCallback(() => {
    setToast((prev) => ({ ...prev, open: false }));
  }, []);

  const show = useCallback((next) => {
    const message = String(next?.message || "").trim();
    if (!message) return;

    setToast({
      open: true,
      message,
      severity: next?.severity || "info",
      autoHideDuration:
        typeof next?.autoHideDuration === "number"
          ? next.autoHideDuration
          : DEFAULT_AUTO_HIDE_MS,
    });
  }, []);

  const api = useMemo(
    () => ({
      show,
      success: (message, opts) => show({ ...opts, severity: "success", message }),
      error: (message, opts) => show({ ...opts, severity: "error", message }),
      info: (message, opts) => show({ ...opts, severity: "info", message }),
      warning: (message, opts) => show({ ...opts, severity: "warning", message }),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <Snackbar
        open={toast.open}
        onClose={close}
        autoHideDuration={toast.autoHideDuration}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={close}
          severity={toast.severity}
          variant="outlined"
          sx={{
            width: "100%",
            borderRadius: 0,
            ...(toast.severity === "success"
              ? {
                  backgroundColor: "#10B98133",
                  border: "1px solid #10B981",
                  color: "#10B981",
                  "& .MuiAlert-icon": { color: "#10B981" },
                }
              : null),
          }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}

