import React from 'react';

function PrivacySection({ 
  privacy, 
  setPrivacy, 
  display, 
  labelClass, 
  subTextClass, 
  inputClass,
  navigate,
  handleExportData,
  exportingData
}) {
  return (
    <div className="space-y-6">
      <div className={`border-b pb-4 mb-6 ${display.dark_mode ? 'border-gray-700' : 'border-gray-200'}`}>
        <h2 className="text-2xl font-bold">🛡️ Privacy</h2>
        <p className={subTextClass}>Control your data and visibility</p>
      </div>

      {/* Toggles */}
      {[
        { key: 'profile_visible', label: '👁️ Profile Visible', desc: 'Allow others to see your profile' },
        { key: 'show_progress_publicly', label: '📊 Share Progress', desc: 'Show learning progress publicly' },
        { key: 'allow_analytics', label: '📈 Allow Analytics', desc: 'Help us improve with anonymous data' }
      ].map(item => (
        <div key={item.key} className={`flex items-center justify-between p-4 rounded-lg border-2 ${display.dark_mode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
          <div>
            <span className="font-semibold">{item.label}</span>
            <p className={`text-sm ${subTextClass}`}>{item.desc}</p>
          </div>
          <button
            onClick={() => setPrivacy(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
            className={`w-14 h-8 rounded-full transition-colors ${
              privacy[item.key] ? 'bg-gold' : 'bg-gray-400'
            }`}
          >
            <div className={`w-6 h-6 bg-white rounded-full shadow transform transition-transform ${
              privacy[item.key] ? 'translate-x-7' : 'translate-x-1'
            }`} />
          </button>
        </div>
      ))}

      {/* Data Retention */}
      <div>
        <label className={`block font-semibold mb-2 ${labelClass}`}>🗄️ Data Retention</label>
        <select
          value={privacy.data_retention_months}
          onChange={(e) => setPrivacy(prev => ({ ...prev, data_retention_months: parseInt(e.target.value) }))}
          className={`w-full px-4 py-3 rounded-lg border-2 ${inputClass}`}
        >
          <option value={6}>6 months</option>
          <option value={12}>1 year</option>
          <option value={24}>2 years</option>
          <option value={36}>3 years</option>
          <option value={-1}>Forever</option>
        </select>
      </div>

      {/* Export Data */}
      <div className={`p-5 rounded-xl border-2 ${display.dark_mode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
        <h3 className="font-semibold mb-2">📥 Export My Data</h3>
        <p className={`text-sm ${subTextClass} mb-4`}>Download all your data (GDPR compliant)</p>
        <button
          onClick={handleExportData}
          disabled={exportingData}
          className="bg-navy-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-navy-800 disabled:bg-gray-400 transition"
        >
          {exportingData ? '⏳ Preparing...' : '📥 Download My Data'}
        </button>
      </div>

      {/* Learning History */}
      <div className={`p-5 rounded-xl border-2 ${display.dark_mode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
        <h3 className="font-semibold mb-2">📜 Learning History</h3>
        <div className={`p-8 text-center rounded-lg ${display.dark_mode ? 'bg-gray-800' : 'bg-white'}`}>
          <span className="text-5xl mb-4 block">📚</span>
          <p className={`font-medium ${labelClass}`}>No learning history yet</p>
          <p className={`text-sm ${subTextClass} mt-1`}>Complete lessons and quizzes to see your history here</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 bg-gold text-navy-900 px-6 py-2 rounded-lg font-semibold hover:bg-yellow-400 transition"
          >
            Start Learning
          </button>
        </div>
      </div>
    </div>
  );
}

export default PrivacySection;
