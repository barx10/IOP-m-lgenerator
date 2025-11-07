import type { StudentProfile, Framework, IopConstructionKit } from '../types';

// Callback type for streaming updates (not implemented in backend version)
type StreamCallback = (partial: Partial<IopConstructionKit>) => void;

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
    
    const response = await fetch(`${API_URL}/api/generate-iop`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
