import React from 'react';

function DangerSection({ display, subTextClass, setShowResetProgress, setShowDeleteModal, setDeleteStep }) {
  return (
    <div className="space-y-6">
      <div className={`border-b pb-4 mb-6 ${display.dark_mode ? 'border-gray-700' : 'border-gray-200'}`}>
        <h2 className="text-2xl font-bold">⚙️ Account Actions</h2>
        <p className={subTextClass}>Manage your account and data</p>
      </div>

      {/* Reset Progress */}
      <div className={`p-5 rounded-xl border-2 ${display.dark_mode ? 'border-orange-500/50 bg-orange-900/20' : 'border-orange-300 bg-gradient-to-r from-orange-50 to-yellow-50'}`}>
        <div className="flex items-start gap-4">
          <span className="text-3xl">🔄</span>
          <div className="flex-1">
            <h3 className="font-bold text-orange-600 mb-2">Reset Learning Progress</h3>
            <p className={`text-sm ${subTextClass} mb-3`}>Start fresh! This will clear:</p>
            <ul className={`text-sm ${subTextClass} mb-4 list-disc list-inside space-y-1`}>
              <li>All quiz scores and results</li>
              <li>PPI responses and financial DNA</li>
              <li>Chapter progress and unlocks</li>
            </ul>
            <p className="text-sm font-semibold text-green-600 mb-4">
              ✓ Your account and settings will be kept
            </p>
            <button
              onClick={() => setShowResetProgress(true)}
              className="bg-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition"
            >
              🔄 Reset Progress
            </button>
          </div>
        </div>
      </div>

      {/* Delete Account */}
      <div className={`p-5 rounded-xl border-2 ${display.dark_mode ? 'border-red-500/50 bg-red-900/20' : 'border-red-300 bg-gradient-to-r from-red-50 to-pink-50'}`}>
        <div className="flex items-start gap-4">
          <span className="text-3xl">🗑️</span>
          <div className="flex-1">
            <h3 className="font-bold text-red-600 mb-2">Delete Account Permanently</h3>
            <p className={`text-sm ${subTextClass} mb-3`}>This will permanently delete:</p>
            <ul className={`text-sm ${subTextClass} mb-4 list-disc list-inside space-y-1`}>
              <li>Your entire account</li>
              <li>All learning progress and data</li>
              <li>Profile information</li>
              <li>Everything - forever</li>
            </ul>
            <p className="text-sm font-bold text-red-600 mb-4">⚠️ This action CANNOT be undone!</p>
            <button
              onClick={() => { setShowDeleteModal(true); setDeleteStep(1); }}
              className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition"
              data-testid="delete-account-btn"
            >
              🗑️ Delete My Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DangerSection;
