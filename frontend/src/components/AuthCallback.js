import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

/**
 * AuthCallback component handles OAuth callbacks from Emergent Auth
 * Processes the session_id from URL fragment and establishes user session
 * 
 * REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
 */
function AuthCallback({ onLogin }) {
  const navigate = useNavigate();
  const location = useLocation();
  const hasProcessed = useRef(false);
  const [status, setStatus] = useState('processing');

  useEffect(() => {
    // Prevent double processing in StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processSession = async () => {
      try {
        // Extract session_id from URL fragment (check both location.hash and window.location.hash)
        const hash = location.hash || window.location.hash;
        const sessionId = hash?.split('session_id=')[1]?.split('&')[0];

        if (!sessionId) {
          console.error('No session_id found in URL');
          setStatus('error');
          setTimeout(() => navigate('/login', { replace: true }), 2000);
          return;
        }

        // Exchange session_id for user data from Emergent OAuth
        const response = await axios.get(
          'https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data',
          {
            headers: { 'X-Session-ID': sessionId }
          }
        );

        const { id, email, name, picture, session_token } = response.data;

        // Send to our backend to create/update user and set session (using Google callback)
        const backendResponse = await axios.post(
          `${API}/auth/google/callback`,
          {
            google_id: id,
            email,
            name,
            picture,
            session_token,
            provider: 'google'
          },
          { withCredentials: true }
        );

        // Store auth data
        localStorage.setItem('token', backendResponse.data.access_token);
        
        // Call onLogin if provided
        if (onLogin) {
          onLogin(backendResponse.data.user, backendResponse.data.access_token);
        }
        
        setStatus('success');
        
        // Clear the hash from URL and navigate to dashboard
        window.history.replaceState(null, '', window.location.pathname);
        
        setTimeout(() => {
          navigate('/dashboard', { 
            replace: true,
            state: { user: backendResponse.data.user }
          });
        }, 500);

      } catch (error) {
        console.error('OAuth callback error:', error);
        setStatus('error');
        setTimeout(() => {
          navigate('/login', { 
            replace: true,
            state: { error: 'Authentication failed. Please try again.' }
          });
        }, 2000);
      }
    };

    processSession();
  }, [location, navigate, onLogin]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 to-navy-700 flex items-center justify-center">
      <div className="text-center">
        {status === 'processing' && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-gold mx-auto mb-4"></div>
            <p className="text-white text-xl">Completing sign in...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="text-6xl mb-4">✅</div>
            <p className="text-white text-xl">Success! Redirecting...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="text-6xl mb-4">❌</div>
            <p className="text-white text-xl">Authentication failed. Redirecting to login...</p>
          </>
        )}
      </div>
    </div>
  );
}

export default AuthCallback;
