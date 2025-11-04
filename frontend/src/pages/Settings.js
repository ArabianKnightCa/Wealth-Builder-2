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

  const handleDeleteAccount = async () => {
    alert('DELETE BUTTON CLICKED! Function is being called.');
    console.log('handleDeleteAccount called');
    console.log('User:', user);
    
    if (!window.confirm('⚠️ Are you ABSOLUTELY SURE you want to delete your account? All data will be lost forever.')) {
      return;
    }
    if (!window.confirm('⚠️⚠️ FINAL WARNING: Click OK to permanently delete your account and all data.')) {
      return;
    }

    alert('About to send delete request...');
    
    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      alert('Backend URL: ' + BACKEND_URL);
      
      const response = await fetch(`${BACKEND_URL}/api/auth/delete-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email })
      });

      const data = await response.json();
      alert('Response received: ' + JSON.stringify(data));
      
      if (response.ok) {
        alert('✅ Account deleted successfully!');
        localStorage.clear();
        window.location.href = '/';
      } else {
        alert('❌ Delete failed: ' + (data.detail || 'Unknown error'));
      }
    } catch (error) {
      alert('❌ Exception: ' + error.message);
      console.error('Delete error:', error);
    }
  };
  const [message, setMessage] = useState('');

  const languageOptions = [
    { code: 'en', name: 'English' },
    { code: 'ar', name: 'Arabic - العربية' },
    { code: 'es', name: 'Spanish - Español' },
    { code: 'zh', name: 'Mandarin - 中文' },
    { code: 'yue', name: 'Cantonese - 廣東話' },
    { code: 'hi', name: 'Hindi - हिन्दी' },
    { code: 'pa', name: 'Punjabi - ਪੰਜਾਬੀ' },
    { code: 'gu', name: 'Gujarati - ગુજરાતી' },
    { code: 'ml', name: 'Malayalam - മലയാളം' },
    { code: 'tl', name: 'Tagalog' },
    { code: 'ru', name: 'Russian - Русский' },
    { code: 'arz', name: 'Egyptian Arabic - مصرى' },
    { code: 'ur', name: 'Urdu - اردو' },
    { code: 'rw', name: 'Kinyarwanda' },
    { code: 'uk', name: 'Ukrainian - Українська' }
  ];

  const experienceLevels = [
    { value: 1, label: 'Beginner' },
    { value: 2, label: 'Novice' },
    { value: 3, label: 'Intermediate' },
    { value: 4, label: 'Advanced' },
    { value: 5, label: 'Expert' }
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

            {/* Danger Zone */}
            <div className="mt-8 pt-8 border-t-2 border-red-200">
              <h3 className="text-lg font-bold text-red-600 mb-4">⚠️ Danger Zone</h3>
              <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
                <p className="text-sm text-red-800 mb-3">
                  Deleting your account will permanently remove all your data, progress, and quiz results. This action cannot be undone.
                </p>
                <button
                  onClick={async (e) => {
                    e.preventDefault();
                    console.log('DELETE CLICKED - INLINE');
                    
                    const confirmed = window.confirm('⚠️ DELETE YOUR ACCOUNT? This cannot be undone!');
                    if (!confirmed) {
                      console.log('User cancelled');
                      return;
                    }
                    
                    console.log('User confirmed, proceeding...');
                    console.log('User email:', user.email);
                    
                    try {
                      const url = `${process.env.REACT_APP_BACKEND_URL}/api/auth/delete-account`;
                      console.log('Sending to:', url);
                      
                      const res = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: user.email })
                      });
                      
                      console.log('Response status:', res.status);
                      const data = await res.json();
                      console.log('Response data:', data);
                      
                      if (res.ok) {
                        alert('✅ Account deleted! Logging out...');
                        localStorage.clear();
                        window.location.href = '/';
                      } else {
                        alert('❌ Failed: ' + (data.detail || 'Unknown error'));
                      }
                    } catch (err) {
                      console.error('Error:', err);
                      alert('❌ Error: ' + err.message);
                    }
                  }}
                  type="button"
                  className="w-full bg-red-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-red-700 transition-all"
                >
                  🗑️ Delete My Account Permanently
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;