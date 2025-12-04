import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

/**
 * Profile Manager Component
 * Shows current profile and allows switching/managing profiles
 */
function ProfileManager({ token, currentProfile, onProfileSwitch }) {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSwitcher, setShowSwitcher] = useState(false);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const response = await axios.get(`${API}/profiles`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfiles(response.data.profiles);
    } catch (error) {
      console.error('Failed to fetch profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchProfile = async (profile) => {
    try {
      await axios.post(
        `${API}/profiles/${profile.id}/activate`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      onProfileSwitch(profile);
      setShowSwitcher(false);
    } catch (error) {
      console.error('Failed to switch profile:', error);
    }
  };

  const handleDeleteProfile = async (profileId) => {
    if (!window.confirm('Are you sure you want to delete this profile? All progress will be lost.')) {
      return;
    }

    try {
      await axios.delete(`${API}/profiles/${profileId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Refresh profiles list
      fetchProfiles();
    } catch (error) {
      console.error('Failed to delete profile:', error);
      alert(error.response?.data?.detail || 'Failed to delete profile');
    }
  };

  if (loading) {
    return <div className="text-gray-600">Loading profiles...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Manage Profiles</h2>
        {profiles.length < 5 && (
          <button
            onClick={() => navigate('/profiles/add')}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            + Add Profile
          </button>
        )}
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Click a profile to switch. ({profiles.length}/5 profiles)
      </p>

      {/* All Profiles - Click to Switch */}
      <div className="space-y-3">
        {profiles.map(profile => (
          <div
            key={profile.id}
            className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
              currentProfile?.id === profile.id
                ? 'bg-blue-50 border-blue-500 shadow-md'
                : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow cursor-pointer'
            }`}
            onClick={() => currentProfile?.id !== profile.id && handleSwitchProfile(profile)}
          >
            {/* Avatar */}
            <div className="text-4xl sm:text-5xl">{profile.avatar}</div>
            
            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div className="font-semibold text-base sm:text-lg text-gray-800 truncate">
                  {profile.name}
                </div>
                {currentProfile?.id === profile.id && (
                  <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                    Active
                  </span>
                )}
                {profile.is_primary && (
                  <span className="bg-gold/20 text-gold text-xs px-2 py-0.5 rounded-full font-medium">
                    Owner
                  </span>
                )}
              </div>
              <div className="text-xs sm:text-sm text-gray-600 mt-0.5">
                {profile.age} years old • Level {profile.experience_level}/5
                {profile.ppi_completed && ' • ✓ PPI Done'}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {currentProfile?.id !== profile.id && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSwitchProfile(profile);
                  }}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs sm:text-sm font-medium hover:bg-blue-200 transition-colors"
                >
                  Switch
                </button>
              )}
              {!profile.is_primary && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteProfile(profile.id);
                  }}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Delete Profile"
                >
                  🗑️
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
        <div className="text-xs sm:text-sm text-blue-800 space-y-1">
          <p>• Click any profile to switch to it</p>
          <p>• Each profile has separate progress and personalization</p>
          <p>• Owner profile cannot be deleted</p>
        </div>
      </div>
    </div>
  );
}

export default ProfileManager;
