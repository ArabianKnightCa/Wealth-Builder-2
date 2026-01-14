import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

/**
 * Profile Manager Component
 * Shows current profile and allows switching/managing profiles
 */
function ProfileManager({ token, currentProfile, onProfileSwitch, darkMode = false }) {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

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

  // Theme classes
  const bgClass = darkMode ? 'bg-gray-800' : 'bg-white';
  const textClass = darkMode ? 'text-white' : 'text-gray-800';
  const subTextClass = darkMode ? 'text-gray-400' : 'text-gray-600';
  const borderClass = darkMode ? 'border-gray-600' : 'border-gray-200';
  const hoverBgClass = darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50';
  const activeBgClass = darkMode ? 'bg-gold/10 border-gold' : 'bg-gold/10 border-gold';
  const infoBgClass = darkMode ? 'bg-gray-700' : 'bg-blue-50';
  const infoTextClass = darkMode ? 'text-gray-300' : 'text-blue-800';
  const infoBorderClass = darkMode ? 'border-gray-600' : 'border-blue-200';

  if (loading) {
    return (
      <div className={`p-6 ${bgClass}`}>
        <div className={`${subTextClass}`}>Loading profiles...</div>
      </div>
    );
  }

  return (
    <div className={`${bgClass}`}>
      {/* Header */}
      <div className={`px-6 py-4 border-b ${borderClass} flex justify-between items-center`}>
        <div>
          <h3 className={`text-lg font-bold ${textClass}`}>👥 Linked Profiles</h3>
          <p className={`text-sm ${subTextClass}`}>{profiles.length}/5 profiles • Click to switch</p>
        </div>
        {profiles.length < 5 && (
          <button
            onClick={() => navigate('/profiles/add')}
            className="px-4 py-2 bg-gold text-navy-900 rounded-lg hover:bg-yellow-400 transition-colors text-sm font-semibold"
            data-testid="add-profile-btn"
          >
            + Add Profile
          </button>
        )}
      </div>

      {/* Profiles List */}
      <div className="p-4 space-y-2">
        {profiles.map(profile => {
          const isActive = currentProfile?.id === profile.id;
          
          return (
            <div
              key={profile.id}
              className={`flex items-center gap-4 p-3 rounded-lg border-2 transition-all cursor-pointer ${
                isActive
                  ? activeBgClass
                  : `${borderClass} ${hoverBgClass}`
              }`}
              onClick={() => !isActive && handleSwitchProfile(profile)}
              data-testid={`profile-${profile.id}`}
            >
              {/* Avatar */}
              <div className="text-3xl flex-shrink-0">{profile.avatar}</div>
              
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`font-semibold ${textClass} truncate`}>
                    {profile.name}
                  </span>
                  {isActive && (
                    <span className="bg-gold text-navy-900 text-xs px-2 py-0.5 rounded-full font-bold">
                      Active
                    </span>
                  )}
                  {profile.is_primary && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${darkMode ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-600'}`}>
                      Owner
                    </span>
                  )}
                </div>
                <p className={`text-xs ${subTextClass} mt-0.5`}>
                  {profile.age} yrs • Level {profile.experience_level}/5
                  {profile.ppi_completed && ' • ✓ PPI'}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {!isActive && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSwitchProfile(profile);
                    }}
                    className="px-3 py-1.5 bg-gold text-navy-900 rounded-lg text-xs font-semibold hover:bg-yellow-400 transition-colors"
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
                    className={`p-1.5 rounded transition-colors ${darkMode ? 'text-red-400 hover:bg-red-900/30' : 'text-red-500 hover:bg-red-50'}`}
                    title="Delete Profile"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Box */}
      <div className={`mx-4 mb-4 p-3 rounded-lg border ${infoBgClass} ${infoBorderClass}`}>
        <p className={`text-xs ${infoTextClass}`}>
          Each profile has separate progress and settings. Owner profile cannot be deleted.
        </p>
      </div>
    </div>
  );
}

export default ProfileManager;
