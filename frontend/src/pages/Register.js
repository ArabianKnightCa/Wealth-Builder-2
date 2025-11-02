import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function Register({ onLogin }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    date_of_birth: '',
    language: 'en',
    experience_level: 3,
    user_type: 'POC'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const experienceLevels = [
    { value: 1, label: 'Beginner - Just starting with financial concepts' },
    { value: 2, label: 'Novice - Know some basics, want to learn more' },
    { value: 3, label: 'Intermediate - Comfortable with basic finance' },
    { value: 4, label: 'Advanced - Strong financial knowledge' },
    { value: 5, label: 'Expert - Deep understanding of finance' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/register`, formData);
      onLogin(response.data.user, response.data.access_token);
      navigate('/ppi');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 to-navy-700 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-white mb-2" data-testid="register-title">Start Your Journey</h2>
          <p className="text-gray-300">Create an account to begin learning</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded" data-testid="error-message">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">First Name</label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  required
                  data-testid="first-name-input"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Date of Birth</label>
                <input
                  type="date"
                  className="input-field"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  required
                  data-testid="dob-input"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">Email</label>
              <input
                type="email"
                className="input-field"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                data-testid="email-input"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">Password (min 8 characters)</label>
              <input
                type="password"
                className="input-field"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                minLength={8}
                required
                data-testid="password-input"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">Financial Experience Level</label>
              <select
                className="input-field"
                value={formData.experience_level}
                onChange={(e) => setFormData({ ...formData, experience_level: parseInt(e.target.value) })}
                data-testid="experience-select"
              >
                {experienceLevels.map(level => (
                  <option key={level.value} value={level.value}>{level.label}</option>
                ))}
              </select>
            </div>

            <button 
              type="submit" 
              className="btn-primary w-full" 
              disabled={loading}
              data-testid="submit-btn"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <button 
                onClick={() => navigate('/login')} 
                className="text-gold font-semibold hover:underline"
                data-testid="login-link"
              >
                Sign In
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;