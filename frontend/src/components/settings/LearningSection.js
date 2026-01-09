import React from 'react';
import { LANGUAGE_OPTIONS, EXPERIENCE_LEVELS } from './constants';
import { FINANCIAL_GOALS_CONFIG } from '../../data/financialGoals';

function LearningSection({ 
  preferences, 
  setPreferences, 
  display, 
  labelClass, 
  subTextClass, 
  inputClass,
  openCategories,
  setOpenCategories
}) {
  const getAllGoalIds = () => {
    return FINANCIAL_GOALS_CONFIG.categories.flatMap(cat => cat.goals.map(g => g.id));
  };

  const handleGoalToggle = (goalId) => {
    setPreferences(prev => {
      const currentGoals = prev.financial_goals || [];
      if (currentGoals.includes(goalId)) {
        return { ...prev, financial_goals: currentGoals.filter(id => id !== goalId) };
      } else {
        return { ...prev, financial_goals: [...currentGoals, goalId] };
      }
    });
  };

  const handleClearAllGoals = () => {
    setPreferences(prev => ({ ...prev, financial_goals: [] }));
  };

  return (
    <div className="space-y-6">
      <div className={`border-b pb-4 mb-6 ${display.dark_mode ? 'border-gray-700' : 'border-gray-200'}`}>
        <h2 className="text-2xl font-bold">📚 Learning Preferences</h2>
        <p className={subTextClass}>Customize your learning experience</p>
      </div>

      {/* Language */}
      <div>
        <label className={`block font-semibold mb-2 ${labelClass}`}>Language</label>
        <select
          value={preferences.language}
          onChange={(e) => setPreferences(prev => ({ ...prev, language: e.target.value }))}
          className={`w-full px-4 py-3 rounded-lg border-2 ${inputClass} focus:ring-2 focus:ring-gold focus:border-gold`}
          data-testid="language-select"
        >
          {LANGUAGE_OPTIONS.map(lang => (
            <option key={lang.code} value={lang.code}>{lang.name}</option>
          ))}
        </select>
      </div>

      {/* Experience Level */}
      <div>
        <label className={`block font-semibold mb-2 ${labelClass}`}>Financial Experience</label>
        <select
          value={preferences.experience_level}
          onChange={(e) => setPreferences(prev => ({ ...prev, experience_level: parseInt(e.target.value) }))}
          className={`w-full px-4 py-3 rounded-lg border-2 ${inputClass} focus:ring-2 focus:ring-gold focus:border-gold`}
          data-testid="experience-select"
        >
          {EXPERIENCE_LEVELS.map(level => (
            <option key={level.value} value={level.value}>{level.label}</option>
          ))}
        </select>
      </div>

      {/* Daily Learning Goal - Slider */}
      <div>
        <label className={`block font-semibold mb-2 ${labelClass}`}>Daily Learning Goal</label>
        <div className={`p-4 rounded-xl border-2 ${display.dark_mode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-sm ${subTextClass}`}>5 min</span>
            <span className="text-2xl font-bold text-gold">{preferences.daily_goal_minutes} min</span>
            <span className={`text-sm ${subTextClass}`}>240 min</span>
          </div>
          <input
            type="range"
            min="5"
            max="240"
            step="5"
            value={preferences.daily_goal_minutes}
            onChange={(e) => setPreferences(prev => ({ ...prev, daily_goal_minutes: parseInt(e.target.value) }))}
            className="w-full h-3 rounded-full appearance-none cursor-pointer bg-gray-300 accent-gold"
            style={{
              background: `linear-gradient(to right, #F5A623 0%, #F5A623 ${((preferences.daily_goal_minutes - 5) / 235) * 100}%, ${display.dark_mode ? '#4B5563' : '#D1D5DB'} ${((preferences.daily_goal_minutes - 5) / 235) * 100}%, ${display.dark_mode ? '#4B5563' : '#D1D5DB'} 100%)`
            }}
            data-testid="daily-goal-slider"
          />
          <div className="flex justify-between mt-2 text-xs">
            {[5, 30, 60, 120, 180, 240].map(mark => (
              <span 
                key={mark} 
                className={`${preferences.daily_goal_minutes === mark ? 'text-gold font-bold' : subTextClass}`}
              >
                {mark}
              </span>
            ))}
          </div>
          <p className={`text-center text-sm mt-3 ${subTextClass}`}>
            {preferences.daily_goal_minutes <= 10 ? '🌱 Quick daily practice' : 
             preferences.daily_goal_minutes <= 30 ? '📖 Good learning habit' :
             preferences.daily_goal_minutes <= 60 ? '🔥 Serious learner!' :
             preferences.daily_goal_minutes <= 120 ? '🏆 Power learner mode!' :
             preferences.daily_goal_minutes <= 180 ? '💪 Intense focus session!' :
             '🚀 Marathon learning day!'}
          </p>
        </div>
      </div>

      {/* Enable Hints */}
      <div className={`flex items-center justify-between p-4 rounded-lg border-2 ${display.dark_mode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
        <div>
          <span className="font-semibold">💡 Enable Hints</span>
          <p className={`text-sm ${subTextClass}`}>Show helpful hints during lessons</p>
        </div>
        <button
          onClick={() => setPreferences(prev => ({ ...prev, enable_hints: !prev.enable_hints }))}
          className={`w-14 h-8 rounded-full transition-colors ${
            preferences.enable_hints ? 'bg-gold' : 'bg-gray-400'
          }`}
        >
          <div className={`w-6 h-6 bg-white rounded-full shadow transform transition-transform ${
            preferences.enable_hints ? 'translate-x-7' : 'translate-x-1'
          }`} />
        </button>
      </div>

      {/* Financial Goals */}
      <div className={`p-5 rounded-xl border-2 ${display.dark_mode ? 'border-gold/30 bg-gray-700/30' : 'border-gold/50 bg-gradient-to-br from-yellow-50 to-orange-50'}`}>
        <div className="flex justify-between items-center mb-4">
          <div>
            <label className={`block font-semibold ${labelClass}`}>🎯 Financial Goals</label>
            <p className={`text-sm ${subTextClass}`}>
              {preferences.financial_goals?.length || 0} of {getAllGoalIds().length} selected
            </p>
          </div>
          <button
            onClick={handleClearAllGoals}
            className="px-3 py-1.5 text-xs font-bold bg-gray-500 text-white rounded-full hover:bg-gray-600 transition border-2 border-gray-600"
          >
            ✕ Clear All
          </button>
        </div>
        
        <div className={`border-2 rounded-lg max-h-80 overflow-y-auto ${display.dark_mode ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-white'}`}>
          {FINANCIAL_GOALS_CONFIG.categories.map((category, idx) => {
            const displayLabel = category.label.replace(/ Goals?$/i, '');
            const categoryGoalIds = category.goals.map(g => g.id);
            const selectedInCategory = category.goals.filter(g => preferences.financial_goals?.includes(g.id)).length;
            const allSelectedInCategory = selectedInCategory === category.goals.length;
            
            return (
              <div key={category.id} className={idx > 0 ? `border-t-2 ${display.dark_mode ? 'border-gray-600' : 'border-gray-200'}` : ''}>
                <div className={`flex items-center justify-between p-3 ${display.dark_mode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <button
                    type="button"
                    onClick={() => setOpenCategories(prev => ({ ...prev, [category.id]: !prev[category.id] }))}
                    className="flex-1 flex items-center gap-2 text-left hover:opacity-80"
                  >
                    <span className="text-gold text-lg font-bold w-6">{openCategories[category.id] ? '−' : '+'}</span>
                    <span className="font-medium text-sm">{displayLabel}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      allSelectedInCategory ? 'bg-green-500 text-white' : display.dark_mode ? 'bg-gray-600' : 'bg-gray-200'
                    }`}>
                      {selectedInCategory}/{category.goals.length}
                    </span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (allSelectedInCategory) {
                        setPreferences(prev => ({
                          ...prev,
                          financial_goals: (prev.financial_goals || []).filter(id => !categoryGoalIds.includes(id))
                        }));
                      } else {
                        setPreferences(prev => ({
                          ...prev,
                          financial_goals: [...new Set([...(prev.financial_goals || []), ...categoryGoalIds])]
                        }));
                      }
                    }}
                    className={`px-2 py-1 text-xs font-bold rounded transition ${
                      allSelectedInCategory ? 'bg-gray-400 text-white hover:bg-gray-500' : 'bg-green-500 text-white hover:bg-green-600'
                    }`}
                  >
                    {allSelectedInCategory ? '✕ Clear' : '✓ All'}
                  </button>
                </div>
                {openCategories[category.id] && (
                  <div className={`p-3 space-y-1 ${display.dark_mode ? 'bg-gray-800' : 'bg-white'}`}>
                    {category.goals.map((goal) => (
                      <label key={goal.id} className={`flex items-center gap-3 p-2 rounded cursor-pointer transition border ${
                        preferences.financial_goals?.includes(goal.id)
                          ? display.dark_mode ? 'bg-gold/20 border-gold/50' : 'bg-gold/10 border-gold/30'
                          : display.dark_mode ? 'border-transparent hover:bg-gray-700' : 'border-transparent hover:bg-gray-200'
                      }`}>
                        <input
                          type="checkbox"
                          checked={preferences.financial_goals?.includes(goal.id) || false}
                          onChange={() => handleGoalToggle(goal.id)}
                          className="w-4 h-4 text-gold rounded focus:ring-gold"
                        />
                        <span className="text-sm">{goal.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default LearningSection;
