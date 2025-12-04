import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

/**
 * Profile Selector - Choose which family member's profile to use
 * Shown after login for accounts with multiple profiles
 */
function ProfileSelector({ token, onProfileSelected, onLogout }) {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddProfile, setShowAddProfile] = useState(false);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const response = await axios.get(`${API}/profiles`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfiles(response.data.profiles);
      
      // If only one profile and it's the primary, auto-select it
      if (response.data.profiles.length === 1 && response.data.profiles[0].is_primary) {
        handleSelectProfile(response.data.profiles[0]);
      }
    } catch (error) {
      console.error('Failed to fetch profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProfile = async (profile) => {
    try {
      await axios.post(
        `${API}/profiles/${profile.id}/activate`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      onProfileSelected(profile);
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to activate profile:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-xl text-gray-700">Loading profiles...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Who's Learning Today?</h1>
          <p className="text-gray-600">Select a profile to continue</p>
        </div>

        {/* Profiles Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {profiles.map(profile => (
            <button
              key={profile.id}
              onClick={() => handleSelectProfile(profile)}
              className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all transform hover:scale-105 flex flex-col items-center gap-3"
            >
              <div className="text-6xl">{profile.avatar}</div>
              <div className="text-center">
                <div className="font-bold text-lg text-gray-800">{profile.name}</div>
                <div className="text-sm text-gray-500">{profile.age} years old</div>
                {profile.is_primary && (
                  <div className="text-xs text-blue-600 mt-1">Account Owner</div>
                )}
              </div>
            </button>
          ))}

          {/* Add Profile Button */}
          {profiles.length < 5 && (
            <button
              onClick={() => navigate('/profiles/add')}
              className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all border-2 border-dashed border-gray-300 hover:border-blue-500 flex flex-col items-center justify-center gap-3"
            >
              <div className="text-6xl text-gray-400">➕</div>
              <div className="font-semibold text-gray-600">Add Profile</div>
            </button>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="flex justify-between items-center mt-8">
          <button
            onClick={onLogout}
            className="text-gray-600 hover:text-gray-800 underline"
          >
            Log Out
          </button>
          <div className="text-sm text-gray-500">
            {profiles.length}/5 profiles
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileSelector;
