import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

/**
 * AuthCallback component handles the Google OAuth callback
 * Processes the session_id from URL fragment and establishes user session
 * 
 * REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
 */
function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent double processing in StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processSession = async () => {
      try {
        // Extract session_id from URL fragment
        const hash = location.hash;
        const sessionId = hash?.split('session_id=')[1]?.split('&')[0];

        if (!sessionId) {
          console.error('No session_id found in URL');
          navigate('/login', { replace: true });
          return;
        }

        // Exchange session_id for user data
        const response = await axios.get(
          'https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data',
          {
            headers: { 'X-Session-ID': sessionId }
          }
        );

        const { id, email, name, picture, session_token } = response.data;

        // Send to our backend to create/update user and set session
        const backendResponse = await axios.post(
          `${API}/auth/google/callback`,
          {
            google_id: id,
            email,
            name,
            picture,
            session_token
          },
          { withCredentials: true }
        );

        // Store auth data
        localStorage.setItem('token', backendResponse.data.access_token);
        
        // Navigate to dashboard with user data
        navigate('/dashboard', { 
          replace: true,
          state: { user: backendResponse.data.user }
        });

      } catch (error) {
        console.error('OAuth callback error:', error);
        navigate('/login', { 
          replace: true,
          state: { error: 'Authentication failed. Please try again.' }
        });
      }
    };

    processSession();
  }, [location, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 to-navy-700 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-gold mx-auto mb-4"></div>
        <p className="text-white text-xl">Completing sign in...</p>
      </div>
    </div>
  );
}

export default AuthCallback;
