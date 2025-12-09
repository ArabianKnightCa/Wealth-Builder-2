import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

/**
 * Option 3: Search Autocomplete Component
 * 
 * Features:
 * - Type-ahead search for city names
 * - Combined country/city in single field
 * - Fast for power users
 * - Keyboard navigation support
 */
function LocationSelectorAutocomplete({ value, onChange, token }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(value || null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  useEffect(() => {
    if (value) {
      setSelectedLocation(value);
      setSearchQuery(value.formatted_address || '');
    }
  }, [value]);

  const handleSearchChange = async (query) => {
    setSearchQuery(query);
    setHighlightedIndex(-1);

    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoading(true);
    setShowSuggestions(true);

    try {
      const response = await axios.post(
        `${API}/location/search`,
        { query },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );

      setSuggestions(response.data.suggestions || []);
      setLoading(false);
    } catch (err) {
      console.error('Search error:', err);
      setSuggestions([]);
      setLoading(false);
    }
  };

  const handleSelectSuggestion = (suggestion) => {
    setSelectedLocation(suggestion);
    setSearchQuery(suggestion.formatted_address);
    setSuggestions([]);
    setShowSuggestions(false);
    onChange(suggestion);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          handleSelectSuggestion(suggestions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        inputRef.current?.blur();
        break;
      default:
        break;
    }
  };

  const handleClearSelection = () => {
    setSelectedLocation(null);
    setSearchQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    onChange(null);
    inputRef.current?.focus();
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0 && searchQuery.length >= 2) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    // Delay to allow click on suggestion
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  return (
    <div className="space-y-3">
      <label className="block text-gray-700 font-semibold mb-2">
        🔍 Location (City, Country)
      </label>

      {/* Search Input */}
      <div className="relative">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              placeholder="Start typing... (e.g., San Francisco, London, Tokyo)"
              className="input-field pr-10"
            />
            {loading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <span className="animate-spin">⏳</span>
              </div>
            )}
          </div>
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

        {/* Autocomplete Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto"
          >
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectSuggestion(suggestion)}
                onMouseEnter={() => setHighlightedIndex(idx)}
                className={`w-full px-4 py-3 text-left border-b border-gray-100 last:border-b-0 transition-colors ${
                  idx === highlightedIndex ? 'bg-blue-100' : 'hover:bg-blue-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📍</span>
                  <div>
                    <div className="font-medium text-gray-900">
                      {suggestion.city}
                    </div>
                    <div className="text-sm text-gray-600">
                      {suggestion.country}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* No results message */}
        {showSuggestions && !loading && searchQuery.length >= 2 && suggestions.length === 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center text-gray-500">
            No locations found for "{searchQuery}"
          </div>
        )}
      </div>

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
                  {selectedLocation.latitude.toFixed(4)}, {selectedLocation.longitude.toFixed(4)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <p className="text-xs text-gray-500">
        💡 <strong>Tip:</strong> Type at least 2 characters. Use ↑↓ arrows to navigate, Enter to select, Esc to close.
      </p>
    </div>
  );
}

export default LocationSelectorAutocomplete;
