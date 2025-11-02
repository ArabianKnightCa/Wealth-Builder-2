import React, { useState } from 'react';
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

  const MASTER_CODE = 'WEALTHBUILDER';

  const testProfiles = [
    {
      name: '9 Year Old Beginner (Curious)',
      profile: {
        email: 'test_9yo_beginner@test.com',
        password: 'Test1234',
        first_name: 'Alex',
        date_of_birth: '2016-01-15',
        experience_level: 1,
        ppi_pattern: 'curious' // Mostly A and D answers
      }
    },
    {
      name: '45 Year Old Experienced (Organized)',
      profile: {
        email: 'test_45yo_expert@test.com',
        password: 'Test1234',
        first_name: 'Jordan',
        date_of_birth: '1980-06-20',
        experience_level: 4,
        ppi_pattern: 'organized' // Mostly B answers
      }
    },
    {
      name: '67 Year Old No Experience (Collaborative)',
      profile: {
        email: 'test_67yo_novice@test.com',
        password: 'Test1234',
        first_name: 'Morgan',
        date_of_birth: '1958-03-10',
        experience_level: 1,
        ppi_pattern: 'collaborative' // Mostly D answers
      }
    },
    {
      name: '30 Year Old Intermediate (Competitive)',
      profile: {
        email: 'test_30yo_intermediate@test.com',
        password: 'Test1234',
        first_name: 'Casey',
        date_of_birth: '1995-09-25',
        experience_level: 3,
        ppi_pattern: 'competitive' // Mostly C answers
      }
    },
    {
      name: '55 Year Old Advanced (Balanced)',
      profile: {
        email: 'test_55yo_advanced@test.com',
        password: 'Test1234',
        first_name: 'Riley',
        date_of_birth: '1970-12-05',
        experience_level: 4,
        ppi_pattern: 'balanced' // Mix of all
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
      // Register user
      const registerResponse = await axios.post(`${API}/auth/register`, {
        email: profile.email,
        password: profile.password,
        first_name: profile.first_name,
        date_of_birth: profile.date_of_birth,
        language: 'en',
        experience_level: profile.experience_level
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
              <p className="text-gray-600">FINTEST + Current Year</p>
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
          <h1 className="text-3xl font-bold mb-2">🧪 Testing Admin Panel</h1>
          <p className="text-gray-300">Create and test different user personas instantly</p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded ${message.includes('❌') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {testProfiles.map((item, index) => (
            <div key={index} className="card">
              <h3 className="text-xl font-bold text-navy-900 mb-3">{item.name}</h3>
              
              <div className="bg-gray-50 p-3 rounded mb-4 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="font-semibold">Age:</span> {new Date().getFullYear() - new Date(item.profile.date_of_birth).getFullYear()} years
                  </div>
                  <div>
                    <span className="font-semibold">Experience:</span> Level {item.profile.experience_level}
                  </div>
                  <div>
                    <span className="font-semibold">Email:</span> {item.profile.email}
                  </div>
                  <div>
                    <span className="font-semibold">Password:</span> {item.profile.password}
                  </div>
                  <div className="col-span-2">
                    <span className="font-semibold">Personality:</span> {item.profile.ppi_pattern}
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
