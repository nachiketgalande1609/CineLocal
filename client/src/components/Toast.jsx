import React, { createContext, useContext, useState, useCallback } from "react";
import styles from "./Toast.module.css";

const Ctx = createContext(null);
let _seq = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((message, type = "info", duration = 4000) => {
    const id = ++_seq;
    setToasts((p) => [...p.slice(-4), { id, message, type, out: false }]);
    const timer = setTimeout(() => {
      setToasts((p) => p.map((t) => (t.id === id ? { ...t, out: true } : t)));
      setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 350);
    }, duration);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((p) => p.filter((t) => t.id !== id));
  }, []);

  return (
    <Ctx.Provider value={toast}>
      {children}
      <div className={styles.stack} aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`${styles.toast} ${styles[t.type] || ""} ${t.out ? styles.out : ""}`}
            role="alert"
          >
            <span className={styles.icon}>{ICONS[t.type]}</span>
            <span className={styles.msg}>{t.message}</span>
            <button className={styles.x} onClick={() => dismiss(t.id)} aria-label="Dismiss">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  return useContext(Ctx) ?? (() => {});
}

const ICONS = {
  success: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  error: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="12" cy="12" r="10"/>
      <line x1="15" y1="9" x2="9" y2="15"/>
      <line x1="9" y1="9" x2="15" y2="15"/>
    </svg>
  ),
  warning: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="3"/>
    </svg>
  ),
  info: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="3"/>
    </svg>
  ),
};
