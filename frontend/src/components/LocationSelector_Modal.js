import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

/**
 * Option 2: Modal Picker (iOS Style) Component
 * 
 * Features:
 * - Single field that opens modal
 * - Clean, mobile-friendly design
 * - Separate country and city dropdowns in modal
 * - Better for mobile UX, keeps form compact
 */
function LocationSelectorModal({ value, onChange, token }) {
  const [showModal, setShowModal] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(value || null);

  // Mock country list (can be extended)
  const countries = [
    { code: 'US', name: 'United States' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'CA', name: 'Canada' },
    { code: 'AU', name: 'Australia' },
    { code: 'FR', name: 'France' },
    { code: 'DE', name: 'Germany' },
    { code: 'ES', name: 'Spain' },
    { code: 'IT', name: 'Italy' },
    { code: 'JP', name: 'Japan' },
    { code: 'IN', name: 'India' },
    { code: 'SG', name: 'Singapore' },
    { code: 'AE', name: 'United Arab Emirates' },
    { code: 'NL', name: 'Netherlands' },
  ];

  useEffect(() => {
    if (value) {
      setSelectedLocation(value);
    }
  }, [value]);

  useEffect(() => {
    if (selectedCountry) {
      loadCitiesForCountry(selectedCountry);
    }
  }, [selectedCountry]);

  const loadCitiesForCountry = async (countryName) => {
    setLoading(true);
    try {
      // Search for cities in the selected country
      const response = await axios.post(
        `${API}/location/search`,
        { query: countryName },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );

      const citiesInCountry = response.data.suggestions.filter(
        (s) => s.country === countryName
      );
      setCities(citiesInCountry);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load cities:', err);
      setCities([]);
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setShowModal(true);
    if (selectedLocation) {
      setSelectedCountry(selectedLocation.country);
      setSelectedCity(selectedLocation.city);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedCountry('');
    setSelectedCity('');
    setCities([]);
  };

  const handleDone = () => {
    if (selectedCountry && selectedCity) {
      const cityData = cities.find((c) => c.city === selectedCity);
      if (cityData) {
        setSelectedLocation(cityData);
        onChange(cityData);
      }
    }
    handleCloseModal();
  };

  const handleClear = () => {
    setSelectedLocation(null);
    setSelectedCountry('');
    setSelectedCity('');
    setCities([]);
    onChange(null);
  };

  return (
    <div className="space-y-3">
      <label className="block text-gray-700 font-semibold mb-2">
        📍 Location
      </label>

      {/* Display Field (Tap to Open Modal) */}
      <div
        onClick={handleOpenModal}
        className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg cursor-pointer hover:border-gold transition-colors flex items-center justify-between"
      >
        {selectedLocation ? (
          <div className="flex items-center gap-3">
            <span className="text-2xl">📍</span>
            <div>
              <div className="font-medium text-gray-900">
                {selectedLocation.city}, {selectedLocation.country}
              </div>
            </div>
          </div>
        ) : (
          <span className="text-gray-500">Tap to select location</span>
        )}
        <span className="text-gray-400">➡️</span>
      </div>

      {/* Clear Button */}
      {selectedLocation && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleClear();
          }}
          className="w-full px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm"
        >
          Clear Selection
        </button>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-navy-900 text-white p-6">
              <h3 className="text-2xl font-bold">Select Location</h3>
              <p className="text-gray-300 text-sm mt-1">
                Choose your country and city
              </p>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Country Selector */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Country
                </label>
                <select
                  value={selectedCountry}
                  onChange={(e) => {
                    setSelectedCountry(e.target.value);
                    setSelectedCity('');
                  }}
                  className="input-field"
                >
                  <option value="">Select country...</option>
                  {countries.map((country) => (
                    <option key={country.code} value={country.name}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* City Selector */}
              {selectedCountry && (
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    City
                  </label>
                  {loading ? (
                    <div className="text-center text-gray-500 py-4">
                      <span className="animate-spin text-2xl">⏳</span>
                      <p className="text-sm mt-2">Loading cities...</p>
                    </div>
                  ) : cities.length > 0 ? (
                    <select
                      value={selectedCity}
                      onChange={(e) => setSelectedCity(e.target.value)}
                      className="input-field"
                    >
                      <option value="">Select city...</option>
                      {cities.map((city, idx) => (
                        <option key={idx} value={city.city}>
                          {city.city}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-center text-gray-500 py-4 bg-gray-50 rounded-lg">
                      <p className="text-sm">
                        No cities available for {selectedCountry}
                      </p>
                      <p className="text-xs mt-1">
                        Try selecting a different country
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Instructions */}
              {!selectedCountry && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-gray-700">
                  <p className="font-semibold mb-2">📌 How to use:</p>
                  <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li>Select your country from the dropdown</li>
                    <li>Select your city from the available options</li>
                    <li>Click "Done" to confirm</li>
                  </ol>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 p-6 flex gap-3">
              <button
                type="button"
                onClick={handleCloseModal}
                className="flex-1 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDone}
                disabled={!selectedCountry || !selectedCity}
                className="flex-1 px-6 py-3 bg-gold text-white rounded-lg font-semibold hover:bg-gold-dark disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info text */}
      <p className="text-xs text-gray-500">
        💡 <strong>Tip:</strong> Tap the field above to open the location picker
      </p>
    </div>
  );
}

export default LocationSelectorModal;
