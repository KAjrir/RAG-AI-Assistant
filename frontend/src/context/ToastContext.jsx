import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import '../styles/toast.css';

const ToastContext = createContext(null);
let nextId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers              = useRef({});

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current[id]);
    delete timers.current[id];
    setToasts(prev => prev.map(t => t.id === id ? { ...t, leaving: true } : t));
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 200);
  }, []);

  const show = useCallback((type, message, duration) => {
    const id = ++nextId;
    setToasts(prev => [...prev, { id, type, message, leaving: false }].slice(-4));
    timers.current[id] = setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  const toast = useMemo(() => ({
    success: (message, duration = 4000) => show('success', message, duration),
    error:   (message, duration = 6000) => show('error', message, duration),
    dismiss,
  }), [show, dismiss]);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-region">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`toast toast--${t.type} ${t.leaving ? 'toast--leaving' : ''}`}
            role={t.type === 'error' ? 'alert' : 'status'}
          >
            <span className="toast-icon">
              {t.type === 'success' ? <SuccessIcon /> : <ErrorIcon />}
            </span>
            <p className="toast-message">{t.message}</p>
            <button className="toast-close" onClick={() => dismiss(t.id)} aria-label="Sluiten">
              <CloseIcon />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

function SuccessIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M5 8.3l2 2 4-4.3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3"/>
      <line x1="8" y1="4.8" x2="8" y2="8.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <circle cx="8" cy="11" r="0.8" fill="currentColor"/>
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M2.5 2.5l7 7M9.5 2.5l-7 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}