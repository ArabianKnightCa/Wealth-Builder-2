import React, { useState } from 'react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

/**
 * Utility to convert ArrayBuffer to base64url string
 */
function bufferToBase64url(buffer) {
  const bytes = new Uint8Array(buffer);
  let str = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    str += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(str);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Utility to convert base64url string to ArrayBuffer
 */
function base64urlToBuffer(base64url) {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - base64.length % 4) % 4;
  const padded = base64 + '='.repeat(padLen);
  const binary = atob(padded);
  const buffer = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    buffer[i] = binary.charCodeAt(i);
  }
  return buffer.buffer;
}

/**
 * Check if WebAuthn/Passkeys are supported
 */
function isPasskeySupported() {
  return window.PublicKeyCredential !== undefined;
}

/**
 * PasskeyButton component for registering and authenticating with passkeys
 */
function PasskeyButton({ mode = 'login', email, onSuccess, onError }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /**
   * Register a new passkey
   */
  const handleRegister = async () => {
    if (!email) {
      setError('Email is required to register a passkey');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Get registration options from server
      const optionsRes = await fetch(`${API}/auth/passkey/register/options`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!optionsRes.ok) {
        const err = await optionsRes.json();
        throw new Error(err.detail || 'Failed to get registration options');
      }

      const { options } = await optionsRes.json();
      const publicKeyOptions = JSON.parse(options);

      // Convert base64url strings to ArrayBuffers
      publicKeyOptions.challenge = base64urlToBuffer(publicKeyOptions.challenge);
      publicKeyOptions.user.id = base64urlToBuffer(publicKeyOptions.user.id);
      if (publicKeyOptions.excludeCredentials) {
        publicKeyOptions.excludeCredentials = publicKeyOptions.excludeCredentials.map(cred => ({
          ...cred,
          id: base64urlToBuffer(cred.id),
        }));
      }

      // 2. Create credential using browser WebAuthn API
      const credential = await navigator.credentials.create({ publicKey: publicKeyOptions });

      // 3. Send credential to server for verification
      const credentialForServer = {
        id: credential.id,
        rawId: bufferToBase64url(credential.rawId),
        type: credential.type,
        response: {
          clientDataJSON: bufferToBase64url(credential.response.clientDataJSON),
          attestationObject: bufferToBase64url(credential.response.attestationObject),
        },
      };

      const verifyRes = await fetch(`${API}/auth/passkey/register/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, credential: credentialForServer }),
      });

      if (!verifyRes.ok) {
        const err = await verifyRes.json();
        throw new Error(err.detail || 'Failed to verify passkey registration');
      }

      const result = await verifyRes.json();
      onSuccess?.(result);

    } catch (err) {
      console.error('Passkey registration error:', err);
      const message = err.name === 'NotAllowedError' 
        ? 'Passkey registration was cancelled' 
        : err.message;
      setError(message);
      onError?.(message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Authenticate with an existing passkey
   */
  const handleAuthenticate = async () => {
    setLoading(true);
    setError('');

    try {
      // 1. Get authentication options from server
      const optionsRes = await fetch(`${API}/auth/passkey/authenticate/options`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email || null }),
      });

      if (!optionsRes.ok) {
        const err = await optionsRes.json();
        throw new Error(err.detail || 'Failed to get authentication options');
      }

      const { options } = await optionsRes.json();
      const publicKeyOptions = JSON.parse(options);

      // Convert base64url strings to ArrayBuffers
      publicKeyOptions.challenge = base64urlToBuffer(publicKeyOptions.challenge);
      if (publicKeyOptions.allowCredentials) {
        publicKeyOptions.allowCredentials = publicKeyOptions.allowCredentials.map(cred => ({
          ...cred,
          id: base64urlToBuffer(cred.id),
        }));
      }

      // 2. Get credential using browser WebAuthn API
      const credential = await navigator.credentials.get({ publicKey: publicKeyOptions });

      // 3. Send credential to server for verification
      const credentialForServer = {
        id: credential.id,
        rawId: bufferToBase64url(credential.rawId),
        type: credential.type,
        response: {
          clientDataJSON: bufferToBase64url(credential.response.clientDataJSON),
          authenticatorData: bufferToBase64url(credential.response.authenticatorData),
          signature: bufferToBase64url(credential.response.signature),
          userHandle: credential.response.userHandle 
            ? bufferToBase64url(credential.response.userHandle) 
            : null,
        },
      };

      const verifyRes = await fetch(`${API}/auth/passkey/authenticate/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credentialForServer }),
      });

      if (!verifyRes.ok) {
        const err = await verifyRes.json();
        throw new Error(err.detail || 'Failed to verify passkey authentication');
      }

      const result = await verifyRes.json();
      onSuccess?.(result);

    } catch (err) {
      console.error('Passkey authentication error:', err);
      const message = err.name === 'NotAllowedError' 
        ? 'Passkey authentication was cancelled' 
        : err.message;
      setError(message);
      onError?.(message);
    } finally {
      setLoading(false);
    }
  };

  // Check if passkeys are supported
  if (!isPasskeySupported()) {
    return null; // Don't show button if not supported
  }

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={mode === 'register' ? handleRegister : handleAuthenticate}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        data-testid="passkey-btn"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 1C8.676 1 6 3.676 6 7c0 2.362 1.362 4.406 3.341 5.399C5.857 13.66 3 17.324 3 21.5c0 .828.672 1.5 1.5 1.5s1.5-.672 1.5-1.5c0-3.584 2.916-6.5 6.5-6.5s6.5 2.916 6.5 6.5c0 .828.672 1.5 1.5 1.5s1.5-.672 1.5-1.5c0-4.176-2.857-7.84-6.341-9.101C17.638 11.406 19 9.362 19 7c0-3.324-2.676-6-6-6zm0 9c-1.654 0-3-1.346-3-3s1.346-3 3-3 3 1.346 3 3-1.346 3-3 3z"/>
        </svg>
        <span>{loading ? 'Processing...' : mode === 'register' ? 'Register Passkey' : 'Sign in with Passkey'}</span>
      </button>
      {error && (
        <p className="text-red-500 text-sm mt-2 text-center">{error}</p>
      )}
    </div>
  );
}

export default PasskeyButton;
export { isPasskeySupported };
