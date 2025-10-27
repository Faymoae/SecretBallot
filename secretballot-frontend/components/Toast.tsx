"use client";

/**
 * Toast Notification Component
 * Beautiful glassmorphism toast notifications
 */

import { useEffect } from "react";

export type ToastType = "success" | "error" | "info" | "warning";

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, type, onClose, duration = 5000 }: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const icons = {
    success: "✅",
    error: "❌",
    info: "ℹ️",
    warning: "⚠️",
  };

  const styles = {
    success: "from-green-500/20 to-emerald-500/20 border-green-500/30 text-green-700 dark:text-green-300",
    error: "from-red-500/20 to-rose-500/20 border-red-500/30 text-red-700 dark:text-red-300",
    info: "from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-700 dark:text-blue-300",
    warning: "from-yellow-500/20 to-amber-500/20 border-yellow-500/30 text-yellow-700 dark:text-yellow-300",
  };

  return (
    <div
      className={`
        fixed top-4 right-4 z-50 max-w-md w-full
        animate-in slide-in-from-top-5 fade-in duration-300
      `}
    >
      <div
        className={`
          glass rounded-xl p-4 border-2
          bg-gradient-to-br backdrop-blur-xl
          shadow-2xl
          ${styles[type]}
        `}
      >
        <div className="flex items-start gap-3">
          <div className="text-2xl flex-shrink-0">{icons[type]}</div>
          <div className="flex-1 min-w-0">
            <p className="font-medium break-words">{message}</p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

interface ToastContainerProps {
  toasts: Array<{ id: string; message: string; type: ToastType }>;
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-md w-full pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => onRemove(toast.id)}
          />
        </div>
      ))}
    </div>
  );
}

