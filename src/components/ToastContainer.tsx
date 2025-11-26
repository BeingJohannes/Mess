import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'motion/react';
import { ToastNotification, ToastType } from './ToastNotification';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

// Singleton toast manager
class ToastManager {
  private listeners: Set<(toasts: Toast[]) => void> = new Set();
  private toasts: Toast[] = [];
  private toastTimeouts: Map<string, NodeJS.Timeout> = new Map();

  subscribe(listener: (toasts: Toast[]) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(listener => listener([...this.toasts]));
  }

  add(message: string, type: ToastType = 'info', duration: number = 5000) {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const toast: Toast = { id, message, type, duration };
    
    this.toasts.push(toast);
    this.notify();

    // Auto-dismiss after duration
    const timeout = setTimeout(() => {
      this.remove(id);
    }, duration);
    
    this.toastTimeouts.set(id, timeout);
  }

  remove(id: string) {
    // Clear timeout if exists
    const timeout = this.toastTimeouts.get(id);
    if (timeout) {
      clearTimeout(timeout);
      this.toastTimeouts.delete(id);
    }

    this.toasts = this.toasts.filter(t => t.id !== id);
    this.notify();
  }

  clear() {
    // Clear all timeouts
    this.toastTimeouts.forEach(timeout => clearTimeout(timeout));
    this.toastTimeouts.clear();
    
    this.toasts = [];
    this.notify();
  }
}

export const toastManager = new ToastManager();

interface ToastContainerProps {
  variant?: 'standalone' | 'sidebar';
}

export function ToastContainer({ variant = 'standalone' }: ToastContainerProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const unsubscribe = toastManager.subscribe(setToasts);
    return unsubscribe;
  }, []);

  const handleClose = useCallback((id: string) => {
    toastManager.remove(id);
  }, []);

  const containerClasses = variant === 'sidebar'
    ? "absolute bottom-0 left-0 right-0 w-full p-6 pointer-events-auto flex flex-col-reverse gap-3 max-h-full overflow-y-auto"
    : "relative w-full p-4 pointer-events-auto flex flex-col-reverse gap-3 max-h-96 overflow-y-auto";

  return (
    <div className={containerClasses}>
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastNotification
            key={toast.id}
            id={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={handleClose}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}