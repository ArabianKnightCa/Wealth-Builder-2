import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

/**
 * Option 6: Google Places API Integration Component
 * 
 * Features:
 * - Geolocation detection (Use Current Location)
 * - Manual search with autocomplete
 * - Mock geocoding (ready for real Google Places API)
 * 
 * To enable real Google Places API:
 * 1. Get API key from Google Cloud Console
 * 2. Add GOOGLE_PLACES_API_KEY to backend/.env
 * 3. Backend will automatically use real API
 */
function LocationSelectorGooglePlaces({ value, onChange, token }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [geolocating, setGeolocating] = useState(false);
  const [error, setError] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(value || null);

  useEffect(() => {
    if (value) {
      setSelectedLocation(value);
      setSearchQuery(value.formatted_address || '');
    }
  }, [value]);

  const handleUseCurrentLocation = async () => {
    setGeolocating(true);
    setError('');

    // Check if geolocation is supported
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setGeolocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Call backend to reverse geocode
          const response = await axios.post(
            `${API}/location/reverse-geocode`,
            { latitude, longitude },
            { headers: token ? { Authorization: `Bearer ${token}` } : {} }
          );

          const location = response.data;
          setSelectedLocation(location);
          setSearchQuery(location.formatted_address);
          onChange(location);
          setGeolocating(false);
        } catch (err) {
          console.error('Reverse geocoding error:', err);
          setError('Failed to get location details. Please try manual search.');
          setGeolocating(false);
        }
      },
      (err) => {
        console.error('Geolocation error:', err);
        setError('Unable to access your location. Please enable location permissions or use manual search.');
        setGeolocating(false);
      }
    );
  };

  const handleSearchChange = async (query) => {
    setSearchQuery(query);
    setError('');

    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setLoading(true);

    try {
      // Call backend geocoding API (mock or real Google Places)
      const response = await axios.post(
        `${API}/location/search`,
        { query },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );

      setSuggestions(response.data.suggestions || []);
      setLoading(false);
    } catch (err) {
      console.error('Search error:', err);
      setError('Search failed. Please try again.');
      setSuggestions([]);
      setLoading(false);
    }
  };

  const handleSelectSuggestion = (suggestion) => {
    setSelectedLocation(suggestion);
    setSearchQuery(suggestion.formatted_address);
    setSuggestions([]);
    onChange(suggestion);
  };

  const handleClearSelection = () => {
    setSelectedLocation(null);
    setSearchQuery('');
    setSuggestions([]);
    onChange(null);
  };

  return (
    <div className="space-y-3">
      {/* Instruction Text */}
      <p className="text-gray-600 text-sm mb-3">
        The place you are located the most
      </p>

      {!selectedLocation && !searchQuery && (
        <>
          {/* Geolocation Button - Show ONLY when nothing selected */}
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={geolocating}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {geolocating ? (
              <>
                <span className="animate-spin">⏳</span>
                Detecting Location...
              </>
            ) : (
              <>
                <span>🎯</span>
                Use Current Location
              </>
            )}
          </button>

          {/* OR Divider */}
          <div className="flex items-center gap-3 my-3">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="text-gray-500 text-sm">OR</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>
        </>
      )}

      {/* Manual Search - Show when user starts typing OR after geolocation button clicked */}
      <div className="relative">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="or type city name (e.g., Sacramento, USA)"
            className="input-field flex-1"
            disabled={geolocating}
          />
          {selectedLocation && (
            <button
              type="button"
              onClick={handleClearSelection}
              className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Clear selection"
            >
              ✕
            </button>
          )}
        </div>

        {/* Loading indicator */}
        {loading && (
          <div className="absolute right-3 top-3 text-gray-400">
            <span className="animate-spin">⏳</span>
          </div>
        )}

        {/* Suggestions dropdown */}
        {suggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectSuggestion(suggestion)}
                className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
              >
                <div className="font-medium text-gray-900">
                  {suggestion.city}
                </div>
                <div className="text-sm text-gray-600">
                  {suggestion.country}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Selected location display */}
      {selectedLocation && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">✅</span>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">Selected Location:</p>
              <p className="text-sm text-gray-700 mt-1">
                {selectedLocation.city}, {selectedLocation.country}
              </p>
              {selectedLocation.latitude && (
                <p className="text-xs text-gray-500 mt-1">
                  Coordinates: {selectedLocation.latitude.toFixed(4)}, {selectedLocation.longitude.toFixed(4)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Info text */}
      <p className="text-xs text-gray-500">
        💡 <strong>Tip:</strong> Allow location access for instant detection, or type your city name for manual search.
      </p>
    </div>
  );
}

export default LocationSelectorGooglePlaces;
