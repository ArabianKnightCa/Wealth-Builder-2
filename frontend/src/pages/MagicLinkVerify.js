import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

/**
 * MagicLinkVerify component handles magic link email verification
 * Extracts token from URL and verifies with backend
 */
function MagicLinkVerify({ onLogin }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [error, setError] = useState('');
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const verifyToken = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setStatus('error');
        setError('No magic link token found. Please request a new link.');
        return;
      }

      try {
        const response = await axios.post(`${API}/auth/magic-link/verify`, { token });

        // Store auth data
        localStorage.setItem('token', response.data.access_token);

        setStatus('success');

        // Call onLogin if provided
        if (onLogin) {
          onLogin(response.data.user, response.data.access_token);
        }

        // Navigate to dashboard after short delay
        setTimeout(() => {
          navigate('/dashboard', { 
            replace: true,
            state: { user: response.data.user }
          });
        }, 1500);

      } catch (err) {
        setStatus('error');
        setError(err.response?.data?.detail || 'Failed to verify magic link. It may have expired.');
      }
    };

    verifyToken();
  }, [searchParams, navigate, onLogin]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 to-navy-700 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="card text-center p-8">
          {status === 'verifying' && (
            <>
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-gold mx-auto mb-6"></div>
              <h2 className="text-2xl font-bold text-navy-900 mb-2">Verifying your magic link...</h2>
              <p className="text-gray-600">Please wait while we sign you in.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="text-6xl mb-6">✨</div>
              <h2 className="text-2xl font-bold text-green-600 mb-2">Success!</h2>
              <p className="text-gray-600">You're signed in. Redirecting to dashboard...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="text-6xl mb-6">😕</div>
              <h2 className="text-2xl font-bold text-red-600 mb-2">Verification Failed</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={() => navigate('/login')}
                className="btn-primary"
                data-testid="back-to-login-btn"
              >
                Back to Login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default MagicLinkVerify;
