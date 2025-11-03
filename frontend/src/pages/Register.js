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
    confirmPassword: '',
    first_name: '',
    date_of_birth: '',
    language: 'en',
    experience_level: 3,
    user_type: 'POC',
    occupation: '',
    school_name: '',
    school_city: '',
    school_state: '',
    parent_email: ''
  });
  const [showSchoolCapture, setShowSchoolCapture] = useState(false);
  const [showParentConsent, setShowParentConsent] = useState(false);
  const [userAge, setUserAge] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const experienceLevels = [
    { value: 1, label: 'Beginner - Just starting with financial concepts' },
    { value: 2, label: 'Novice - Know some basics, want to learn more' },
    { value: 3, label: 'Intermediate - Comfortable with basic finance' },
    { value: 4, label: 'Advanced - Strong financial knowledge' },
    { value: 5, label: 'Expert - Deep understanding of finance' }
  ];

  const occupationOptions = [
    'Middle / High School Student',
    'College / University Student',
    'Part-Time Worker / Student',
    'Full-Time Employee',
    'Self-Employed / Freelancer',
    'Parent / Guardian',
    'Educator / Mentor / Advisor',
    'Unemployed / In Transition'
  ];

  const studentRoles = ['Middle / High School Student', 'College / University Student'];

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

  const handleOccupationChange = (occupation) => {
    setFormData({ ...formData, occupation });
    setShowSchoolCapture(studentRoles.includes(occupation));
  };

  const handleDOBChange = (dob) => {
    setFormData({ ...formData, date_of_birth: dob });
    const age = calculateAge(dob);
    setUserAge(age);
    setShowParentConsent(age !== null && age < 18);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.occupation) {
      setError('Please select your current role');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    
    if (showParentConsent && !formData.parent_email) {
      setError('Parent/Guardian email is required for users under 18');
      return;
    }
    
    setError('');
    setLoading(true);

    try {
      const { confirmPassword, ...submitData } = formData;
      
      // Clean up empty optional fields
      const cleanData = {
        ...submitData,
        school_name: submitData.school_name || null,
        school_city: submitData.school_city || null,
        school_state: submitData.school_state || null,
        parent_email: submitData.parent_email || null
      };
      
      const response = await axios.post(`${API}/auth/register`, cleanData);
      console.log('Registration success:', response.data);
      onLogin(response.data.user, response.data.access_token);
      
      // Force navigation to PPI
      setTimeout(() => {
        navigate('/ppi', { replace: true });
      }, 100);
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
      console.error('Registration error:', err.response?.data);
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
                  onChange={(e) => handleDOBChange(e.target.value)}
                  required
                  data-testid="dob-input"
                />
                {userAge !== null && userAge < 18 && (
                  <p className="text-sm text-blue-600 mt-1">⚠️ Parental consent required for users under 18</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">Which best describes your current role?</label>
              <select
                className="input-field"
                value={formData.occupation}
                onChange={(e) => handleOccupationChange(e.target.value)}
                required
                data-testid="occupation-select"
              >
                <option value="">Select your role...</option>
                {occupationOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            {showSchoolCapture && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-navy-900 mb-3">School Information</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">School Name</label>
                    <input
                      type="text"
                      className="input-field"
                      value={formData.school_name}
                      onChange={(e) => setFormData({ ...formData, school_name: e.target.value })}
                      placeholder="Enter your school name"
                      data-testid="school-name-input"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-700 mb-2">City (Optional)</label>
                      <input
                        type="text"
                        className="input-field"
                        value={formData.school_city}
                        onChange={(e) => setFormData({ ...formData, school_city: e.target.value })}
                        placeholder="City"
                        data-testid="school-city-input"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-2">State (Optional)</label>
                      <input
                        type="text"
                        className="input-field"
                        value={formData.school_state}
                        onChange={(e) => setFormData({ ...formData, school_state: e.target.value })}
                        placeholder="State"
                        data-testid="school-state-input"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {showParentConsent && (
              <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
                <h4 className="font-semibold text-navy-900 mb-2">🛡️ Parental Consent Required</h4>
                <p className="text-sm text-gray-700 mb-3">
                  Since you're under 18, we need a parent or guardian's permission. They'll receive a verification email.
                </p>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Parent/Guardian Email</label>
                  <input
                    type="email"
                    className="input-field"
                    value={formData.parent_email}
                    onChange={(e) => setFormData({ ...formData, parent_email: e.target.value })}
                    placeholder="parent@example.com"
                    required={showParentConsent}
                    data-testid="parent-email-input"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    Your parent will receive a verification link to approve your account.
                  </p>
                </div>
              </div>
            )}

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
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="input-field pr-12"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  minLength={8}
                  required
                  data-testid="password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  data-testid="toggle-password"
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className="input-field pr-12"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  minLength={8}
                  required
                  data-testid="confirm-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  data-testid="toggle-confirm-password"
                >
                  {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="text-sm text-red-600 mt-1">⚠️ Passwords do not match</p>
              )}
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">What is your level of financial experience?</label>
              <select
                className="input-field"
                value={formData.experience_level}
                onChange={(e) => setFormData({ ...formData, experience_level: parseInt(e.target.value) })}
                data-testid="experience-select"
              >
                <option value="">What's your level of financial experience?</option>
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