import React, { useState } from 'react';
import LocationSelectorGooglePlaces from '../components/LocationSelector_GooglePlaces';
import LocationSelectorAutocomplete from '../components/LocationSelector_Autocomplete';
import LocationSelectorModal from '../components/LocationSelector_Modal';

/**
 * Demo Page: Compare all 3 Location Selector Options
 * 
 * Test each option and choose the best one for your registration flow
 */
function LocationSelectorDemo({ token }) {
  const [location1, setLocation1] = useState(null);
  const [location2, setLocation2] = useState(null);
  const [location3, setLocation3] = useState(null);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-navy-900 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Location Selector Comparison</h1>
          <p className="text-gray-300">Test all 3 options and choose the best one for your needs</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8">
        {/* Introduction */}
        <div className="card mb-8 bg-blue-50 border-2 border-blue-200">
          <h2 className="text-xl font-bold text-navy-900 mb-3">🧪 How to Use This Demo</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Test each location selector option below</li>
            <li>Try the different interaction methods (geolocation, search, modal)</li>
            <li>Compare user experience on desktop and mobile</li>
            <li>Choose your favorite to integrate into registration</li>
          </ol>
        </div>

        {/* Option 6: Google Places API */}
        <div className="card mb-8">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">🎯</span>
              <h2 className="text-2xl font-bold text-navy-900">
                Option 6: Google Places API Integration
              </h2>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-700 mb-2">
                <strong>Features:</strong> Geolocation detection + Manual search with autocomplete
              </p>
              <p className="text-sm text-gray-700 mb-2">
                <strong>Best for:</strong> Users who want instant detection or power search
              </p>
              <p className="text-sm text-gray-700">
                <strong>Pros:</strong> Fast, accurate, modern UX | <strong>Cons:</strong> Requires API key (paid after free tier)
              </p>
            </div>
          </div>

          <LocationSelectorGooglePlaces
            value={location1}
            onChange={setLocation1}
            token={token}
          />

          {location1 && (
            <div className="mt-4 bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-sm font-semibold text-gray-700 mb-2">Selected Data:</p>
              <pre className="text-xs bg-white p-3 rounded border border-gray-200 overflow-x-auto">
                {JSON.stringify(location1, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Option 3: Search Autocomplete */}
        <div className="card mb-8">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">🔍</span>
              <h2 className="text-2xl font-bold text-navy-900">
                Option 3: Search Autocomplete
              </h2>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-700 mb-2">
                <strong>Features:</strong> Type-ahead search with keyboard navigation
              </p>
              <p className="text-sm text-gray-700 mb-2">
                <strong>Best for:</strong> Power users who type fast
              </p>
              <p className="text-sm text-gray-700">
                <strong>Pros:</strong> Fast input, keyboard shortcuts | <strong>Cons:</strong> Requires typing skills
              </p>
            </div>
          </div>

          <LocationSelectorAutocomplete
            value={location2}
            onChange={setLocation2}
            token={token}
          />

          {location2 && (
            <div className="mt-4 bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-sm font-semibold text-gray-700 mb-2">Selected Data:</p>
              <pre className="text-xs bg-white p-3 rounded border border-gray-200 overflow-x-auto">
                {JSON.stringify(location2, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Option 2: Modal Picker */}
        <div className="card mb-8">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">📱</span>
              <h2 className="text-2xl font-bold text-navy-900">
                Option 2: Modal Picker (iOS Style)
              </h2>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-700 mb-2">
                <strong>Features:</strong> Single tap opens modal with country + city dropdowns
              </p>
              <p className="text-sm text-gray-700 mb-2">
                <strong>Best for:</strong> Mobile-first design, keeps form compact
              </p>
              <p className="text-sm text-gray-700">
                <strong>Pros:</strong> Clean, mobile-friendly, familiar | <strong>Cons:</strong> Extra tap required
              </p>
            </div>
          </div>

          <LocationSelectorModal
            value={location3}
            onChange={setLocation3}
            token={token}
          />

          {location3 && (
            <div className="mt-4 bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-sm font-semibold text-gray-700 mb-2">Selected Data:</p>
              <pre className="text-xs bg-white p-3 rounded border border-gray-200 overflow-x-auto">
                {JSON.stringify(location3, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Comparison Summary */}
        <div className="card bg-gradient-to-br from-navy-50 to-gold-50 border-2 border-gold">
          <h2 className="text-2xl font-bold text-navy-900 mb-4">📊 Quick Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-navy-900 text-white">
                  <th className="px-4 py-3 text-left">Feature</th>
                  <th className="px-4 py-3 text-center">Option 6</th>
                  <th className="px-4 py-3 text-center">Option 3</th>
                  <th className="px-4 py-3 text-center">Option 2</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-semibold">Geolocation</td>
                  <td className="px-4 py-3 text-center">✅</td>
                  <td className="px-4 py-3 text-center">❌</td>
                  <td className="px-4 py-3 text-center">❌</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-semibold">Autocomplete</td>
                  <td className="px-4 py-3 text-center">✅</td>
                  <td className="px-4 py-3 text-center">✅</td>
                  <td className="px-4 py-3 text-center">❌</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-semibold">Mobile Optimized</td>
                  <td className="px-4 py-3 text-center">⭐⭐⭐</td>
                  <td className="px-4 py-3 text-center">⭐⭐</td>
                  <td className="px-4 py-3 text-center">⭐⭐⭐</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-semibold">Fast Input</td>
                  <td className="px-4 py-3 text-center">⭐⭐⭐</td>
                  <td className="px-4 py-3 text-center">⭐⭐⭐</td>
                  <td className="px-4 py-3 text-center">⭐⭐</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-semibold">Form Compactness</td>
                  <td className="px-4 py-3 text-center">⭐⭐</td>
                  <td className="px-4 py-3 text-center">⭐⭐⭐</td>
                  <td className="px-4 py-3 text-center">⭐⭐⭐</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-semibold">No API Key Needed</td>
                  <td className="px-4 py-3 text-center">❌</td>
                  <td className="px-4 py-3 text-center">✅</td>
                  <td className="px-4 py-3 text-center">✅</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Recommendation */}
        <div className="card mt-8 bg-gold text-navy-900">
          <h3 className="text-xl font-bold mb-3">💡 Recommendation</h3>
          <p className="mb-3">
            <strong>For POC/Testing:</strong> Use <strong>Option 6</strong> (already integrated in registration) with mock data. It provides the best UX.
          </p>
          <p className="mb-3">
            <strong>For Production:</strong> Switch to <strong>Option 3</strong> if you want to avoid Google Places API costs, or upgrade Option 6 with a real API key for best experience.
          </p>
          <p>
            <strong>For Mobile-First Apps:</strong> <strong>Option 2</strong> (Modal Picker) is the cleanest and most familiar to mobile users.
          </p>
        </div>
      </div>
    </div>
  );
}

export default LocationSelectorDemo;
