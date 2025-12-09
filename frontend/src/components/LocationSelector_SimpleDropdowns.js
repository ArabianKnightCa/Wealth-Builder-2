import React, { useState, useEffect } from 'react';

/**
 * Simple Country + City Dropdowns (Active in Registration)
 * 
 * Clean, simple dropdown fields for country and city selection.
 * Other fancy options (Google API, iOS Modal, Autocomplete) are ready in background.
 */

const COUNTRIES_AND_CITIES = {
  "United States": ["San Francisco", "San Jose", "Los Angeles", "New York", "Chicago", "Seattle", "Boston", "Austin", "Miami", "Denver"],
  "United Kingdom": ["London", "Manchester", "Birmingham", "Edinburgh", "Glasgow"],
  "Canada": ["Toronto", "Vancouver", "Montreal", "Calgary", "Ottawa"],
  "Australia": ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide"],
  "India": ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Kolkata"],
  "France": ["Paris", "Lyon", "Marseille", "Toulouse", "Nice"],
  "Germany": ["Berlin", "Munich", "Hamburg", "Frankfurt", "Cologne"],
  "Spain": ["Madrid", "Barcelona", "Valencia", "Seville", "Bilbao"],
  "Italy": ["Rome", "Milan", "Naples", "Turin", "Florence"],
  "Japan": ["Tokyo", "Osaka", "Kyoto", "Yokohama", "Nagoya"],
  "Singapore": ["Singapore"],
  "United Arab Emirates": ["Dubai", "Abu Dhabi", "Sharjah"],
  "Netherlands": ["Amsterdam", "Rotterdam", "The Hague", "Utrecht"],
};

function LocationSelectorSimpleDropdowns({ value, onChange }) {
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [availableCities, setAvailableCities] = useState([]);

  useEffect(() => {
    if (value && value.country) {
      setSelectedCountry(value.country);
      setSelectedCity(value.city || '');
      setAvailableCities(COUNTRIES_AND_CITIES[value.country] || []);
    }
  }, [value]);

  const handleCountryChange = (country) => {
    setSelectedCountry(country);
    setSelectedCity('');
    setAvailableCities(COUNTRIES_AND_CITIES[country] || []);
    
    // Clear city selection when country changes
    onChange({
      country,
      city: '',
      country_code: getCountryCode(country),
    });
  };

  const handleCityChange = (city) => {
    setSelectedCity(city);
    
    onChange({
      country: selectedCountry,
      city,
      country_code: getCountryCode(selectedCountry),
      formatted_address: `${city}, ${selectedCountry}`
    });
  };

  const getCountryCode = (countryName) => {
    const codes = {
      "United States": "US",
      "United Kingdom": "GB",
      "Canada": "CA",
      "Australia": "AU",
      "India": "IN",
      "France": "FR",
      "Germany": "DE",
      "Spain": "ES",
      "Italy": "IT",
      "Japan": "JP",
      "Singapore": "SG",
      "United Arab Emirates": "AE",
      "Netherlands": "NL",
    };
    return codes[countryName] || "";
  };

  return (
    <div className="space-y-4">
      {/* Country Dropdown */}
      <div>
        <label className="block text-gray-700 font-semibold mb-2">
          Country
        </label>
        <select
          value={selectedCountry}
          onChange={(e) => handleCountryChange(e.target.value)}
          className="input-field"
          required
        >
          <option value="">Select country...</option>
          {Object.keys(COUNTRIES_AND_CITIES).sort().map((country) => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </select>
      </div>

      {/* City Dropdown */}
      <div>
        <label className="block text-gray-700 font-semibold mb-2">
          City
        </label>
        <select
          value={selectedCity}
          onChange={(e) => handleCityChange(e.target.value)}
          className="input-field"
          disabled={!selectedCountry}
          required
        >
          <option value="">
            {selectedCountry ? "Select city..." : "Select country first..."}
          </option>
          {availableCities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default LocationSelectorSimpleDropdowns;
