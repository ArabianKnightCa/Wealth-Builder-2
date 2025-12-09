import React from 'react';
import { LOCATION_SELECTOR_CONFIG } from '../config/locationSelectorConfig';

// Import all location selector options
import LocationSelectorSimpleDropdowns from './LocationSelector_SimpleDropdowns';
import LocationSelectorGooglePlaces from './LocationSelector_GooglePlaces';
import LocationSelectorModal from './LocationSelector_Modal';
import LocationSelectorAutocomplete from './LocationSelector_Autocomplete';

/**
 * Location Selector Wrapper
 * 
 * Smart wrapper that switches between different location selector implementations
 * based on configuration in locationSelectorConfig.js
 * 
 * TO SWITCH OPTIONS: Edit /app/frontend/src/config/locationSelectorConfig.js
 */
function LocationSelectorWrapper({ value, onChange, token }) {
  const { activeOption } = LOCATION_SELECTOR_CONFIG;

  // Render the active option
  switch (activeOption) {
    case 'google':
      return (
        <LocationSelectorGooglePlaces
          value={value}
          onChange={onChange}
          token={token}
        />
      );
    
    case 'modal':
      return (
        <LocationSelectorModal
          value={value}
          onChange={onChange}
          token={token}
        />
      );
    
    case 'autocomplete':
      return (
        <LocationSelectorAutocomplete
          value={value}
          onChange={onChange}
          token={token}
        />
      );
    
    case 'simple':
    default:
      return (
        <LocationSelectorSimpleDropdowns
          value={value}
          onChange={onChange}
        />
      );
  }
}

export default LocationSelectorWrapper;
