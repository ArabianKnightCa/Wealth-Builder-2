import React, { useState } from 'react';
import { FINANCIAL_GOALS_CONFIG } from '../data/financialGoals';

function GoalSelector({ selectedGoals, onGoalsChange, onNext, onBack }) {
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
    console.log('GoalSelector handleNext called, selectedGoals:', selectedGoals);
    if (selectedGoals.length === 0) {
      console.log('Validation failed: no goals selected');
      setShowError(true);
      return;
    }
    console.log('Validation passed, calling onNext()');
    onNext();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 to-navy-700 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-lg shadow-2xl p-8">
        <div className="mb-6">
          <p className="text-gold font-semibold mb-2">Step 3 of 4</p>
          <h2 className="text-3xl font-bold text-navy-900 mb-2">
            What are your financial goals?
          </h2>
          <p className="text-gray-600">
            Check all that applies, but must check at least one to help us personalize your learning journey.
          </p>
        </div>

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

        {/* Goal Categories */}
        <div className="space-y-3 mb-6 max-h-96 overflow-y-auto pr-2">
          {FINANCIAL_GOALS_CONFIG.categories.map((category) => (
            <div key={category.id} className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <span className="font-semibold text-navy-900 text-left">
                  {category.label}
                </span>
                <span className="text-gold text-xl">
                  {openCategories[category.id] ? '−' : '+'}
                </span>
              </button>

              {/* Category Goals */}
              {openCategories[category.id] && (
                <div className="p-4 bg-white space-y-2">
                  {category.goals.map((goal) => (
                    <label
                      key={goal.id}
                      className="flex items-start space-x-3 p-2 rounded hover:bg-gray-50 cursor-pointer transition-colors"
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
          ))}
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
            onClick={onBack}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all"
          >
            ← Back
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="btn-primary flex-1"
            data-testid="continue-from-goals-btn"
          >
            Continue →
          </button>
        </div>
      </div>
    </div>
  );
}

export default GoalSelector;
