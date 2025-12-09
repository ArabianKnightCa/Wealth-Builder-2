/**
 * Location Selector Configuration
 * 
 * EASY SWITCHING: Change the activeOption to activate different location selectors
 * 
 * Options:
 * - 'simple': Simple dropdown fields (ACTIVE NOW)
 * - 'google': Google Places API with geolocation (ready in background)
 * - 'modal': iOS-style modal picker (ready in background)
 * - 'autocomplete': Type-ahead autocomplete (ready in background)
 */

export const LOCATION_SELECTOR_CONFIG = {
  // CURRENT ACTIVE OPTION
  activeOption: 'google',  // Changed to 'google' for geolocation + search bar
  
  // GOOGLE PLACES API SETTINGS (ready for when you add API key)
  google: {
    enabled: false,  // Set to true when GOOGLE_PLACES_API_KEY is added to backend .env
    apiKey: process.env.REACT_APP_GOOGLE_PLACES_API_KEY || null,
    fallbackToMock: true,  // Use mock data if API key not available
  },
  
  // IOS MODAL SETTINGS (ready for iPhone users)
  modal: {
    enabled: false,  // Set to true to activate iOS-style modal
    detectMobile: true,  // Auto-switch to modal on mobile devices
  },
  
  // AUTOCOMPLETE SETTINGS (ready for power users)
  autocomplete: {
    enabled: false,  // Set to true for type-ahead search
    minCharacters: 2,
    keyboardNavigation: true,
  },
};

// Helper function to detect mobile devices
export const isMobileDevice = () => {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
};

// Helper function to detect iOS specifically
export const isIOSDevice = () => {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
};

/**
 * HOW TO ACTIVATE DIFFERENT OPTIONS:
 * 
 * 1. FOR GOOGLE PLACES API:
 *    - Add GOOGLE_PLACES_API_KEY to /app/backend/.env
 *    - Set google.enabled = true
 *    - Set activeOption = 'google'
 * 
 * 2. FOR IOS MODAL:
 *    - Set modal.enabled = true
 *    - Set activeOption = 'modal'
 *    - Or enable modal.detectMobile for auto-switching
 * 
 * 3. FOR AUTOCOMPLETE:
 *    - Set autocomplete.enabled = true
 *    - Set activeOption = 'autocomplete'
 * 
 * 4. KEEP SIMPLE DROPDOWNS:
 *    - Leave activeOption = 'simple' (current setting)
 */
