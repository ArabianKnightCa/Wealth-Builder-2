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
    contentEngagement: []
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
      const [userProgress, topicPerformance, chapterHeatmap] = await Promise.all([
        axios.get(`${API}/analytics/user-progress`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/analytics/topic-performance`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/analytics/chapter-heatmap`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      setAnalytics({
        userProgress: userProgress.data.data || [],
        topicPerformance: topicPerformance.data.data || [],
        chapterHeatmap: chapterHeatmap.data.data || []
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
            {['overview', 'users', 'content', 'feedback'].map(tab => (
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

            {/* Feedback Tab */}
            {activeTab === 'feedback' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">User Feedback</h2>
                <p className="text-gray-600 mb-4">
                  View all user feedback in the dedicated Feedback Viewer page.
                </p>
                <a
                  href="/feedback"
                  className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Go to Feedback Viewer →
                </a>
              </div>
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
