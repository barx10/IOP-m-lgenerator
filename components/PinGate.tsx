import React, { useState, useEffect } from 'react';
import { getStoredPinCode, storePinCode, clearStoredPinCode } from '../services/geminiService.backend';

interface PinGateProps {
  children: React.ReactNode;
}

// Get API URL based on environment
const getApiUrl = () => {
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:3000';
  }
  return '';
};

export const PinGate: React.FC<PinGateProps> = ({ children }) => {
  const [isUnlocked, setIsUnlocked] = useState<boolean | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    // IMPORTANT: Clear old localStorage keys to force re-login
    // This removes any old PIN codes stored with previous keys
    try {
      localStorage.removeItem('iop-pingate-code'); // Remove old key
    } catch (e) {
      // Ignore errors
    }

    // Check if PIN is already stored (with new key)
    const storedPin = getStoredPinCode();
    if (storedPin) {
      // Re-validate stored PIN on app load
      validatePin(storedPin, true);
    } else {
      setIsUnlocked(false);
    }
  }, []);

  const validatePin = async (pin: string, isSilent: boolean = false) => {
    try {
      const API_URL = getApiUrl();
      const response = await fetch(`${API_URL}/api/validate-pin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pin }),
      });

      const data = await response.json();

      if (response.ok && data.valid) {
        // PIN is valid - store it and unlock app
        storePinCode(pin);
        setIsUnlocked(true);
        return true;
      } else {
        // PIN is invalid - clear stored PIN and show error
        clearStoredPinCode();
        setIsUnlocked(false);
        if (!isSilent) {
          setError(data.error || 'Ugyldig PIN-kode');
        }
        return false;
      }
    } catch (err) {
      console.error('PIN validation error:', err);
      if (!isSilent) {
        setError('Kunne ikke validere PIN-kode. Sjekk internettforbindelsen.');
      }
      setIsUnlocked(false);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsValidating(true);

    const trimmedPin = pinInput.trim();
    if (!trimmedPin) {
      setError('Vennligst oppgi en PIN-kode');
      setIsValidating(false);
      return;
    }

    // Validate PIN against server
    await validatePin(trimmedPin, false);
    setIsValidating(false);
  };

  // Show loading state while checking
  if (isUnlocked === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue"></div>
      </div>
    );
  }

  // Show PIN input modal if not unlocked
  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-brand-blue via-purple-600 to-pink-600 rounded-2xl shadow-xl flex items-center justify-center transform rotate-3 mb-6">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">IOP Målbygger</h1>
            <p className="text-gray-600">Oppgi PIN-kode for å få tilgang</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="pin" className="block text-sm font-semibold text-gray-700 mb-2">
                PIN-kode
              </label>
              <input
                type="password"
                id="pin"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Skriv inn PIN-kode"
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue transition-all text-center tracking-widest"
                autoFocus
                autoComplete="off"
              />
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isValidating}
              className="w-full py-3 px-6 text-lg font-semibold text-white bg-gradient-to-r from-brand-blue to-purple-600 rounded-xl hover:from-brand-blue/90 hover:to-purple-700 transform hover:scale-[1.02] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isValidating ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Validerer...
                </span>
              ) : (
                'Lås opp'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Kontakt administrator hvis du ikke har mottatt PIN-kode
          </p>
        </div>
      </div>
    );
  }

  // Render children if unlocked
  return <>{children}</>;
};
