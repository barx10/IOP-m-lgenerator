// PIN-gate storage key (changed to invalidate old stored pins)
const PIN_STORAGE_KEY = 'iop-pingate-code-v2';

// Store PIN code in localStorage
export const storePinCode = (pin: string): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PIN_STORAGE_KEY, pin);
  } catch {
    // Ignore storage errors
  }
};

// Clear stored PIN code
export const clearStoredPinCode = (): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(PIN_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
};
