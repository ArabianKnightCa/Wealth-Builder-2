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
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Profile Management</h2>

      {/* Current Profile */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Current Profile
        </label>
        <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-5xl">{currentProfile?.avatar || '👤'}</div>
          <div className="flex-1">
            <div className="font-semibold text-lg text-gray-800">
              {currentProfile?.name || 'User'}
            </div>
            <div className="text-sm text-gray-600">
              {currentProfile?.age} years old
              {currentProfile?.is_primary && ' • Account Owner'}
            </div>
          </div>
          <button
            onClick={() => setShowSwitcher(!showSwitcher)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Switch Profile
          </button>
        </div>
      </div>

      {/* Profile Switcher */}
      {showSwitcher && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-3">Select Profile:</h3>
          <div className="space-y-2">
            {profiles.map(profile => (
              <div
                key={profile.id}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                  currentProfile?.id === profile.id
                    ? 'bg-blue-100 border border-blue-300'
                    : 'bg-white border border-gray-200 hover:bg-gray-50'
                }`}
                onClick={() => handleSwitchProfile(profile)}
              >
                <div className="text-3xl">{profile.avatar}</div>
                <div className="flex-1">
                  <div className="font-medium text-gray-800">{profile.name}</div>
                  <div className="text-sm text-gray-500">{profile.age} years old</div>
                </div>
                {currentProfile?.id === profile.id && (
                  <div className="text-sm text-blue-600 font-medium">Current</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Profiles */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold text-gray-800">All Profiles ({profiles.length}/5)</h3>
          {profiles.length < 5 && (
            <button
              onClick={() => navigate('/profiles/add')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              + Add Profile
            </button>
          )}
        </div>

        <div className="space-y-2">
          {profiles.map(profile => (
            <div
              key={profile.id}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
            >
              <div className="text-3xl">{profile.avatar}</div>
              <div className="flex-1">
                <div className="font-medium text-gray-800">{profile.name}</div>
                <div className="text-sm text-gray-500">
                  {profile.age} years old • Experience: {profile.experience_level}/5
                  {profile.ppi_completed && ' • PPI Completed'}
                </div>
              </div>
              {!profile.is_primary && (
                <button
                  onClick={() => handleDeleteProfile(profile.id)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Delete
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">About Multi-Profile</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Each profile has its own learning progress</li>
          <li>• PPI results are unique to each profile</li>
          <li>• Content is personalized per profile</li>
          <li>• Maximum 5 profiles per account</li>
        </ul>
      </div>
    </div>
  );
}

export default ProfileManager;
