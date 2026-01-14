import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

/**
 * Analytics Dashboard - View telemetry and analytics data
 */
function AnalyticsDashboard({ token }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState({
    userProgress: [],
    topicPerformance: [],
    chapterHeatmap: [],
    contentEngagement: [],
    personalization: {
      personalizedVsBaseline: [],
      dnaProfilePerformance: [],
      experienceLevelEffectiveness: []
    },
    learningPatterns: {
      sessionPatterns: [],
      dayOfWeekPatterns: [],
      streakAnalysis: {},
      quizRetryBehavior: []
    },
    multiProfile: {
      profileDistribution: [],
      switchingBehavior: {}
    },
    errorsAndFriction: {
      apiErrors: [],
      frictionPoints: []
    },
    contentDifficulty: {
      quizDifficulty: [],
      lessonEngagement: []
    },
    featureUsage: {
      features: {}
    }
  });
  const [telemetry, setTelemetry] = useState({
    sessions: 0,
    onboarding: 0,
    ppiCompleted: 0,
    topicsCompleted: 0,
    quizAttempts: 0
  });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([
      loadTelemetryStats(),
      loadAnalytics()
    ]);
    setLoading(false);
  };

  const loadTelemetryStats = async () => {
    try {
      // Count documents in each telemetry collection
      const collections = [
        'telemetry_user_session',
        'telemetry_onboarding',
        'telemetry_ppi_completed',
        'telemetry_topic_completed',
        'telemetry_quiz_attempt'
      ];

      // Note: This is a simplified approach. In production, you'd have dedicated count endpoints
      setTelemetry({
        sessions: 0,
        onboarding: 0,
        ppiCompleted: 0,
        topicsCompleted: 0,
        quizAttempts: 0
      });
    } catch (error) {
      console.error('Failed to load telemetry:', error);
    }
  };

  const loadAnalytics = async () => {
    try {
      const [
        userProgress, 
        topicPerformance, 
        chapterHeatmap, 
        contentEngagement, 
        personalization, 
        learningPatterns,
        multiProfile,
        errorsAndFriction,
        contentDifficulty,
        featureUsage
      ] = await Promise.all([
        axios.get(`${API}/analytics/user-progress`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/analytics/topic-performance`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/analytics/chapter-heatmap`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/analytics/content-engagement`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/analytics/personalization-effectiveness`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/analytics/learning-patterns`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/analytics/multi-profile-usage`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/analytics/errors-and-friction`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/analytics/content-difficulty-heatmap`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/analytics/feature-usage`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      setAnalytics({
        userProgress: userProgress.data.data || [],
        topicPerformance: topicPerformance.data.data || [],
        chapterHeatmap: chapterHeatmap.data.data || [],
        contentEngagement: contentEngagement.data.data || [],
        personalization: personalization.data || {
          personalizedVsBaseline: [],
          dnaProfilePerformance: [],
          experienceLevelEffectiveness: []
        },
        learningPatterns: learningPatterns.data || {
          sessionPatterns: [],
          dayOfWeekPatterns: [],
          streakAnalysis: {},
          quizRetryBehavior: []
        },
        multiProfile: multiProfile.data || {
          profileDistribution: [],
          switchingBehavior: {}
        },
        errorsAndFriction: errorsAndFriction.data || {
          apiErrors: [],
          frictionPoints: []
        },
        contentDifficulty: contentDifficulty.data || {
          quizDifficulty: [],
          lessonEngagement: []
        },
        featureUsage: featureUsage.data || {
          features: {}
        }
      });
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };

  const generateAnalytics = async () => {
    setLoading(true);
    try {
      await axios.post(`${API}/analytics/generate/all`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Analytics generated successfully!');
      loadAnalytics();
    } catch (error) {
      console.error('Failed to generate analytics:', error);
      alert('Failed to generate analytics');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Analytics Dashboard</h1>
              <p className="text-gray-600">Telemetry data and user insights</p>
            </div>
            <button
              onClick={generateAnalytics}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              🔄 Refresh Analytics
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="flex border-b overflow-x-auto">
            {[
              'overview', 
              'users', 
              'content', 
              'engagement', 
              'personalization', 
              'patterns', 
              'profiles',
              'difficulty',
              'features',
              'errors',
              'feedback'
            ].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading analytics...</p>
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Quick Stats */}
                <StatCard title="Total Users" value="Coming Soon" icon="👥" color="blue" />
                <StatCard title="PPI Completed" value={telemetry.ppiCompleted} icon="🧬" color="green" />
                <StatCard title="Topics Completed" value={telemetry.topicsCompleted} icon="📚" color="purple" />
                <StatCard title="Quiz Attempts" value={telemetry.quizAttempts} icon="✅" color="orange" />
                <StatCard title="Active Sessions" value={telemetry.sessions} icon="🔥" color="red" />
                <StatCard title="Feedback Entries" value="See Feedback Tab" icon="💬" color="yellow" />
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">User Progress</h2>
                  {analytics.userProgress.length === 0 ? (
                    <p className="text-gray-600">No user progress data available. Generate analytics first.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">User ID</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Topics Completed</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Avg Score</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Last Active</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analytics.userProgress.map((user, idx) => (
                            <tr key={idx} className="border-t">
                              <td className="px-4 py-2 text-sm">{user.userId}</td>
                              <td className="px-4 py-2 text-sm">{user.totalTopicsCompleted || 0}</td>
                              <td className="px-4 py-2 text-sm">{user.avgScore?.toFixed(1) || 'N/A'}%</td>
                              <td className="px-4 py-2 text-sm">{user.lastActive ? new Date(user.lastActive).toLocaleDateString() : 'N/A'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Content Tab */}
            {activeTab === 'content' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Chapter Performance</h2>
                  {analytics.chapterHeatmap.length === 0 ? (
                    <p className="text-gray-600">No chapter data available. Generate analytics first.</p>
                  ) : (
                    <div className="space-y-3">
                      {analytics.chapterHeatmap.map((chapter, idx) => (
                        <div key={idx} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-center mb-2">
                            <h3 className="font-semibold text-gray-800">Chapter {chapter.chapterId}</h3>
                            <span className="text-sm text-gray-600">
                              Avg Score: {chapter.avgScore?.toFixed(1) || 'N/A'}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${chapter.avgScore || 0}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Topic Performance</h2>
                  {analytics.topicPerformance.length === 0 ? (
                    <p className="text-gray-600">No topic data available. Generate analytics first.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Topic</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Completions</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Avg Score</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analytics.topicPerformance.map((topic, idx) => (
                            <tr key={idx} className="border-t">
                              <td className="px-4 py-2 text-sm">{topic.topicId}</td>
                              <td className="px-4 py-2 text-sm">{topic.completions || 0}</td>
                              <td className="px-4 py-2 text-sm">{topic.avgScore?.toFixed(1) || 'N/A'}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Engagement Tab - NEW! */}
            {activeTab === 'engagement' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">📊 Content Engagement Metrics</h2>
                  <p className="text-sm text-gray-600 mb-4">
                    Time spent, completion rates, and re-reads per lesson
                  </p>
                  
                  {analytics.contentEngagement.length === 0 ? (
                    <div className="text-center p-8 bg-gray-50 rounded-lg">
                      <p className="text-gray-600">No engagement data yet.</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Data will appear once users start viewing lessons.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left font-medium text-gray-700">Lesson</th>
                            <th className="px-3 py-2 text-center font-medium text-gray-700">Views</th>
                            <th className="px-3 py-2 text-center font-medium text-gray-700">Completion</th>
                            <th className="px-3 py-2 text-center font-medium text-gray-700">Re-reads</th>
                            <th className="px-3 py-2 text-center font-medium text-gray-700">Avg Time</th>
                            <th className="px-3 py-2 text-center font-medium text-gray-700">Scroll %</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analytics.contentEngagement.map((lesson, idx) => (
                            <tr key={idx} className="border-t hover:bg-gray-50">
                              <td className="px-3 py-3">
                                <div className="font-medium text-gray-800">{lesson.lessonTitle}</div>
                                <div className="text-xs text-gray-500">{lesson.chapterId} / {lesson.lessonId}</div>
                              </td>
                              <td className="px-3 py-3 text-center text-gray-700">
                                {lesson.totalViews}
                              </td>
                              <td className="px-3 py-3 text-center">
                                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                  lesson.completionRate >= 80 ? 'bg-green-100 text-green-700' :
                                  lesson.completionRate >= 50 ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                  {lesson.completionRate?.toFixed(0) || 0}%
                                </span>
                              </td>
                              <td className="px-3 py-3 text-center">
                                {lesson.rereads > 0 ? (
                                  <span className="text-blue-600 font-medium">
                                    {lesson.rereads} ({lesson.rereadRate?.toFixed(0)}%)
                                  </span>
                                ) : (
                                  <span className="text-gray-400">0</span>
                                )}
                              </td>
                              <td className="px-3 py-3 text-center text-gray-700">
                                {Math.floor(lesson.avgTimeSpent / 60)}m {lesson.avgTimeSpent % 60}s
                              </td>
                              <td className="px-3 py-3 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <div className="w-12 bg-gray-200 rounded-full h-1.5">
                                    <div
                                      className="bg-blue-600 h-1.5 rounded-full"
                                      style={{ width: `${lesson.avgScrollDepth}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-xs text-gray-600">{lesson.avgScrollDepth}%</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Insights */}
                {analytics.contentEngagement.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-2">💡 Insights</h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• <strong>Low completion rate?</strong> Content might be too long or complex</li>
                      <li>• <strong>High re-reads?</strong> Content is either confusing or very valuable</li>
                      <li>• <strong>Low scroll depth?</strong> Users losing interest early</li>
                      <li>• <strong>Short time spent?</strong> Content might need more depth</li>
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Personalization Tab - NEW! */}
            {activeTab === 'personalization' && (
              <div className="space-y-6">
                {/* DNA Profile Performance */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">🧬 DNA Profile Performance</h2>
                  <p className="text-sm text-gray-600 mb-4">
                    How different personality types engage with content
                  </p>
                  
                  {analytics.personalization.dnaProfilePerformance.length === 0 ? (
                    <p className="text-gray-600">No DNA profile data yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {analytics.personalization.dnaProfilePerformance.map((profile, idx) => (
                        <div key={idx} className="border border-gray-200 rounded-lg p-4">
                          <h3 className="font-semibold text-gray-800 mb-2">{profile.dnaProfile || 'Unknown'}</h3>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Completion Rate:</span>
                              <span className="font-medium text-gray-800">{profile.avgCompletionRate}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Avg Time:</span>
                              <span className="font-medium text-gray-800">{Math.floor(profile.avgTimeSpent / 60)}m</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Users:</span>
                              <span className="font-medium text-gray-800">{profile.userCount}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Completed:</span>
                              <span className="font-medium text-gray-800">{profile.chaptersCompleted}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Experience Level Effectiveness */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">📊 Content Effectiveness by Experience Level</h2>
                  <p className="text-sm text-gray-600 mb-4">
                    How users at different financial experience levels engage with content
                  </p>
                  
                  {analytics.personalization.experienceLevelEffectiveness?.length === 0 || !analytics.personalization.experienceLevelEffectiveness ? (
                    <p className="text-gray-600">No experience level data yet. Generate analytics to see insights.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {analytics.personalization.experienceLevelEffectiveness.map((exp, idx) => (
                        <div key={idx} className="border-2 border-indigo-200 bg-indigo-50 rounded-lg p-4">
                          <h3 className="font-bold text-lg mb-3 text-indigo-900">
                            Level {exp.experienceLevel} {exp.experienceLevel === 1 ? '(Beginner)' : exp.experienceLevel === 5 ? '(Expert)' : ''}
                          </h3>
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="text-gray-600">Completion Rate:</span>
                              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                <div
                                  className="bg-indigo-600 h-2 rounded-full"
                                  style={{ width: `${exp.avgCompletionRate}%` }}
                                ></div>
                              </div>
                              <span className="font-medium">{exp.avgCompletionRate}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Avg Time:</span>
                              <span className="font-medium">{Math.floor(exp.avgTimeSpent / 60)}m {exp.avgTimeSpent % 60}s</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Scroll Depth:</span>
                              <span className="font-medium">{exp.avgScrollDepth}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Total Lessons:</span>
                              <span className="font-medium">{exp.totalLessons}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Key Insights */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
                  <h3 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
                    <span className="text-2xl">🎯</span>
                    Personalization Insights
                  </h3>
                  <ul className="text-sm text-purple-800 space-y-2">
                    <li>• <strong>DNA Profiles:</strong> Shows which personality types engage most with content</li>
                    <li>• <strong>Experience Levels:</strong> Tracks how beginners vs. experts interact with material</li>
                    <li>• <strong>Best Performers:</strong> Identify which personalizations drive completion</li>
                    <li>• <strong>Proof of Concept:</strong> Data proves personalization improves outcomes</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Learning Patterns Tab - Priority 3 */}
            {activeTab === 'patterns' && (
              <div className="space-y-6">
                {/* Session Time Patterns */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">⏰ Session Time Patterns</h2>
                  <p className="text-sm text-gray-600 mb-4">
                    When users are most active and how long they study
                  </p>
                  
                  {analytics.learningPatterns.sessionPatterns.length === 0 ? (
                    <p className="text-gray-600">No session data yet.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left font-medium text-gray-700">Time of Day</th>
                            <th className="px-4 py-2 text-center font-medium text-gray-700">Sessions</th>
                            <th className="px-4 py-2 text-center font-medium text-gray-700">Avg Duration</th>
                            <th className="px-4 py-2 text-center font-medium text-gray-700">Lessons/Session</th>
                            <th className="px-4 py-2 text-center font-medium text-gray-700">Quizzes/Session</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analytics.learningPatterns.sessionPatterns.map((pattern, idx) => (
                            <tr key={idx} className="border-t hover:bg-gray-50">
                              <td className="px-4 py-3 font-medium text-gray-800 capitalize">
                                {pattern.timeOfDay || 'Unknown'}
                              </td>
                              <td className="px-4 py-3 text-center text-gray-700">
                                {pattern.sessionCount}
                              </td>
                              <td className="px-4 py-3 text-center text-gray-700">
                                {pattern.avgDurationMinutes} min
                              </td>
                              <td className="px-4 py-3 text-center text-gray-700">
                                {pattern.avgLessonsPerSession}
                              </td>
                              <td className="px-4 py-3 text-center text-gray-700">
                                {pattern.avgQuizzesPerSession}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Day of Week Patterns */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">📅 Day of Week Activity</h2>
                  <p className="text-sm text-gray-600 mb-4">
                    Which days see the most engagement
                  </p>
                  
                  {analytics.learningPatterns.dayOfWeekPatterns.length === 0 ? (
                    <p className="text-gray-600">No day-of-week data yet.</p>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                      {analytics.learningPatterns.dayOfWeekPatterns.map((day, idx) => (
                        <div key={idx} className="border border-gray-200 rounded-lg p-4 text-center">
                          <div className="font-bold text-gray-800 mb-2">{day.dayOfWeek}</div>
                          <div className="text-2xl font-bold text-blue-600 mb-1">{day.sessionCount}</div>
                          <div className="text-xs text-gray-600">sessions</div>
                          <div className="text-sm text-gray-600 mt-2">{day.avgDurationMinutes} min avg</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Streak Analysis */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">🔥 Learning Streaks</h2>
                  <p className="text-sm text-gray-600 mb-4">
                    User engagement and consistency metrics
                  </p>
                  
                  {!analytics.learningPatterns.streakAnalysis || Object.keys(analytics.learningPatterns.streakAnalysis).length === 0 ? (
                    <p className="text-gray-600">No streak data yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border border-orange-200 bg-orange-50 rounded-lg p-6 text-center">
                        <div className="text-4xl mb-2">🔥</div>
                        <div className="text-3xl font-bold text-orange-600 mb-1">
                          {analytics.learningPatterns.streakAnalysis.avgMaxStreak?.toFixed(1) || 0}
                        </div>
                        <div className="text-sm text-gray-700">Average Max Streak (days)</div>
                      </div>
                      <div className="border border-green-200 bg-green-50 rounded-lg p-6 text-center">
                        <div className="text-4xl mb-2">👥</div>
                        <div className="text-3xl font-bold text-green-600 mb-1">
                          {analytics.learningPatterns.streakAnalysis.usersWithStreaks || 0}
                        </div>
                        <div className="text-sm text-gray-700">Users with Active Streaks</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Quiz Retry Behavior */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">🎯 Quiz Retry Patterns</h2>
                  <p className="text-sm text-gray-600 mb-4">
                    How many attempts users need to pass quizzes
                  </p>
                  
                  {analytics.learningPatterns.quizRetryBehavior.length === 0 ? (
                    <p className="text-gray-600">No retry data yet.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left font-medium text-gray-700">Attempt Number</th>
                            <th className="px-4 py-2 text-center font-medium text-gray-700">Quiz Count</th>
                            <th className="px-4 py-2 text-center font-medium text-gray-700">Pass Rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analytics.learningPatterns.quizRetryBehavior.map((retry, idx) => (
                            <tr key={idx} className="border-t hover:bg-gray-50">
                              <td className="px-4 py-3 font-medium text-gray-800">
                                Attempt {retry.attemptNumber}
                              </td>
                              <td className="px-4 py-3 text-center text-gray-700">
                                {retry.quizCount}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                  retry.passRate >= 80 ? 'bg-green-100 text-green-700' :
                                  retry.passRate >= 50 ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                  {retry.passRate}%
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Insights */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-6">
                  <h3 className="font-bold text-indigo-900 mb-3 flex items-center gap-2">
                    <span className="text-2xl">💡</span>
                    Learning Pattern Insights
                  </h3>
                  <ul className="text-sm text-indigo-800 space-y-2">
                    <li>• <strong>Time of Day:</strong> Identify peak learning hours to optimize content delivery</li>
                    <li>• <strong>Day Patterns:</strong> Understand weekly engagement cycles for better planning</li>
                    <li>• <strong>Streaks:</strong> Measure user consistency and habit formation</li>
                    <li>• <strong>Quiz Retries:</strong> Gauge content difficulty and learning curve</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Multi-Profile Usage Tab - Priority 4 */}
            {activeTab === 'profiles' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">👨‍👩‍👧‍👦 Profile Distribution</h2>
                  <p className="text-sm text-gray-600 mb-4">
                    How many profiles families are creating per account
                  </p>
                  
                  {analytics.multiProfile.profileDistribution.length === 0 ? (
                    <p className="text-gray-600">No multi-profile data yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {analytics.multiProfile.profileDistribution.map((dist, idx) => (
                        <div key={idx} className="border border-indigo-200 bg-indigo-50 rounded-lg p-6 text-center">
                          <div className="text-3xl font-bold text-indigo-600 mb-2">
                            {dist.profilesPerAccount}
                          </div>
                          <div className="text-sm text-gray-700 mb-1">Profiles per Account</div>
                          <div className="text-2xl font-bold text-gray-800 mt-2">{dist.accountCount}</div>
                          <div className="text-xs text-gray-600">accounts</div>
                          {dist.avgProfileAge && (
                            <div className="text-sm text-gray-600 mt-2">Avg Age: {dist.avgProfileAge} years</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">🔄 Profile Switching Behavior</h2>
                  <p className="text-sm text-gray-600 mb-4">
                    How actively families use multiple profiles
                  </p>
                  
                  {!analytics.multiProfile.switchingBehavior || Object.keys(analytics.multiProfile.switchingBehavior).length === 0 ? (
                    <p className="text-gray-600">No switching behavior data yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="border border-blue-200 bg-blue-50 rounded-lg p-6 text-center">
                        <div className="text-4xl mb-2">📊</div>
                        <div className="text-3xl font-bold text-blue-600 mb-1">
                          {analytics.multiProfile.switchingBehavior.avgSessionsPerAccount?.toFixed(1) || 0}
                        </div>
                        <div className="text-sm text-gray-700">Avg Sessions per Account</div>
                      </div>
                      <div className="border border-green-200 bg-green-50 rounded-lg p-6 text-center">
                        <div className="text-4xl mb-2">👥</div>
                        <div className="text-3xl font-bold text-green-600 mb-1">
                          {analytics.multiProfile.switchingBehavior.avgProfilesUsed?.toFixed(1) || 0}
                        </div>
                        <div className="text-sm text-gray-700">Avg Profiles Used</div>
                      </div>
                      <div className="border border-purple-200 bg-purple-50 rounded-lg p-6 text-center">
                        <div className="text-4xl mb-2">🏠</div>
                        <div className="text-3xl font-bold text-purple-600 mb-1">
                          {analytics.multiProfile.switchingBehavior.totalAccounts || 0}
                        </div>
                        <div className="text-sm text-gray-700">Total Accounts</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Content Difficulty Heatmap Tab - Priority 6 */}
            {activeTab === 'difficulty' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">🎯 Quiz Difficulty Analysis</h2>
                  <p className="text-sm text-gray-600 mb-4">
                    Pass rates and difficulty levels for each quiz
                  </p>
                  
                  {analytics.contentDifficulty.quizDifficulty.length === 0 ? (
                    <p className="text-gray-600">No quiz difficulty data yet.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left font-medium text-gray-700">Chapter</th>
                            <th className="px-4 py-2 text-left font-medium text-gray-700">Quiz</th>
                            <th className="px-4 py-2 text-center font-medium text-gray-700">Attempts</th>
                            <th className="px-4 py-2 text-center font-medium text-gray-700">Pass Rate</th>
                            <th className="px-4 py-2 text-center font-medium text-gray-700">Avg Score</th>
                            <th className="px-4 py-2 text-center font-medium text-gray-700">Difficulty</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analytics.contentDifficulty.quizDifficulty.map((quiz, idx) => (
                            <tr key={idx} className="border-t hover:bg-gray-50">
                              <td className="px-4 py-3 font-medium text-gray-800">{quiz.chapterId}</td>
                              <td className="px-4 py-3 text-gray-700">{quiz.quizId}</td>
                              <td className="px-4 py-3 text-center text-gray-700">{quiz.totalAttempts}</td>
                              <td className="px-4 py-3 text-center">
                                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                  quiz.passRate >= 80 ? 'bg-green-100 text-green-700' :
                                  quiz.passRate >= 50 ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                  {quiz.passRate}%
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center text-gray-700">{quiz.avgScore}%</td>
                              <td className="px-4 py-3 text-center">
                                <span className={`inline-block px-2 py-1 rounded text-xs font-medium capitalize ${
                                  quiz.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                                  quiz.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                  {quiz.difficulty}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">📚 Lesson Engagement Heatmap</h2>
                  <p className="text-sm text-gray-600 mb-4">
                    Completion rates and engagement levels for each lesson
                  </p>
                  
                  {analytics.contentDifficulty.lessonEngagement.length === 0 ? (
                    <p className="text-gray-600">No lesson engagement data yet.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left font-medium text-gray-700">Chapter</th>
                            <th className="px-4 py-2 text-left font-medium text-gray-700">Lesson</th>
                            <th className="px-4 py-2 text-center font-medium text-gray-700">Views</th>
                            <th className="px-4 py-2 text-center font-medium text-gray-700">Completion Rate</th>
                            <th className="px-4 py-2 text-center font-medium text-gray-700">Avg Time</th>
                            <th className="px-4 py-2 text-center font-medium text-gray-700">Engagement</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analytics.contentDifficulty.lessonEngagement.map((lesson, idx) => (
                            <tr key={idx} className="border-t hover:bg-gray-50">
                              <td className="px-4 py-3 font-medium text-gray-800">{lesson.chapterId}</td>
                              <td className="px-4 py-3 text-gray-700">{lesson.lessonId}</td>
                              <td className="px-4 py-3 text-center text-gray-700">{lesson.totalViews}</td>
                              <td className="px-4 py-3 text-center">
                                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                  lesson.completionRate >= 80 ? 'bg-green-100 text-green-700' :
                                  lesson.completionRate >= 50 ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                  {lesson.completionRate}%
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center text-gray-700">
                                {Math.floor(lesson.avgTimeSpent / 60)}m {lesson.avgTimeSpent % 60}s
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className={`inline-block px-2 py-1 rounded text-xs font-medium capitalize ${
                                  lesson.engagement === 'high' ? 'bg-green-100 text-green-700' :
                                  lesson.engagement === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                  {lesson.engagement}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-6">
                  <h3 className="font-bold text-orange-900 mb-3 flex items-center gap-2">
                    <span className="text-2xl">🔍</span>
                    Difficulty Insights
                  </h3>
                  <ul className="text-sm text-orange-800 space-y-2">
                    <li>• <strong>Hard Quizzes:</strong> Low pass rates indicate content may need simplification</li>
                    <li>• <strong>Easy Quizzes:</strong> High pass rates suggest content could be more challenging</li>
                    <li>• <strong>Low Engagement:</strong> Lessons with low completion need investigation</li>
                    <li>• <strong>High Time Spent:</strong> May indicate confusion or deep interest</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Feature Usage Tab - Priority 7 */}
            {activeTab === 'features' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">🎯 Feature Adoption Metrics</h2>
                  <p className="text-sm text-gray-600 mb-4">
                    Which features users are actively using
                  </p>
                  
                  {!analytics.featureUsage.features || Object.keys(analytics.featureUsage.features).length === 0 ? (
                    <p className="text-gray-600">No feature usage data yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* PPI */}
                      {analytics.featureUsage.features.ppi && (
                        <div className="border-2 border-purple-200 bg-purple-50 rounded-lg p-6">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-bold text-purple-900">🧬 PPI Assessment</h3>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-700">Total Users:</span>
                              <span className="font-medium">{analytics.featureUsage.features.ppi.totalUsers}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-700">Completed:</span>
                              <span className="font-medium">{analytics.featureUsage.features.ppi.completed}</span>
                            </div>
                            <div className="mt-2 pt-2 border-t border-purple-200">
                              <div className="flex justify-between items-center">
                                <span className="text-gray-700 font-medium">Completion Rate:</span>
                                <span className="text-2xl font-bold text-purple-600">
                                  {analytics.featureUsage.features.ppi.completionRate}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Onboarding */}
                      {analytics.featureUsage.features.onboarding && (
                        <div className="border-2 border-blue-200 bg-blue-50 rounded-lg p-6">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-bold text-blue-900">🚀 Onboarding</h3>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-700">Completed:</span>
                              <span className="font-medium">{analytics.featureUsage.features.onboarding.completed}</span>
                            </div>
                            <div className="mt-2 pt-2 border-t border-blue-200">
                              <div className="flex justify-between items-center">
                                <span className="text-gray-700 font-medium">Completion Rate:</span>
                                <span className="text-2xl font-bold text-blue-600">
                                  {analytics.featureUsage.features.onboarding.completionRate}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Quizzes */}
                      {analytics.featureUsage.features.quizzes && (
                        <div className="border-2 border-green-200 bg-green-50 rounded-lg p-6">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-bold text-green-900">✅ Quizzes</h3>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-700">Total Attempts:</span>
                              <span className="font-medium">{analytics.featureUsage.features.quizzes.totalAttempts}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-700">Users Attempting:</span>
                              <span className="font-medium">{analytics.featureUsage.features.quizzes.usersAttempting}</span>
                            </div>
                            <div className="mt-2 pt-2 border-t border-green-200">
                              <div className="flex justify-between items-center">
                                <span className="text-gray-700 font-medium">Adoption Rate:</span>
                                <span className="text-2xl font-bold text-green-600">
                                  {analytics.featureUsage.features.quizzes.adoptionRate}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Lessons */}
                      {analytics.featureUsage.features.lessons && (
                        <div className="border-2 border-orange-200 bg-orange-50 rounded-lg p-6">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-bold text-orange-900">📚 Lessons</h3>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-700">Total Views:</span>
                              <span className="font-medium">{analytics.featureUsage.features.lessons.totalViews}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-700">Users Viewing:</span>
                              <span className="font-medium">{analytics.featureUsage.features.lessons.usersViewing}</span>
                            </div>
                            <div className="mt-2 pt-2 border-t border-orange-200">
                              <div className="flex justify-between items-center">
                                <span className="text-gray-700 font-medium">Adoption Rate:</span>
                                <span className="text-2xl font-bold text-orange-600">
                                  {analytics.featureUsage.features.lessons.adoptionRate}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Multi-Profile */}
                      {analytics.featureUsage.features.multiProfile && (
                        <div className="border-2 border-indigo-200 bg-indigo-50 rounded-lg p-6">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-bold text-indigo-900">👨‍👩‍👧‍👦 Multi-Profile</h3>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-700">Total Profiles:</span>
                              <span className="font-medium">{analytics.featureUsage.features.multiProfile.totalProfiles}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-700">Accounts Using:</span>
                              <span className="font-medium">{analytics.featureUsage.features.multiProfile.accountsUsing}</span>
                            </div>
                            <div className="mt-2 pt-2 border-t border-indigo-200">
                              <div className="flex justify-between items-center">
                                <span className="text-gray-700 font-medium">Avg per Account:</span>
                                <span className="text-2xl font-bold text-indigo-600">
                                  {analytics.featureUsage.features.multiProfile.avgProfilesPerAccount}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Feedback */}
                      {analytics.featureUsage.features.feedback && (
                        <div className="border-2 border-yellow-200 bg-yellow-50 rounded-lg p-6">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-bold text-yellow-900">💬 Feedback</h3>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-700">Total Feedback:</span>
                              <span className="font-medium">{analytics.featureUsage.features.feedback.totalFeedback}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-700">Users Submitting:</span>
                              <span className="font-medium">{analytics.featureUsage.features.feedback.usersSubmitting}</span>
                            </div>
                            <div className="mt-2 pt-2 border-t border-yellow-200">
                              <div className="flex justify-between items-center">
                                <span className="text-gray-700 font-medium">Adoption Rate:</span>
                                <span className="text-2xl font-bold text-yellow-600">
                                  {analytics.featureUsage.features.feedback.adoptionRate}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                    <span className="text-2xl">📈</span>
                    Feature Usage Insights
                  </h3>
                  <ul className="text-sm text-blue-800 space-y-2">
                    <li>• <strong>High Adoption:</strong> Features used by &gt;70% of users are core to the experience</li>
                    <li>• <strong>Medium Adoption:</strong> 30-70% adoption indicates optional but valuable features</li>
                    <li>• <strong>Low Adoption:</strong> &lt;30% may need better discovery or simplification</li>
                    <li>• <strong>Engagement Tracking:</strong> Monitor total usage vs. unique users for depth insights</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Errors & Friction Tab - Priority 5 */}
            {activeTab === 'errors' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">⚠️ API Errors</h2>
                  <p className="text-sm text-gray-600 mb-4">
                    Track API failures and error patterns
                  </p>
                  
                  {analytics.errorsAndFriction.apiErrors.length === 0 ? (
                    <div className="text-center p-8 bg-green-50 rounded-lg border border-green-200">
                      <div className="text-4xl mb-2">✅</div>
                      <p className="text-green-700 font-medium">No API errors detected!</p>
                      <p className="text-sm text-green-600 mt-1">All systems running smoothly</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-red-50">
                          <tr>
                            <th className="px-4 py-2 text-left font-medium text-gray-700">Endpoint</th>
                            <th className="px-4 py-2 text-center font-medium text-gray-700">Status Code</th>
                            <th className="px-4 py-2 text-center font-medium text-gray-700">Error Count</th>
                            <th className="px-4 py-2 text-left font-medium text-gray-700">Last Occurred</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analytics.errorsAndFriction.apiErrors.map((error, idx) => (
                            <tr key={idx} className="border-t hover:bg-red-50">
                              <td className="px-4 py-3 font-medium text-gray-800">{error.endpoint}</td>
                              <td className="px-4 py-3 text-center">
                                <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700">
                                  {error.statusCode}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center text-gray-700">{error.errorCount}</td>
                              <td className="px-4 py-3 text-gray-700">
                                {error.lastOccurred ? new Date(error.lastOccurred).toLocaleString() : 'N/A'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">🚧 Friction Points</h2>
                  <p className="text-sm text-gray-600 mb-4">
                    Lessons where users exit quickly (high bounce rate)
                  </p>
                  
                  {analytics.errorsAndFriction.frictionPoints.length === 0 ? (
                    <div className="text-center p-8 bg-green-50 rounded-lg border border-green-200">
                      <div className="text-4xl mb-2">✨</div>
                      <p className="text-green-700 font-medium">No significant friction points detected!</p>
                      <p className="text-sm text-green-600 mt-1">Users are engaging well with content</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-yellow-50">
                          <tr>
                            <th className="px-4 py-2 text-left font-medium text-gray-700">Lesson ID</th>
                            <th className="px-4 py-2 text-center font-medium text-gray-700">Quick Exits</th>
                            <th className="px-4 py-2 text-center font-medium text-gray-700">Avg Time Before Exit</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analytics.errorsAndFriction.frictionPoints.map((friction, idx) => (
                            <tr key={idx} className="border-t hover:bg-yellow-50">
                              <td className="px-4 py-3 font-medium text-gray-800">{friction.lessonId}</td>
                              <td className="px-4 py-3 text-center">
                                <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-700">
                                  {friction.quickExits}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center text-gray-700">{friction.avgTimeBeforeExit}s</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-6">
                  <h3 className="font-bold text-red-900 mb-3 flex items-center gap-2">
                    <span className="text-2xl">🔧</span>
                    Error & Friction Insights
                  </h3>
                  <ul className="text-sm text-red-800 space-y-2">
                    <li>• <strong>API Errors:</strong> Track and fix recurring errors to improve reliability</li>
                    <li>• <strong>Friction Points:</strong> Lessons with quick exits may need content revision</li>
                    <li>• <strong>User Experience:</strong> Monitor these metrics to identify pain points</li>
                    <li>• <strong>Proactive Monitoring:</strong> Catch issues before they impact many users</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Feedback Tab */}
            {activeTab === 'feedback' && (
              <FeedbackPanel token={token} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ title, value, icon, color }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200'
  };

  return (
    <div className={`rounded-lg shadow-md p-6 border-2 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-700">{title}</h3>
        <span className="text-3xl">{icon}</span>
      </div>
      <div className="text-3xl font-bold">{value}</div>
    </div>
  );
}

export default AnalyticsDashboard;
