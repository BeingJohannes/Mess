import React from 'react';
import { toastManager } from '../components/ToastContainer';

export function showToast(
  message: string, 
  options?: {
    type?: 'success' | 'info' | 'warning' | 'error';
    showConfetti?: boolean;
    duration?: number;
  }
) {
  const { type = 'info', duration = 5000 } = options || {};
  toastManager.add(message, type, duration);
}

// Convenience methods
export const toastHelper = {
  success: (message: string, showConfetti = false) => 
    showToast(message, { type: 'success' }),
  
  info: (message: string) => 
    showToast(message, { type: 'info' }),
  
  warning: (message: string) => 
    showToast(message, { type: 'warning' }),
  
  error: (message: string) => 
    showToast(message, { type: 'error' }),
};