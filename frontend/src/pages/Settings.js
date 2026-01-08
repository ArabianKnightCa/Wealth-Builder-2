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

// Timezone options (common ones)
const TIMEZONE_OPTIONS = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Central European (CET)' },
  { value: 'Asia/Tokyo', label: 'Japan (JST)' },
  { value: 'Asia/Shanghai', label: 'China (CST)' },
  { value: 'Asia/Kolkata', label: 'India (IST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' }
];

function Settings({ user, token, onUserUpdate, darkMode, setDarkMode }) {
  const navigate = useNavigate();
  
  // Profile Settings
  const [profile, setProfile] = useState({
    first_name: user.first_name || '',
    avatar: user.avatar || '👤',
    profile_picture_url: user.profile_picture_url || null
  });
  
  // Personal Info - including DOB
  const [personalInfo, setPersonalInfo] = useState({
    date_of_birth: user.date_of_birth || '',
    life_stage: user.life_stage || 'AD',
    occupation: user.occupation || '',
    location: user.location || null,
    timezone: user.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    pronouns: user.pronouns || '',
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
    lesson_length: user.lesson_length || 'medium',
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
    confirm_password: '',
    two_factor_enabled: user.two_factor_enabled || false
  });
  
  // Privacy Settings
  const [privacy, setPrivacy] = useState({
    profile_visible: user.profile_visible !== false,
    show_progress_publicly: user.show_progress_publicly || false,
    allow_analytics: user.allow_analytics !== false,
    data_retention_months: user.data_retention_months || 24
  });
  
  // Parental Controls
  const [parental, setParental] = useState({
    parent_email: user.parent_email || '',
    parent_name: user.parent_name || '',
    daily_time_limit: user.daily_time_limit || 60,
    content_filter: user.content_filter || 'standard',
    require_approval: user.require_approval || false,
    weekly_report: user.weekly_report !== false,
    verified: user.parent_verified || false
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
  const [loginHistory, setLoginHistory] = useState([]);
  const [showLoginHistory, setShowLoginHistory] = useState(false);

  // Calculate if user is minor (under 18)
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
  const isMinor = userAge !== null && userAge < 18;

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

  const fontOptions = [
    { value: 'default', label: 'System Default' },
    { value: 'serif', label: 'Serif (Traditional)' },
    { value: 'dyslexic', label: 'OpenDyslexic' },
    { value: 'mono', label: 'Monospace' }
  ];

  const dailyGoalOptions = [5, 10, 15, 20, 30, 45, 60];

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

  // Handle Select All / Clear All
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
        // Profile
        first_name: profile.first_name,
        avatar: profile.avatar,
        profile_picture_url: profile.profile_picture_url,
        // Personal Info
        date_of_birth: personalInfo.date_of_birth,
        life_stage: personalInfo.life_stage,
        occupation: personalInfo.occupation,
        location: personalInfo.location,
        timezone: personalInfo.timezone,
        pronouns: personalInfo.pronouns,
        secondary_email: personalInfo.secondary_email,
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
        milestone_celebrations: preferences.milestone_celebrations,
        streak_reminders: preferences.streak_reminders,
        quiet_hours_start: preferences.quiet_hours_start,
        quiet_hours_end: preferences.quiet_hours_end,
        email_frequency: preferences.email_frequency,
        // Display
        dark_mode: display.dark_mode,
        text_size: display.text_size,
        reduce_animations: display.reduce_animations,
        high_contrast: display.high_contrast,
        font_family: display.font_family,
        // Privacy
        profile_visible: privacy.profile_visible,
        show_progress_publicly: privacy.show_progress_publicly,
        allow_analytics: privacy.allow_analytics,
        data_retention_months: privacy.data_retention_months,
        // Parental (always save, backend handles validation)
        parent_email: parental.parent_email,
        parent_name: parental.parent_name,
        daily_time_limit: parental.daily_time_limit,
        content_filter: parental.content_filter,
        require_approval: parental.require_approval,
        weekly_report: parental.weekly_report
      };

      await axios.put(`${API}/settings`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update dark mode if changed
      if (setDarkMode && display.dark_mode !== darkMode) {
        setDarkMode(display.dark_mode);
        localStorage.setItem('darkMode', display.dark_mode);
      }

      showMessage('✅ Settings saved successfully!');
      
      // Update local user state if callback provided
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

      setSecurity({ ...security, current_password: '', new_password: '', confirm_password: '' });
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

  // Send verification to parent
  const handleSendParentVerification = async () => {
    if (!parental.parent_email) {
      showMessage('Please enter parent email first', 'error');
      return;
    }
    try {
      await axios.post(`${API}/parental/send-verification`, {
        parent_email: parental.parent_email,
        parent_name: parental.parent_name
      }, { headers: { Authorization: `Bearer ${token}` } });
      showMessage('Verification email sent to parent!');
    } catch (error) {
      showMessage('Failed to send verification', 'error');
    }
  };

  // Navigation sections
  const sections = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'personal', label: 'Personal Info', icon: '📋' },
    { id: 'learning', label: 'Learning', icon: '📚' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'display', label: 'Display', icon: '🎨' },
    { id: 'security', label: 'Security', icon: '🔐' },
    { id: 'privacy', label: 'Privacy', icon: '🛡️' },
    { id: 'parental', label: 'Parental Controls', icon: '👨‍👩‍👧' },
    { id: 'danger', label: 'Account Actions', icon: '⚙️' }
  ];

  // Dynamic classes based on dark mode
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
          {/* Sidebar Navigation */}
          <div className={`md:w-64 ${cardClass} rounded-xl shadow-lg p-4 h-fit md:sticky md:top-4`}>
            <nav className="space-y-1">
              {sections.map(section => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all flex items-center gap-3 ${
                    activeSection === section.id
                      ? 'bg-gradient-to-r from-gold to-yellow-400 text-navy-900 font-semibold shadow-md'
                      : display.dark_mode
                        ? 'text-gray-300 hover:bg-gray-700'
                        : 'text-gray-700 hover:bg-gray-100'
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
          <div className={`flex-1 ${cardClass} rounded-xl shadow-lg p-6`}>
            
            {/* ==================== PROFILE SECTION ==================== */}
            {activeSection === 'profile' && (
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-4 mb-6">
                  <h2 className="text-2xl font-bold">👤 Profile</h2>
                  <p className={subTextClass}>Manage your public identity</p>
                </div>
                
                {/* Avatar/Picture */}
                <div className="flex flex-col items-center mb-8">
                  <div className="relative group">
                    {profile.profile_picture_url ? (
                      <img 
                        src={profile.profile_picture_url} 
                        alt="Profile" 
                        className="w-32 h-32 rounded-full object-cover border-4 border-gold shadow-lg"
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-navy-900 to-navy-700 flex items-center justify-center text-6xl border-4 border-gold shadow-lg">
                        {profile.avatar}
                      </div>
                    )}
                    <button
                      onClick={() => setShowAvatarPicker(true)}
                      className="absolute bottom-0 right-0 bg-gold text-navy-900 rounded-full p-2 shadow-lg hover:bg-yellow-400 transition transform hover:scale-110"
                      title="Change avatar"
                    >
                      ✏️
                    </button>
                  </div>
                  
                  <label className="mt-4 cursor-pointer">
                    <span className="text-sm text-gold hover:underline flex items-center gap-2">
                      📷 {uploadingPicture ? 'Uploading...' : 'Upload custom photo'}
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
                  <label className={`block font-semibold mb-2 ${labelClass}`}>Display Name</label>
                  <input
                    type="text"
                    value={profile.first_name}
                    onChange={(e) => setProfile(prev => ({ ...prev, first_name: e.target.value }))}
                    className={`w-full px-4 py-3 rounded-lg border ${inputClass} focus:ring-2 focus:ring-gold focus:border-transparent`}
                    placeholder="Enter your name"
                    data-testid="name-input"
                  />
                </div>

                {/* User IDs Display - Simplified */}
                <div className={`p-5 rounded-xl ${display.dark_mode ? 'bg-gray-700/50' : 'bg-gradient-to-r from-gray-50 to-gray-100'} border ${display.dark_mode ? 'border-gray-600' : 'border-gray-200'}`}>
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    🆔 Your Account ID
                    <span className={`text-xs ${subTextClass} font-normal`}>(for support & sharing)</span>
                  </h3>
                  <div className="space-y-3">
                    {/* Primary UID - Most Important */}
                    {(user.uid || user.user_code) && (
                      <div className="flex justify-between items-center p-3 bg-gold/10 rounded-lg border border-gold/30">
                        <span className={`font-medium ${labelClass}`}>Your ID:</span>
                        <span className="font-mono font-bold text-lg text-gold bg-navy-900 px-4 py-1 rounded-full">
                          {user.uid || user.user_code}
                        </span>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className={`p-2 rounded ${display.dark_mode ? 'bg-gray-600' : 'bg-white'}`}>
                        <span className={subTextClass}>Email:</span>
                        <p className="font-medium truncate">{user.email}</p>
                      </div>
                      <div className={`p-2 rounded ${display.dark_mode ? 'bg-gray-600' : 'bg-white'}`}>
                        <span className={subTextClass}>Cohort:</span>
                        <p className="font-medium">
                          <span className="bg-blue-500 text-white px-2 py-0.5 rounded text-xs">{user.cohort || 'N/A'}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Profile Manager */}
                <div className={`pt-6 border-t ${display.dark_mode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <h3 className="font-semibold mb-3">👥 Family Profiles</h3>
                  <ProfileManager 
                    token={token} 
                    currentProfile={user} 
                    onProfileSwitch={() => window.location.reload()} 
                  />
                </div>
              </div>
            )}

            {/* ==================== PERSONAL INFO SECTION ==================== */}
            {activeSection === 'personal' && (
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-4 mb-6">
                  <h2 className="text-2xl font-bold">📋 Personal Information</h2>
                  <p className={subTextClass}>Your personal details help us personalize content</p>
                </div>

                {/* Date of Birth - EDITABLE */}
                <div>
                  <label className={`block font-semibold mb-2 ${labelClass}`}>
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={personalInfo.date_of_birth}
                    onChange={(e) => setPersonalInfo(prev => ({ ...prev, date_of_birth: e.target.value }))}
                    className={`w-full px-4 py-3 rounded-lg border ${inputClass} focus:ring-2 focus:ring-gold`}
                    data-testid="dob-input"
                  />
                  {userAge !== null && (
                    <p className={`text-sm mt-1 ${subTextClass}`}>
                      Age: {userAge} years old {isMinor && <span className="text-orange-500">(Minor - parental controls available)</span>}
                    </p>
                  )}
                </div>

                {/* Pronouns */}
                <div>
                  <label className={`block font-semibold mb-2 ${labelClass}`}>Pronouns (optional)</label>
                  <select
                    value={personalInfo.pronouns}
                    onChange={(e) => setPersonalInfo(prev => ({ ...prev, pronouns: e.target.value }))}
                    className={`w-full px-4 py-3 rounded-lg border ${inputClass} focus:ring-2 focus:ring-gold`}
                  >
                    <option value="">Prefer not to say</option>
                    <option value="he/him">He/Him</option>
                    <option value="she/her">She/Her</option>
                    <option value="they/them">They/Them</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Life Stage */}
                <div>
                  <label className={`block font-semibold mb-2 ${labelClass}`}>Life Stage</label>
                  <select
                    value={personalInfo.life_stage}
                    onChange={(e) => setPersonalInfo(prev => ({ ...prev, life_stage: e.target.value }))}
                    className={`w-full px-4 py-3 rounded-lg border ${inputClass} focus:ring-2 focus:ring-gold`}
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
                    className={`w-full px-4 py-3 rounded-lg border ${inputClass} focus:ring-2 focus:ring-gold`}
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
                    className={`w-full px-4 py-3 rounded-lg border ${inputClass} focus:ring-2 focus:ring-gold`}
                  >
                    {TIMEZONE_OPTIONS.map(tz => (
                      <option key={tz.value} value={tz.value}>{tz.label}</option>
                    ))}
                  </select>
                </div>

                {/* Secondary Email */}
                <div>
                  <label className={`block font-semibold mb-2 ${labelClass}`}>Backup Email (optional)</label>
                  <input
                    type="email"
                    value={personalInfo.secondary_email}
                    onChange={(e) => setPersonalInfo(prev => ({ ...prev, secondary_email: e.target.value }))}
                    className={`w-full px-4 py-3 rounded-lg border ${inputClass} focus:ring-2 focus:ring-gold`}
                    placeholder="backup@example.com"
                  />
                  <p className={`text-xs mt-1 ${subTextClass}`}>For account recovery</p>
                </div>
              </div>
            )}

            {/* ==================== LEARNING SECTION ==================== */}
            {activeSection === 'learning' && (
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-4 mb-6">
                  <h2 className="text-2xl font-bold">📚 Learning Preferences</h2>
                  <p className={subTextClass}>Customize your learning experience</p>
                </div>

                {/* Language */}
                <div>
                  <label className={`block font-semibold mb-2 ${labelClass}`}>Language</label>
                  <select
                    value={preferences.language}
                    onChange={(e) => setPreferences(prev => ({ ...prev, language: e.target.value }))}
                    className={`w-full px-4 py-3 rounded-lg border ${inputClass} focus:ring-2 focus:ring-gold`}
                    data-testid="language-select"
                  >
                    {languageOptions.map(lang => (
                      <option key={lang.code} value={lang.code}>{lang.name}</option>
                    ))}
                  </select>
                  <p className={`text-xs mt-1 ${subTextClass}`}>UI translation coming soon</p>
                </div>

                {/* Experience Level */}
                <div>
                  <label className={`block font-semibold mb-2 ${labelClass}`}>Financial Experience</label>
                  <select
                    value={preferences.experience_level}
                    onChange={(e) => setPreferences(prev => ({ ...prev, experience_level: parseInt(e.target.value) }))}
                    className={`w-full px-4 py-3 rounded-lg border ${inputClass} focus:ring-2 focus:ring-gold`}
                    data-testid="experience-select"
                  >
                    {experienceLevels.map(level => (
                      <option key={level.value} value={level.value}>{level.label}</option>
                    ))}
                  </select>
                </div>

                {/* Daily Learning Goal */}
                <div>
                  <label className={`block font-semibold mb-2 ${labelClass}`}>Daily Learning Goal</label>
                  <div className="flex flex-wrap gap-2">
                    {dailyGoalOptions.map(mins => (
                      <button
                        key={mins}
                        onClick={() => setPreferences(prev => ({ ...prev, daily_goal_minutes: mins }))}
                        className={`px-4 py-2 rounded-lg font-semibold transition ${
                          preferences.daily_goal_minutes === mins
                            ? 'bg-gradient-to-r from-gold to-yellow-400 text-navy-900 shadow-md'
                            : display.dark_mode
                              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {mins} min
                      </button>
                    ))}
                  </div>
                </div>

                {/* Lesson Length */}
                <div>
                  <label className={`block font-semibold mb-2 ${labelClass}`}>Preferred Lesson Length</label>
                  <div className="flex gap-2">
                    {['short', 'medium', 'detailed'].map(len => (
                      <button
                        key={len}
                        onClick={() => setPreferences(prev => ({ ...prev, lesson_length: len }))}
                        className={`flex-1 px-4 py-3 rounded-lg font-semibold capitalize transition ${
                          preferences.lesson_length === len
                            ? 'bg-gradient-to-r from-gold to-yellow-400 text-navy-900 shadow-md'
                            : display.dark_mode
                              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {len === 'short' ? '⚡ Short' : len === 'medium' ? '📖 Medium' : '📚 Detailed'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Enable Hints Toggle */}
                <div className={`flex items-center justify-between p-4 rounded-lg ${display.dark_mode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
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

                {/* Financial Goals - Enhanced with Select All */}
                <div className={`p-5 rounded-xl border-2 ${display.dark_mode ? 'border-gold/30 bg-gray-700/30' : 'border-gold/50 bg-gradient-to-br from-yellow-50 to-orange-50'}`}>
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <label className={`block font-semibold ${labelClass}`}>
                        🎯 Financial Goals
                      </label>
                      <p className={`text-sm ${subTextClass}`}>
                        {preferences.financial_goals?.length || 0} of {getAllGoalIds().length} selected
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleSelectAllGoals}
                        className="px-3 py-1 text-xs font-semibold bg-green-500 text-white rounded-full hover:bg-green-600 transition"
                      >
                        ✓ Select All
                      </button>
                      <button
                        onClick={handleClearAllGoals}
                        className="px-3 py-1 text-xs font-semibold bg-gray-400 text-white rounded-full hover:bg-gray-500 transition"
                      >
                        ✕ Clear
                      </button>
                    </div>
                  </div>
                  
                  <div className={`border rounded-lg max-h-72 overflow-y-auto ${display.dark_mode ? 'border-gray-600 bg-gray-800' : 'border-gray-200 bg-white'}`}>
                    {FINANCIAL_GOALS_CONFIG.categories.map((category, idx) => (
                      <div key={category.id} className={idx > 0 ? 'border-t border-gray-200' : ''}>
                        <button
                          type="button"
                          onClick={() => setOpenCategories(prev => ({ ...prev, [category.id]: !prev[category.id] }))}
                          className={`w-full flex justify-between items-center p-3 ${
                            display.dark_mode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                        >
                          <span className="font-medium text-sm flex items-center gap-2">
                            {category.label}
                            <span className={`text-xs px-2 py-0.5 rounded-full ${display.dark_mode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                              {category.goals.filter(g => preferences.financial_goals?.includes(g.id)).length}/{category.goals.length}
                            </span>
                          </span>
                          <span className="text-gold text-lg">{openCategories[category.id] ? '−' : '+'}</span>
                        </button>
                        {openCategories[category.id] && (
                          <div className={`p-3 space-y-1 ${display.dark_mode ? 'bg-gray-800' : 'bg-white'}`}>
                            {category.goals.map((goal) => (
                              <label key={goal.id} className={`flex items-center gap-3 p-2 rounded cursor-pointer transition ${
                                preferences.financial_goals?.includes(goal.id)
                                  ? display.dark_mode ? 'bg-gold/20' : 'bg-gold/10'
                                  : display.dark_mode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
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
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ==================== NOTIFICATIONS SECTION ==================== */}
            {activeSection === 'notifications' && (
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-4 mb-6">
                  <h2 className="text-2xl font-bold">🔔 Notifications</h2>
                  <p className={subTextClass}>Control how and when we reach you</p>
                </div>

                {/* Master Toggle */}
                <div className={`p-4 rounded-xl ${display.dark_mode ? 'bg-gray-700' : 'bg-gradient-to-r from-blue-50 to-indigo-50'} border ${display.dark_mode ? 'border-gray-600' : 'border-blue-200'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-lg">🔔 Enable Notifications</span>
                      <p className={`text-sm ${subTextClass}`}>Master toggle for all notifications</p>
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
                    {/* Learning Reminders */}
                    <div>
                      <label className={`block font-semibold mb-2 ${labelClass}`}>⏰ Daily Reminder Time</label>
                      <input
                        type="time"
                        value={preferences.reminder_time}
                        onChange={(e) => setPreferences(prev => ({ ...prev, reminder_time: e.target.value }))}
                        className={`w-full px-4 py-3 rounded-lg border ${inputClass}`}
                      />
                    </div>

                    {/* Notification Toggles */}
                    <div className="space-y-3">
                      {[
                        { key: 'achievement_alerts', label: '🏆 Achievement Alerts', desc: 'Get notified when you earn badges' },
                        { key: 'milestone_celebrations', label: '🎉 Milestone Celebrations', desc: 'Celebrate when you hit learning milestones' },
                        { key: 'streak_reminders', label: '🔥 Streak Reminders', desc: 'Reminders to maintain your learning streak' },
                        { key: 'weekly_email', label: '📧 Weekly Progress Email', desc: 'Receive a summary of your learning' }
                      ].map(item => (
                        <div key={item.key} className={`flex items-center justify-between p-4 rounded-lg ${display.dark_mode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
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

                    {/* Email Frequency */}
                    <div>
                      <label className={`block font-semibold mb-2 ${labelClass}`}>📬 Email Frequency</label>
                      <div className="flex gap-2">
                        {['daily', 'weekly', 'monthly', 'never'].map(freq => (
                          <button
                            key={freq}
                            onClick={() => setPreferences(prev => ({ ...prev, email_frequency: freq }))}
                            className={`flex-1 px-3 py-2 rounded-lg font-medium capitalize text-sm transition ${
                              preferences.email_frequency === freq
                                ? 'bg-gold text-navy-900'
                                : display.dark_mode
                                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {freq}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Quiet Hours */}
                    <div className={`p-4 rounded-lg ${display.dark_mode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <label className="block font-semibold mb-3">🌙 Quiet Hours</label>
                      <p className={`text-sm ${subTextClass} mb-3`}>No notifications during this time</p>
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <label className={`text-xs ${subTextClass}`}>From</label>
                          <input
                            type="time"
                            value={preferences.quiet_hours_start}
                            onChange={(e) => setPreferences(prev => ({ ...prev, quiet_hours_start: e.target.value }))}
                            className={`w-full px-3 py-2 rounded-lg border ${inputClass}`}
                          />
                        </div>
                        <div className="flex-1">
                          <label className={`text-xs ${subTextClass}`}>To</label>
                          <input
                            type="time"
                            value={preferences.quiet_hours_end}
                            onChange={(e) => setPreferences(prev => ({ ...prev, quiet_hours_end: e.target.value }))}
                            className={`w-full px-3 py-2 rounded-lg border ${inputClass}`}
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
                <div className="border-b border-gray-200 pb-4 mb-6">
                  <h2 className="text-2xl font-bold">🎨 Display & Accessibility</h2>
                  <p className={subTextClass}>Customize how the app looks and feels</p>
                </div>

                {/* Dark Mode */}
                <div className={`p-4 rounded-xl ${display.dark_mode ? 'bg-gradient-to-r from-gray-700 to-gray-600' : 'bg-gradient-to-r from-gray-100 to-gray-200'}`}>
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
                      <div className={`w-7 h-7 bg-white rounded-full shadow transform transition-transform flex items-center justify-center ${
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
                        className={`flex-1 px-4 py-3 rounded-lg font-semibold transition ${size.class} ${
                          display.text_size === size.value
                            ? 'bg-gold text-navy-900 shadow-md'
                            : display.dark_mode
                              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {size.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Font Family */}
                <div>
                  <label className={`block font-semibold mb-2 ${labelClass}`}>🔤 Font Style</label>
                  <select
                    value={display.font_family}
                    onChange={(e) => setDisplay(prev => ({ ...prev, font_family: e.target.value }))}
                    className={`w-full px-4 py-3 rounded-lg border ${inputClass} focus:ring-2 focus:ring-gold`}
                  >
                    {fontOptions.map(font => (
                      <option key={font.value} value={font.value}>{font.label}</option>
                    ))}
                  </select>
                  <p className={`text-xs mt-1 ${subTextClass}`}>OpenDyslexic recommended for users with dyslexia</p>
                </div>

                {/* Accessibility Toggles */}
                <div className="space-y-3">
                  <div className={`flex items-center justify-between p-4 rounded-lg ${display.dark_mode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
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

                  <div className={`flex items-center justify-between p-4 rounded-lg ${display.dark_mode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
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
                <div className="border-b border-gray-200 pb-4 mb-6">
                  <h2 className="text-2xl font-bold">🔐 Security</h2>
                  <p className={subTextClass}>Keep your account safe</p>
                </div>

                {/* Change Password */}
                <div className={`p-5 rounded-xl ${display.dark_mode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <h3 className="font-semibold mb-4 flex items-center gap-2">🔑 Change Password</h3>
                  <div className="space-y-4">
                    <input
                      type="password"
                      placeholder="Current password"
                      value={security.current_password}
                      onChange={(e) => setSecurity(prev => ({ ...prev, current_password: e.target.value }))}
                      className={`w-full px-4 py-3 rounded-lg border ${inputClass}`}
                    />
                    <input
                      type="password"
                      placeholder="New password (min 8 characters)"
                      value={security.new_password}
                      onChange={(e) => setSecurity(prev => ({ ...prev, new_password: e.target.value }))}
                      className={`w-full px-4 py-3 rounded-lg border ${inputClass}`}
                    />
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      value={security.confirm_password}
                      onChange={(e) => setSecurity(prev => ({ ...prev, confirm_password: e.target.value }))}
                      className={`w-full px-4 py-3 rounded-lg border ${inputClass}`}
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

                {/* Two-Factor Authentication */}
                <div className={`p-5 rounded-xl ${display.dark_mode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold flex items-center gap-2">🛡️ Two-Factor Authentication</h3>
                      <p className={`text-sm ${subTextClass}`}>Add an extra layer of security</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      security.two_factor_enabled 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {security.two_factor_enabled ? '✓ Enabled' : 'Coming Soon'}
                    </span>
                  </div>
                </div>

                {/* Active Sessions */}
                <div className={`p-5 rounded-xl ${display.dark_mode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">📱 Active Sessions</h3>
                  <p className={`text-sm ${subTextClass} mb-3`}>Devices where you are logged in</p>
                  <div className={`p-3 rounded-lg ${display.dark_mode ? 'bg-gray-600' : 'bg-white'} border ${display.dark_mode ? 'border-gray-500' : 'border-gray-200'}`}>
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
                  <button className="mt-3 text-red-500 text-sm font-semibold hover:underline">
                    Sign out of all other devices
                  </button>
                </div>

                {/* Connected Accounts */}
                <div className={`p-5 rounded-xl ${display.dark_mode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <h3 className="font-semibold mb-3">🔗 Connected Accounts</h3>
                  <div className={`flex items-center justify-between p-3 rounded-lg ${display.dark_mode ? 'bg-gray-600' : 'bg-white'}`}>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🔵</span>
                      <span>Google</span>
                    </div>
                    <button className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-500 text-white hover:bg-blue-600">
                      Connect
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ==================== PRIVACY SECTION ==================== */}
            {activeSection === 'privacy' && (
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-4 mb-6">
                  <h2 className="text-2xl font-bold">🛡️ Privacy</h2>
                  <p className={subTextClass}>Control your data and visibility</p>
                </div>

                {/* Profile Visibility */}
                <div className={`flex items-center justify-between p-4 rounded-lg ${display.dark_mode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                  <div>
                    <span className="font-semibold">👁️ Profile Visible</span>
                    <p className={`text-sm ${subTextClass}`}>Allow others to see your profile</p>
                  </div>
                  <button
                    onClick={() => setPrivacy(prev => ({ ...prev, profile_visible: !prev.profile_visible }))}
                    className={`w-14 h-8 rounded-full transition-colors ${
                      privacy.profile_visible ? 'bg-gold' : 'bg-gray-400'
                    }`}
                  >
                    <div className={`w-6 h-6 bg-white rounded-full shadow transform transition-transform ${
                      privacy.profile_visible ? 'translate-x-7' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                {/* Progress Sharing */}
                <div className={`flex items-center justify-between p-4 rounded-lg ${display.dark_mode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                  <div>
                    <span className="font-semibold">📊 Share Progress</span>
                    <p className={`text-sm ${subTextClass}`}>Show your learning progress publicly</p>
                  </div>
                  <button
                    onClick={() => setPrivacy(prev => ({ ...prev, show_progress_publicly: !prev.show_progress_publicly }))}
                    className={`w-14 h-8 rounded-full transition-colors ${
                      privacy.show_progress_publicly ? 'bg-gold' : 'bg-gray-400'
                    }`}
                  >
                    <div className={`w-6 h-6 bg-white rounded-full shadow transform transition-transform ${
                      privacy.show_progress_publicly ? 'translate-x-7' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                {/* Analytics */}
                <div className={`flex items-center justify-between p-4 rounded-lg ${display.dark_mode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                  <div>
                    <span className="font-semibold">📈 Allow Analytics</span>
                    <p className={`text-sm ${subTextClass}`}>Help us improve with anonymous usage data</p>
                  </div>
                  <button
                    onClick={() => setPrivacy(prev => ({ ...prev, allow_analytics: !prev.allow_analytics }))}
                    className={`w-14 h-8 rounded-full transition-colors ${
                      privacy.allow_analytics ? 'bg-gold' : 'bg-gray-400'
                    }`}
                  >
                    <div className={`w-6 h-6 bg-white rounded-full shadow transform transition-transform ${
                      privacy.allow_analytics ? 'translate-x-7' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                {/* Data Retention */}
                <div>
                  <label className={`block font-semibold mb-2 ${labelClass}`}>🗄️ Data Retention</label>
                  <p className={`text-sm ${subTextClass} mb-2`}>How long to keep your learning history</p>
                  <select
                    value={privacy.data_retention_months}
                    onChange={(e) => setPrivacy(prev => ({ ...prev, data_retention_months: parseInt(e.target.value) }))}
                    className={`w-full px-4 py-3 rounded-lg border ${inputClass}`}
                  >
                    <option value={6}>6 months</option>
                    <option value={12}>1 year</option>
                    <option value={24}>2 years</option>
                    <option value={36}>3 years</option>
                    <option value={-1}>Forever</option>
                  </select>
                </div>

                {/* Export Data */}
                <div className={`p-5 rounded-xl ${display.dark_mode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <h3 className="font-semibold mb-2">📥 Export My Data</h3>
                  <p className={`text-sm ${subTextClass} mb-4`}>
                    Download all your data (GDPR compliant)
                  </p>
                  <button
                    onClick={handleExportData}
                    disabled={exportingData}
                    className="bg-navy-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-navy-800 disabled:bg-gray-400 transition"
                  >
                    {exportingData ? '⏳ Preparing...' : '📥 Download My Data'}
                  </button>
                </div>

                {/* View History */}
                <div className={`p-5 rounded-xl ${display.dark_mode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <h3 className="font-semibold mb-2">📜 Learning History</h3>
                  <p className={`text-sm ${subTextClass} mb-4`}>View your completed lessons and quizzes</p>
                  <button
                    onClick={() => navigate('/history')}
                    className="bg-gold text-navy-900 px-6 py-3 rounded-lg font-semibold hover:bg-yellow-400 transition"
                  >
                    📊 View History
                  </button>
                </div>
              </div>
            )}

            {/* ==================== PARENTAL CONTROLS SECTION ==================== */}
            {activeSection === 'parental' && (
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-4 mb-6">
                  <h2 className="text-2xl font-bold">👨‍👩‍👧 Parental Controls</h2>
                  <p className={subTextClass}>
                    {isMinor 
                      ? 'Connect a parent or guardian to your account' 
                      : 'Monitor and manage your child\'s learning'}
                  </p>
                </div>

                {/* Info Banner */}
                <div className={`p-4 rounded-xl ${display.dark_mode ? 'bg-blue-900/30' : 'bg-blue-50'} border border-blue-200`}>
                  <p className="text-sm">
                    {isMinor 
                      ? '👋 Since you are under 18, you can connect a parent or guardian to receive updates about your progress.'
                      : '👨‍👩‍👧 Set up parental controls to monitor learning progress and set limits.'}
                  </p>
                </div>

                {/* Parent Info */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block font-semibold mb-2 ${labelClass}`}>Parent/Guardian Name</label>
                    <input
                      type="text"
                      value={parental.parent_name}
                      onChange={(e) => setParental(prev => ({ ...prev, parent_name: e.target.value }))}
                      placeholder="Parent name"
                      className={`w-full px-4 py-3 rounded-lg border ${inputClass}`}
                    />
                  </div>
                  <div>
                    <label className={`block font-semibold mb-2 ${labelClass}`}>Parent/Guardian Email</label>
                    <input
                      type="email"
                      value={parental.parent_email}
                      onChange={(e) => setParental(prev => ({ ...prev, parent_email: e.target.value }))}
                      placeholder="parent@example.com"
                      className={`w-full px-4 py-3 rounded-lg border ${inputClass}`}
                    />
                  </div>
                </div>

                {/* Verification Status */}
                <div className={`flex items-center justify-between p-4 rounded-lg ${
                  parental.verified 
                    ? display.dark_mode ? 'bg-green-900/30' : 'bg-green-50'
                    : display.dark_mode ? 'bg-yellow-900/30' : 'bg-yellow-50'
                }`}>
                  <div>
                    <span className="font-semibold">
                      {parental.verified ? '✅ Parent Verified' : '⏳ Pending Verification'}
                    </span>
                    <p className={`text-sm ${subTextClass}`}>
                      {parental.verified 
                        ? 'Parent has confirmed their email' 
                        : 'Send a verification email to the parent'}
                    </p>
                  </div>
                  {!parental.verified && (
                    <button
                      onClick={handleSendParentVerification}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 text-sm"
                    >
                      Send Verification
                    </button>
                  )}
                </div>

                {/* Daily Time Limit */}
                <div>
                  <label className={`block font-semibold mb-2 ${labelClass}`}>⏱️ Daily Time Limit</label>
                  <p className={`text-sm ${subTextClass} mb-2`}>Maximum learning time per day</p>
                  <select
                    value={parental.daily_time_limit}
                    onChange={(e) => setParental(prev => ({ ...prev, daily_time_limit: parseInt(e.target.value) }))}
                    className={`w-full px-4 py-3 rounded-lg border ${inputClass}`}
                  >
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hours</option>
                    <option value={120}>2 hours</option>
                    <option value={-1}>No limit</option>
                  </select>
                </div>

                {/* Content Filter */}
                <div>
                  <label className={`block font-semibold mb-2 ${labelClass}`}>🛡️ Content Filter</label>
                  <div className="flex gap-2">
                    {['strict', 'standard', 'off'].map(level => (
                      <button
                        key={level}
                        onClick={() => setParental(prev => ({ ...prev, content_filter: level }))}
                        className={`flex-1 px-4 py-3 rounded-lg font-semibold capitalize transition ${
                          parental.content_filter === level
                            ? 'bg-gold text-navy-900'
                            : display.dark_mode
                              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {level === 'strict' ? '🔒 Strict' : level === 'standard' ? '📘 Standard' : '🔓 Off'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Toggles */}
                <div className="space-y-3">
                  <div className={`flex items-center justify-between p-4 rounded-lg ${display.dark_mode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <div>
                      <span className="font-semibold">📧 Weekly Progress Report</span>
                      <p className={`text-sm ${subTextClass}`}>Email weekly summary to parent</p>
                    </div>
                    <button
                      onClick={() => setParental(prev => ({ ...prev, weekly_report: !prev.weekly_report }))}
                      className={`w-14 h-8 rounded-full transition-colors ${
                        parental.weekly_report ? 'bg-gold' : 'bg-gray-400'
                      }`}
                    >
                      <div className={`w-6 h-6 bg-white rounded-full shadow transform transition-transform ${
                        parental.weekly_report ? 'translate-x-7' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>

                  <div className={`flex items-center justify-between p-4 rounded-lg ${display.dark_mode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <div>
                      <span className="font-semibold">✅ Require Approval</span>
                      <p className={`text-sm ${subTextClass}`}>Parent must approve certain actions</p>
                    </div>
                    <button
                      onClick={() => setParental(prev => ({ ...prev, require_approval: !prev.require_approval }))}
                      className={`w-14 h-8 rounded-full transition-colors ${
                        parental.require_approval ? 'bg-gold' : 'bg-gray-400'
                      }`}
                    >
                      <div className={`w-6 h-6 bg-white rounded-full shadow transform transition-transform ${
                        parental.require_approval ? 'translate-x-7' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ==================== ACCOUNT ACTIONS (DANGER ZONE) ==================== */}
            {activeSection === 'danger' && (
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-4 mb-6">
                  <h2 className="text-2xl font-bold">⚙️ Account Actions</h2>
                  <p className={subTextClass}>Manage your account and data</p>
                </div>

                {/* Reset Progress - Orange/Warning */}
                <div className={`p-5 rounded-xl border-2 ${display.dark_mode ? 'border-orange-500/50 bg-orange-900/20' : 'border-orange-300 bg-gradient-to-r from-orange-50 to-yellow-50'}`}>
                  <div className="flex items-start gap-4">
                    <span className="text-3xl">🔄</span>
                    <div className="flex-1">
                      <h3 className="font-bold text-orange-600 mb-2">Reset Learning Progress</h3>
                      <p className={`text-sm ${subTextClass} mb-3`}>
                        Start fresh! This will clear:
                      </p>
                      <ul className={`text-sm ${subTextClass} mb-4 list-disc list-inside space-y-1`}>
                        <li>All quiz scores and results</li>
                        <li>PPI responses and financial DNA</li>
                        <li>Chapter progress and unlocks</li>
                      </ul>
                      <p className="text-sm font-semibold text-green-600 mb-4">
                        ✓ Your account, settings, and profile will be kept
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

                {/* Delete Account - Red/Danger */}
                <div className={`p-5 rounded-xl border-2 ${display.dark_mode ? 'border-red-500/50 bg-red-900/20' : 'border-red-300 bg-gradient-to-r from-red-50 to-pink-50'}`}>
                  <div className="flex items-start gap-4">
                    <span className="text-3xl">🗑️</span>
                    <div className="flex-1">
                      <h3 className="font-bold text-red-600 mb-2">Delete Account Permanently</h3>
                      <p className={`text-sm ${subTextClass} mb-3`}>
                        This will permanently delete:
                      </p>
                      <ul className={`text-sm ${subTextClass} mb-4 list-disc list-inside space-y-1`}>
                        <li>Your entire account</li>
                        <li>All learning progress and data</li>
                        <li>Profile information</li>
                        <li>Everything - forever</li>
                      </ul>
                      <p className="text-sm font-bold text-red-600 mb-4">
                        ⚠️ This action CANNOT be undone!
                      </p>
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

            {/* Save Button (shown on most sections) */}
            {!['security', 'danger'].includes(activeSection) && (
              <div className={`mt-8 pt-6 border-t ${display.dark_mode ? 'border-gray-700' : 'border-gray-200'}`}>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-gold to-yellow-400 text-navy-900 py-4 rounded-xl font-bold text-lg hover:from-yellow-400 hover:to-gold disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition shadow-lg hover:shadow-xl"
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
          <div className={`${cardClass} rounded-xl p-6 max-w-md w-full shadow-2xl`}>
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
              className={`w-full py-2 ${display.dark_mode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'} rounded-lg font-semibold`}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Reset Progress Modal */}
      {showResetProgress && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${cardClass} rounded-xl p-6 max-w-md w-full shadow-2xl`}>
            <h3 className="text-xl font-bold mb-4 text-orange-600">🔄 Reset All Progress?</h3>
            <p className={`${subTextClass} mb-6`}>
              This will clear all your learning progress, quiz scores, and PPI responses. Your account settings will be preserved.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetProgress(false)}
                className={`flex-1 py-3 ${display.dark_mode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'} rounded-lg font-semibold`}
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
          <div className={`${cardClass} rounded-xl p-6 max-w-md w-full shadow-2xl`}>
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
                    className={`flex-1 py-3 ${display.dark_mode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'} rounded-lg font-semibold`}
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
                <p className={`${subTextClass} mb-6`}>
                  You are about to <strong className="text-red-600">PERMANENTLY DELETE</strong> your account.
                  This action <strong>CANNOT</strong> be undone!
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => { setShowDeleteModal(false); setDeleteStep(1); }}
                    className={`flex-1 py-3 ${display.dark_mode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'} rounded-lg font-semibold`}
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
