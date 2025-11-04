import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function GlobalHUD({ user, token, onLogout }) {
  const navigate = useNavigate();
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);

  // Debug: Log when component mounts
  React.useEffect(() => {
    console.log('GlobalHUD mounted with user:', user);
  }, [user]);

  const handleFeedbackSubmit = async () => {
    if (!feedback.trim()) {
      alert('Please enter your feedback');
      return;
    }

    setFeedbackSubmitting(true);
    try {
      await axios.post(`${API}/feedback`, {
        user_id: user.id,
        user_email: user.email,
        feedback: feedback,
        submitted_at: new Date().toISOString()
      });
      
      alert('✅ Thank you for your feedback!');
      setFeedback('');
      setShowFeedback(false);
    } catch (error) {
      alert('❌ Failed to submit feedback. Please try again.');
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  return (
    <>
      <div className="bg-navy-900 text-white py-2 px-4 shadow-md border-b border-gold/30">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold text-gold cursor-pointer" onClick={() => navigate('/dashboard')}>
              Wealth Builder
            </h1>
            <span className="text-sm text-gray-300">
              Welcome, {user.first_name}!
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-gold hover:text-white text-2xl font-bold transition-colors"
              title="Help - Return to Dashboard"
            >
              ?
            </button>

            <button
              onClick={() => setShowFeedback(true)}
              className="px-3 py-1 bg-green-600 text-white rounded text-sm font-semibold hover:bg-green-700 transition-all"
              title="Leave Feedback"
            >
              💬 Feedback
            </button>

            <button
              onClick={() => navigate('/admin')}
              className="px-3 py-1 bg-gold/20 text-gold rounded text-sm font-semibold hover:bg-gold/30 transition-all"
              title="Testing Panel"
            >
              🧪 Test
            </button>

            <button
              onClick={() => navigate('/settings')}
              className="px-3 py-1 text-gray-300 hover:text-white text-sm transition-colors"
              title="Settings"
            >
              ⚙️ Settings
            </button>

            <button
              onClick={onLogout}
              className="px-3 py-1 bg-gold text-navy-900 rounded text-sm font-semibold hover:bg-gold-dark transition-all"
              title="Logout"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Feedback Modal */}
      {showFeedback && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]" onClick={() => setShowFeedback(false)}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full m-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-navy-900 mb-4">Share Your Feedback</h2>
            <p className="text-gray-600 mb-4">Help us improve Wealth Builder! Share your thoughts, suggestions, or report issues.</p>
            
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="w-full h-32 p-3 border-2 border-gray-300 rounded-lg focus:border-gold focus:outline-none"
              placeholder="Your feedback here..."
              maxLength={500}
            />
            
            <div className="flex justify-between items-center mt-4">
              <span className="text-sm text-gray-500">{feedback.length}/500</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowFeedback(false)}
                  className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFeedbackSubmit}
                  disabled={feedbackSubmitting}
                  className="px-4 py-2 bg-gold text-navy-900 rounded-lg font-semibold hover:bg-gold-dark disabled:opacity-50"
                >
                  {feedbackSubmitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default GlobalHUD;
