import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ProfileManager from '../components/ProfileManager';
import { FINANCIAL_GOALS_CONFIG } from '../data/financialGoals';
import LocationSelectorWrapper from '../components/LocationSelectorWrapper';
import {
  AVATAR_OPTIONS,
  LIFE_STAGE_OPTIONS,
  OCCUPATION_OPTIONS,
  TIMEZONE_OPTIONS,
  FONT_OPTIONS,
  EXPERIENCE_LEVELS,
  LANGUAGE_OPTIONS,
  getLifeStageLabel,
  getExperienceLabel
} from '../components/settings/constants';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

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
    date_of_birth: user.date_of_birth || '',
    life_stage: user.life_stage || 'AD',
    occupation: user.occupation || '',
    location: user.location || null,
    timezone: user.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    secondary_email: user.secondary_email || ''
  });
  
  // Preferences
  const [preferences, setPreferences] = useState({
    language: user.language || 'en',
    experience_level: user.experience_level || 3,
    financial_goals: user.financial_goals || [],
    notifications_enabled: user.notifications_enabled !== false,
    daily_goal_minutes: user.daily_goal_minutes || 10,
    reminder_time: user.reminder_time || '09:00',
    enable_hints: user.enable_hints !== false,
    weekly_email: user.weekly_email !== false,
    achievement_alerts: user.achievement_alerts !== false,
    milestone_celebrations: user.milestone_celebrations !== false,
    streak_reminders: user.streak_reminders !== false,
    quiet_hours_start: user.quiet_hours_start || '22:00',
    quiet_hours_end: user.quiet_hours_end || '08:00',
    email_frequency: user.email_frequency || 'weekly'
  });
  
  // Display Settings
  const [display, setDisplay] = useState({
    dark_mode: darkMode || false,
    text_size: user.text_size || 'medium',
    reduce_animations: user.reduce_animations || false,
    high_contrast: user.high_contrast || false,
    font_family: user.font_family || 'default'
  });
  
  // Security
  const [security, setSecurity] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  
  // Privacy Settings
  const [privacy, setPrivacy] = useState({
    profile_visible: user.profile_visible !== false,
    show_progress_publicly: user.show_progress_publicly || false,
    allow_analytics: user.allow_analytics !== false,
    data_retention_months: user.data_retention_months || 24
  });
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [activeSection, setActiveSection] = useState('profile');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteStep, setDeleteStep] = useState(1);
  const [isDeleting, setIsDeleting] = useState(false);
  const [openCategories, setOpenCategories] = useState({});
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showResetProgress, setShowResetProgress] = useState(false);
  const [exportingData, setExportingData] = useState(false);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [showFontPicker, setShowFontPicker] = useState(false);

  // Calculate age
  const calculateAge = (dob) => {
    if (!dob) return null;
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };
  
  const userAge = calculateAge(personalInfo.date_of_birth || user.date_of_birth);

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

  // Show message helper
  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  // Get all goal IDs for select all
  const getAllGoalIds = () => {
    const allIds = [];
    FINANCIAL_GOALS_CONFIG.categories.forEach(cat => {
      cat.goals.forEach(goal => allIds.push(goal.id));
    });
    return allIds;
  };

  const handleSelectAllGoals = () => {
    setPreferences(prev => ({ ...prev, financial_goals: getAllGoalIds() }));
  };

  const handleClearAllGoals = () => {
    setPreferences(prev => ({ ...prev, financial_goals: [] }));
  };

  // Handle profile picture upload
  const handlePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

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
        first_name: profile.first_name,
        avatar: profile.avatar,
        profile_picture_url: profile.profile_picture_url,
        date_of_birth: personalInfo.date_of_birth,
        life_stage: personalInfo.life_stage,
        occupation: personalInfo.occupation,
        location: personalInfo.location,
        timezone: personalInfo.timezone,
        secondary_email: personalInfo.secondary_email,
        language: preferences.language,
        experience_level: preferences.experience_level,
        financial_goals: preferences.financial_goals,
        notifications_enabled: preferences.notifications_enabled,
        daily_goal_minutes: preferences.daily_goal_minutes,
        reminder_time: preferences.reminder_time,
        enable_hints: preferences.enable_hints,
        weekly_email: preferences.weekly_email,
        achievement_alerts: preferences.achievement_alerts,
        milestone_celebrations: preferences.milestone_celebrations,
        streak_reminders: preferences.streak_reminders,
        quiet_hours_start: preferences.quiet_hours_start,
        quiet_hours_end: preferences.quiet_hours_end,
        email_frequency: preferences.email_frequency,
        dark_mode: display.dark_mode,
        text_size: display.text_size,
        reduce_animations: display.reduce_animations,
        high_contrast: display.high_contrast,
        font_family: display.font_family,
        profile_visible: privacy.profile_visible,
        show_progress_publicly: privacy.show_progress_publicly,
        allow_analytics: privacy.allow_analytics,
        data_retention_months: privacy.data_retention_months
      };

      await axios.put(`${API}/settings`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (setDarkMode && display.dark_mode !== darkMode) {
        setDarkMode(display.dark_mode);
        localStorage.setItem('darkMode', display.dark_mode);
      }

      showMessage('✅ Settings saved successfully!');
      
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

  // Export user data
  const handleExportData = async () => {
    setExportingData(true);
    try {
      const response = await axios.get(`${API}/user/export-data`, {
        headers: { Authorization: `Bearer ${token}` }
      });

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

  // Get experience level label
  const getExperienceLabel = (level) => {
    const found = experienceLevels.find(l => l.value === level);
    return found ? found.label : 'Unknown';
  };

  // Get life stage label
  const getLifeStageLabel = (stage) => {
    const found = LIFE_STAGE_OPTIONS.find(l => l.value === stage);
    return found ? found.label : stage;
  };

  // Navigation sections
  const sections = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'learning', label: 'Learning', icon: '📚' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'display', label: 'Display', icon: '🎨' },
    { id: 'security', label: 'Security', icon: '🔐' },
    { id: 'privacy', label: 'Privacy', icon: '🛡️' },
    { id: 'parental', label: 'Parental Controls', icon: '👨‍👩‍👧' },
    { id: 'danger', label: 'Account Actions', icon: '⚙️' }
  ];

  // Dynamic classes
  const cardClass = display.dark_mode ? 'bg-gray-800 text-white' : 'bg-white';
  const inputClass = display.dark_mode 
    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
    : 'bg-white border-gray-300 text-gray-900';
  const labelClass = display.dark_mode ? 'text-gray-200' : 'text-gray-700';
  const subTextClass = display.dark_mode ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className={`min-h-screen ${display.dark_mode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <nav className={`${display.dark_mode ? 'bg-gray-800' : 'bg-navy-900'} text-white p-4 shadow-lg`}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold" data-testid="settings-title">⚙️ Settings</h1>
          <button 
            onClick={() => navigate('/dashboard')} 
            className="text-gold hover:underline flex items-center gap-2"
            data-testid="back-btn"
          >
            ← Back to Dashboard
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-4 md:p-8">
        {/* Message Banner */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'error' 
              ? 'bg-red-100 text-red-700 border border-red-300' 
              : 'bg-green-100 text-green-700 border border-green-300'
          }`} data-testid="message-banner">
            <span className="text-xl">{message.type === 'error' ? '❌' : '✅'}</span>
            {message.text}
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar Navigation - Enhanced borders */}
          <div className={`md:w-64 ${cardClass} rounded-xl shadow-lg p-4 h-fit md:sticky md:top-4 border-2 ${display.dark_mode ? 'border-gray-700' : 'border-gray-200'}`}>
            <nav className="space-y-2">
              {sections.map(section => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center gap-3 border-2 ${
                    activeSection === section.id
                      ? 'bg-gradient-to-r from-gold to-yellow-400 text-navy-900 font-bold shadow-lg border-yellow-500 scale-[1.02]'
                      : display.dark_mode
                        ? 'text-gray-300 border-transparent hover:bg-gray-700 hover:border-gray-500 hover:shadow-md'
                        : 'text-gray-700 border-transparent hover:bg-gray-200 hover:border-gray-300 hover:shadow-md'
                  }`}
                  data-testid={`nav-${section.id}`}
                >
                  <span className="text-lg">{section.icon}</span>
                  <span>{section.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className={`flex-1 ${cardClass} rounded-xl shadow-lg p-6 border-2 ${display.dark_mode ? 'border-gray-700' : 'border-gray-200'}`}>
            
            {/* ==================== PROFILE SECTION ==================== */}
            {activeSection === 'profile' && (
              <div className="space-y-6">
                <div className={`border-b pb-4 mb-6 ${display.dark_mode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <h2 className="text-2xl font-bold">👤 Profile</h2>
                  <p className={subTextClass}>Manage your identity and personal information</p>
                </div>
                
                {/* User Stats Card - Enhanced */}
                <div className={`p-6 rounded-xl ${display.dark_mode ? 'bg-gradient-to-br from-gray-700 to-gray-800' : 'bg-gradient-to-br from-navy-900 to-navy-800'} text-white`}>
                  <div className="flex items-start gap-6">
                    {/* Avatar */}
                    <div className="relative group flex-shrink-0">
                      {profile.profile_picture_url ? (
                        <img 
                          src={profile.profile_picture_url} 
                          alt="Profile" 
                          className="w-24 h-24 rounded-full object-cover border-4 border-gold shadow-lg"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gold to-yellow-400 flex items-center justify-center text-5xl border-4 border-white/20 shadow-lg">
                          {profile.avatar}
                        </div>
                      )}
                      <button
                        onClick={() => setShowAvatarPicker(true)}
                        className="absolute bottom-0 right-0 bg-gold text-navy-900 rounded-full p-1.5 shadow-lg hover:bg-yellow-400 transition transform hover:scale-110"
                        title="Change avatar"
                      >
                        ✏️
                      </button>
                    </div>
                    
                    {/* Stats Grid */}
                    <div className="flex-1 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-gold text-xs uppercase tracking-wide">Name</p>
                        <p className="text-xl font-bold">{profile.first_name || 'Not set'}</p>
                      </div>
                      <div>
                        <p className="text-gold text-xs uppercase tracking-wide">Age</p>
                        <p className="text-xl font-bold">{userAge !== null ? `${userAge} yrs` : 'Not set'}</p>
                      </div>
                      <div>
                        <p className="text-gold text-xs uppercase tracking-wide">Stage</p>
                        <p className="text-lg font-semibold">{getLifeStageLabel(personalInfo.life_stage)}</p>
                      </div>
                      <div>
                        <p className="text-gold text-xs uppercase tracking-wide">Location</p>
                        <p className="text-lg font-semibold">{personalInfo.location?.city || 'Not set'}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Upload Photo Link */}
                  <div className="mt-4 pt-4 border-t border-white/20">
                    <label className="cursor-pointer inline-flex items-center gap-2 text-gold hover:text-yellow-300 text-sm">
                      📷 {uploadingPicture ? 'Uploading...' : 'Upload custom photo'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePictureUpload}
                        className="hidden"
                        disabled={uploadingPicture}
                      />
                    </label>
                  </div>
                </div>

                {/* Edit Name */}
                <div>
                  <label className={`block font-semibold mb-2 ${labelClass}`}>Display Name</label>
                  <input
                    type="text"
                    value={profile.first_name}
                    onChange={(e) => setProfile(prev => ({ ...prev, first_name: e.target.value }))}
                    className={`w-full px-4 py-3 rounded-lg border-2 ${inputClass} focus:ring-2 focus:ring-gold focus:border-gold`}
                    placeholder="Enter your name"
                    data-testid="name-input"
                  />
                </div>

                {/* Date of Birth */}
                <div>
                  <label className={`block font-semibold mb-2 ${labelClass}`}>Date of Birth</label>
                  <input
                    type="date"
                    value={personalInfo.date_of_birth}
                    onChange={(e) => setPersonalInfo(prev => ({ ...prev, date_of_birth: e.target.value }))}
                    className={`w-full px-4 py-3 rounded-lg border-2 ${inputClass} focus:ring-2 focus:ring-gold focus:border-gold`}
                    data-testid="dob-input"
                  />
                  {userAge !== null && (
                    <p className={`text-sm mt-1 ${subTextClass}`}>Age: {userAge} years old</p>
                  )}
                </div>

                {/* Life Stage */}
                <div>
                  <label className={`block font-semibold mb-2 ${labelClass}`}>Life Stage</label>
                  <select
                    value={personalInfo.life_stage}
                    onChange={(e) => setPersonalInfo(prev => ({ ...prev, life_stage: e.target.value }))}
                    className={`w-full px-4 py-3 rounded-lg border-2 ${inputClass} focus:ring-2 focus:ring-gold focus:border-gold`}
                    data-testid="life-stage-select"
                  >
                    {LIFE_STAGE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Occupation */}
                <div>
                  <label className={`block font-semibold mb-2 ${labelClass}`}>Occupation</label>
                  <select
                    value={personalInfo.occupation}
                    onChange={(e) => setPersonalInfo(prev => ({ ...prev, occupation: e.target.value }))}
                    className={`w-full px-4 py-3 rounded-lg border-2 ${inputClass} focus:ring-2 focus:ring-gold focus:border-gold`}
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
                  <label className={`block font-semibold mb-2 ${labelClass}`}>Location</label>
                  <LocationSelectorWrapper
                    onLocationSelect={(loc) => setPersonalInfo(prev => ({ ...prev, location: loc }))}
                    initialLocation={personalInfo.location}
                  />
                </div>

                {/* Timezone */}
                <div>
                  <label className={`block font-semibold mb-2 ${labelClass}`}>Timezone</label>
                  <select
                    value={personalInfo.timezone}
                    onChange={(e) => setPersonalInfo(prev => ({ ...prev, timezone: e.target.value }))}
                    className={`w-full px-4 py-3 rounded-lg border-2 ${inputClass} focus:ring-2 focus:ring-gold focus:border-gold`}
                  >
                    {TIMEZONE_OPTIONS.map(tz => (
                      <option key={tz.value} value={tz.value}>{tz.label}</option>
                    ))}
                  </select>
                </div>

                {/* Your ID */}
                <div className={`p-4 rounded-xl ${display.dark_mode ? 'bg-gray-700/50' : 'bg-gray-100'} border ${display.dark_mode ? 'border-gray-600' : 'border-gray-200'}`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className={`text-xs ${subTextClass} uppercase tracking-wide`}>Your ID</p>
                      <p className="text-sm text-gray-500">Use this for support & sharing</p>
                    </div>
                    <span className="font-mono font-bold text-lg bg-gold text-navy-900 px-4 py-2 rounded-full">
                      {user.uid || user.user_code || 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Profile Manager */}
                <div className={`pt-6 border-t ${display.dark_mode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <h3 className="font-semibold mb-3">👥 Manage Profiles</h3>
                  <ProfileManager 
                    token={token} 
                    currentProfile={user} 
                    onProfileSwitch={() => window.location.reload()} 
                  />
                </div>

                {/* Mobile App Download QR Codes */}
                <div className={`pt-6 border-t ${display.dark_mode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <h3 className="font-semibold mb-3">📱 Get the Mobile App</h3>
                  <p className={`text-sm mb-4 ${subTextClass}`}>Scan the QR code to download Wealth Builder on your device</p>
                  
                  <div className="grid grid-cols-2 gap-6">
                    {/* Apple App Store QR */}
                    <div className={`p-4 rounded-xl border-2 ${display.dark_mode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'} text-center`}>
                      <div className="relative inline-block">
                        {/* QR Code Pattern - Apple */}
                        <svg width="140" height="140" viewBox="0 0 140 140" className="mx-auto">
                          {/* QR Background */}
                          <rect width="140" height="140" fill="white" rx="8"/>
                          
                          {/* QR Pattern - Corners */}
                          <rect x="10" y="10" width="30" height="30" fill="black"/>
                          <rect x="14" y="14" width="22" height="22" fill="white"/>
                          <rect x="18" y="18" width="14" height="14" fill="black"/>
                          
                          <rect x="100" y="10" width="30" height="30" fill="black"/>
                          <rect x="104" y="14" width="22" height="22" fill="white"/>
                          <rect x="108" y="18" width="14" height="14" fill="black"/>
                          
                          <rect x="10" y="100" width="30" height="30" fill="black"/>
                          <rect x="14" y="104" width="22" height="22" fill="white"/>
                          <rect x="18" y="108" width="14" height="14" fill="black"/>
                          
                          {/* QR Data Pattern */}
                          <rect x="50" y="10" width="6" height="6" fill="black"/>
                          <rect x="62" y="10" width="6" height="6" fill="black"/>
                          <rect x="74" y="10" width="6" height="6" fill="black"/>
                          <rect x="86" y="10" width="6" height="6" fill="black"/>
                          
                          <rect x="10" y="50" width="6" height="6" fill="black"/>
                          <rect x="22" y="50" width="6" height="6" fill="black"/>
                          <rect x="10" y="62" width="6" height="6" fill="black"/>
                          <rect x="10" y="74" width="6" height="6" fill="black"/>
                          <rect x="22" y="74" width="6" height="6" fill="black"/>
                          <rect x="10" y="86" width="6" height="6" fill="black"/>
                          
                          <rect x="50" y="124" width="6" height="6" fill="black"/>
                          <rect x="62" y="124" width="6" height="6" fill="black"/>
                          <rect x="74" y="124" width="6" height="6" fill="black"/>
                          <rect x="86" y="124" width="6" height="6" fill="black"/>
                          
                          <rect x="124" y="50" width="6" height="6" fill="black"/>
                          <rect x="112" y="50" width="6" height="6" fill="black"/>
                          <rect x="124" y="62" width="6" height="6" fill="black"/>
                          <rect x="124" y="74" width="6" height="6" fill="black"/>
                          <rect x="112" y="74" width="6" height="6" fill="black"/>
                          <rect x="124" y="86" width="6" height="6" fill="black"/>
                          
                          {/* Random QR data points */}
                          <rect x="50" y="50" width="4" height="4" fill="black"/>
                          <rect x="58" y="54" width="4" height="4" fill="black"/>
                          <rect x="78" y="50" width="4" height="4" fill="black"/>
                          <rect x="86" y="54" width="4" height="4" fill="black"/>
                          <rect x="50" y="82" width="4" height="4" fill="black"/>
                          <rect x="58" y="86" width="4" height="4" fill="black"/>
                          <rect x="78" y="82" width="4" height="4" fill="black"/>
                          <rect x="86" y="86" width="4" height="4" fill="black"/>
                          
                          {/* Center white circle for logo */}
                          <circle cx="70" cy="70" r="22" fill="white"/>
                          <circle cx="70" cy="70" r="20" fill="black"/>
                          
                          {/* Apple Logo */}
                          <path d="M70 55c-1.5-3.5 1-7 4-7.5 0.3 3-2 5-4 7.5zm6 4c-2.5-0.5-4.5 1-6 1s-3-1.5-5-1.5c-3.5 0-7 3-7 8 0 6 4 13 7 13 1.5 0 3-1 5-1s3.5 1 5 1c3 0 6-7 7-10-4-2-5-6-3-10-2-1-3-1.5-3-1.5z" fill="white" transform="translate(0, 2)"/>
                        </svg>
                      </div>
                      <p className="mt-3 font-semibold text-sm">App Store</p>
                      <p className={`text-xs ${subTextClass}`}>iOS / iPadOS</p>
                    </div>

                    {/* Google Play Store QR */}
                    <div className={`p-4 rounded-xl border-2 ${display.dark_mode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'} text-center`}>
                      <div className="relative inline-block">
                        {/* QR Code Pattern - Android */}
                        <svg width="140" height="140" viewBox="0 0 140 140" className="mx-auto">
                          {/* QR Background */}
                          <rect width="140" height="140" fill="white" rx="8"/>
                          
                          {/* QR Pattern - Corners */}
                          <rect x="10" y="10" width="30" height="30" fill="black"/>
                          <rect x="14" y="14" width="22" height="22" fill="white"/>
                          <rect x="18" y="18" width="14" height="14" fill="black"/>
                          
                          <rect x="100" y="10" width="30" height="30" fill="black"/>
                          <rect x="104" y="14" width="22" height="22" fill="white"/>
                          <rect x="108" y="18" width="14" height="14" fill="black"/>
                          
                          <rect x="10" y="100" width="30" height="30" fill="black"/>
                          <rect x="14" y="104" width="22" height="22" fill="white"/>
                          <rect x="18" y="108" width="14" height="14" fill="black"/>
                          
                          {/* QR Data Pattern - Different from Apple */}
                          <rect x="50" y="10" width="6" height="6" fill="black"/>
                          <rect x="56" y="16" width="6" height="6" fill="black"/>
                          <rect x="68" y="10" width="6" height="6" fill="black"/>
                          <rect x="80" y="16" width="6" height="6" fill="black"/>
                          <rect x="86" y="10" width="6" height="6" fill="black"/>
                          
                          <rect x="10" y="50" width="6" height="6" fill="black"/>
                          <rect x="16" y="56" width="6" height="6" fill="black"/>
                          <rect x="10" y="68" width="6" height="6" fill="black"/>
                          <rect x="16" y="80" width="6" height="6" fill="black"/>
                          <rect x="10" y="86" width="6" height="6" fill="black"/>
                          
                          <rect x="50" y="124" width="6" height="6" fill="black"/>
                          <rect x="56" y="118" width="6" height="6" fill="black"/>
                          <rect x="68" y="124" width="6" height="6" fill="black"/>
                          <rect x="80" y="118" width="6" height="6" fill="black"/>
                          <rect x="86" y="124" width="6" height="6" fill="black"/>
                          
                          <rect x="124" y="50" width="6" height="6" fill="black"/>
                          <rect x="118" y="56" width="6" height="6" fill="black"/>
                          <rect x="124" y="68" width="6" height="6" fill="black"/>
                          <rect x="118" y="80" width="6" height="6" fill="black"/>
                          <rect x="124" y="86" width="6" height="6" fill="black"/>
                          
                          {/* Random QR data points - Different pattern */}
                          <rect x="50" y="52" width="4" height="4" fill="black"/>
                          <rect x="56" y="56" width="4" height="4" fill="black"/>
                          <rect x="80" y="52" width="4" height="4" fill="black"/>
                          <rect x="86" y="56" width="4" height="4" fill="black"/>
                          <rect x="50" y="80" width="4" height="4" fill="black"/>
                          <rect x="56" y="84" width="4" height="4" fill="black"/>
                          <rect x="80" y="80" width="4" height="4" fill="black"/>
                          <rect x="86" y="84" width="4" height="4" fill="black"/>
                          
                          {/* Center white circle for logo */}
                          <circle cx="70" cy="70" r="22" fill="white"/>
                          <circle cx="70" cy="70" r="20" fill="#3DDC84"/>
                          
                          {/* Android Robot Logo */}
                          {/* Head */}
                          <path d="M58 62 L82 62 L82 75 Q82 80 70 80 Q58 80 58 75 Z" fill="white"/>
                          {/* Eyes */}
                          <circle cx="64" cy="68" r="2" fill="#3DDC84"/>
                          <circle cx="76" cy="68" r="2" fill="#3DDC84"/>
                          {/* Antennas */}
                          <line x1="63" y1="56" x2="66" y2="62" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                          <line x1="77" y1="56" x2="74" y2="62" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </div>
                      <p className="mt-3 font-semibold text-sm">Google Play</p>
                      <p className={`text-xs ${subTextClass}`}>Android</p>
                    </div>
                  </div>
                  
                  <p className={`text-xs mt-4 text-center ${subTextClass}`}>
                    <span className="inline-flex items-center gap-1">
                      <span>🚀</span> Coming Soon - Mobile apps in development
                    </span>
                  </p>
                </div>
              </div>
            )}

            {/* ==================== LEARNING SECTION ==================== */}
            {activeSection === 'learning' && (
              <div className="space-y-6">
                <div className={`border-b pb-4 mb-6 ${display.dark_mode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <h2 className="text-2xl font-bold">📚 Learning Preferences</h2>
                  <p className={subTextClass}>Customize your learning experience</p>
                </div>

                {/* Language */}
                <div>
                  <label className={`block font-semibold mb-2 ${labelClass}`}>Language</label>
                  <select
                    value={preferences.language}
                    onChange={(e) => setPreferences(prev => ({ ...prev, language: e.target.value }))}
                    className={`w-full px-4 py-3 rounded-lg border-2 ${inputClass} focus:ring-2 focus:ring-gold focus:border-gold`}
                    data-testid="language-select"
                  >
                    {languageOptions.map(lang => (
                      <option key={lang.code} value={lang.code}>{lang.name}</option>
                    ))}
                  </select>
                </div>

                {/* Experience Level */}
                <div>
                  <label className={`block font-semibold mb-2 ${labelClass}`}>Financial Experience</label>
                  <select
                    value={preferences.experience_level}
                    onChange={(e) => setPreferences(prev => ({ ...prev, experience_level: parseInt(e.target.value) }))}
                    className={`w-full px-4 py-3 rounded-lg border-2 ${inputClass} focus:ring-2 focus:ring-gold focus:border-gold`}
                    data-testid="experience-select"
                  >
                    {experienceLevels.map(level => (
                      <option key={level.value} value={level.value}>{level.label}</option>
                    ))}
                  </select>
                </div>

                {/* Daily Learning Goal - Slider */}
                <div>
                  <label className={`block font-semibold mb-2 ${labelClass}`}>Daily Learning Goal</label>
                  <div className={`p-4 rounded-xl border-2 ${display.dark_mode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-sm ${subTextClass}`}>5 min</span>
                      <span className="text-2xl font-bold text-gold">{preferences.daily_goal_minutes} min</span>
                      <span className={`text-sm ${subTextClass}`}>240 min</span>
                    </div>
                    <input
                      type="range"
                      min="15"
                      max="240"
                      step="15"
                      value={preferences.daily_goal_minutes}
                      onChange={(e) => setPreferences(prev => ({ ...prev, daily_goal_minutes: parseInt(e.target.value) }))}
                      className="w-full h-3 rounded-full appearance-none cursor-pointer bg-gray-300 accent-gold"
                      style={{
                        background: `linear-gradient(to right, #F5A623 0%, #F5A623 ${((preferences.daily_goal_minutes - 15) / 225) * 100}%, ${display.dark_mode ? '#4B5563' : '#D1D5DB'} ${((preferences.daily_goal_minutes - 15) / 225) * 100}%, ${display.dark_mode ? '#4B5563' : '#D1D5DB'} 100%)`
                      }}
                      data-testid="daily-goal-slider"
                    />
                    <div className="flex justify-between mt-2 text-xs">
                      {[15, 30, 60, 90, 120, 180, 240].map(mark => (
                        <span 
                          key={mark} 
                          className={`${preferences.daily_goal_minutes === mark ? 'text-gold font-bold' : subTextClass}`}
                        >
                          {mark}
                        </span>
                      ))}
                    </div>
                    <p className={`text-center text-sm mt-3 ${subTextClass}`}>
                      {preferences.daily_goal_minutes <= 15 ? '🌱 Quick daily practice' : 
                       preferences.daily_goal_minutes <= 30 ? '📖 Good learning habit' :
                       preferences.daily_goal_minutes <= 60 ? '🔥 Serious learner!' :
                       preferences.daily_goal_minutes <= 120 ? '🏆 Power learner mode!' :
                       preferences.daily_goal_minutes <= 180 ? '💪 Intense focus session!' :
                       '🚀 Marathon learning day!'}
                    </p>
                  </div>
                </div>

                {/* Enable Hints */}
                <div className={`flex items-center justify-between p-4 rounded-lg border-2 ${display.dark_mode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                  <div>
                    <span className="font-semibold">💡 Enable Hints</span>
                    <p className={`text-sm ${subTextClass}`}>Show helpful hints during lessons</p>
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

                {/* Financial Goals - Enhanced with per-category Select All */}
                <div className={`p-5 rounded-xl border-2 ${display.dark_mode ? 'border-gold/30 bg-gray-700/30' : 'border-gold/50 bg-gradient-to-br from-yellow-50 to-orange-50'}`}>
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <label className={`block font-semibold ${labelClass}`}>🎯 Financial Goals</label>
                      <p className={`text-sm ${subTextClass}`}>
                        {preferences.financial_goals?.length || 0} of {getAllGoalIds().length} selected
                      </p>
                    </div>
                    <button
                      onClick={handleClearAllGoals}
                      className="px-3 py-1.5 text-xs font-bold bg-gray-500 text-white rounded-full hover:bg-gray-600 transition border-2 border-gray-600"
                    >
                      ✕ Clear All
                    </button>
                  </div>
                  
                  <div className={`border-2 rounded-lg max-h-80 overflow-y-auto ${display.dark_mode ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-white'}`}>
                    {FINANCIAL_GOALS_CONFIG.categories.map((category, idx) => {
                      // Remove "Goals" from label for display
                      const displayLabel = category.label.replace(/ Goals?$/i, '');
                      const categoryGoalIds = category.goals.map(g => g.id);
                      const selectedInCategory = category.goals.filter(g => preferences.financial_goals?.includes(g.id)).length;
                      const allSelectedInCategory = selectedInCategory === category.goals.length;
                      
                      return (
                        <div key={category.id} className={idx > 0 ? `border-t-2 ${display.dark_mode ? 'border-gray-600' : 'border-gray-200'}` : ''}>
                          <div className={`flex items-center justify-between p-3 ${
                            display.dark_mode ? 'bg-gray-700' : 'bg-gray-50'
                          }`}>
                            <button
                              type="button"
                              onClick={() => setOpenCategories(prev => ({ ...prev, [category.id]: !prev[category.id] }))}
                              className="flex-1 flex items-center gap-2 text-left hover:opacity-80"
                            >
                              <span className="text-gold text-lg font-bold w-6">{openCategories[category.id] ? '−' : '+'}</span>
                              <span className="font-medium text-sm">{displayLabel}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                allSelectedInCategory 
                                  ? 'bg-green-500 text-white' 
                                  : display.dark_mode ? 'bg-gray-600' : 'bg-gray-200'
                              }`}>
                                {selectedInCategory}/{category.goals.length}
                              </span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (allSelectedInCategory) {
                                  // Deselect all in this category
                                  setPreferences(prev => ({
                                    ...prev,
                                    financial_goals: (prev.financial_goals || []).filter(id => !categoryGoalIds.includes(id))
                                  }));
                                } else {
                                  // Select all in this category
                                  setPreferences(prev => ({
                                    ...prev,
                                    financial_goals: [...new Set([...(prev.financial_goals || []), ...categoryGoalIds])]
                                  }));
                                }
                              }}
                              className={`px-2 py-1 text-xs font-bold rounded transition ${
                                allSelectedInCategory
                                  ? 'bg-gray-400 text-white hover:bg-gray-500'
                                  : 'bg-green-500 text-white hover:bg-green-600'
                              }`}
                            >
                              {allSelectedInCategory ? '✕ Clear' : '✓ All'}
                            </button>
                          </div>
                          {openCategories[category.id] && (
                            <div className={`p-3 space-y-1 ${display.dark_mode ? 'bg-gray-800' : 'bg-white'}`}>
                              {category.goals.map((goal) => (
                                <label key={goal.id} className={`flex items-center gap-3 p-2 rounded cursor-pointer transition border ${
                                  preferences.financial_goals?.includes(goal.id)
                                    ? display.dark_mode ? 'bg-gold/20 border-gold/50' : 'bg-gold/10 border-gold/30'
                                    : display.dark_mode ? 'border-transparent hover:bg-gray-700' : 'border-transparent hover:bg-gray-200'
                                }`}>
                                  <input
                                    type="checkbox"
                                    checked={preferences.financial_goals?.includes(goal.id) || false}
                                    onChange={() => handleGoalToggle(goal.id)}
                                    className="w-4 h-4 text-gold rounded focus:ring-gold"
                                  />
                                  <span className="text-sm">{goal.label}</span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ==================== NOTIFICATIONS SECTION ==================== */}
            {activeSection === 'notifications' && (
              <div className="space-y-6">
                <div className={`border-b pb-4 mb-6 ${display.dark_mode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <h2 className="text-2xl font-bold">🔔 Notifications</h2>
                  <p className={subTextClass}>Control how and when we reach you</p>
                </div>

                {/* Master Toggle */}
                <div className={`p-4 rounded-xl border-2 ${display.dark_mode ? 'bg-gray-700 border-gray-600' : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-lg">🔔 Enable Notifications</span>
                      <p className={`text-sm ${subTextClass}`}>Master toggle</p>
                    </div>
                    <button
                      onClick={() => setPreferences(prev => ({ ...prev, notifications_enabled: !prev.notifications_enabled }))}
                      className={`w-16 h-9 rounded-full transition-colors ${
                        preferences.notifications_enabled ? 'bg-green-500' : 'bg-gray-400'
                      }`}
                    >
                      <div className={`w-7 h-7 bg-white rounded-full shadow transform transition-transform ${
                        preferences.notifications_enabled ? 'translate-x-8' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                </div>

                {preferences.notifications_enabled && (
                  <>
                    <div>
                      <label className={`block font-semibold mb-2 ${labelClass}`}>⏰ Daily Reminder Time</label>
                      <input
                        type="time"
                        value={preferences.reminder_time}
                        onChange={(e) => setPreferences(prev => ({ ...prev, reminder_time: e.target.value }))}
                        className={`w-full px-4 py-3 rounded-lg border-2 ${inputClass}`}
                      />
                    </div>

                    <div className="space-y-3">
                      {[
                        { key: 'achievement_alerts', label: '🏆 Achievement Alerts', desc: 'Get notified when you earn badges' },
                        { key: 'milestone_celebrations', label: '🎉 Milestone Celebrations', desc: 'Celebrate learning milestones' },
                        { key: 'streak_reminders', label: '🔥 Streak Reminders', desc: 'Maintain your learning streak' },
                        { key: 'weekly_email', label: '📧 Weekly Progress Email', desc: 'Summary of your learning' }
                      ].map(item => (
                        <div key={item.key} className={`flex items-center justify-between p-4 rounded-lg border-2 ${display.dark_mode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                          <div>
                            <span className="font-semibold">{item.label}</span>
                            <p className={`text-sm ${subTextClass}`}>{item.desc}</p>
                          </div>
                          <button
                            onClick={() => setPreferences(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                            className={`w-14 h-8 rounded-full transition-colors ${
                              preferences[item.key] ? 'bg-gold' : 'bg-gray-400'
                            }`}
                          >
                            <div className={`w-6 h-6 bg-white rounded-full shadow transform transition-transform ${
                              preferences[item.key] ? 'translate-x-7' : 'translate-x-1'
                            }`} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div>
                      <label className={`block font-semibold mb-2 ${labelClass}`}>📬 Email Frequency</label>
                      <div className="flex gap-2">
                        {['daily', 'weekly', 'monthly', 'never'].map(freq => (
                          <button
                            key={freq}
                            onClick={() => setPreferences(prev => ({ ...prev, email_frequency: freq }))}
                            className={`flex-1 px-3 py-2 rounded-lg font-medium capitalize text-sm transition border-2 ${
                              preferences.email_frequency === freq
                                ? 'bg-gold text-navy-900 border-yellow-500'
                                : display.dark_mode
                                  ? 'bg-gray-700 text-gray-300 border-gray-600 hover:border-gray-400'
                                  : 'bg-gray-100 text-gray-700 border-gray-200 hover:border-gray-400'
                            }`}
                          >
                            {freq}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className={`p-4 rounded-lg border-2 ${display.dark_mode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-200'}`}>
                      <label className="block font-semibold mb-3">🌙 Quiet Hours</label>
                      <p className={`text-sm ${subTextClass} mb-3`}>No notifications during this time</p>
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <label className={`text-xs ${subTextClass}`}>From</label>
                          <input
                            type="time"
                            value={preferences.quiet_hours_start}
                            onChange={(e) => setPreferences(prev => ({ ...prev, quiet_hours_start: e.target.value }))}
                            className={`w-full px-3 py-2 rounded-lg border-2 ${inputClass}`}
                          />
                        </div>
                        <div className="flex-1">
                          <label className={`text-xs ${subTextClass}`}>To</label>
                          <input
                            type="time"
                            value={preferences.quiet_hours_end}
                            onChange={(e) => setPreferences(prev => ({ ...prev, quiet_hours_end: e.target.value }))}
                            className={`w-full px-3 py-2 rounded-lg border-2 ${inputClass}`}
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ==================== DISPLAY SECTION ==================== */}
            {activeSection === 'display' && (
              <div className="space-y-6">
                <div className={`border-b pb-4 mb-6 ${display.dark_mode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <h2 className="text-2xl font-bold">🎨 Display & Accessibility</h2>
                  <p className={subTextClass}>Customize how the app looks</p>
                </div>

                {/* Dark Mode */}
                <div className={`p-4 rounded-xl border-2 ${display.dark_mode ? 'bg-gradient-to-r from-gray-700 to-gray-600 border-gray-500' : 'bg-gradient-to-r from-gray-100 to-gray-200 border-gray-300'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-lg">{display.dark_mode ? '🌙' : '☀️'} Dark Mode</span>
                      <p className={`text-sm ${subTextClass}`}>Easier on the eyes at night</p>
                    </div>
                    <button
                      onClick={() => setDisplay(prev => ({ ...prev, dark_mode: !prev.dark_mode }))}
                      className={`w-16 h-9 rounded-full transition-all ${
                        display.dark_mode ? 'bg-indigo-500' : 'bg-yellow-400'
                      }`}
                    >
                      <div className={`w-7 h-7 bg-white rounded-full shadow transform transition-transform flex items-center justify-center text-sm ${
                        display.dark_mode ? 'translate-x-8' : 'translate-x-1'
                      }`}>
                        {display.dark_mode ? '🌙' : '☀️'}
                      </div>
                    </button>
                  </div>
                </div>

                {/* Text Size */}
                <div>
                  <label className={`block font-semibold mb-2 ${labelClass}`}>📝 Text Size</label>
                  <div className="flex gap-2">
                    {textSizeOptions.map(size => (
                      <button
                        key={size.value}
                        onClick={() => setDisplay(prev => ({ ...prev, text_size: size.value }))}
                        className={`flex-1 px-4 py-3 rounded-lg font-semibold transition border-2 ${size.class} ${
                          display.text_size === size.value
                            ? 'bg-gold text-navy-900 shadow-md border-yellow-500'
                            : display.dark_mode
                              ? 'bg-gray-700 text-gray-300 border-gray-600 hover:border-gray-400'
                              : 'bg-gray-100 text-gray-700 border-gray-200 hover:border-gray-400'
                        }`}
                      >
                        {size.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Font Style - With Preview */}
                <div>
                  <label className={`block font-semibold mb-2 ${labelClass}`}>🔤 Font Style</label>
                  <button
                    onClick={() => setShowFontPicker(true)}
                    className={`w-full px-4 py-3 rounded-lg border-2 text-left flex justify-between items-center ${inputClass} hover:border-gold`}
                  >
                    <div>
                      <span className="font-medium">{FONT_OPTIONS.find(f => f.value === display.font_family)?.label || 'System Default'}</span>
                      <span className={`ml-3 ${FONT_OPTIONS.find(f => f.value === display.font_family)?.style || ''} ${subTextClass}`}>
                        {FONT_OPTIONS.find(f => f.value === display.font_family)?.preview}
                      </span>
                    </div>
                    <span className="text-gold">▼</span>
                  </button>
                  <p className={`text-xs mt-1 ${subTextClass}`}>OpenDyslexic recommended for users with dyslexia</p>
                </div>

                {/* Accessibility Toggles */}
                <div className="space-y-3">
                  <div className={`flex items-center justify-between p-4 rounded-lg border-2 ${display.dark_mode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                    <div>
                      <span className="font-semibold">🎯 High Contrast</span>
                      <p className={`text-sm ${subTextClass}`}>Increase contrast for better visibility</p>
                    </div>
                    <button
                      onClick={() => setDisplay(prev => ({ ...prev, high_contrast: !prev.high_contrast }))}
                      className={`w-14 h-8 rounded-full transition-colors ${
                        display.high_contrast ? 'bg-gold' : 'bg-gray-400'
                      }`}
                    >
                      <div className={`w-6 h-6 bg-white rounded-full shadow transform transition-transform ${
                        display.high_contrast ? 'translate-x-7' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>

                  <div className={`flex items-center justify-between p-4 rounded-lg border-2 ${display.dark_mode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                    <div>
                      <span className="font-semibold">✨ Reduce Animations</span>
                      <p className={`text-sm ${subTextClass}`}>For users who prefer less motion</p>
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
              </div>
            )}

            {/* ==================== SECURITY SECTION ==================== */}
            {activeSection === 'security' && (
              <div className="space-y-6">
                <div className={`border-b pb-4 mb-6 ${display.dark_mode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <h2 className="text-2xl font-bold">🔐 Security</h2>
                  <p className={subTextClass}>Keep your account safe</p>
                </div>

                {/* Change Password */}
                <div className={`p-5 rounded-xl border-2 ${display.dark_mode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                  <h3 className="font-semibold mb-4 flex items-center gap-2">🔑 Change Password</h3>
                  <div className="space-y-4">
                    <input
                      type="password"
                      placeholder="Current password"
                      value={security.current_password}
                      onChange={(e) => setSecurity(prev => ({ ...prev, current_password: e.target.value }))}
                      className={`w-full px-4 py-3 rounded-lg border-2 ${inputClass}`}
                    />
                    <input
                      type="password"
                      placeholder="New password (min 8 characters)"
                      value={security.new_password}
                      onChange={(e) => setSecurity(prev => ({ ...prev, new_password: e.target.value }))}
                      className={`w-full px-4 py-3 rounded-lg border-2 ${inputClass}`}
                    />
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      value={security.confirm_password}
                      onChange={(e) => setSecurity(prev => ({ ...prev, confirm_password: e.target.value }))}
                      className={`w-full px-4 py-3 rounded-lg border-2 ${inputClass}`}
                    />
                    <button
                      onClick={handleChangePassword}
                      disabled={!security.current_password || !security.new_password || loading}
                      className="w-full bg-navy-900 text-white py-3 rounded-lg font-semibold hover:bg-navy-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                    >
                      {loading ? 'Changing...' : '🔒 Update Password'}
                    </button>
                  </div>
                </div>

                {/* Two-Factor - Coming Soon */}
                <div className={`p-5 rounded-xl border-2 ${display.dark_mode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold flex items-center gap-2">🛡️ Two-Factor Authentication</h3>
                      <p className={`text-sm ${subTextClass}`}>Add an extra layer of security</p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                      Coming Soon
                    </span>
                  </div>
                </div>

                {/* Active Sessions */}
                <div className={`p-5 rounded-xl border-2 ${display.dark_mode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                  <h3 className="font-semibold mb-3">📱 Active Sessions</h3>
                  <div className={`p-3 rounded-lg border ${display.dark_mode ? 'bg-gray-600 border-gray-500' : 'bg-white border-gray-200'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">💻</span>
                        <div>
                          <p className="font-medium">Current Device</p>
                          <p className={`text-xs ${subTextClass}`}>This browser • Active now</p>
                        </div>
                      </div>
                      <span className="text-green-500 text-sm">● Active</span>
                    </div>
                  </div>
                </div>

                {/* Connected Accounts - All OAuth Providers */}
                <div className={`p-5 rounded-xl border-2 ${display.dark_mode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                  <h3 className="font-semibold mb-4">🔗 Connected Accounts</h3>
                  <div className="space-y-3">
                    {/* Google */}
                    <div className={`flex items-center justify-between p-3 rounded-lg ${display.dark_mode ? 'bg-gray-600' : 'bg-white'} border ${display.dark_mode ? 'border-gray-500' : 'border-gray-200'}`}>
                      <div className="flex items-center gap-3">
                        <svg className="w-6 h-6" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        <div>
                          <span className="font-medium">Google</span>
                          {user.google_connected && <p className={`text-xs ${subTextClass}`}>Connected</p>}
                        </div>
                      </div>
                      {user.google_connected ? (
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">✓ Connected</span>
                      ) : (
                        <button 
                          onClick={() => {
                            const redirectUrl = window.location.origin + '/settings';
                            window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
                          }}
                          className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-500 text-white hover:bg-blue-600 transition"
                          data-testid="connect-google-btn"
                        >Connect</button>
                      )}
                    </div>

                    {/* Apple */}
                    <div className={`flex items-center justify-between p-3 rounded-lg ${display.dark_mode ? 'bg-gray-600' : 'bg-white'} border ${display.dark_mode ? 'border-gray-500' : 'border-gray-200'}`}>
                      <div className="flex items-center gap-3">
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                        </svg>
                        <div>
                          <span className="font-medium">Apple</span>
                          {user.apple_connected && <p className={`text-xs ${subTextClass}`}>Connected</p>}
                        </div>
                      </div>
                      {user.apple_connected ? (
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">✓ Connected</span>
                      ) : (
                        <button 
                          onClick={() => {
                            const redirectUrl = window.location.origin + '/settings';
                            window.location.href = `https://auth.emergentagent.com/apple?redirect=${encodeURIComponent(redirectUrl)}`;
                          }}
                          className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-500 text-white hover:bg-blue-600 transition"
                          data-testid="connect-apple-btn"
                        >Connect</button>
                      )}
                    </div>

                    {/* Microsoft */}
                    <div className={`flex items-center justify-between p-3 rounded-lg ${display.dark_mode ? 'bg-gray-600' : 'bg-white'} border ${display.dark_mode ? 'border-gray-500' : 'border-gray-200'}`}>
                      <div className="flex items-center gap-3">
                        <svg className="w-6 h-6" viewBox="0 0 24 24">
                          <path fill="#F25022" d="M1 1h10v10H1z"/>
                          <path fill="#00A4EF" d="M1 13h10v10H1z"/>
                          <path fill="#7FBA00" d="M13 1h10v10H13z"/>
                          <path fill="#FFB900" d="M13 13h10v10H13z"/>
                        </svg>
                        <div>
                          <span className="font-medium">Microsoft</span>
                          {user.microsoft_connected && <p className={`text-xs ${subTextClass}`}>Connected</p>}
                        </div>
                      </div>
                      {user.microsoft_connected ? (
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">✓ Connected</span>
                      ) : (
                        <button 
                          onClick={() => {
                            const redirectUrl = window.location.origin + '/settings';
                            window.location.href = `https://auth.emergentagent.com/microsoft?redirect=${encodeURIComponent(redirectUrl)}`;
                          }}
                          className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-500 text-white hover:bg-blue-600 transition"
                          data-testid="connect-microsoft-btn"
                        >Connect</button>
                      )}
                    </div>

                    {/* Facebook */}
                    <div className={`flex items-center justify-between p-3 rounded-lg ${display.dark_mode ? 'bg-gray-600' : 'bg-white'} border ${display.dark_mode ? 'border-gray-500' : 'border-gray-200'}`}>
                      <div className="flex items-center gap-3">
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#1877F2">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                        <div>
                          <span className="font-medium">Facebook</span>
                          {user.facebook_connected && <p className={`text-xs ${subTextClass}`}>Connected</p>}
                        </div>
                      </div>
                      {user.facebook_connected ? (
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">✓ Connected</span>
                      ) : (
                        <button 
                          onClick={() => {
                            const redirectUrl = window.location.origin + '/settings';
                            window.location.href = `https://auth.emergentagent.com/facebook?redirect=${encodeURIComponent(redirectUrl)}`;
                          }}
                          className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-500 text-white hover:bg-blue-600 transition"
                          data-testid="connect-facebook-btn"
                        >Connect</button>
                      )}
                    </div>

                    {/* LinkedIn */}
                    <div className={`flex items-center justify-between p-3 rounded-lg ${display.dark_mode ? 'bg-gray-600' : 'bg-white'} border ${display.dark_mode ? 'border-gray-500' : 'border-gray-200'}`}>
                      <div className="flex items-center gap-3">
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#0A66C2">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                        <div>
                          <span className="font-medium">LinkedIn</span>
                          {user.linkedin_connected && <p className={`text-xs ${subTextClass}`}>Connected</p>}
                        </div>
                      </div>
                      {user.linkedin_connected ? (
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">✓ Connected</span>
                      ) : (
                        <button 
                          onClick={() => {
                            const redirectUrl = window.location.origin + '/settings';
                            window.location.href = `https://auth.emergentagent.com/linkedin?redirect=${encodeURIComponent(redirectUrl)}`;
                          }}
                          className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-500 text-white hover:bg-blue-600 transition"
                          data-testid="connect-linkedin-btn"
                        >Connect</button>
                      )}
                    </div>
                  </div>
                  <p className={`text-xs mt-3 ${subTextClass}`}>Connect social accounts for easier sign-in.</p>
                </div>
              </div>
            )}

            {/* ==================== PRIVACY SECTION ==================== */}
            {activeSection === 'privacy' && (
              <div className="space-y-6">
                <div className={`border-b pb-4 mb-6 ${display.dark_mode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <h2 className="text-2xl font-bold">🛡️ Privacy</h2>
                  <p className={subTextClass}>Control your data and visibility</p>
                </div>

                {/* Toggles */}
                {[
                  { key: 'profile_visible', label: '👁️ Profile Visible', desc: 'Allow others to see your profile' },
                  { key: 'show_progress_publicly', label: '📊 Share Progress', desc: 'Show learning progress publicly' },
                  { key: 'allow_analytics', label: '📈 Allow Analytics', desc: 'Help us improve with anonymous data' }
                ].map(item => (
                  <div key={item.key} className={`flex items-center justify-between p-4 rounded-lg border-2 ${display.dark_mode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                    <div>
                      <span className="font-semibold">{item.label}</span>
                      <p className={`text-sm ${subTextClass}`}>{item.desc}</p>
                    </div>
                    <button
                      onClick={() => setPrivacy(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                      className={`w-14 h-8 rounded-full transition-colors ${
                        privacy[item.key] ? 'bg-gold' : 'bg-gray-400'
                      }`}
                    >
                      <div className={`w-6 h-6 bg-white rounded-full shadow transform transition-transform ${
                        privacy[item.key] ? 'translate-x-7' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                ))}

                {/* Data Retention */}
                <div>
                  <label className={`block font-semibold mb-2 ${labelClass}`}>🗄️ Data Retention</label>
                  <select
                    value={privacy.data_retention_months}
                    onChange={(e) => setPrivacy(prev => ({ ...prev, data_retention_months: parseInt(e.target.value) }))}
                    className={`w-full px-4 py-3 rounded-lg border-2 ${inputClass}`}
                  >
                    <option value={6}>6 months</option>
                    <option value={12}>1 year</option>
                    <option value={24}>2 years</option>
                    <option value={36}>3 years</option>
                    <option value={-1}>Forever</option>
                  </select>
                </div>

                {/* Export & History */}
                <div className={`p-5 rounded-xl border-2 ${display.dark_mode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                  <h3 className="font-semibold mb-2">📥 Export My Data</h3>
                  <p className={`text-sm ${subTextClass} mb-4`}>Download all your data (GDPR compliant)</p>
                  <button
                    onClick={handleExportData}
                    disabled={exportingData}
                    className="bg-navy-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-navy-800 disabled:bg-gray-400 transition"
                  >
                    {exportingData ? '⏳ Preparing...' : '📥 Download My Data'}
                  </button>
                </div>

                {/* Learning History - Empty State */}
                <div className={`p-5 rounded-xl border-2 ${display.dark_mode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                  <h3 className="font-semibold mb-2">📜 Learning History</h3>
                  <div className={`p-8 text-center rounded-lg ${display.dark_mode ? 'bg-gray-800' : 'bg-white'}`}>
                    <span className="text-5xl mb-4 block">📚</span>
                    <p className={`font-medium ${labelClass}`}>No learning history yet</p>
                    <p className={`text-sm ${subTextClass} mt-1`}>Complete lessons and quizzes to see your history here</p>
                    <button
                      onClick={() => navigate('/dashboard')}
                      className="mt-4 bg-gold text-navy-900 px-6 py-2 rounded-lg font-semibold hover:bg-yellow-400 transition"
                    >
                      Start Learning
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ==================== PARENTAL CONTROLS - COMING SOON ==================== */}
            {activeSection === 'parental' && (
              <div className="space-y-6">
                <div className={`border-b pb-4 mb-6 ${display.dark_mode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <h2 className="text-2xl font-bold">👨‍👩‍👧 Parental Controls</h2>
                  <p className={subTextClass}>Monitor and manage learning</p>
                </div>

                {/* Coming Soon Header */}
                <div className={`p-6 rounded-xl border-2 text-center mb-6 ${display.dark_mode ? 'bg-gradient-to-br from-gray-700 to-gray-800 border-gray-600' : 'bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200'}`}>
                  <span className="text-5xl mb-3 block">🚀</span>
                  <h3 className="text-xl font-bold mb-2">Coming Soon</h3>
                  <p className={`${subTextClass} text-sm`}>
                    Powerful tools for parents to guide their child&apos;s financial education journey
                  </p>
                </div>

                {/* Phase 1: MVP */}
                <div className={`p-5 rounded-xl border-2 mb-4 ${display.dark_mode ? 'bg-green-900/20 border-green-500/50' : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300'}`}>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">PHASE 1</span>
                    <h4 className="font-bold text-green-700">Foundation</h4>
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    {[
                      { icon: '🔗', title: 'Parent Account Linking', desc: 'Verified email connection' },
                      { icon: '📧', title: 'Weekly Progress Email', desc: 'Summary of lessons, quizzes, time spent' },
                      { icon: '📊', title: 'Weak Topics Dashboard', desc: 'See where your child needs help' },
                      { icon: '⏱️', title: 'Custom Time Limits', desc: '15 min to 4 hour daily limits' },
                      { icon: '📅', title: 'Flexible Schedules', desc: 'Weekday / Weekend / Holiday modes' },
                      { icon: '🔐', title: 'Parent-Only Password', desc: 'You control password changes' },
                      { icon: '🛡️', title: 'Account Protection', desc: 'Child cannot delete account' },
                      { icon: '💬', title: 'Parent Messages', desc: 'Send encouragement on app open' }
                    ].map((item, i) => (
                      <div key={i} className={`flex items-start gap-3 p-3 rounded-lg ${display.dark_mode ? 'bg-gray-800/50' : 'bg-white/70'}`}>
                        <span className="text-xl">{item.icon}</span>
                        <div>
                          <p className="font-semibold text-sm">{item.title}</p>
                          <p className={`text-xs ${subTextClass}`}>{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Message Templates Callout */}
                  <div className={`mt-4 p-3 rounded-lg ${display.dark_mode ? 'bg-gray-800' : 'bg-white'} border ${display.dark_mode ? 'border-gray-600' : 'border-green-200'}`}>
                    <p className="text-sm font-semibold mb-2">💬 Parent Messages Feature</p>
                    <p className={`text-xs ${subTextClass}`}>
                      Write personal messages or use templates for inspiration. 
                      <span className="text-green-600 font-medium"> Create your own reusable templates!</span>
                    </p>
                  </div>
                </div>

                {/* Phase 2: Engagement */}
                <div className={`p-5 rounded-xl border-2 mb-4 ${display.dark_mode ? 'bg-blue-900/20 border-blue-500/50' : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300'}`}>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded">PHASE 2</span>
                    <h4 className="font-bold text-blue-700">Piggybank & Engagement</h4>
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    {[
                      { icon: '🐷', title: 'Virtual Piggybank', desc: 'Mirror real deposits digitally' },
                      { icon: '🎯', title: 'Savings Goals', desc: 'Child sets goals, tracks progress' },
                      { icon: '📚', title: 'Learning Application', desc: '"What will you invest in when you reach your goal?"' },
                      { icon: '⚠️', title: 'Struggle Alerts', desc: 'Notified when child fails quizzes' },
                      { icon: '🎯', title: 'Parent-Set Goals', desc: '"Complete 5 lessons this week"' },
                      { icon: '📝', title: 'Quiz Score History', desc: 'See all attempts and scores' },
                      { icon: '🧬', title: 'Financial DNA Report', desc: 'Receive child PPI results' },
                      { icon: '💡', title: 'Help Suggestions', desc: '"3 ways to help at home..."' }
                    ].map((item, i) => (
                      <div key={i} className={`flex items-start gap-3 p-3 rounded-lg ${display.dark_mode ? 'bg-gray-800/50' : 'bg-white/70'}`}>
                        <span className="text-xl">{item.icon}</span>
                        <div>
                          <p className="font-semibold text-sm">{item.title}</p>
                          <p className={`text-xs ${subTextClass}`}>{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Piggybank Callout */}
                  <div className={`mt-4 p-4 rounded-lg ${display.dark_mode ? 'bg-gray-800' : 'bg-white'} border ${display.dark_mode ? 'border-gray-600' : 'border-blue-200'}`}>
                    <p className="text-sm font-semibold mb-2">🐷 Virtual Piggybank Highlights</p>
                    <ul className={`text-xs ${subTextClass} space-y-1`}>
                      <li>• Parents physically deposit in child&apos;s presence → app mirrors it</li>
                      <li>• Accountability on both ends - win/win!</li>
                      <li>• Child answers: &quot;What will you invest in after reaching your goal?&quot;</li>
                      <li>• Ties lessons to real-world decisions</li>
                    </ul>
                  </div>
                </div>

                {/* Phase 3: Future */}
                <div className={`p-5 rounded-xl border-2 ${display.dark_mode ? 'bg-purple-900/20 border-purple-500/50' : 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-300'}`}>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded">PHASE 3</span>
                    <h4 className="font-bold text-purple-700">Future Roadmap</h4>
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    {[
                      { icon: '🏦', title: 'Plaid Bank Integration', desc: 'Connect real savings accounts' },
                      { icon: '👥', title: 'Community Controls', desc: 'Manage social features safely' },
                      { icon: '🏆', title: 'Family Leaderboard', desc: 'Friendly sibling competition' },
                      { icon: '🧹', title: 'Chore Integration', desc: 'Chores = virtual earnings' },
                      { icon: '🎓', title: 'Graduated Autonomy', desc: 'Controls relax as child ages' },
                      { icon: '🏫', title: 'School Integration', desc: 'Teachers can assign lessons' }
                    ].map((item, i) => (
                      <div key={i} className={`flex items-start gap-3 p-3 rounded-lg ${display.dark_mode ? 'bg-gray-800/50' : 'bg-white/70'}`}>
                        <span className="text-xl">{item.icon}</span>
                        <div>
                          <p className="font-semibold text-sm">{item.title}</p>
                          <p className={`text-xs ${subTextClass}`}>{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Plaid Callout */}
                  <div className={`mt-4 p-4 rounded-lg ${display.dark_mode ? 'bg-gray-800' : 'bg-white'} border ${display.dark_mode ? 'border-gray-600' : 'border-purple-200'}`}>
                    <p className="text-sm font-semibold mb-2">🏦 Real Bank Connection (Plaid)</p>
                    <ul className={`text-xs ${subTextClass} space-y-1`}>
                      <li>• Connect to 12,000+ banks securely</li>
                      <li>• Show real savings balance in app</li>
                      <li>• Auto-detect when parent makes deposits</li>
                      <li>• Track real savings growth over time</li>
                    </ul>
                  </div>
                </div>

                {/* Notify Me */}
                <div className={`mt-6 p-4 rounded-xl text-center ${display.dark_mode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <p className={`text-sm ${subTextClass} mb-3`}>Want to be notified when Parental Controls launch?</p>
                  <button className="bg-gold text-navy-900 px-6 py-2 rounded-lg font-semibold hover:bg-yellow-400 transition">
                    🔔 Notify Me
                  </button>
                </div>
              </div>
            )}

            {/* ==================== ACCOUNT ACTIONS ==================== */}
            {activeSection === 'danger' && (
              <div className="space-y-6">
                <div className={`border-b pb-4 mb-6 ${display.dark_mode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <h2 className="text-2xl font-bold">⚙️ Account Actions</h2>
                  <p className={subTextClass}>Manage your account and data</p>
                </div>

                {/* Reset Progress */}
                <div className={`p-5 rounded-xl border-2 ${display.dark_mode ? 'border-orange-500/50 bg-orange-900/20' : 'border-orange-300 bg-gradient-to-r from-orange-50 to-yellow-50'}`}>
                  <div className="flex items-start gap-4">
                    <span className="text-3xl">🔄</span>
                    <div className="flex-1">
                      <h3 className="font-bold text-orange-600 mb-2">Reset Learning Progress</h3>
                      <p className={`text-sm ${subTextClass} mb-3`}>Start fresh! This will clear:</p>
                      <ul className={`text-sm ${subTextClass} mb-4 list-disc list-inside space-y-1`}>
                        <li>All quiz scores and results</li>
                        <li>PPI responses and financial DNA</li>
                        <li>Chapter progress and unlocks</li>
                      </ul>
                      <p className="text-sm font-semibold text-green-600 mb-4">
                        ✓ Your account and settings will be kept
                      </p>
                      <button
                        onClick={() => setShowResetProgress(true)}
                        className="bg-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition"
                      >
                        🔄 Reset Progress
                      </button>
                    </div>
                  </div>
                </div>

                {/* Delete Account */}
                <div className={`p-5 rounded-xl border-2 ${display.dark_mode ? 'border-red-500/50 bg-red-900/20' : 'border-red-300 bg-gradient-to-r from-red-50 to-pink-50'}`}>
                  <div className="flex items-start gap-4">
                    <span className="text-3xl">🗑️</span>
                    <div className="flex-1">
                      <h3 className="font-bold text-red-600 mb-2">Delete Account Permanently</h3>
                      <p className={`text-sm ${subTextClass} mb-3`}>This will permanently delete:</p>
                      <ul className={`text-sm ${subTextClass} mb-4 list-disc list-inside space-y-1`}>
                        <li>Your entire account</li>
                        <li>All learning progress and data</li>
                        <li>Profile information</li>
                        <li>Everything - forever</li>
                      </ul>
                      <p className="text-sm font-bold text-red-600 mb-4">⚠️ This action CANNOT be undone!</p>
                      <button
                        onClick={() => { setShowDeleteModal(true); setDeleteStep(1); }}
                        className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition"
                        data-testid="delete-account-btn"
                      >
                        🗑️ Delete My Account
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            {!['security', 'danger', 'parental'].includes(activeSection) && (
              <div className={`mt-8 pt-6 border-t ${display.dark_mode ? 'border-gray-700' : 'border-gray-200'}`}>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-gold to-yellow-400 text-navy-900 py-4 rounded-xl font-bold text-lg hover:from-yellow-400 hover:to-gold disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition shadow-lg hover:shadow-xl border-2 border-yellow-500"
                  data-testid="save-btn"
                >
                  {loading ? '⏳ Saving...' : '💾 Save Changes'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Avatar Picker Modal */}
      {showAvatarPicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${cardClass} rounded-xl p-6 max-w-md w-full shadow-2xl border-2 ${display.dark_mode ? 'border-gray-600' : 'border-gray-200'}`}>
            <h3 className="text-xl font-bold mb-4">Choose Your Avatar</h3>
            <div className="grid grid-cols-6 gap-3 mb-6">
              {AVATAR_OPTIONS.map((avatar, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setProfile(prev => ({ ...prev, avatar, profile_picture_url: null }));
                    setShowAvatarPicker(false);
                  }}
                  className={`text-3xl p-2 rounded-lg hover:bg-gold/20 transition border-2 ${
                    profile.avatar === avatar ? 'bg-gold/30 border-gold' : 'border-transparent hover:border-gray-300'
                  }`}
                >
                  {avatar}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowAvatarPicker(false)}
              className={`w-full py-2 rounded-lg font-semibold border-2 ${display.dark_mode ? 'bg-gray-600 hover:bg-gray-500 border-gray-500' : 'bg-gray-200 hover:bg-gray-300 border-gray-300'}`}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Font Picker Modal */}
      {showFontPicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${cardClass} rounded-xl p-6 max-w-lg w-full shadow-2xl border-2 ${display.dark_mode ? 'border-gray-600' : 'border-gray-200'}`}>
            <h3 className="text-xl font-bold mb-4">🔤 Choose Font Style</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {FONT_OPTIONS.map((font) => (
                <button
                  key={font.value}
                  onClick={() => {
                    setDisplay(prev => ({ ...prev, font_family: font.value }));
                    setShowFontPicker(false);
                  }}
                  className={`w-full p-4 rounded-lg text-left transition border-2 flex justify-between items-center ${
                    display.font_family === font.value
                      ? 'bg-gold/20 border-gold'
                      : display.dark_mode
                        ? 'bg-gray-700 border-gray-600 hover:border-gray-400'
                        : 'bg-gray-50 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <div>
                    <span className="font-medium">{font.label}</span>
                    <p className={`text-lg mt-1 ${font.style}`} style={
                      font.value === 'georgia' ? { fontFamily: 'Georgia, serif' } :
                      font.value === 'times' ? { fontFamily: 'Times New Roman, serif' } :
                      font.value === 'arial' ? { fontFamily: 'Arial, sans-serif' } :
                      font.value === 'verdana' ? { fontFamily: 'Verdana, sans-serif' } :
                      font.value === 'courier' ? { fontFamily: 'Courier New, monospace' } :
                      font.value === 'comic' ? { fontFamily: 'Comic Sans MS, cursive' } :
                      {}
                    }>
                      {font.preview}
                    </p>
                  </div>
                  {display.font_family === font.value && (
                    <span className="text-gold text-xl">✓</span>
                  )}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowFontPicker(false)}
              className={`w-full mt-4 py-2 rounded-lg font-semibold border-2 ${display.dark_mode ? 'bg-gray-600 hover:bg-gray-500 border-gray-500' : 'bg-gray-200 hover:bg-gray-300 border-gray-300'}`}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Reset Progress Modal */}
      {showResetProgress && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${cardClass} rounded-xl p-6 max-w-md w-full shadow-2xl border-2 ${display.dark_mode ? 'border-gray-600' : 'border-gray-200'}`}>
            <h3 className="text-xl font-bold mb-4 text-orange-600">🔄 Reset All Progress?</h3>
            <p className={`${subTextClass} mb-6`}>
              This will clear all your learning progress, quiz scores, and PPI responses. Your account settings will be preserved.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetProgress(false)}
                className={`flex-1 py-3 rounded-lg font-semibold border-2 ${display.dark_mode ? 'bg-gray-600 hover:bg-gray-500 border-gray-500' : 'bg-gray-200 hover:bg-gray-300 border-gray-300'}`}
              >
                Cancel
              </button>
              <button
                onClick={handleResetProgress}
                disabled={loading}
                className="flex-1 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 disabled:bg-gray-400 border-2 border-orange-600"
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
          <div className={`${cardClass} rounded-xl p-6 max-w-md w-full shadow-2xl border-2 ${display.dark_mode ? 'border-gray-600' : 'border-gray-200'}`}>
            {deleteStep === 1 ? (
              <>
                <h3 className="text-xl font-bold mb-4 text-red-600">⚠️ Delete Account?</h3>
                <p className={`${subTextClass} mb-4`}>This will permanently delete:</p>
                <ul className={`${subTextClass} mb-6 list-disc list-inside space-y-1`}>
                  <li>All your progress and achievements</li>
                  <li>Quiz results and scores</li>
                  <li>PPI responses</li>
                  <li>All account data</li>
                </ul>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className={`flex-1 py-3 rounded-lg font-semibold border-2 ${display.dark_mode ? 'bg-gray-600 hover:bg-gray-500 border-gray-500' : 'bg-gray-200 hover:bg-gray-300 border-gray-300'}`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setDeleteStep(2)}
                    className="flex-1 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 border-2 border-red-700"
                  >
                    Continue
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-xl font-bold mb-4 text-red-600">⚠️⚠️ FINAL WARNING ⚠️⚠️</h3>
                <p className={`${subTextClass} mb-6`}>
                  You are about to <strong className="text-red-600">PERMANENTLY DELETE</strong> your account.
                  This action <strong>CANNOT</strong> be undone!
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => { setShowDeleteModal(false); setDeleteStep(1); }}
                    className={`flex-1 py-3 rounded-lg font-semibold border-2 ${display.dark_mode ? 'bg-gray-600 hover:bg-gray-500 border-gray-500' : 'bg-gray-200 hover:bg-gray-300 border-gray-300'}`}
                  >
                    Go Back
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                    className="flex-1 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:bg-gray-400 border-2 border-red-700"
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
