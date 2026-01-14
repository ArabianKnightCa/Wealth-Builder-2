import React, { useState } from 'react';
import { FINANCIAL_GOALS_CONFIG } from '../data/financialGoals';

function GoalSelector({ selectedGoals, onGoalsChange, onNext, onBack, loading, error }) {
  const [openCategories, setOpenCategories] = useState({});
  const [customGoal, setCustomGoal] = useState('');
  const [showError, setShowError] = useState(false);

  const toggleCategory = (categoryId) => {
    setOpenCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const handleGoalToggle = (goalId) => {
    setShowError(false);
    const newGoals = selectedGoals.includes(goalId)
      ? selectedGoals.filter(id => id !== goalId)
      : [...selectedGoals, goalId];
    onGoalsChange(newGoals);
  };

  const handleAddCustomGoal = () => {
    if (customGoal.trim()) {
      const customId = `custom_${Date.now()}`;
      handleGoalToggle(customId);
      // Store custom goal text separately
      localStorage.setItem(customId, customGoal.trim());
      setCustomGoal('');
    }
  };

  const handleNext = () => {
    if (selectedGoals.length === 0) {
      setShowError(true);
      return;
    }
    onNext();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 to-navy-700 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-lg shadow-2xl p-8">
        <div className="mb-6">
          <p className="text-gold font-semibold mb-2">Step 4 of 4</p>
          <h2 className="text-3xl font-bold text-navy-900 mb-2">
            What are your financial goals?
          </h2>
          <p className="text-gray-600">
            Check all that applies, but must check at least one to help us personalize your learning journey.
          </p>
        </div>

        {/* Backend Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded" data-testid="error-message">
            <p className="font-semibold">⚠️ Registration Error</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Selection Counter */}
        <div className="mb-4 p-3 bg-gold bg-opacity-10 border-l-4 border-gold rounded">
          <p className="text-navy-900 font-semibold">
            {selectedGoals.length === 0 
              ? "Check all that applies, but must check at least one" 
              : `${selectedGoals.length} goal${selectedGoals.length !== 1 ? 's' : ''} selected`}
          </p>
        </div>

        {/* Error Message */}
        {showError && (
          <div className="mb-4 p-3 bg-red-100 border-l-4 border-red-500 rounded">
            <p className="text-red-700 font-semibold">
              ⚠️ You must check at least one goal before continuing
            </p>
          </div>
        )}

        {/* Goal Categories - Dropdown with Select All per category */}
        <div className="space-y-3 mb-6 max-h-96 overflow-y-auto pr-2">
          {FINANCIAL_GOALS_CONFIG.categories.map((category) => {
            const categoryGoalIds = category.goals.map(g => g.id);
            const selectedInCategory = category.goals.filter(g => selectedGoals.includes(g.id)).length;
            const allSelectedInCategory = selectedInCategory === category.goals.length;
            const isOpen = openCategories[category.id];
            
            return (
              <div key={category.id} className="border-2 border-gray-200 rounded-lg overflow-hidden">
                {/* Category Header */}
                <div className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                  <button
                    onClick={() => toggleCategory(category.id)}
                    className="flex-1 flex items-center gap-3 text-left"
                  >
                    <span className={`text-lg transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                    <span className="font-semibold text-navy-900">
                      {category.label}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      allSelectedInCategory 
                        ? 'bg-green-500 text-white' 
                        : selectedInCategory > 0
                          ? 'bg-gold text-navy-900'
                          : 'bg-gray-300 text-gray-600'
                    }`}>
                      {selectedInCategory}/{category.goals.length}
                    </span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (allSelectedInCategory) {
                        // Deselect all in this category
                        const newGoals = selectedGoals.filter(id => !categoryGoalIds.includes(id));
                        onGoalsChange(newGoals);
                      } else {
                        // Select all in this category
                        const newGoals = [...new Set([...selectedGoals, ...categoryGoalIds])];
                        onGoalsChange(newGoals);
                      }
                    }}
                    className={`px-3 py-1.5 text-xs font-bold rounded-full transition ${
                      allSelectedInCategory
                        ? 'bg-red-500 text-white hover:bg-red-600'
                        : 'bg-green-500 text-white hover:bg-green-600'
                    }`}
                  >
                    {allSelectedInCategory ? '✕ Clear All' : '✓ Select All'}
                  </button>
                </div>

                {/* Category Goals */}
                {isOpen && (
                  <div className="p-4 bg-white space-y-2 border-t border-gray-200">
                    {category.goals.map((goal) => (
                      <label
                        key={goal.id}
                        className={`flex items-start space-x-3 p-2 rounded-lg cursor-pointer transition-colors border-2 ${
                          selectedGoals.includes(goal.id)
                            ? 'bg-gold/10 border-gold/30'
                            : 'border-transparent hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedGoals.includes(goal.id)}
                          onChange={() => handleGoalToggle(goal.id)}
                          className="mt-1 w-5 h-5 text-gold border-gray-300 rounded focus:ring-gold"
                        />
                        <span className="text-gray-700">{goal.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Custom Goal Section */}
        {FINANCIAL_GOALS_CONFIG.allowCustomGoal && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <label className="block text-navy-900 font-semibold mb-2">
              {FINANCIAL_GOALS_CONFIG.customGoalField.label}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customGoal}
                onChange={(e) => setCustomGoal(e.target.value)}
                placeholder={FINANCIAL_GOALS_CONFIG.customGoalField.placeholder}
                maxLength={FINANCIAL_GOALS_CONFIG.customGoalField.maxLength}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:border-transparent"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomGoal();
                  }
                }}
              />
              <button
                onClick={handleAddCustomGoal}
                disabled={!customGoal.trim()}
                className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                  customGoal.trim()
                    ? 'bg-gold hover:bg-yellow-500 text-navy-900'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Add
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {customGoal.length}/{FINANCIAL_GOALS_CONFIG.customGoalField.maxLength} characters
            </p>
          </div>
        )}

        {/* Custom Goals Display */}
        {selectedGoals.some(id => id.startsWith('custom_')) && (
          <div className="mb-6">
            <h3 className="font-semibold text-navy-900 mb-2">Your Custom Goals:</h3>
            <div className="space-y-2">
              {selectedGoals
                .filter(id => id.startsWith('custom_'))
                .map(customId => (
                  <div
                    key={customId}
                    className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                  >
                    <span className="text-gray-700">
                      {localStorage.getItem(customId)}
                    </span>
                    <button
                      onClick={() => {
                        handleGoalToggle(customId);
                        localStorage.removeItem(customId);
                      }}
                      className="text-red-500 hover:text-red-700 font-semibold"
                    >
                      Remove
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4 border-t border-gray-200">
          <button 
            type="button"
            onClick={onBack}
            className="px-6 py-3 bg-white border-2 border-gold text-navy-900 rounded-lg font-semibold hover:bg-gold hover:border-gold transition-all"
            data-testid="back-btn"
          >
            ← Back
          </button>
          <button 
            type="button"
            onClick={handleNext}
            disabled={loading}
            className="btn-primary"
            data-testid="continue-from-goals-btn"
          >
            {loading ? 'Creating Account...' : 'Continue →'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default GoalSelector;
