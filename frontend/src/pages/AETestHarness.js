import React, { useState } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function AETestHarness({ token }) {
  const [age, setAge] = useState(25);
  const [experienceLevel, setExperienceLevel] = useState(3);
  const [combinedScore, setCombinedScore] = useState(null);
  const [testResults, setTestResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [runningTests, setRunningTests] = useState(false);

  const experienceLevels = [
    { value: 1, label: '1 - Beginner' },
    { value: 2, label: '2 - Novice' },
    { value: 3, label: '3 - Intermediate' },
    { value: 4, label: '4 - Advanced' },
    { value: 5, label: '5 - Expert' }
  ];

  const calculateScore = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${API}/ae/test/calculate-score`,
        { age: parseInt(age), experience_level: parseInt(experienceLevel) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCombinedScore(response.data);
    } catch (error) {
      console.error('Failed to calculate score:', error);
      alert('Failed to calculate score. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const runAutomatedTests = async () => {
    setRunningTests(true);
    try {
      const response = await axios.post(
        `${API}/ae/test/run-suite`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTestResults(response.data);
    } catch (error) {
      console.error('Failed to run tests:', error);
      alert('Failed to run automated tests. Please try again.');
    } finally {
      setRunningTests(false);
    }
  };

  const getScoreColor = (score) => {
    if (score < 0.3) return 'text-blue-600';
    if (score < 0.6) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getScoreLabel = (score) => {
    if (score < 0.2) return 'Beginner Level';
    if (score < 0.4) return 'Developing';
    if (score < 0.6) return 'Intermediate';
    if (score < 0.8) return 'Advanced';
    return 'Expert Level';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-navy-900 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">AE-CORE v2.0 Test Harness</h1>
          <p className="text-gray-300">Visual Debug & Testing Interface for Adaptive Engine</p>
          <div className="mt-4 bg-navy-800 p-3 rounded">
            <code className="text-gold text-sm">
              Formula: combined_score = 0.4 × age_score + 0.6 × exp_score
            </code>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Manual Calculator */}
          <div className="card">
            <h2 className="text-2xl font-bold text-navy-900 mb-4">🧮 Manual Calculator</h2>
            <p className="text-gray-600 mb-6">
              Test the AE formula with custom age and experience inputs
            </p>

            <div className="space-y-6">
              {/* Age Input */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Age: {age} years
                </label>
                <input
                  type="range"
                  min="6"
                  max="99"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #C5A572 0%, #C5A572 ${((age - 6) / (99 - 6)) * 100}%, #e5e7eb ${((age - 6) / (99 - 6)) * 100}%, #e5e7eb 100%)`
                  }}
                />
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <span>Min: 6</span>
                  <span>Max: 99</span>
                </div>
              </div>

              {/* Experience Level */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Financial Experience Level
                </label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  className="input-field"
                >
                  {experienceLevels.map(level => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Calculate Button */}
              <button
                onClick={calculateScore}
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? 'Calculating...' : '🧪 Calculate Score'}
              </button>

              {/* Results Display */}
              {combinedScore && (
                <div className="mt-6 bg-gradient-to-br from-navy-50 to-gold-50 border-2 border-gold rounded-lg p-6">
                  <h3 className="text-lg font-bold text-navy-900 mb-4">Calculation Results</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Age Score:</span>
                      <span className="font-mono font-bold text-navy-900">
                        {combinedScore.age_score.toFixed(3)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Experience Score:</span>
                      <span className="font-mono font-bold text-navy-900">
                        {combinedScore.exp_score.toFixed(3)}
                      </span>
                    </div>
                    
                    <div className="border-t-2 border-gold pt-3 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 font-semibold">Combined Score:</span>
                        <span className={`font-mono font-bold text-3xl ${getScoreColor(combinedScore.combined_score)}`}>
                          {combinedScore.combined_score.toFixed(3)}
                        </span>
                      </div>
                      <div className="text-right text-sm text-gray-600 mt-1">
                        {getScoreLabel(combinedScore.combined_score)}
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-300">
                      <p className="text-xs text-gray-600">
                        <strong>Formula:</strong> {combinedScore.combined_score.toFixed(3)} = 
                        (0.4 × {combinedScore.age_score.toFixed(3)}) + 
                        (0.6 × {combinedScore.exp_score.toFixed(3)})
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Automated Tests */}
          <div className="card">
            <h2 className="text-2xl font-bold text-navy-900 mb-4">🧪 Automated Test Suite</h2>
            <p className="text-gray-600 mb-6">
              Run 18 automated tests to verify AE-CORE v2.0 formula accuracy
            </p>

            <button
              onClick={runAutomatedTests}
              disabled={runningTests}
              className="btn-primary w-full mb-6"
            >
              {runningTests ? '⏳ Running 18 Tests...' : '▶️ Run All 18 Tests'}
            </button>

            {testResults && (
              <div>
                <div className={`p-4 rounded-lg mb-4 ${
                  testResults.all_passed 
                    ? 'bg-green-50 border-2 border-green-500' 
                    : 'bg-red-50 border-2 border-red-500'
                }`}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold">
                      {testResults.all_passed ? '✅ All Tests Passed!' : '❌ Some Tests Failed'}
                    </h3>
                    <span className="text-2xl font-bold">
                      {testResults.passed}/{testResults.total}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    {testResults.all_passed 
                      ? 'AE-CORE v2.0 formula is working correctly.'
                      : 'Please review failed tests below.'}
                  </p>
                </div>

                {/* Test Groups */}
                <div className="space-y-4">
                  {testResults.test_groups.map((group, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-bold text-navy-900 mb-2">{group.name}</h4>
                      <div className="space-y-2">
                        {group.tests.map((test, testIdx) => (
                          <div 
                            key={testIdx}
                            className="flex items-start gap-2 text-sm"
                          >
                            <span className={test.passed ? 'text-green-600' : 'text-red-600'}>
                              {test.passed ? '✓' : '✗'}
                            </span>
                            <div className="flex-1">
                              <p className="text-gray-700">{test.name}</p>
                              {test.result && (
                                <p className="text-xs text-gray-500 font-mono">{test.result}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!testResults && !runningTests && (
              <div className="text-center text-gray-500 py-12">
                <p className="text-4xl mb-4">🧪</p>
                <p>Click the button above to run the automated test suite</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Reference Table */}
        <div className="card mt-8">
          <h2 className="text-2xl font-bold text-navy-900 mb-4">📊 Quick Reference: Sample Scores</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-navy-900 text-white">
                  <th className="px-4 py-3 text-left">User Type</th>
                  <th className="px-4 py-3 text-center">Age</th>
                  <th className="px-4 py-3 text-center">Experience</th>
                  <th className="px-4 py-3 text-center">Combined Score</th>
                  <th className="px-4 py-3 text-left">Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3">Child Beginner</td>
                  <td className="px-4 py-3 text-center font-mono">10</td>
                  <td className="px-4 py-3 text-center">1</td>
                  <td className="px-4 py-3 text-center font-bold text-blue-600">0.017</td>
                  <td className="px-4 py-3">Beginner</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3">Teen Novice</td>
                  <td className="px-4 py-3 text-center font-mono">16</td>
                  <td className="px-4 py-3 text-center">2</td>
                  <td className="px-4 py-3 text-center font-bold text-blue-600">0.193</td>
                  <td className="px-4 py-3">Beginner</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3">Young Professional</td>
                  <td className="px-4 py-3 text-center font-mono">25</td>
                  <td className="px-4 py-3 text-center">3</td>
                  <td className="px-4 py-3 text-center font-bold text-yellow-600">0.382</td>
                  <td className="px-4 py-3">Developing</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3">Mid-Career Advanced</td>
                  <td className="px-4 py-3 text-center font-mono">40</td>
                  <td className="px-4 py-3 text-center">4</td>
                  <td className="px-4 py-3 text-center font-bold text-yellow-600">0.596</td>
                  <td className="px-4 py-3">Intermediate</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3">Senior Expert</td>
                  <td className="px-4 py-3 text-center font-mono">60</td>
                  <td className="px-4 py-3 text-center">5</td>
                  <td className="px-4 py-3 text-center font-bold text-green-600">0.832</td>
                  <td className="px-4 py-3">Expert</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3">Career Changer</td>
                  <td className="px-4 py-3 text-center font-mono">45</td>
                  <td className="px-4 py-3 text-center">1</td>
                  <td className="px-4 py-3 text-center font-bold text-blue-600">0.168</td>
                  <td className="px-4 py-3">Beginner</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AETestHarness;
