import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function AdminPanel({ onLogin }) {
  const navigate = useNavigate();
  const [masterCode, setMasterCode] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'quizzes'
  const [validationReport, setValidationReport] = useState(null);
  const [loadingValidation, setLoadingValidation] = useState(false);

  const MASTER_CODE = 'WEALTHBUILDER';

  // Feature 1: Fetch quiz validation report
  const fetchValidationReport = async () => {
    setLoadingValidation(true);
    try {
      const response = await axios.get(`${API}/admin/quiz-validation-report`);
      setValidationReport(response.data);
    } catch (error) {
      console.error('Error fetching validation report:', error);
      setMessage('❌ Error loading validation report');
    } finally {
      setLoadingValidation(false);
    }
  };

  // Feature 1: Run validation with auto-correct option
  const runValidation = async (autoCorrect = false) => {
    setLoadingValidation(true);
    setMessage(autoCorrect ? 'Running validation with auto-correct...' : 'Running validation...');
    try {
      const response = await axios.post(`${API}/admin/quiz-validation-run?auto_correct=${autoCorrect}`);
      setValidationReport(response.data.report);
      setMessage(`✅ Validation completed! ${autoCorrect ? 'Auto-corrections applied.' : ''}`);
    } catch (error) {
      console.error('Error running validation:', error);
      setMessage('❌ Error running validation');
    } finally {
      setLoadingValidation(false);
    }
  };

  useEffect(() => {
    if (unlocked && activeTab === 'quizzes' && !validationReport) {
      fetchValidationReport();
    }
  }, [unlocked, activeTab]);

  // AE-CORE v2.0 Test Cases (18 Automated Test Scenarios)
  const testProfiles = [
    // GROUP 1: EDGE CASES
    {
      name: 'Test 1: Min Age + Min Experience',
      testCase: 'Edge Case',
      profile: {
        email: 'test_01_min@test.com',
        password: 'Test1234',
        first_name: 'MinUser',
        date_of_birth: '2019-01-01', // Age 6
        experience_level: 1,
        ppi_pattern: 'curious',
        expectedScore: 0.0
      }
    },
    {
      name: 'Test 2: Max Age + Max Experience',
      testCase: 'Edge Case',
      profile: {
        email: 'test_02_max@test.com',
        password: 'Test1234',
        first_name: 'MaxUser',
        date_of_birth: '1926-01-01', // Age 99
        experience_level: 5,
        ppi_pattern: 'balanced',
        expectedScore: 1.0
      }
    },
    {
      name: 'Test 3: Young Expert (6yo, Exp 5)',
      testCase: 'Edge Case',
      profile: {
        email: 'test_03_young_expert@test.com',
        password: 'Test1234',
        first_name: 'Prodigy',
        date_of_birth: '2019-01-01', // Age 6
        experience_level: 5,
        ppi_pattern: 'competitive',
        expectedScore: 0.6
      }
    },
    {
      name: 'Test 4: Senior Beginner (99yo, Exp 1)',
      testCase: 'Edge Case',
      profile: {
        email: 'test_04_senior_beginner@test.com',
        password: 'Test1234',
        first_name: 'SeniorNew',
        date_of_birth: '1926-01-01', // Age 99
        experience_level: 1,
        ppi_pattern: 'collaborative',
        expectedScore: 0.4
      }
    },
    {
      name: 'Test 5: Child Beginner (10yo, Exp 1)',
      testCase: 'Age Band',
      profile: {
        email: 'test_05_child@test.com',
        password: 'Test1234',
        first_name: 'Child',
        date_of_birth: '2015-06-15', // Age 10
        experience_level: 1,
        ppi_pattern: 'curious',
        expectedScore: 0.017
      }
    },
    {
      name: 'Test 6: Teen Novice (15yo, Exp 2)',
      testCase: 'Age Band',
      profile: {
        email: 'test_06_teen@test.com',
        password: 'Test1234',
        first_name: 'Teen',
        date_of_birth: '2010-03-20', // Age 15
        experience_level: 2,
        ppi_pattern: 'balanced',
        expectedScore: 0.189
      }
    },
    
    // GROUP 2: FORMULA ACCURACY
    {
      name: 'Test 7: Midpoint (53yo, Exp 3)',
      testCase: 'Formula Check',
      profile: {
        email: 'test_07_midpoint@test.com',
        password: 'Test1234',
        first_name: 'MidUser',
        date_of_birth: '1972-06-15', // Age 53
        experience_level: 3,
        ppi_pattern: 'balanced',
        expectedScore: 0.5
      }
    },
    {
      name: 'Test 8: Experience Weight (30yo, Exp varies)',
      testCase: 'Weight Test',
      profile: {
        email: 'test_08_exp_weight@test.com',
        password: 'Test1234',
        first_name: 'ExpTest',
        date_of_birth: '1995-01-01', // Age 30
        experience_level: 3,
        ppi_pattern: 'organized',
        expectedScore: 0.36
      }
    },
    {
      name: 'Test 9: Age Weight (varies, Exp 3)',
      testCase: 'Weight Test',
      profile: {
        email: 'test_09_age_weight@test.com',
        password: 'Test1234',
        first_name: 'AgeTest',
        date_of_birth: '1980-01-01', // Age 45
        experience_level: 3,
        ppi_pattern: 'competitive',
        expectedScore: 0.47
      }
    },
    {
      name: 'Test 10: Linear Age Progression (28yo)',
      testCase: 'Linearity',
      profile: {
        email: 'test_10_linear_age@test.com',
        password: 'Test1234',
        first_name: 'Linear',
        date_of_birth: '1997-01-01', // Age 28
        experience_level: 3,
        ppi_pattern: 'balanced',
        expectedScore: 0.395
      }
    },
    {
      name: 'Test 11: Linear Exp Progression (40yo)',
      testCase: 'Linearity',
      profile: {
        email: 'test_11_linear_exp@test.com',
        password: 'Test1234',
        first_name: 'LinearExp',
        date_of_birth: '1985-01-01', // Age 40
        experience_level: 3,
        ppi_pattern: 'curious',
        expectedScore: 0.446
      }
    },
    {
      name: 'Test 12: Normalization Check (50yo, Exp 3)',
      testCase: 'Bounds',
      profile: {
        email: 'test_12_normalization@test.com',
        password: 'Test1234',
        first_name: 'Normalized',
        date_of_birth: '1975-01-01', // Age 50
        experience_level: 3,
        ppi_pattern: 'organized',
        expectedScore: 0.489
      }
    },
    
    // GROUP 3: REAL-WORLD SCENARIOS
    {
      name: 'Test 13: Young Professional (25yo, Exp 3)',
      testCase: 'Real World',
      profile: {
        email: 'test_13_young_pro@test.com',
        password: 'Test1234',
        first_name: 'YoungPro',
        date_of_birth: '2000-05-15', // Age 25
        experience_level: 3,
        ppi_pattern: 'competitive',
        expectedScore: 0.382
      }
    },
    {
      name: 'Test 14: Mid-Career Advanced (40yo, Exp 4)',
      testCase: 'Real World',
      profile: {
        email: 'test_14_midcareer@test.com',
        password: 'Test1234',
        first_name: 'MidCareer',
        date_of_birth: '1985-08-20', // Age 40
        experience_level: 4,
        ppi_pattern: 'organized',
        expectedScore: 0.596
      }
    },
    {
      name: 'Test 15: Senior Expert (60yo, Exp 5)',
      testCase: 'Real World',
      profile: {
        email: 'test_15_senior_expert@test.com',
        password: 'Test1234',
        first_name: 'SeniorExp',
        date_of_birth: '1965-12-10', // Age 60
        experience_level: 5,
        ppi_pattern: 'balanced',
        expectedScore: 0.832
      }
    },
    {
      name: 'Test 16: Career Changer (45yo, Exp 1)',
      testCase: 'Real World',
      profile: {
        email: 'test_16_career_change@test.com',
        password: 'Test1234',
        first_name: 'Changer',
        date_of_birth: '1980-03-15', // Age 45
        experience_level: 1,
        ppi_pattern: 'collaborative',
        expectedScore: 0.168
      }
    },
    {
      name: 'Test 17: Child Prodigy (8yo, Exp 3)',
      testCase: 'Real World',
      profile: {
        email: 'test_17_prodigy@test.com',
        password: 'Test1234',
        first_name: 'Prodigy',
        date_of_birth: '2017-06-20', // Age 8
        experience_level: 3,
        ppi_pattern: 'curious',
        expectedScore: 0.309
      }
    },
    {
      name: 'Test 18: Consistency Check (30yo, Exp 3)',
      testCase: 'Deterministic',
      profile: {
        email: 'test_18_consistency@test.com',
        password: 'Test1234',
        first_name: 'Consistent',
        date_of_birth: '1995-09-25', // Age 30
        experience_level: 3,
        ppi_pattern: 'balanced',
        expectedScore: 0.403
      }
    }
  ];

  const handleUnlock = () => {
    if (masterCode === MASTER_CODE) {
      setUnlocked(true);
      setMessage('Admin Panel Unlocked! 🔓');
    } else {
      setMessage('Invalid master code. Try again.');
    }
  };

  const getPPIAnswers = (pattern) => {
    const answers = [];
    const patterns = {
      curious: ['A', 'B', 'A', 'D', 'A', 'B', 'A', 'B', 'D', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A'],
      organized: ['B', 'A', 'B', 'A', 'B', 'A', 'B', 'B', 'B', 'B', 'B', 'B', 'B', 'B', 'B', 'B', 'B', 'B', 'B', 'B'],
      collaborative: ['D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'D'],
      competitive: ['C', 'C', 'C', 'B', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C', 'C'],
      balanced: ['A', 'B', 'C', 'D', 'A', 'B', 'C', 'D', 'A', 'B', 'C', 'D', 'A', 'B', 'C', 'D', 'A', 'B', 'C', 'D']
    };

    const selectedPattern = patterns[pattern] || patterns.balanced;
    for (let i = 1; i <= 20; i++) {
      answers.push({
        question_id: `ppi_${String(i).padStart(2, '0')}`,
        selected_option: selectedPattern[i - 1]
      });
    }
    return answers;
  };

  const createTestUser = async (profile, skipPPI = false, unlockAllChapters = false) => {
    setLoading(true);
    setMessage('Creating test user...');

    try {
      // Register user with all required fields including location
      const registerResponse = await axios.post(`${API}/auth/register`, {
        email: profile.email,
        password: profile.password,
        first_name: profile.first_name,
        date_of_birth: profile.date_of_birth,
        language: 'en',
        experience_level: profile.experience_level,
        user_type: 'POC',
        occupation: profile.occupation || 'Full-Time Employee',
        location: profile.location || {
          city: 'San Francisco',
          country: 'United States',
          country_code: 'US',
          formatted_address: 'San Francisco, United States'
        },
        financial_goals: ['save_money', 'invest']
      });

      const { user, access_token } = registerResponse.data;

      // If skipPPI, submit PPI answers
      if (skipPPI) {
        const ppiAnswers = getPPIAnswers(profile.ppi_pattern);
        await axios.post(
          `${API}/ppi/submit`,
          { answers: ppiAnswers },
          { headers: { Authorization: `Bearer ${access_token}` } }
        );
      }

      // If unlockAllChapters, unlock and pass all quizzes
      if (unlockAllChapters) {
        for (let i = 1; i <= 10; i++) {
          const chapterId = `CH${String(i).padStart(2, '0')}`;
          
          // Submit perfect quiz answers
          const quizAnswers = [
            { question_id: `${chapterId}_Q01`, selected_option: 'B' },
            { question_id: `${chapterId}_Q02`, selected_option: i === 5 ? 'C' : (i === 7 ? 'A' : 'B') },
            { question_id: `${chapterId}_Q03`, selected_option: i === 3 ? 'A' : 'B' }
          ];

          await axios.post(
            `${API}/lpi/quiz/submit`,
            { chapter_id: chapterId, answers: quizAnswers },
            { headers: { Authorization: `Bearer ${access_token}` } }
          );
        }
      }

      setMessage(`✅ User created successfully! Logging you in...`);
      setTimeout(() => {
        onLogin(user, access_token);
        navigate(unlockAllChapters ? '/completed' : (skipPPI ? '/dashboard' : '/ppi'));
      }, 1000);

    } catch (error) {
      if (error.response?.data?.detail?.includes('already registered')) {
        // User exists, try to login
        try {
          const loginResponse = await axios.post(`${API}/auth/login`, {
            email: profile.email,
            password: profile.password
          });
          setMessage(`✅ Logged in as existing user!`);
          setTimeout(() => {
            onLogin(loginResponse.data.user, loginResponse.data.access_token);
            navigate('/dashboard');
          }, 1000);
        } catch (loginError) {
          setMessage(`❌ Error: ${loginError.response?.data?.detail || 'Login failed'}`);
        }
      } else {
        setMessage(`❌ Error: ${error.response?.data?.detail || 'User creation failed'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-navy-900 to-navy-700 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="card text-center">
            <div className="text-6xl mb-4">🔐</div>
            <h2 className="text-2xl font-bold text-navy-900 mb-4">Admin Testing Panel</h2>
            <p className="text-gray-600 mb-6">Enter master code to unlock testing capabilities</p>
            
            {message && (
              <div className={`mb-4 p-3 rounded ${message.includes('Invalid') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                {message}
              </div>
            )}

            <input
              type="password"
              className="input-field mb-4"
              placeholder="Enter Master Code"
              value={masterCode}
              onChange={(e) => setMasterCode(e.target.value.toUpperCase())}
              onKeyPress={(e) => e.key === 'Enter' && handleUnlock()}
            />
            
            <button onClick={handleUnlock} className="btn-primary w-full mb-4">
              Unlock Panel
            </button>

            <button onClick={() => navigate('/')} className="text-gold hover:underline">
              Back to Home
            </button>

            <div className="mt-6 p-4 bg-gray-100 rounded text-left text-sm">
              <p className="font-semibold text-navy-900 mb-2">📝 Master Code Hint:</p>
              <p className="text-gray-600">Think: Building prosperity together</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-gradient-to-r from-navy-900 to-navy-700 text-white p-6 rounded-lg mb-8">
          <h1 className="text-3xl font-bold mb-2">🧪 AE-CORE v2.0 Testing Panel</h1>
          <p className="text-gray-300 mb-2">18 Automated Test Cases for Adaptive Engine Verification</p>
          <div className="flex gap-4 text-sm mt-3">
            <span className="px-3 py-1 bg-blue-500 bg-opacity-30 rounded">6 Edge Cases</span>
            <span className="px-3 py-1 bg-green-500 bg-opacity-30 rounded">6 Formula Tests</span>
            <span className="px-3 py-1 bg-purple-500 bg-opacity-30 rounded">6 Real-World Scenarios</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 flex gap-2 border-b border-gray-300">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === 'users'
                ? 'text-navy-900 border-b-2 border-navy-900'
                : 'text-gray-500 hover:text-navy-700'
            }`}
          >
            👥 User Testing
          </button>
          <button
            onClick={() => setActiveTab('quizzes')}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === 'quizzes'
                ? 'text-navy-900 border-b-2 border-navy-900'
                : 'text-gray-500 hover:text-navy-700'
            }`}
          >
            📝 Quiz Management (Feature 1)
          </button>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded ${message.includes('❌') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message}
          </div>
        )}

        {/* User Testing Tab */}
        {activeTab === 'users' && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {testProfiles.map((item, index) => (
            <div key={index} className="card border-l-4 border-gold">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-bold text-navy-900">{item.name}</h3>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                  {item.testCase}
                </span>
              </div>
              
              <div className="bg-gradient-to-br from-gray-50 to-blue-50 p-4 rounded-lg mb-4 text-sm border border-gray-200">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="font-semibold text-gray-700">Age:</span> 
                    <span className="ml-2 text-navy-900 font-mono">{new Date().getFullYear() - new Date(item.profile.date_of_birth).getFullYear()} years</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Experience:</span> 
                    <span className="ml-2 text-navy-900 font-mono">Level {item.profile.experience_level}</span>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-gray-200">
                    <span className="font-semibold text-gray-700">Expected Score:</span> 
                    <span className="ml-2 text-gold font-mono text-lg font-bold">{item.profile.expectedScore.toFixed(3)}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="font-semibold text-gray-700">Email:</span> 
                    <span className="ml-2 text-gray-600 text-xs">{item.profile.email}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="font-semibold text-gray-700">Personality:</span> 
                    <span className="ml-2 text-navy-900 capitalize">{item.profile.ppi_pattern}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => createTestUser(item.profile, false, false)}
                  disabled={loading}
                  className="btn-primary w-full text-sm"
                >
                  Create & Start Fresh
                </button>
                <button
                  onClick={() => createTestUser(item.profile, true, false)}
                  disabled={loading}
                  className="btn-secondary w-full text-sm"
                >
                  Create & Skip to Dashboard
                </button>
                <button
                  onClick={() => createTestUser(item.profile, true, true)}
                  disabled={loading}
                  className="bg-gold text-navy-900 px-4 py-2 rounded font-semibold w-full text-sm hover:bg-gold-hover"
                >
                  Create & Complete All Chapters
                </button>
              </div>
            </div>
          ))}
            </div>

            <div className="card bg-blue-50 border-2 border-blue-200">
              <h3 className="text-xl font-bold text-navy-900 mb-3">📋 Testing Instructions</h3>
              <ul className="space-y-2 text-gray-700">
                <li>✓ <strong>Create & Start Fresh:</strong> Begin from PPI assessment</li>
                <li>✓ <strong>Skip to Dashboard:</strong> Auto-complete PPI with personality pattern</li>
                <li>✓ <strong>Complete All Chapters:</strong> Instantly finish entire journey</li>
                <li>✓ <strong>Login Credentials:</strong> Listed above each profile</li>
                <li>✓ <strong>Multiple Tests:</strong> You can create all profiles and switch between them</li>
              </ul>
            </div>
          </>
        )}

        {/* Quiz Management Tab - Feature 1: Consistency Check */}
        {activeTab === 'quizzes' && (
          <div className="space-y-6">
            {/* Header and Actions */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-navy-900">Feature 1: Consistency Check</h2>
                  <p className="text-gray-600 mt-1">Validate quiz structure, answer keys, and content integrity</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => runValidation(false)}
                    disabled={loadingValidation}
                    className="btn-secondary text-sm"
                  >
                    {loadingValidation ? 'Running...' : 'Run Validation'}
                  </button>
                  <button
                    onClick={() => runValidation(true)}
                    disabled={loadingValidation}
                    className="btn-primary text-sm"
                  >
                    Run with Auto-Fix
                  </button>
                </div>
              </div>

              {loadingValidation && (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-navy-900"></div>
                  <p className="mt-2 text-gray-600">Validating quizzes...</p>
                </div>
              )}

              {!loadingValidation && validationReport && (
                <>
                  {/* Summary */}
                  <div className={`p-4 rounded-lg mb-4 ${
                    validationReport.status === 'PASS' 
                      ? 'bg-green-100 border-2 border-green-300' 
                      : 'bg-red-100 border-2 border-red-300'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold">
                          {validationReport.status === 'PASS' ? '✅ All Checks Passed' : '❌ Validation Failed'}
                        </h3>
                        <p className="text-sm mt-1">
                          Checked at: {new Date(validationReport.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold">
                          {validationReport.summary.pass_rate}
                        </div>
                        <div className="text-sm">Pass Rate</div>
                      </div>
                    </div>
                  </div>

                  {/* Statistics Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-700">
                        {validationReport.summary.total_questions}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">Total Questions</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-700">
                        {validationReport.summary.validated_ok}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">Validated OK</div>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-red-700">
                        {validationReport.summary.mismatches_found}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">Mismatches</div>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-yellow-700">
                        {validationReport.summary.missing_in_key}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">Missing in Key</div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-purple-700">
                        {validationReport.summary.correctness_issues}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">Correctness Issues</div>
                    </div>
                  </div>

                  {/* Mismatches */}
                  {validationReport.mismatches && validationReport.mismatches.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-lg font-bold text-red-700 mb-3">
                        ❌ Mismatches Found ({validationReport.mismatches.length})
                      </h4>
                      <div className="space-y-2">
                        {validationReport.mismatches.map((mismatch, idx) => (
                          <div key={idx} className="p-3 bg-red-50 border border-red-200 rounded">
                            <div className="font-semibold text-red-900">{mismatch.question_id}</div>
                            <div className="text-sm text-gray-700 mt-1">
                              Quiz says: <span className="font-bold">{mismatch.quiz_correct}</span> | 
                              Key says: <span className="font-bold">{mismatch.key_answer}</span>
                              <span className="ml-2 text-xs bg-red-200 px-2 py-1 rounded">
                                {mismatch.action}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Correctness Issues (Feature 2) */}
                  {validationReport.correctness_issues && validationReport.correctness_issues.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-lg font-bold text-purple-700 mb-3">
                        🔍 Correctness Validation Issues ({validationReport.correctness_issues.length})
                      </h4>
                      <div className="space-y-3">
                        {validationReport.correctness_issues.map((item, idx) => (
                          <div key={idx} className="p-4 bg-purple-50 border border-purple-200 rounded">
                            <div className="font-semibold text-purple-900 mb-2">
                              {item.question_id}: {item.question_text}
                            </div>
                            <div className="space-y-1">
                              {item.issues.map((issue, issueIdx) => (
                                <div key={issueIdx} className="text-sm pl-4">
                                  <span className="mr-2">
                                    {issue.type === 'CRITICAL' ? '🔴' : issue.type === 'WARNING' ? '⚠️' : 'ℹ️'}
                                  </span>
                                  <span className="font-medium">{issue.check}:</span> {issue.message}
                                  {issue.requires_human_review && (
                                    <span className="ml-2 text-xs bg-orange-200 px-2 py-1 rounded">
                                      Requires Human Review
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Warnings */}
                  {validationReport.warnings && validationReport.warnings.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-lg font-bold text-yellow-700 mb-3">
                        ⚠️ Warnings ({validationReport.warnings.length})
                      </h4>
                      <div className="space-y-1">
                        {validationReport.warnings.map((warning, idx) => (
                          <div key={idx} className="text-sm p-2 bg-yellow-50 border border-yellow-200 rounded">
                            {warning}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Feature Status */}
            <div className="card bg-blue-50 border-2 border-blue-200">
              <h3 className="text-xl font-bold text-navy-900 mb-3">📋 Commercial Quiz Features Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-green-600 text-xl">✅</span>
                  <div>
                    <div className="font-semibold">Feature 1: Consistency Check</div>
                    <div className="text-gray-600">Fully Implemented</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-600 text-xl">✅</span>
                  <div>
                    <div className="font-semibold">Feature 2: Correctness Validation</div>
                    <div className="text-gray-600">Fully Implemented</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-xl">⏳</span>
                  <div>
                    <div className="font-semibold">Feature 3: Peer Review</div>
                    <div className="text-gray-600">Coming Next</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-xl">⏳</span>
                  <div>
                    <div className="font-semibold">Feature 4: Versioning</div>
                    <div className="text-gray-600">Pending</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-xl">⏳</span>
                  <div>
                    <div className="font-semibold">Feature 5: Audit Trail</div>
                    <div className="text-gray-600">Pending</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-xl">⏳</span>
                  <div>
                    <div className="font-semibold">Feature 6: Rollback</div>
                    <div className="text-gray-600">Pending</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-xl">⏳</span>
                  <div>
                    <div className="font-semibold">Feature 7: A/B Testing</div>
                    <div className="text-gray-600">Pending</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-xl">⏳</span>
                  <div>
                    <div className="font-semibold">Feature 8: SME Review</div>
                    <div className="text-gray-600">Pending</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-xl">⏳</span>
                  <div>
                    <div className="font-semibold">Feature 9: Staging/Prod</div>
                    <div className="text-gray-600">Pending</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-center gap-4">
          <button onClick={() => navigate('/')} className="btn-secondary">
            Back to Home
          </button>
          <button onClick={() => setUnlocked(false)} className="btn-primary">
            Lock Panel
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;
