/**
 * Safe localStorage wrapper
 * Handles cases where localStorage is blocked (e.g., in iframes, private browsing)
 */

const memoryStorage = new Map<string, string>();
let isLocalStorageBlocked = false;

export const safeStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    
    if (isLocalStorageBlocked) {
      return memoryStorage.get(key) || null;
    }
    
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn('⚠️ localStorage blocked, using memory storage');
      isLocalStorageBlocked = true;
      return memoryStorage.get(key) || null;
    }
  },

  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    
    // Always save to memory as backup
    memoryStorage.set(key, value);
    
    if (isLocalStorageBlocked) return;
    
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn('⚠️ localStorage blocked, using memory storage only');
      isLocalStorageBlocked = true;
    }
  },

  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return;
    
    memoryStorage.delete(key);
    
    if (isLocalStorageBlocked) return;
    
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn('⚠️ localStorage blocked');
      isLocalStorageBlocked = true;
    }
  },

  clear: (): void => {
    if (typeof window === 'undefined') return;
    
    memoryStorage.clear();
    
    if (isLocalStorageBlocked) return;
    
    try {
      localStorage.clear();
    } catch (e) {
      console.warn('⚠️ localStorage blocked');
      isLocalStorageBlocked = true;
    }
  }
};
