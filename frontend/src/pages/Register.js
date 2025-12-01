import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import GoalSelector from './GoalSelector';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function Register({ onLogin }) {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    date_of_birth: '',
    language: 'en',
    experience_level: '',
    user_type: 'POC',
    occupation: '',
    state: '',
    school_name: '',
    school_city: '',
    school_state: '',
    parent_email: '',
    financial_goals: []
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

  const usStates = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
    'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
    'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
    'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico',
    'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
    'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
    'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
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

  const handlePage1Next = () => {
    setError('');
    
    if (!formData.first_name.trim()) {
      setError('Please enter your first name');
      return;
    }
    
    if (!formData.email.trim()) {
      setError('Please enter your email');
      return;
    }
    
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setCurrentPage(2);
  };

  const handlePage2Next = async () => {
    setError('');
    
    if (!formData.date_of_birth) {
      setError('Please enter your date of birth');
      return;
    }
    
    if (!formData.occupation) {
      setError('Please select your current role');
      return;
    }
    
    if (!formData.experience_level) {
      setError('Please select your financial experience level');
      return;
    }
    
    if (showParentConsent && !formData.parent_email) {
      setError('Parent/Guardian email is required for users under 18');
      return;
    }
    
    setLoading(true);
    try {
      const { confirmPassword, ...submitData } = formData;
      
      // Extract custom goals from localStorage
      const customGoals = submitData.financial_goals
        .filter(id => id.startsWith('custom_'))
        .map(id => localStorage.getItem(id))
        .filter(Boolean);
      
      // Clean custom goal IDs from localStorage after extracting
      submitData.financial_goals.forEach(id => {
        if (id.startsWith('custom_')) {
          localStorage.removeItem(id);
        }
      });
      
      const cleanData = {
        ...submitData,
        experience_level: parseInt(submitData.experience_level),
        school_name: submitData.school_name || null,
        school_city: submitData.school_city || null,
        school_state: submitData.school_state || null,
        parent_email: submitData.parent_email || null,
        financial_goals: submitData.financial_goals || [],
        custom_goals: customGoals
      };
      
      const response = await axios.post(`${API}/auth/register`, cleanData);
      console.log('Registration success:', response.data);
      onLogin(response.data.user, response.data.access_token);
      
      // Force navigation to PPI - use window.location for hard redirect
      window.location.href = '/ppi';
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
      console.error('Registration error:', err.response?.data);
      setLoading(false);
    }
  };

  // PAGE 1: Name, Email, Password
  if (currentPage === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-navy-900 to-navy-700 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-white mb-2" data-testid="register-title">Start Your Journey</h2>
            <p className="text-gray-300">Create an account to begin learning</p>
            <p className="text-gold mt-2">Step 1 of 3</p>
          </div>

          <div className="card">
            <div className="space-y-6">
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded" data-testid="error-message">
                  {error}
                </div>
              )}

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

              <button 
                type="button"
                onClick={handlePage1Next}
                className="btn-primary w-full" 
                data-testid="next-btn"
              >
                Continue
              </button>
            </div>

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

  // PAGE 2: Age, Role, Financial Experience
  if (currentPage === 2) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-navy-900 to-navy-700 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-white mb-2">Tell Us About You</h2>
            <p className="text-gray-300">Help us personalize your experience</p>
            <p className="text-gold mt-2">Step 2 of 4</p>
          </div>

          <div className="card">
            <div className="space-y-6">
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded" data-testid="error-message">
                  {error}
                </div>
              )}

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

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Preferred Language</label>
                <select
                  className="input-field"
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  required
                  data-testid="language-select"
                >
                  {languageOptions.map(lang => (
                    <option key={lang.code} value={lang.code}>{lang.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">State (Where are you from?)</label>
                <select
                  className="input-field"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  required
                  data-testid="state-select"
                >
                  <option value="">Select your state...</option>
                  {usStates.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
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
                <label className="block text-gray-700 font-semibold mb-2">Financial Experience Level</label>
                <select
                  className="input-field"
                  value={formData.experience_level}
                  onChange={(e) => setFormData({ ...formData, experience_level: e.target.value })}
                  required
                  data-testid="experience-select"
                >
                  <option value="">Choose your level...</option>
                  {experienceLevels.map(level => (
                    <option key={level.value} value={level.value}>{level.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-4">
                <button 
                  type="button"
                  onClick={() => setCurrentPage(1)}
                  className="px-6 py-3 bg-white border-2 border-gold text-navy-900 rounded-lg font-semibold hover:bg-gold hover:border-gold transition-all"
                  data-testid="back-btn"
                >
                  ← Back
                </button>
                <button 
                  type="button"
                  onClick={() => setCurrentPage(3)}
                  className="btn-primary flex-1" 
                  data-testid="continue-to-goals-btn"
                >
                  Continue to Goals
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // PAGE 3: Goal Selection
  if (currentPage === 3) {
    return (
      <GoalSelector
        selectedGoals={formData.financial_goals}
        onGoalsChange={(goals) => setFormData({ ...formData, financial_goals: goals })}
        onNext={handlePage2Next}
        onBack={() => setCurrentPage(2)}
      />
    );
  }

  return null;
}

export default Register;
