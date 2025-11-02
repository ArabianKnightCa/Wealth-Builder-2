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
          <h1 className="text-2xl font-bold" data-testid="settings-title">Settings</h1>
          <button 
            onClick={() => navigate('/dashboard')} 
            className="text-gold hover:underline"
            data-testid="back-btn"
          >
            Back to Dashboard
          </button>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto p-8">
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
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
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