/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismissToast = (id) => {
    setToasts((currentToasts) =>
      currentToasts.filter((toast) => toast.id !== id),
    );
  };

  const showToast = (input) => {
    const toast =
      typeof input === "string"
        ? { title: "Success", message: input, tone: "success" }
        : input;

    const nextToast = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: toast.title || "Notice",
      message: toast.message || "",
      tone: toast.tone || "success",
    };

    setToasts((currentToasts) => [...currentToasts, nextToast]);

    window.setTimeout(() => {
      dismissToast(nextToast.id);
    }, 3200);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-stack">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`app-toast app-toast-${toast.tone}`}
            role="status"
          >
            <div>
              <p>{toast.title}</p>
              <span>{toast.message}</span>
            </div>
            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={() => dismissToast(toast.id)}
            >
              Close
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }

  return context;
};
