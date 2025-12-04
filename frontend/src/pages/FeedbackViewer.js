import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

/**
 * Feedback Viewer - Admin page to view user feedback
 */
function FeedbackViewer({ token }) {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, today, week

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      const response = await axios.get(`${API}/admin/feedback`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFeedbacks(response.data.feedback);
    } catch (error) {
      console.error('Failed to fetch feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteFeedback = async (feedbackId) => {
    if (!window.confirm('Delete this feedback?')) return;

    try {
      await axios.delete(`${API}/admin/feedback/${feedbackId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchFeedback(); // Refresh list
    } catch (error) {
      console.error('Failed to delete feedback:', error);
    }
  };

  const filterFeedback = () => {
    const now = new Date();
    return feedbacks.filter(fb => {
      if (filter === 'all') return true;
      const fbDate = new Date(fb.submitted_at);
      
      if (filter === 'today') {
        return fbDate.toDateString() === now.toDateString();
      }
      if (filter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return fbDate >= weekAgo;
      }
      return true;
    });
  };

  const filteredFeedbacks = filterFeedback();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-xl text-gray-700">Loading feedback...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">User Feedback</h1>
          <p className="text-gray-600">View and manage feedback from users</p>
          
          {/* Filter */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All ({feedbacks.length})
            </button>
            <button
              onClick={() => setFilter('today')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'today' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setFilter('week')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              This Week
            </button>
          </div>
        </div>

        {/* Feedback List */}
        {filteredFeedbacks.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-xl text-gray-600">No feedback yet</p>
            <p className="text-sm text-gray-500 mt-2">
              Feedback from users will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFeedbacks.map((fb, index) => (
              <div key={fb._id || index} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-semibold text-gray-800">{fb.user_email}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(fb.submitted_at).toLocaleString()}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteFeedback(fb._id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Delete
                  </button>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-gray-800 whitespace-pre-wrap">{fb.feedback}</p>
                </div>
                
                {fb.user_id && (
                  <div className="mt-2 text-xs text-gray-500">
                    User ID: {fb.user_id}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default FeedbackViewer;
