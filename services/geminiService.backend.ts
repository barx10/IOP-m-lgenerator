import type { StudentProfile, Framework, IopConstructionKit } from '../types';

// Callback type for streaming updates (not implemented in backend version)
type StreamCallback = (partial: Partial<IopConstructionKit>) => void;

// PIN-gate storage key (changed to invalidate old stored pins)
const PIN_STORAGE_KEY = 'iop-pingate-code-v2';

// Get stored PIN code from localStorage
export const getStoredPinCode = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(PIN_STORAGE_KEY);
  } catch {
    return null;
  }
};

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

// Get API URL based on environment
// In production, use same origin (relative path)
// In development, use localhost:3000 for Vite dev server
const getApiUrl = () => {
  // Check if we're in development (localhost)
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:3000';
  }
  // In production, use same origin (empty string means relative path)
  return '';
};

const API_URL = getApiUrl();

export const generateIopGoals = async (
  profile: StudentProfile,
  framework: Framework,
  selectedGoals: string[],
  expertAssessment: string,
  onStream?: StreamCallback
): Promise<IopConstructionKit> => {
  
  try {
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 55000); // 55 second timeout
    
    console.log('Calling API:', `${API_URL}/api/generate-iop`);

    // Get stored PIN code for authentication
    const pinCode = getStoredPinCode() || '';

    const response = await fetch(`${API_URL}/api/generate-iop`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Pin-Code': pinCode,
      },
      body: JSON.stringify({
        profile,
        framework,
        selectedGoals,
        expertAssessment
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    console.log('API response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));

      if (response.status === 401) {
        // Clear invalid PIN and throw specific error
        clearStoredPinCode();
        const error = new Error(errorData.error || 'Ugyldig PIN-kode.');
        (error as any).code = 'INVALID_PIN';
        throw error;
      }

      if (response.status === 429) {
        throw new Error('For mange forespørsler. Vennligst prøv igjen om en time.');
      }

      if (response.status === 504) {
        throw new Error('Serveren brukte for lang tid. Prøv med færre kompetansemål eller enklere beskrivelse.');
      }

      throw new Error(errorData.error || `Server error: ${response.status}`);
    }

    const result: IopConstructionKit = await response.json();
    
    // Call onStream with final result if provided
    if (onStream) {
      onStream(result);
    }
    
    return result;
  } catch (error: any) {
    console.error('Error calling backend API:', error);
    
    // Better error messages
    if (error.name === 'AbortError') {
      throw new Error('Serveren brukte for lang tid. Prøv med færre kompetansemål eller enklere beskrivelse.');
    }
    
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      throw new Error('Nettverksfeil. Sjekk internettforbindelsen din og prøv igjen.');
    }
    
    throw new Error(error.message || 'Ukjent feil ved generering. Prøv igjen.');
  }
};
