import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import PasskeyButton, { isPasskeySupported } from '../components/PasskeyButton';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function Login({ onLogin }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showMagicLink, setShowMagicLink] = useState(false);
  const [magicLinkEmail, setMagicLinkEmail] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [magicLinkLoading, setMagicLinkLoading] = useState(false);

  const handlePasskeySuccess = (result) => {
    localStorage.setItem('token', result.access_token);
    onLogin(result.user, result.access_token);
    navigate('/dashboard');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/login`, formData);
      onLogin(response.data.user, response.data.access_token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLinkSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMagicLinkLoading(true);

    try {
      await axios.post(`${API}/auth/magic-link/send`, { email: magicLinkEmail });
      setMagicLinkSent(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send magic link. Please try again.');
    } finally {
      setMagicLinkLoading(false);
    }
  };

  // Magic Link Success View
  if (magicLinkSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-navy-900 to-navy-700 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="card text-center p-8">
            <div className="text-6xl mb-6">✉️</div>
            <h2 className="text-2xl font-bold text-navy-900 mb-2">Check your email!</h2>
            <p className="text-gray-600 mb-4">
              We sent a magic link to <strong>{magicLinkEmail}</strong>
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Click the link in the email to sign in instantly. The link expires in 15 minutes.
            </p>
            <button
              onClick={() => { setMagicLinkSent(false); setShowMagicLink(false); }}
              className="text-gold font-semibold hover:underline"
            >
              ← Back to login options
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Magic Link Form View
  if (showMagicLink) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-navy-900 to-navy-700 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-white mb-2">✨ Magic Link</h2>
            <p className="text-gray-300">Sign in without a password</p>
          </div>

          <div className="card">
            <form onSubmit={handleMagicLinkSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Email Address</label>
                <input
                  type="email"
                  className="input-field"
                  value={magicLinkEmail}
                  onChange={(e) => setMagicLinkEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  data-testid="magic-link-email"
                />
              </div>

              <button 
                type="submit" 
                className="btn-primary w-full" 
                disabled={magicLinkLoading}
                data-testid="send-magic-link-btn"
              >
                {magicLinkLoading ? 'Sending...' : '✨ Send Magic Link'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowMagicLink(false)}
                  className="text-gold font-semibold hover:underline"
                >
                  ← Back to all sign-in options
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 to-navy-700 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-white mb-2" data-testid="login-title">Welcome Back</h2>
          <p className="text-gray-300">Sign in to continue your financial journey</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded" data-testid="error-message">
                {error}
              </div>
            )}

            <div>
              <label className="block text-gray-700 font-semibold mb-2">Email</label>
              <input
                type="email"
                className="input-field"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                data-testid="email-input"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="input-field pr-12"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  data-testid="password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  data-testid="toggle-password"
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn-primary w-full" 
              disabled={loading}
              data-testid="submit-btn"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or continue with</span>
              </div>
            </div>

            {/* Social Sign In Buttons */}
            <div className="space-y-3">
              {/* Google */}
              <button
                type="button"
                onClick={() => {
                  const baseUrl = 'https://demobackend.emergentagent.com/auth/v1/env/oauth/google';
                  const redirectUri = `${window.location.origin}/auth/callback`;
                  window.location.href = `${baseUrl}?redirect_uri=${encodeURIComponent(redirectUri)}`;
                }}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-100 hover:border-gray-400 transition-all font-semibold"
                data-testid="google-signin-btn"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="text-gray-700">Continue with Google</span>
              </button>

              {/* Apple */}
              <button
                type="button"
                onClick={() => {
                  const baseUrl = 'https://demobackend.emergentagent.com/auth/v1/env/oauth/apple';
                  const redirectUri = `${window.location.origin}/auth/callback`;
                  window.location.href = `${baseUrl}?redirect_uri=${encodeURIComponent(redirectUri)}`;
                }}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-all font-semibold"
                data-testid="apple-signin-btn"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                <span>Continue with Apple</span>
              </button>

              {/* Microsoft */}
              <button
                type="button"
                onClick={() => {
                  const baseUrl = 'https://demobackend.emergentagent.com/auth/v1/env/oauth/microsoft';
                  const redirectUri = `${window.location.origin}/auth/callback#provider=microsoft`;
                  window.location.href = `${baseUrl}?redirect_uri=${encodeURIComponent(redirectUri)}`;
                }}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-100 hover:border-gray-400 transition-all font-semibold"
                data-testid="microsoft-signin-btn"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#F25022" d="M1 1h10v10H1z"/>
                  <path fill="#00A4EF" d="M1 13h10v10H1z"/>
                  <path fill="#7FBA00" d="M13 1h10v10H13z"/>
                  <path fill="#FFB900" d="M13 13h10v10H13z"/>
                </svg>
                <span className="text-gray-700">Continue with Microsoft</span>
              </button>

              {/* Facebook */}
              <button
                type="button"
                onClick={() => {
                  const baseUrl = 'https://demobackend.emergentagent.com/auth/v1/env/oauth/facebook';
                  const redirectUri = `${window.location.origin}/auth/callback#provider=facebook`;
                  window.location.href = `${baseUrl}?redirect_uri=${encodeURIComponent(redirectUri)}`;
                }}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#1877F2] text-white rounded-lg hover:bg-[#166FE5] transition-all font-semibold"
                data-testid="facebook-signin-btn"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span>Continue with Facebook</span>
              </button>

              {/* LinkedIn */}
              <button
                type="button"
                onClick={() => {
                  const baseUrl = 'https://demobackend.emergentagent.com/auth/v1/env/oauth/linkedin';
                  const redirectUri = `${window.location.origin}/auth/callback#provider=linkedin`;
                  window.location.href = `${baseUrl}?redirect_uri=${encodeURIComponent(redirectUri)}`;
                }}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#0A66C2] text-white rounded-lg hover:bg-[#004182] transition-all font-semibold"
                data-testid="linkedin-signin-btn"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                <span>Continue with LinkedIn</span>
              </button>

              {/* Magic Link (Passwordless) */}
              <button
                type="button"
                onClick={() => setShowMagicLink(true)}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg hover:from-purple-600 hover:to-indigo-600 transition-all font-semibold"
                data-testid="magic-link-btn"
              >
                <span className="text-xl">✨</span>
                <span>Sign in with Magic Link</span>
              </button>

              {/* Passkey (WebAuthn) */}
              {isPasskeySupported() && (
                <PasskeyButton 
                  mode="login" 
                  onSuccess={handlePasskeySuccess}
                  onError={(err) => setError(err)}
                />
              )}
            </div>
          </form>

          <div className="mt-4 text-center">
            <button 
              onClick={() => navigate('/forgot-password')} 
              className="text-gold font-semibold hover:underline text-sm"
              data-testid="forgot-password-link"
            >
              Forgot Password?
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <button 
                onClick={() => navigate('/register')} 
                className="text-gold font-semibold hover:underline"
                data-testid="register-link"
              >
                Sign Up
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;