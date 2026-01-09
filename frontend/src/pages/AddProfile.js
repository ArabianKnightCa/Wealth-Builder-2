import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function AddProfile({ token }) {
  const navigate = useNavigate();
  const [avatars, setAvatars] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    avatar: '👤',
    experience_level: 1,
    financial_goals: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAvatars();
  }, []);

  const fetchAvatars = async () => {
    try {
      const response = await axios.get(`${API}/profiles/avatars`);
      setAvatars(response.data.avatars);
      if (response.data.avatars.length > 0) {
        setFormData(prev => ({ ...prev, avatar: response.data.avatars[0] }));
      }
    } catch (error) {
      console.error('Failed to fetch avatars:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(
        `${API}/profiles/create`,
        {
          name: formData.name,
          age: parseInt(formData.age),
          avatar: formData.avatar,
          experience_level: formData.experience_level,
          financial_goals: formData.financial_goals
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Navigate back to profile selector
      navigate('/profiles');
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to create profile');
    } finally {
      setLoading(false);
    }
  };

  const toggleGoal = (goal) => {
    setFormData(prev => ({
      ...prev,
      financial_goals: prev.financial_goals.includes(goal)
        ? prev.financial_goals.filter(g => g !== goal)
        : [...prev.financial_goals, goal]
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-2xl mx-auto py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/profiles')}
            className="text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-2"
          >
            ← Back to Profiles
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Add New Profile</h1>
          <p className="text-gray-600 mt-2">Create a profile for a family member</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6 space-y-6">
          {/* Avatar Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Choose an Avatar
            </label>
            <div className="grid grid-cols-6 gap-3">
              {avatars.map(avatar => (
                <button
                  key={avatar}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, avatar }))}
                  className={`text-4xl p-3 rounded-lg transition-all ${
                    formData.avatar === avatar
                      ? 'bg-blue-100 ring-2 ring-blue-500'
                      : 'bg-gray-50 hover:bg-gray-200'
                  }`}
                >
                  {avatar}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter name"
            />
          </div>

          {/* Age */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Age <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              min="6"
              max="100"
              value={formData.age}
              onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter age"
            />
          </div>

          {/* Experience Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Financial Experience
            </label>
            <select
              value={formData.experience_level}
              onChange={(e) => setFormData(prev => ({ ...prev, experience_level: parseInt(e.target.value) }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={1}>1 - Just starting</option>
              <option value={2}>2 - Some basics</option>
              <option value={3}>3 - Intermediate</option>
              <option value={4}>4 - Comfortable</option>
              <option value={5}>5 - Advanced</option>
            </select>
          </div>

          {/* Goals */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Financial Goals (Optional)
            </label>
            <div className="space-y-2">
              {[
                { id: 'learn_money_basics', label: 'Learn Money Basics' },
                { id: 'save_for_purchase', label: 'Save for a Purchase' },
                { id: 'build_wealth', label: 'Build Long-term Wealth' },
                { id: 'start_business', label: 'Start a Business' }
              ].map(goal => (
                <label key={goal.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.financial_goals.includes(goal.id)}
                    onChange={() => toggleGoal(goal.id)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-700">{goal.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Profile'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/profiles')}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddProfile;
