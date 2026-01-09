import React from 'react';

function NotificationsSection({ preferences, setPreferences, display, labelClass, subTextClass, inputClass }) {
  return (
    <div className="space-y-6">
      <div className={`border-b pb-4 mb-6 ${display.dark_mode ? 'border-gray-700' : 'border-gray-200'}`}>
        <h2 className="text-2xl font-bold">🔔 Notifications</h2>
        <p className={subTextClass}>Control how and when we reach you</p>
      </div>

      {/* Master Toggle */}
      <div className={`p-4 rounded-xl border-2 ${display.dark_mode ? 'bg-gray-700 border-gray-600' : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'}`}>
        <div className="flex items-center justify-between">
          <div>
            <span className="font-semibold text-lg">🔔 Enable Notifications</span>
            <p className={`text-sm ${subTextClass}`}>Master toggle</p>
          </div>
          <button
            onClick={() => setPreferences(prev => ({ ...prev, notifications_enabled: !prev.notifications_enabled }))}
            className={`w-16 h-9 rounded-full transition-colors ${
              preferences.notifications_enabled ? 'bg-green-500' : 'bg-gray-400'
            }`}
          >
            <div className={`w-7 h-7 bg-white rounded-full shadow transform transition-transform ${
              preferences.notifications_enabled ? 'translate-x-8' : 'translate-x-1'
            }`} />
          </button>
        </div>
      </div>

      {preferences.notifications_enabled && (
        <>
          <div>
            <label className={`block font-semibold mb-2 ${labelClass}`}>⏰ Daily Reminder Time</label>
            <input
              type="time"
              value={preferences.reminder_time}
              onChange={(e) => setPreferences(prev => ({ ...prev, reminder_time: e.target.value }))}
              className={`w-full px-4 py-3 rounded-lg border-2 ${inputClass}`}
            />
          </div>

          <div className="space-y-3">
            {[
              { key: 'achievement_alerts', label: '🏆 Achievement Alerts', desc: 'Get notified when you earn badges' },
              { key: 'milestone_celebrations', label: '🎉 Milestone Celebrations', desc: 'Celebrate learning milestones' },
              { key: 'streak_reminders', label: '🔥 Streak Reminders', desc: 'Maintain your learning streak' },
              { key: 'weekly_email', label: '📧 Weekly Progress Email', desc: 'Summary of your learning' }
            ].map(item => (
              <div key={item.key} className={`flex items-center justify-between p-4 rounded-lg border-2 ${display.dark_mode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                <div>
                  <span className="font-semibold">{item.label}</span>
                  <p className={`text-sm ${subTextClass}`}>{item.desc}</p>
                </div>
                <button
                  onClick={() => setPreferences(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                  className={`w-14 h-8 rounded-full transition-colors ${
                    preferences[item.key] ? 'bg-gold' : 'bg-gray-400'
                  }`}
                >
                  <div className={`w-6 h-6 bg-white rounded-full shadow transform transition-transform ${
                    preferences[item.key] ? 'translate-x-7' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            ))}
          </div>

          <div>
            <label className={`block font-semibold mb-2 ${labelClass}`}>📬 Email Frequency</label>
            <div className="flex gap-2">
              {['daily', 'weekly', 'monthly', 'never'].map(freq => (
                <button
                  key={freq}
                  onClick={() => setPreferences(prev => ({ ...prev, email_frequency: freq }))}
                  className={`flex-1 px-3 py-2 rounded-lg font-medium capitalize text-sm transition border-2 ${
                    preferences.email_frequency === freq
                      ? 'bg-gold text-navy-900 border-yellow-500'
                      : display.dark_mode
                        ? 'bg-gray-700 text-gray-300 border-gray-600 hover:border-gray-400'
                        : 'bg-gray-100 text-gray-700 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  {freq}
                </button>
              ))}
            </div>
          </div>

          <div className={`p-4 rounded-lg border-2 ${display.dark_mode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-200'}`}>
            <label className="block font-semibold mb-3">🌙 Quiet Hours</label>
            <p className={`text-sm ${subTextClass} mb-3`}>No notifications during this time</p>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className={`text-xs ${subTextClass}`}>From</label>
                <input
                  type="time"
                  value={preferences.quiet_hours_start}
                  onChange={(e) => setPreferences(prev => ({ ...prev, quiet_hours_start: e.target.value }))}
                  className={`w-full px-3 py-2 rounded-lg border-2 ${inputClass}`}
                />
              </div>
              <div className="flex-1">
                <label className={`text-xs ${subTextClass}`}>To</label>
                <input
                  type="time"
                  value={preferences.quiet_hours_end}
                  onChange={(e) => setPreferences(prev => ({ ...prev, quiet_hours_end: e.target.value }))}
                  className={`w-full px-3 py-2 rounded-lg border-2 ${inputClass}`}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default NotificationsSection;
