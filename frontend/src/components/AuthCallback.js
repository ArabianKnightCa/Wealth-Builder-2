import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

/**
 * AuthCallback component handles OAuth callbacks from multiple providers
 * Supports: Google, Apple, Microsoft, Facebook, LinkedIn
 * Processes the session_id from URL fragment and establishes user session
 * 
 * REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
 */
function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const hasProcessed = useRef(false);
  const [providerName, setProviderName] = useState('');

  useEffect(() => {
    // Prevent double processing in StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processSession = async () => {
      try {
        // Extract session_id from URL fragment
        const hash = location.hash;
        const sessionId = hash?.split('session_id=')[1]?.split('&')[0];
        
        // Try to detect provider from state parameter or referrer
        // The Emergent OAuth will include provider info in the state or we default to google
        const stateMatch = hash?.match(/state=([^&]+)/);
        let provider = 'google'; // default
        
        if (stateMatch) {
          try {
            const stateData = JSON.parse(decodeURIComponent(stateMatch[1]));
            if (stateData.provider) {
              provider = stateData.provider;
            }
          } catch (e) {
            // State might not be JSON, check if it contains provider name
            const stateValue = decodeURIComponent(stateMatch[1]).toLowerCase();
            if (stateValue.includes('apple')) provider = 'apple';
            else if (stateValue.includes('microsoft')) provider = 'microsoft';
            else if (stateValue.includes('facebook')) provider = 'facebook';
            else if (stateValue.includes('linkedin')) provider = 'linkedin';
          }
        }
        
        setProviderName(provider.charAt(0).toUpperCase() + provider.slice(1));

        if (!sessionId) {
          console.error('No session_id found in URL');
          navigate('/login', { replace: true });
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

        // Determine backend endpoint based on provider
        const callbackEndpoint = `${API}/auth/${provider}/callback`;
        
        // Build payload based on provider
        const payload = {
          [`${provider}_id`]: id,
          email,
          name,
          picture,
          session_token,
          provider
        };

        // Send to our backend to create/update user and set session
        const backendResponse = await axios.post(
          callbackEndpoint,
          payload,
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
        <p className="text-white text-xl">Completing {providerName || ''} sign in...</p>
      </div>
    </div>
  );
}

export default AuthCallback;
