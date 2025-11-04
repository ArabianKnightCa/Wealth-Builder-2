import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function GlobalHUD({ user, token, onLogout }) {
  const navigate = useNavigate();
  const [resetting, setResetting] = useState(false);
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

  const handleReset = async () => {
    try {
      alert('TEST: Function called!');
      
      if (!user || !user.email) {
        alert('ERROR: No user email found');
        return;
      }
      
      const confirmed1 = window.confirm('⚠️ This will DELETE your account and all data. Are you sure?');
      if (!confirmed1) return;

      const confirmed2 = window.confirm('⚠️⚠️ FINAL WARNING: This action CANNOT be undone. Delete account?');
      if (!confirmed2) return;

      setResetting(true);
      alert('Sending delete request for: ' + user.email);
      
      const response = await axios.post(`${API}/auth/delete-account`, 
        { email: user.email },
        { headers: { 'Content-Type': 'application/json' } }
      );
      
      alert('✅ Account deleted: ' + JSON.stringify(response.data));
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      onLogout();
      window.location.href = '/';
    } catch (error) {
      alert('❌ ERROR: ' + (error.response?.data?.detail || error.message || 'Unknown'));
      setResetting(false);
    }
  };

  return (
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
            onClick={() => alert('Test button works!')}
            className="px-2 py-1 bg-blue-500 text-white rounded text-xs"
          >
            TEST
          </button>

          <button
            onClick={() => navigate('/dashboard')}
            className="text-gold hover:text-white text-2xl font-bold transition-colors"
            title="Help - Return to Dashboard"
          >
            ?
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
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleReset();
            }}
            disabled={resetting}
            className="px-3 py-1 bg-red-600 text-white rounded text-sm font-semibold hover:bg-red-700 transition-all disabled:opacity-50 cursor-pointer z-50"
            title="Reset Account"
            type="button"
            style={{ pointerEvents: 'auto' }}
          >
            {resetting ? '...' : '🔄 Reset'}
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
  );
}

export default GlobalHUD;
