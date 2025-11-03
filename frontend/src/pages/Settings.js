import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function Settings({ user, token }) {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    language: user.language || 'en',
    experience_level: user.experience_level || 3,
    notifications_enabled: true
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const languageOptions = [
    { code: 'en', name: 'English' },
    { code: 'ar', name: 'العربية (Arabic)' },
    { code: 'es', name: 'Español (Spanish)' },
    { code: 'zh', name: '中文 (Mandarin)' },
    { code: 'yue', name: '廣東話 (Cantonese)' },
    { code: 'hi', name: 'हिन्दी (Hindi)' },
    { code: 'pa', name: 'ਪੰਜਾਬੀ (Punjabi)' },
    { code: 'gu', name: 'ગુજરાતી (Gujarati)' },
    { code: 'ml', name: 'മലയാളം (Malayalam)' },
    { code: 'tl', name: 'Tagalog' },
    { code: 'ru', name: 'Русский (Russian)' },
    { code: 'arz', name: 'مصرى (Egyptian Arabic)' },
    { code: 'ur', name: 'اردو (Urdu)' },
    { code: 'rw', name: 'Kinyarwanda' },
    { code: 'uk', name: 'Українська (Ukrainian)' }
  ];

  const languageOptions = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español (Spanish)' },
    { code: 'zh', name: '中文 (Chinese)' },
    { code: 'hi', name: 'हिन्दी (Hindi)' },
    { code: 'ar', name: 'العربية (Arabic)' },
    { code: 'pt', name: 'Português (Portuguese)' },
    { code: 'ja', name: '日本語 (Japanese)' },
    { code: 'ko', name: '한국어 (Korean)' }
  ];

  const handleSave = async () => {
    setLoading(true);
    setMessage('');
    try {
      await axios.put(
        `${API}/settings`,
        settings,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      setMessage('Failed to save settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-navy-900 text-white p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold" data-testid="settings-title">Wealth Builder - Settings</h1>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/dashboard')} 
              className="text-gold hover:text-white text-2xl font-bold transition-colors"
              title="Help - Return to Dashboard"
              data-testid="help-btn"
            >
              ?
            </button>
            <button 
              onClick={() => navigate('/dashboard')} 
              className="text-gold hover:underline"
              data-testid="back-btn"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto p-8">
        <div className="card mb-6 bg-gradient-to-r from-navy-900 to-navy-700 text-white">
          <h2 className="text-2xl font-bold mb-4">Your Account</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">User ID:</span>
              <span className="bg-gold/20 text-gold px-3 py-1 rounded-full font-semibold" data-testid="user-id-display">
                {user.user_code}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Person Key:</span>
              <span className="font-mono text-sm text-gray-300">{user.person_key}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Email:</span>
              <span className="text-gray-300">{user.email}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Cohort:</span>
              <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-sm font-semibold">
                {user.cohort}
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-2xl font-bold text-navy-900 mb-6">Your Preferences</h2>

          {message && (
            <div className={`mb-4 p-4 rounded ${message.includes('success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`} data-testid="message">
              {message}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Language</label>
              <select
                className="input-field"
                value={settings.language}
                onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                data-testid="language-select"
              >
                {languageOptions.map(lang => (
                  <option key={lang.code} value={lang.code}>{lang.name}</option>
                ))}
              </select>
              <p className="text-sm text-gray-500 mt-1">Language setting saves successfully but UI translation is not yet implemented in this POC version.</p>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">Experience Level</label>
              <select
                className="input-field"
                value={settings.experience_level}
                onChange={(e) => setSettings({ ...settings, experience_level: parseInt(e.target.value) })}
                data-testid="experience-select"
              >
                {experienceLevels.map(level => (
                  <option key={level.value} value={level.value}>{level.label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="notifications"
                checked={settings.notifications_enabled}
                onChange={(e) => setSettings({ ...settings, notifications_enabled: e.target.checked })}
                className="mr-3"
                data-testid="notifications-checkbox"
              />
              <label htmlFor="notifications" className="text-gray-700">Enable Notifications</label>
            </div>

            <button
              onClick={handleSave}
              disabled={loading}
              className="btn-primary w-full"
              data-testid="save-btn"
            >
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;