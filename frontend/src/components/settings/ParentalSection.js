import React from 'react';

function ParentalSection({ display, subTextClass }) {
  return (
    <div className="space-y-6">
      <div className={`border-b pb-4 mb-6 ${display.dark_mode ? 'border-gray-700' : 'border-gray-200'}`}>
        <h2 className="text-2xl font-bold">👨‍👩‍👧 Parental Controls</h2>
        <p className={subTextClass}>Monitor and manage learning</p>
      </div>

      {/* Coming Soon Header */}
      <div className={`p-6 rounded-xl border-2 text-center mb-6 ${display.dark_mode ? 'bg-gradient-to-br from-gray-700 to-gray-800 border-gray-600' : 'bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200'}`}>
        <span className="text-5xl mb-3 block">🚀</span>
        <h3 className="text-xl font-bold mb-2">Coming Soon</h3>
        <p className={`${subTextClass} text-sm`}>
          Powerful tools for parents to guide their child&apos;s financial education journey
        </p>
      </div>

      {/* Phase 1: MVP */}
      <div className={`p-5 rounded-xl border-2 mb-4 ${display.dark_mode ? 'bg-green-900/20 border-green-500/50' : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300'}`}>
        <div className="flex items-center gap-2 mb-4">
          <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">PHASE 1</span>
          <h4 className="font-bold text-green-700">Foundation</h4>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {[
            { icon: '🔗', title: 'Parent Account Linking', desc: 'Verified email connection' },
            { icon: '📧', title: 'Weekly Progress Email', desc: 'Summary of lessons, quizzes, time spent' },
            { icon: '📊', title: 'Weak Topics Dashboard', desc: 'See where your child needs help' },
            { icon: '⏱️', title: 'Custom Time Limits', desc: '15 min to 4 hour daily limits' },
            { icon: '📅', title: 'Flexible Schedules', desc: 'Weekday / Weekend / Holiday modes' },
            { icon: '🔐', title: 'Parent-Only Password', desc: 'You control password changes' },
            { icon: '🛡️', title: 'Account Protection', desc: 'Child cannot delete account' },
            { icon: '💬', title: 'Parent Messages', desc: 'Send encouragement on app open' }
          ].map((item, i) => (
            <div key={i} className={`flex items-start gap-3 p-3 rounded-lg ${display.dark_mode ? 'bg-gray-800/50' : 'bg-white/70'}`}>
              <span className="text-xl">{item.icon}</span>
              <div>
                <p className="font-semibold text-sm">{item.title}</p>
                <p className={`text-xs ${subTextClass}`}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Phase 2: Engagement */}
      <div className={`p-5 rounded-xl border-2 mb-4 ${display.dark_mode ? 'bg-blue-900/20 border-blue-500/50' : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300'}`}>
        <div className="flex items-center gap-2 mb-4">
          <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded">PHASE 2</span>
          <h4 className="font-bold text-blue-700">Piggybank & Engagement</h4>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {[
            { icon: '🐷', title: 'Virtual Piggybank', desc: 'Mirror real deposits digitally' },
            { icon: '🎯', title: 'Savings Goals', desc: 'Child sets goals, tracks progress' },
            { icon: '📚', title: 'Learning Application', desc: '"What will you invest in when you reach your goal?"' },
            { icon: '⚠️', title: 'Struggle Alerts', desc: 'Notified when child fails quizzes' },
            { icon: '🎯', title: 'Parent-Set Goals', desc: '"Complete 5 lessons this week"' },
            { icon: '📝', title: 'Quiz Score History', desc: 'See all attempts and scores' },
            { icon: '🧬', title: 'Financial DNA Report', desc: 'Receive child PPI results' },
            { icon: '💡', title: 'Help Suggestions', desc: '"3 ways to help at home..."' }
          ].map((item, i) => (
            <div key={i} className={`flex items-start gap-3 p-3 rounded-lg ${display.dark_mode ? 'bg-gray-800/50' : 'bg-white/70'}`}>
              <span className="text-xl">{item.icon}</span>
              <div>
                <p className="font-semibold text-sm">{item.title}</p>
                <p className={`text-xs ${subTextClass}`}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Phase 3: Future */}
      <div className={`p-5 rounded-xl border-2 ${display.dark_mode ? 'bg-purple-900/20 border-purple-500/50' : 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-300'}`}>
        <div className="flex items-center gap-2 mb-4">
          <span className="bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded">PHASE 3</span>
          <h4 className="font-bold text-purple-700">Future Roadmap</h4>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {[
            { icon: '🏦', title: 'Plaid Bank Integration', desc: 'Connect real savings accounts' },
            { icon: '👥', title: 'Community Controls', desc: 'Manage social features safely' },
            { icon: '🏆', title: 'Family Leaderboard', desc: 'Friendly sibling competition' },
            { icon: '🧹', title: 'Chore Integration', desc: 'Chores = virtual earnings' },
            { icon: '🎓', title: 'Graduated Autonomy', desc: 'Controls relax as child ages' },
            { icon: '🏫', title: 'School Integration', desc: 'Teachers can assign lessons' }
          ].map((item, i) => (
            <div key={i} className={`flex items-start gap-3 p-3 rounded-lg ${display.dark_mode ? 'bg-gray-800/50' : 'bg-white/70'}`}>
              <span className="text-xl">{item.icon}</span>
              <div>
                <p className="font-semibold text-sm">{item.title}</p>
                <p className={`text-xs ${subTextClass}`}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notify Me */}
      <div className={`mt-6 p-4 rounded-xl text-center ${display.dark_mode ? 'bg-gray-700' : 'bg-gray-100'}`}>
        <p className={`text-sm ${subTextClass} mb-3`}>Want to be notified when Parental Controls launch?</p>
        <button className="bg-gold text-navy-900 px-6 py-2 rounded-lg font-semibold hover:bg-yellow-400 transition">
          🔔 Notify Me
        </button>
      </div>
    </div>
  );
}

export default ParentalSection;
