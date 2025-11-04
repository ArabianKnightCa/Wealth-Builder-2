import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function GlobalHUD({ user, token, onLogout }) {
  const navigate = useNavigate();
  const [resetting, setResetting] = useState(false);

  const handleReset = async () => {
    alert('Reset button was clicked!');
    console.log('Reset button clicked');
    console.log('User:', user);
    
    const confirmed1 = window.confirm('⚠️ This will DELETE your account and all data. Are you sure?');
    console.log('First confirmation:', confirmed1);
    if (!confirmed1) {
      return;
    }

    const confirmed2 = window.confirm('⚠️⚠️ FINAL WARNING: This action CANNOT be undone. Delete account?');
    console.log('Second confirmation:', confirmed2);
    if (!confirmed2) {
      return;
    }

    setResetting(true);
    console.log('Attempting to delete account:', user.email);
    
    try {
      console.log('Sending DELETE request to:', `${API}/auth/delete-account`);
      console.log('Request body:', { email: user.email });
      
      const response = await axios.post(`${API}/auth/delete-account`, 
        { email: user.email },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Delete response:', response.data);
      alert('✅ Account deleted successfully. You will be logged out.');
      
      // Clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      onLogout();
      window.location.href = '/';
    } catch (error) {
      console.error('Reset failed - Full error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      alert(`❌ Reset failed: ${error.response?.data?.detail || error.message || 'Unknown error'}`);
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
            onClick={handleReset}
            disabled={resetting}
            className="px-3 py-1 bg-red-600 text-white rounded text-sm font-semibold hover:bg-red-700 transition-all disabled:opacity-50"
            title="Reset Account"
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
