import React from 'react';

const OAUTH_PROVIDERS = [
  {
    id: 'google',
    name: 'Google',
    connectedField: 'google_connected',
    baseUrl: 'https://demobackend.emergentagent.com/auth/v1/env/oauth/google',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
    ),
    description: 'Connect your Google account for easier sign-in'
  },
  {
    id: 'apple',
    name: 'Apple',
    connectedField: 'apple_connected',
    baseUrl: 'https://demobackend.emergentagent.com/auth/v1/env/oauth/apple',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
      </svg>
    ),
    description: 'Connect your Apple ID for seamless sign-in'
  },
  {
    id: 'microsoft',
    name: 'Microsoft',
    connectedField: 'microsoft_connected',
    baseUrl: 'https://demobackend.emergentagent.com/auth/v1/env/oauth/microsoft',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24">
        <path fill="#F25022" d="M1 1h10v10H1z"/>
        <path fill="#00A4EF" d="M1 13h10v10H1z"/>
        <path fill="#7FBA00" d="M13 1h10v10H13z"/>
        <path fill="#FFB900" d="M13 13h10v10H13z"/>
      </svg>
    ),
    description: 'Connect your Microsoft account'
  },
  {
    id: 'facebook',
    name: 'Facebook',
    connectedField: 'facebook_connected',
    baseUrl: 'https://demobackend.emergentagent.com/auth/v1/env/oauth/facebook',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#1877F2">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
    description: 'Connect your Facebook account'
  }
];

function SecuritySection({ 
  user, 
  security, 
  setSecurity, 
  display, 
  labelClass, 
  subTextClass, 
  inputClass,
  loading,
  handleChangePassword 
}) {
  const handleOAuthConnect = (provider) => {
    const redirectUri = `${window.location.origin}/auth/callback#provider=${provider.id}`;
    window.location.href = `${provider.baseUrl}?redirect_uri=${encodeURIComponent(redirectUri)}`;
  };

  return (
    <div className="space-y-6">
      <div className={`border-b pb-4 mb-6 ${display.dark_mode ? 'border-gray-700' : 'border-gray-200'}`}>
        <h2 className="text-2xl font-bold">🔐 Security</h2>
        <p className={subTextClass}>Keep your account safe</p>
      </div>

      {/* Change Password */}
      <div className={`p-5 rounded-xl border-2 ${display.dark_mode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
        <h3 className="font-semibold mb-4 flex items-center gap-2">🔑 Change Password</h3>
        <div className="space-y-4">
          <input
            type="password"
            placeholder="Current password"
            value={security.current_password}
            onChange={(e) => setSecurity(prev => ({ ...prev, current_password: e.target.value }))}
            className={`w-full px-4 py-3 rounded-lg border-2 ${inputClass}`}
          />
          <input
            type="password"
            placeholder="New password (min 8 characters)"
            value={security.new_password}
            onChange={(e) => setSecurity(prev => ({ ...prev, new_password: e.target.value }))}
            className={`w-full px-4 py-3 rounded-lg border-2 ${inputClass}`}
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={security.confirm_password}
            onChange={(e) => setSecurity(prev => ({ ...prev, confirm_password: e.target.value }))}
            className={`w-full px-4 py-3 rounded-lg border-2 ${inputClass}`}
          />
          <button
            onClick={handleChangePassword}
            disabled={!security.current_password || !security.new_password || loading}
            className="w-full bg-navy-900 text-white py-3 rounded-lg font-semibold hover:bg-navy-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Changing...' : '🔒 Update Password'}
          </button>
        </div>
      </div>

      {/* Two-Factor - Coming Soon */}
      <div className={`p-5 rounded-xl border-2 ${display.dark_mode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold flex items-center gap-2">🛡️ Two-Factor Authentication</h3>
            <p className={`text-sm ${subTextClass}`}>Add an extra layer of security</p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
            Coming Soon
          </span>
        </div>
      </div>

      {/* Active Sessions */}
      <div className={`p-5 rounded-xl border-2 ${display.dark_mode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
        <h3 className="font-semibold mb-3">📱 Active Sessions</h3>
        <div className={`p-3 rounded-lg border ${display.dark_mode ? 'bg-gray-600 border-gray-500' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">💻</span>
              <div>
                <p className="font-medium">Current Device</p>
                <p className={`text-xs ${subTextClass}`}>This browser • Active now</p>
              </div>
            </div>
            <span className="text-green-500 text-sm">● Active</span>
          </div>
        </div>
      </div>

      {/* Connected Accounts - All OAuth Providers */}
      <div className={`p-5 rounded-xl border-2 ${display.dark_mode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
        <h3 className="font-semibold mb-4">🔗 Connected Accounts</h3>
        <div className="space-y-3">
          {OAUTH_PROVIDERS.map((provider) => {
            const isConnected = user[provider.connectedField];
            return (
              <div 
                key={provider.id}
                className={`flex items-center justify-between p-3 rounded-lg ${display.dark_mode ? 'bg-gray-600' : 'bg-white'} border ${display.dark_mode ? 'border-gray-500' : 'border-gray-200'}`}
              >
                <div className="flex items-center gap-3">
                  {provider.icon}
                  <div>
                    <span className="font-medium">{provider.name}</span>
                    {isConnected && (
                      <p className={`text-xs ${subTextClass}`}>Connected as {user.email}</p>
                    )}
                  </div>
                </div>
                {isConnected ? (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                    ✓ Connected
                  </span>
                ) : (
                  <button 
                    onClick={() => handleOAuthConnect(provider)}
                    className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-500 text-white hover:bg-blue-600 transition"
                    data-testid={`connect-${provider.id}-btn`}
                  >
                    Connect
                  </button>
                )}
              </div>
            );
          })}
        </div>
        <p className={`text-xs mt-3 ${subTextClass}`}>
          Connect social accounts for easier sign-in. Your primary login email will remain the same.
        </p>
      </div>
    </div>
  );
}

export default SecuritySection;
