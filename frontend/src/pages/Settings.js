import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ProfileManager from '../components/ProfileManager';
import { FINANCIAL_GOALS_CONFIG } from '../data/financialGoals';
import LocationSelectorWrapper from '../components/LocationSelectorWrapper';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Avatar options
const AVATAR_OPTIONS = [
  "👦", "👧", "👨", "👩", "🧒", "👶",
  "🦁", "🐻", "🐼", "🐨", "🦊", "🐸",
  "⭐", "🌟", "💫", "🎯", "🎨", "📚",
  "🚀", "🌈", "🎓", "💼", "🏠", "🌱"
];

// Life stage options
const LIFE_STAGE_OPTIONS = [
  { value: 'ES', label: 'Elementary School' },
  { value: 'JH', label: 'Junior High' },
  { value: 'HS', label: 'High School' },
  { value: 'CL', label: 'College' },
  { value: 'UN', label: 'University' },
  { value: 'AD', label: 'Adult / Non-Student' }
];

// Occupation options
const OCCUPATION_OPTIONS = [
  'Student',
  'Full-Time Employee',
  'Part-Time Employee',
  'Self-Employed',
  'Business Owner',
  'Freelancer',
  'Unemployed',
  'Retired',
  'Homemaker',
  'Other'
];

function Settings({ user, token, onUserUpdate, darkMode, setDarkMode }) {
  const navigate = useNavigate();
  
  // Profile Settings
  const [profile, setProfile] = useState({
    first_name: user.first_name || '',
    avatar: user.avatar || '👤',
    profile_picture_url: user.profile_picture_url || null
  });
  
  // Personal Info
  const [personalInfo, setPersonalInfo] = useState({
    life_stage: user.life_stage || 'AD',
    occupation: user.occupation || '',
    location: user.location || null
  });
  
  // Preferences
  const [preferences, setPreferences] = useState({
    language: user.language || 'en',
    experience_level: user.experience_level || 3,
    financial_goals: user.financial_goals || [],
    notifications_enabled: user.notifications_enabled !== false,
    daily_goal_minutes: user.daily_goal_minutes || 10,
    reminder_time: user.reminder_time || '09:00',
    lesson_length: user.lesson_length || 'medium',
    enable_hints: user.enable_hints !== false,
    weekly_email: user.weekly_email !== false,
    achievement_alerts: user.achievement_alerts !== false,
    quiet_hours_start: user.quiet_hours_start || '22:00',
    quiet_hours_end: user.quiet_hours_end || '08:00'
  });
  
  // Display Settings
  const [display, setDisplay] = useState({
    dark_mode: darkMode || false,
    text_size: user.text_size || 'medium',
    reduce_animations: user.reduce_animations || false
  });
  
  // Security
  const [security, setSecurity] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  
  // Parent/Guardian (for minors)
  const [parentInfo, setParentInfo] = useState({
    parent_email: user.parent_email || ''
  });
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [activeSection, setActiveSection] = useState('profile');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteStep, setDeleteStep] = useState(1);
  const [isDeleting, setIsDeleting] = useState(false);
  const [openCategories, setOpenCategories] = useState({});
  const [customGoal, setCustomGoal] = useState('');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showResetProgress, setShowResetProgress] = useState(false);
  const [exportingData, setExportingData] = useState(false);
  const [uploadingPicture, setUploadingPicture] = useState(false);

  // Calculate if user is minor
  const isMinor = user.age < 18;

  const languageOptions = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish - Español' },
    { code: 'zh', name: 'Mandarin - 中文' },
    { code: 'hi', name: 'Hindi - हिन्दी' },
    { code: 'ar', name: 'Arabic - العربية' },
    { code: 'fr', name: 'French - Français' },
    { code: 'de', name: 'German - Deutsch' },
    { code: 'ja', name: 'Japanese - 日本語' },
    { code: 'ko', name: 'Korean - 한국어' },
    { code: 'pt', name: 'Portuguese - Português' },
    { code: 'ru', name: 'Russian - Русский' },
    { code: 'tl', name: 'Tagalog' }
  ];

  const experienceLevels = [
    { value: 1, label: 'Beginner' },
    { value: 2, label: 'Novice' },
    { value: 3, label: 'Intermediate' },
    { value: 4, label: 'Advanced' },
    { value: 5, label: 'Expert' }
  ];

  const textSizeOptions = [
    { value: 'small', label: 'Small', class: 'text-sm' },
    { value: 'medium', label: 'Medium', class: 'text-base' },
    { value: 'large', label: 'Large', class: 'text-lg' },
    { value: 'xl', label: 'Extra Large', class: 'text-xl' }
  ];

  const dailyGoalOptions = [5, 10, 15, 20, 30, 45, 60];

  // Show message helper
  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  // Handle profile picture upload
  const handlePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      showMessage('Please select an image file', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showMessage('Image must be less than 5MB', 'error');
      return;
    }

    setUploadingPicture(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`${API}/upload/profile-picture`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setProfile(prev => ({ ...prev, profile_picture_url: response.data.url }));
      showMessage('Profile picture updated!');
    } catch (error) {
      console.error('Upload failed:', error);
      showMessage('Failed to upload picture. Using avatar instead.', 'error');
    } finally {
      setUploadingPicture(false);
    }
  };

  // Save all settings
  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = {
        // Profile
        first_name: profile.first_name,
        avatar: profile.avatar,
        profile_picture_url: profile.profile_picture_url,
        // Personal Info
        life_stage: personalInfo.life_stage,
        occupation: personalInfo.occupation,
        location: personalInfo.location,
        // Preferences
        language: preferences.language,
        experience_level: preferences.experience_level,
        financial_goals: preferences.financial_goals,
        notifications_enabled: preferences.notifications_enabled,
        daily_goal_minutes: preferences.daily_goal_minutes,
        reminder_time: preferences.reminder_time,
        lesson_length: preferences.lesson_length,
        enable_hints: preferences.enable_hints,
        weekly_email: preferences.weekly_email,
        achievement_alerts: preferences.achievement_alerts,
        quiet_hours_start: preferences.quiet_hours_start,
        quiet_hours_end: preferences.quiet_hours_end,
        // Display
        dark_mode: display.dark_mode,
        text_size: display.text_size,
        reduce_animations: display.reduce_animations,
        // Parent (if minor)
        ...(isMinor && { parent_email: parentInfo.parent_email })
      };

      await axios.put(`${API}/settings`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update dark mode if changed
      if (setDarkMode && display.dark_mode !== darkMode) {
        setDarkMode(display.dark_mode);
        localStorage.setItem('darkMode', display.dark_mode);
      }

      showMessage('Settings saved successfully!');
      
      // Trigger user update if callback provided
      if (onUserUpdate) {
        onUserUpdate({ ...user, ...payload });
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      showMessage('Failed to save settings. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Change password
  const handleChangePassword = async () => {
    if (security.new_password !== security.confirm_password) {
      showMessage('New passwords do not match', 'error');
      return;
    }
    if (security.new_password.length < 8) {
      showMessage('Password must be at least 8 characters', 'error');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API}/auth/change-password`, {
        current_password: security.current_password,
        new_password: security.new_password
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSecurity({ current_password: '', new_password: '', confirm_password: '' });
      showMessage('Password changed successfully!');
    } catch (error) {
      showMessage(error.response?.data?.detail || 'Failed to change password', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Export user data (GDPR)
  const handleExportData = async () => {
    setExportingData(true);
    try {
      const response = await axios.get(`${API}/user/export-data`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Create and download JSON file
      const dataStr = JSON.stringify(response.data, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `wealth-builder-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showMessage('Data exported successfully!');
    } catch (error) {
      showMessage('Failed to export data', 'error');
    } finally {
      setExportingData(false);
    }
  };

  // Reset all progress
  const handleResetProgress = async () => {
    setLoading(true);
    try {
      await axios.post(`${API}/user/reset-progress`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setShowResetProgress(false);
      showMessage('All progress has been reset. Starting fresh!');
    } catch (error) {
      showMessage('Failed to reset progress', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Delete account
  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await axios.post(`${API}/auth/delete-account`, 
        { email: user.email },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showMessage('Account deleted. Redirecting...');
      setTimeout(() => {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/';
      }, 2000);
    } catch (error) {
      showMessage('Failed to delete account', 'error');
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  // Goal toggle
  const handleGoalToggle = (goalId) => {
    const currentGoals = preferences.financial_goals || [];
    const newGoals = currentGoals.includes(goalId)
      ? currentGoals.filter(id => id !== goalId)
      : [...currentGoals, goalId];
    setPreferences(prev => ({ ...prev, financial_goals: newGoals }));
  };

  // Navigation sections
  const sections = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'personal', label: 'Personal Info', icon: '📋' },
    { id: 'learning', label: 'Learning', icon: '📚' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'display', label: 'Display', icon: '🎨' },
    { id: 'security', label: 'Security', icon: '🔐' },
    { id: 'data', label: 'Data & Privacy', icon: '📊' },
    ...(isMinor ? [{ id: 'parent', label: 'Parent/Guardian', icon: '👨‍👩‍👧' }] : []),
    { id: 'danger', label: 'Danger Zone', icon: '⚠️' }
  ];

  return (
    <div className={`min-h-screen ${display.dark_mode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <nav className={`${display.dark_mode ? 'bg-gray-800' : 'bg-navy-900'} text-white p-4 shadow-lg`}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold" data-testid="settings-title">Settings</h1>
          <button 
            onClick={() => navigate('/dashboard')} 
            className="text-gold hover:underline"
            data-testid="back-btn"
          >
            ← Back to Dashboard
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-4 md:p-8">
        {/* Message Banner */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'error' 
              ? 'bg-red-100 text-red-700 border border-red-300' 
              : 'bg-green-100 text-green-700 border border-green-300'
          }`} data-testid="message-banner">
            {message.text}
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar Navigation */}
          <div className={`md:w-64 ${display.dark_mode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-4`}>
            <nav className="space-y-1">
              {sections.map(section => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all flex items-center gap-3 ${
                    activeSection === section.id
                      ? 'bg-gold text-navy-900 font-semibold'
                      : display.dark_mode
                        ? 'text-gray-300 hover:bg-gray-700'
                        : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  data-testid={`nav-${section.id}`}
                >
                  <span>{section.icon}</span>
                  <span>{section.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className={`flex-1 ${display.dark_mode ? 'bg-gray-800 text-white' : 'bg-white'} rounded-xl shadow-lg p-6`}>
            
            {/* Profile Section */}
            {activeSection === 'profile' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold mb-6">Profile</h2>
                
                {/* Avatar/Picture */}
                <div className="flex flex-col items-center mb-8">
                  <div className="relative">
                    {profile.profile_picture_url ? (
                      <img 
                        src={profile.profile_picture_url} 
                        alt="Profile" 
                        className="w-32 h-32 rounded-full object-cover border-4 border-gold"
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-navy-900 to-navy-700 flex items-center justify-center text-6xl border-4 border-gold">
                        {profile.avatar}
                      </div>
                    )}
                    <button
                      onClick={() => setShowAvatarPicker(true)}
                      className="absolute bottom-0 right-0 bg-gold text-navy-900 rounded-full p-2 shadow-lg hover:bg-yellow-400 transition"
                      title="Change avatar"
                    >
                      ✏️
                    </button>
                  </div>
                  
                  {/* Upload Picture */}
                  <label className="mt-4 cursor-pointer">
                    <span className="text-sm text-gold hover:underline">
                      {uploadingPicture ? 'Uploading...' : 'Upload custom photo'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePictureUpload}
                      className="hidden"
                      disabled={uploadingPicture}
                    />
                  </label>
                </div>

                {/* Name */}
                <div>
                  <label className={`block font-semibold mb-2 ${display.dark_mode ? 'text-gray-200' : 'text-gray-700'}`}>
                    Name
                  </label>
                  <input
                    type="text"
                    value={profile.first_name}
                    onChange={(e) => setProfile(prev => ({ ...prev, first_name: e.target.value }))}
                    className={`w-full px-4 py-3 rounded-lg border ${
                      display.dark_mode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300'
                    } focus:ring-2 focus:ring-gold focus:border-transparent`}
                    data-testid="name-input"
                  />
                </div>

                {/* User IDs Display */}
                <div className={`p-4 rounded-lg ${display.dark_mode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <h3 className="font-semibold mb-3">Your Identifiers</h3>
                  <div className="space-y-2 text-sm">
                    {user.uid && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">UID:</span>
                        <span className="font-mono font-bold text-gold">{user.uid}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500">User Code:</span>
                      <span className="font-mono">{user.user_code || 'Not assigned'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Person Key:</span>
                      <span className="font-mono">{user.person_key || 'Not assigned'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Email:</span>
                      <span>{user.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Cohort:</span>
                      <span className="bg-blue-500 text-white px-2 py-0.5 rounded text-xs">{user.cohort || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Profile Manager */}
                <div className="pt-4 border-t border-gray-200">
                  <ProfileManager 
                    token={token} 
                    currentProfile={user} 
                    onProfileSwitch={() => window.location.reload()} 
                  />
                </div>
              </div>
            )}

            {/* Personal Info Section */}
            {activeSection === 'personal' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold mb-6">Personal Information</h2>

                {/* Date of Birth (Read-only) */}
                <div>
                  <label className={`block font-semibold mb-2 ${display.dark_mode ? 'text-gray-200' : 'text-gray-700'}`}>
                    Date of Birth
                  </label>
                  <div className={`px-4 py-3 rounded-lg ${display.dark_mode ? 'bg-gray-700' : 'bg-gray-100'} text-gray-500`}>
                    {user.date_of_birth || 'Not set'} 
                    <span className="text-xs ml-2">(Contact support to change)</span>
                  </div>
                </div>

                {/* Life Stage */}
                <div>
                  <label className={`block font-semibold mb-2 ${display.dark_mode ? 'text-gray-200' : 'text-gray-700'}`}>
                    Life Stage
                  </label>
                  <select
                    value={personalInfo.life_stage}
                    onChange={(e) => setPersonalInfo(prev => ({ ...prev, life_stage: e.target.value }))}
                    className={`w-full px-4 py-3 rounded-lg border ${
                      display.dark_mode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300'
                    } focus:ring-2 focus:ring-gold`}
                    data-testid="life-stage-select"
                  >
                    {LIFE_STAGE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Occupation */}
                <div>
                  <label className={`block font-semibold mb-2 ${display.dark_mode ? 'text-gray-200' : 'text-gray-700'}`}>
                    Occupation
                  </label>
                  <select
                    value={personalInfo.occupation}
                    onChange={(e) => setPersonalInfo(prev => ({ ...prev, occupation: e.target.value }))}
                    className={`w-full px-4 py-3 rounded-lg border ${
                      display.dark_mode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300'
                    } focus:ring-2 focus:ring-gold`}
                    data-testid="occupation-select"
                  >
                    <option value="">Select occupation...</option>
                    {OCCUPATION_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                {/* Location */}
                <div>
                  <label className={`block font-semibold mb-2 ${display.dark_mode ? 'text-gray-200' : 'text-gray-700'}`}>
                    Location
                  </label>
                  <LocationSelectorWrapper
                    onLocationSelect={(loc) => setPersonalInfo(prev => ({ ...prev, location: loc }))}
                    initialLocation={personalInfo.location}
                  />
                </div>
              </div>
            )}

            {/* Learning Preferences Section */}
            {activeSection === 'learning' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold mb-6">Learning Preferences</h2>

                {/* Language */}
                <div>
                  <label className={`block font-semibold mb-2 ${display.dark_mode ? 'text-gray-200' : 'text-gray-700'}`}>
                    Language
                  </label>
                  <select
                    value={preferences.language}
                    onChange={(e) => setPreferences(prev => ({ ...prev, language: e.target.value }))}
                    className={`w-full px-4 py-3 rounded-lg border ${
                      display.dark_mode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                    } focus:ring-2 focus:ring-gold`}
                    data-testid="language-select"
                  >
                    {languageOptions.map(lang => (
                      <option key={lang.code} value={lang.code}>{lang.name}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">UI translation coming soon</p>
                </div>

                {/* Experience Level */}
                <div>
                  <label className={`block font-semibold mb-2 ${display.dark_mode ? 'text-gray-200' : 'text-gray-700'}`}>
                    Experience Level
                  </label>
                  <select
                    value={preferences.experience_level}
                    onChange={(e) => setPreferences(prev => ({ ...prev, experience_level: parseInt(e.target.value) }))}
                    className={`w-full px-4 py-3 rounded-lg border ${
                      display.dark_mode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                    } focus:ring-2 focus:ring-gold`}
                    data-testid="experience-select"
                  >
                    {experienceLevels.map(level => (
                      <option key={level.value} value={level.value}>{level.label}</option>
                    ))}
                  </select>
                </div>

                {/* Daily Learning Goal */}
                <div>
                  <label className={`block font-semibold mb-2 ${display.dark_mode ? 'text-gray-200' : 'text-gray-700'}`}>
                    Daily Learning Goal
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {dailyGoalOptions.map(mins => (
                      <button
                        key={mins}
                        onClick={() => setPreferences(prev => ({ ...prev, daily_goal_minutes: mins }))}
                        className={`px-4 py-2 rounded-lg font-semibold transition ${
                          preferences.daily_goal_minutes === mins
                            ? 'bg-gold text-navy-900'
                            : display.dark_mode
                              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {mins} min
                      </button>
                    ))}
                  </div>
                </div>

                {/* Lesson Length */}
                <div>
                  <label className={`block font-semibold mb-2 ${display.dark_mode ? 'text-gray-200' : 'text-gray-700'}`}>
                    Preferred Lesson Length
                  </label>
                  <div className="flex gap-2">
                    {['short', 'medium', 'detailed'].map(len => (
                      <button
                        key={len}
                        onClick={() => setPreferences(prev => ({ ...prev, lesson_length: len }))}
                        className={`flex-1 px-4 py-3 rounded-lg font-semibold capitalize transition ${
                          preferences.lesson_length === len
                            ? 'bg-gold text-navy-900'
                            : display.dark_mode
                              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {len}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Enable Hints Toggle */}
                <div className="flex items-center justify-between py-3">
                  <div>
                    <span className={`font-semibold ${display.dark_mode ? 'text-gray-200' : 'text-gray-700'}`}>
                      Enable Hints
                    </span>
                    <p className="text-sm text-gray-500">Show helpful hints during lessons</p>
                  </div>
                  <button
                    onClick={() => setPreferences(prev => ({ ...prev, enable_hints: !prev.enable_hints }))}
                    className={`w-14 h-8 rounded-full transition-colors ${
                      preferences.enable_hints ? 'bg-gold' : 'bg-gray-400'
                    }`}
                  >
                    <div className={`w-6 h-6 bg-white rounded-full shadow transform transition-transform ${
                      preferences.enable_hints ? 'translate-x-7' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                {/* Financial Goals */}
                <div className="pt-4 border-t border-gray-200">
                  <label className={`block font-semibold mb-2 ${display.dark_mode ? 'text-gray-200' : 'text-gray-700'}`}>
                    Financial Goals ({preferences.financial_goals?.length || 0} selected)
                  </label>
                  <div className={`border rounded-lg max-h-64 overflow-y-auto ${display.dark_mode ? 'border-gray-600' : 'border-gray-200'}`}>
                    {FINANCIAL_GOALS_CONFIG.categories.map((category) => (
                      <div key={category.id} className="border-b last:border-b-0">
                        <button
                          type="button"
                          onClick={() => setOpenCategories(prev => ({ ...prev, [category.id]: !prev[category.id] }))}
                          className={`w-full flex justify-between items-center p-3 ${
                            display.dark_mode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                        >
                          <span className="font-medium text-sm">{category.label}</span>
                          <span className="text-gold">{openCategories[category.id] ? '−' : '+'}</span>
                        </button>
                        {openCategories[category.id] && (
                          <div className="p-3 space-y-1">
                            {category.goals.map((goal) => (
                              <label key={goal.id} className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer text-sm">
                                <input
                                  type="checkbox"
                                  checked={preferences.financial_goals?.includes(goal.id) || false}
                                  onChange={() => handleGoalToggle(goal.id)}
                                  className="w-4 h-4 text-gold rounded"
                                />
                                <span>{goal.label}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Section */}
            {activeSection === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold mb-6">Notifications</h2>

                {/* Master Toggle */}
                <div className={`flex items-center justify-between p-4 rounded-lg ${display.dark_mode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <div>
                    <span className="font-semibold">Enable Notifications</span>
                    <p className="text-sm text-gray-500">Master toggle for all notifications</p>
                  </div>
                  <button
                    onClick={() => setPreferences(prev => ({ ...prev, notifications_enabled: !prev.notifications_enabled }))}
                    className={`w-14 h-8 rounded-full transition-colors ${
                      preferences.notifications_enabled ? 'bg-gold' : 'bg-gray-400'
                    }`}
                  >
                    <div className={`w-6 h-6 bg-white rounded-full shadow transform transition-transform ${
                      preferences.notifications_enabled ? 'translate-x-7' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                {preferences.notifications_enabled && (
                  <>
                    {/* Learning Reminders */}
                    <div>
                      <label className={`block font-semibold mb-2 ${display.dark_mode ? 'text-gray-200' : 'text-gray-700'}`}>
                        Reminder Time
                      </label>
                      <input
                        type="time"
                        value={preferences.reminder_time}
                        onChange={(e) => setPreferences(prev => ({ ...prev, reminder_time: e.target.value }))}
                        className={`w-full px-4 py-3 rounded-lg border ${
                          display.dark_mode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                        }`}
                      />
                    </div>

                    {/* Achievement Alerts */}
                    <div className="flex items-center justify-between py-3">
                      <div>
                        <span className="font-semibold">Achievement Alerts</span>
                        <p className="text-sm text-gray-500">Get notified when you earn badges</p>
                      </div>
                      <button
                        onClick={() => setPreferences(prev => ({ ...prev, achievement_alerts: !prev.achievement_alerts }))}
                        className={`w-14 h-8 rounded-full transition-colors ${
                          preferences.achievement_alerts ? 'bg-gold' : 'bg-gray-400'
                        }`}
                      >
                        <div className={`w-6 h-6 bg-white rounded-full shadow transform transition-transform ${
                          preferences.achievement_alerts ? 'translate-x-7' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>

                    {/* Weekly Email */}
                    <div className="flex items-center justify-between py-3">
                      <div>
                        <span className="font-semibold">Weekly Progress Email</span>
                        <p className="text-sm text-gray-500">Receive a summary of your learning</p>
                      </div>
                      <button
                        onClick={() => setPreferences(prev => ({ ...prev, weekly_email: !prev.weekly_email }))}
                        className={`w-14 h-8 rounded-full transition-colors ${
                          preferences.weekly_email ? 'bg-gold' : 'bg-gray-400'
                        }`}
                      >
                        <div className={`w-6 h-6 bg-white rounded-full shadow transform transition-transform ${
                          preferences.weekly_email ? 'translate-x-7' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>

                    {/* Quiet Hours */}
                    <div className={`p-4 rounded-lg ${display.dark_mode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <label className="block font-semibold mb-3">Quiet Hours</label>
                      <p className="text-sm text-gray-500 mb-3">No notifications during this time</p>
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <label className="text-xs text-gray-500">From</label>
                          <input
                            type="time"
                            value={preferences.quiet_hours_start}
                            onChange={(e) => setPreferences(prev => ({ ...prev, quiet_hours_start: e.target.value }))}
                            className={`w-full px-3 py-2 rounded-lg border ${
                              display.dark_mode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'
                            }`}
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-xs text-gray-500">To</label>
                          <input
                            type="time"
                            value={preferences.quiet_hours_end}
                            onChange={(e) => setPreferences(prev => ({ ...prev, quiet_hours_end: e.target.value }))}
                            className={`w-full px-3 py-2 rounded-lg border ${
                              display.dark_mode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Display & Accessibility Section */}
            {activeSection === 'display' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold mb-6">Display & Accessibility</h2>

                {/* Dark Mode */}
                <div className="flex items-center justify-between py-3">
                  <div>
                    <span className="font-semibold">Dark Mode</span>
                    <p className="text-sm text-gray-500">Easier on the eyes at night</p>
                  </div>
                  <button
                    onClick={() => setDisplay(prev => ({ ...prev, dark_mode: !prev.dark_mode }))}
                    className={`w-14 h-8 rounded-full transition-colors ${
                      display.dark_mode ? 'bg-gold' : 'bg-gray-400'
                    }`}
                  >
                    <div className={`w-6 h-6 bg-white rounded-full shadow transform transition-transform ${
                      display.dark_mode ? 'translate-x-7' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                {/* Text Size */}
                <div>
                  <label className={`block font-semibold mb-2 ${display.dark_mode ? 'text-gray-200' : 'text-gray-700'}`}>
                    Text Size
                  </label>
                  <div className="flex gap-2">
                    {textSizeOptions.map(size => (
                      <button
                        key={size.value}
                        onClick={() => setDisplay(prev => ({ ...prev, text_size: size.value }))}
                        className={`flex-1 px-4 py-3 rounded-lg font-semibold transition ${size.class} ${
                          display.text_size === size.value
                            ? 'bg-gold text-navy-900'
                            : display.dark_mode
                              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {size.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reduce Animations */}
                <div className="flex items-center justify-between py-3">
                  <div>
                    <span className="font-semibold">Reduce Animations</span>
                    <p className="text-sm text-gray-500">For users who prefer less motion</p>
                  </div>
                  <button
                    onClick={() => setDisplay(prev => ({ ...prev, reduce_animations: !prev.reduce_animations }))}
                    className={`w-14 h-8 rounded-full transition-colors ${
                      display.reduce_animations ? 'bg-gold' : 'bg-gray-400'
                    }`}
                  >
                    <div className={`w-6 h-6 bg-white rounded-full shadow transform transition-transform ${
                      display.reduce_animations ? 'translate-x-7' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              </div>
            )}

            {/* Security Section */}
            {activeSection === 'security' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold mb-6">Security</h2>

                {/* Change Password */}
                <div className={`p-4 rounded-lg ${display.dark_mode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <h3 className="font-semibold mb-4">Change Password</h3>
                  <div className="space-y-4">
                    <input
                      type="password"
                      placeholder="Current password"
                      value={security.current_password}
                      onChange={(e) => setSecurity(prev => ({ ...prev, current_password: e.target.value }))}
                      className={`w-full px-4 py-3 rounded-lg border ${
                        display.dark_mode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'
                      }`}
                    />
                    <input
                      type="password"
                      placeholder="New password (min 8 characters)"
                      value={security.new_password}
                      onChange={(e) => setSecurity(prev => ({ ...prev, new_password: e.target.value }))}
                      className={`w-full px-4 py-3 rounded-lg border ${
                        display.dark_mode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'
                      }`}
                    />
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      value={security.confirm_password}
                      onChange={(e) => setSecurity(prev => ({ ...prev, confirm_password: e.target.value }))}
                      className={`w-full px-4 py-3 rounded-lg border ${
                        display.dark_mode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'
                      }`}
                    />
                    <button
                      onClick={handleChangePassword}
                      disabled={!security.current_password || !security.new_password || loading}
                      className="w-full bg-navy-900 text-white py-3 rounded-lg font-semibold hover:bg-navy-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Changing...' : 'Change Password'}
                    </button>
                  </div>
                </div>

                {/* Connected Accounts */}
                <div className={`p-4 rounded-lg ${display.dark_mode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <h3 className="font-semibold mb-4">Connected Accounts</h3>
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🔵</span>
                      <span>Google</span>
                    </div>
                    <span className="text-gray-500 text-sm">Not connected</span>
                  </div>
                </div>
              </div>
            )}

            {/* Data & Privacy Section */}
            {activeSection === 'data' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold mb-6">Data & Privacy</h2>

                {/* Export Data */}
                <div className={`p-4 rounded-lg ${display.dark_mode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <h3 className="font-semibold mb-2">Export My Data</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Download all your data including progress, quiz results, and profile information (GDPR compliant)
                  </p>
                  <button
                    onClick={handleExportData}
                    disabled={exportingData}
                    className="bg-navy-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-navy-800 disabled:bg-gray-400"
                  >
                    {exportingData ? 'Preparing download...' : '📥 Export My Data'}
                  </button>
                </div>

                {/* View Learning History */}
                <div className={`p-4 rounded-lg ${display.dark_mode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <h3 className="font-semibold mb-2">Learning History</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    View all your completed lessons, quizzes, and achievements
                  </p>
                  <button
                    onClick={() => navigate('/history')}
                    className="bg-gold text-navy-900 px-6 py-3 rounded-lg font-semibold hover:bg-yellow-400"
                  >
                    📊 View History
                  </button>
                </div>

                {/* Reset Progress */}
                <div className={`p-4 rounded-lg border-2 border-orange-300 ${display.dark_mode ? 'bg-orange-900/20' : 'bg-orange-50'}`}>
                  <h3 className="font-semibold mb-2 text-orange-600">Reset All Progress</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Start fresh! This will clear all your progress, quiz results, and PPI responses. Your account and settings will be kept.
                  </p>
                  <button
                    onClick={() => setShowResetProgress(true)}
                    className="bg-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600"
                  >
                    🔄 Reset Progress
                  </button>
                </div>
              </div>
            )}

            {/* Parent/Guardian Section (Minors Only) */}
            {activeSection === 'parent' && isMinor && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold mb-6">Parent/Guardian Settings</h2>

                <div className={`p-4 rounded-lg ${display.dark_mode ? 'bg-blue-900/30' : 'bg-blue-50'} border border-blue-200`}>
                  <p className="text-sm mb-4">
                    Since you are under 18, a parent or guardian needs to be connected to your account.
                  </p>
                </div>

                {/* Parent Email */}
                <div>
                  <label className={`block font-semibold mb-2 ${display.dark_mode ? 'text-gray-200' : 'text-gray-700'}`}>
                    Parent/Guardian Email
                  </label>
                  <input
                    type="email"
                    value={parentInfo.parent_email}
                    onChange={(e) => setParentInfo(prev => ({ ...prev, parent_email: e.target.value }))}
                    placeholder="parent@example.com"
                    className={`w-full px-4 py-3 rounded-lg border ${
                      display.dark_mode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                    }`}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    They will receive a notification about your account activity
                  </p>
                </div>
              </div>
            )}

            {/* Danger Zone Section */}
            {activeSection === 'danger' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold mb-6 text-red-600">⚠️ Danger Zone</h2>

                <div className={`p-6 rounded-lg border-2 border-red-300 ${display.dark_mode ? 'bg-red-900/20' : 'bg-red-50'}`}>
                  <h3 className="font-bold text-red-600 mb-3">Delete Account Permanently</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    This will permanently delete your account and all associated data including:
                  </p>
                  <ul className="text-sm text-gray-600 mb-4 list-disc list-inside space-y-1">
                    <li>All learning progress</li>
                    <li>Quiz results and scores</li>
                    <li>PPI responses and financial DNA</li>
                    <li>Profile information</li>
                  </ul>
                  <p className="text-sm font-bold text-red-600 mb-4">This action cannot be undone!</p>
                  <button
                    onClick={() => { setShowDeleteModal(true); setDeleteStep(1); }}
                    className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700"
                    data-testid="delete-account-btn"
                  >
                    🗑️ Delete My Account
                  </button>
                </div>
              </div>
            )}

            {/* Save Button (shown on most sections) */}
            {!['security', 'danger', 'data'].includes(activeSection) && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="w-full bg-gold text-navy-900 py-4 rounded-lg font-bold text-lg hover:bg-yellow-400 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                  data-testid="save-btn"
                >
                  {loading ? 'Saving...' : '💾 Save Changes'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Avatar Picker Modal */}
      {showAvatarPicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${display.dark_mode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 max-w-md w-full shadow-2xl`}>
            <h3 className="text-xl font-bold mb-4">Choose Your Avatar</h3>
            <div className="grid grid-cols-6 gap-3 mb-6">
              {AVATAR_OPTIONS.map((avatar, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setProfile(prev => ({ ...prev, avatar, profile_picture_url: null }));
                    setShowAvatarPicker(false);
                  }}
                  className={`text-3xl p-2 rounded-lg hover:bg-gold/20 transition ${
                    profile.avatar === avatar ? 'bg-gold/30 ring-2 ring-gold' : ''
                  }`}
                >
                  {avatar}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowAvatarPicker(false)}
              className="w-full py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Reset Progress Modal */}
      {showResetProgress && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${display.dark_mode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 max-w-md w-full shadow-2xl`}>
            <h3 className="text-xl font-bold mb-4 text-orange-600">🔄 Reset All Progress?</h3>
            <p className="text-gray-600 mb-6">
              This will clear all your learning progress, quiz scores, and PPI responses. Your account settings will be preserved.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetProgress(false)}
                className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleResetProgress}
                disabled={loading}
                className="flex-1 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 disabled:bg-gray-400"
              >
                {loading ? 'Resetting...' : 'Reset Progress'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${display.dark_mode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 max-w-md w-full shadow-2xl`}>
            {deleteStep === 1 ? (
              <>
                <h3 className="text-xl font-bold mb-4 text-red-600">⚠️ Delete Account?</h3>
                <p className="text-gray-600 mb-4">This will permanently delete:</p>
                <ul className="text-gray-600 mb-6 list-disc list-inside space-y-1">
                  <li>All your progress and achievements</li>
                  <li>Quiz results and scores</li>
                  <li>PPI responses</li>
                  <li>All account data</li>
                </ul>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setDeleteStep(2)}
                    className="flex-1 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700"
                  >
                    Continue
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-xl font-bold mb-4 text-red-600">⚠️⚠️ FINAL WARNING ⚠️⚠️</h3>
                <p className="text-gray-600 mb-6">
                  You are about to <strong className="text-red-600">PERMANENTLY DELETE</strong> your account.
                  This action <strong>CANNOT</strong> be undone!
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => { setShowDeleteModal(false); setDeleteStep(1); }}
                    className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300"
                  >
                    Go Back
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                    className="flex-1 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:bg-gray-400"
                  >
                    {isDeleting ? 'Deleting...' : 'DELETE FOREVER'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings;
