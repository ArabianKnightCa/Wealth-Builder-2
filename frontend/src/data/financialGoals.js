// Financial Goals Configuration - Orientation Goal Selector v1.0
// Positioned after Financial Experience Level in onboarding

export const FINANCIAL_GOALS_CONFIG = {
  component: "orientationGoalsDropdown",
  version: "1.0",
  positionAfter: "financial_experience_level",
  multiSelect: true,
  categories: [
    {
      id: "core_money",
      label: "Core Money Goals",
      goals: [
        { id: "core_money_change_habits", label: "Change my money habits" },
        { id: "core_money_stop_paycheck", label: "Stop living paycheck to paycheck" },
        { id: "core_money_improve_situation", label: "Improve my financial situation" },
        { id: "core_money_emergency_fund", label: "Build an emergency fund" },
        { id: "core_money_budget", label: "Learn to budget in a way that fits me" },
        { id: "core_money_stop_overspending", label: "Stop overspending" },
        { id: "core_money_no_stress", label: "Manage money without stress" }
      ]
    },
    {
      id: "debt_credit",
      label: "Debt & Credit Goals",
      goals: [
        { id: "debt_credit_get_out", label: "Get out of debt" },
        { id: "debt_credit_cards", label: "Pay off credit cards" },
        { id: "debt_credit_loans", label: "Pay off personal loans" },
        { id: "debt_credit_interest", label: "Reduce interest payments" },
        { id: "debt_credit_score", label: "Fix or improve my credit score" },
        { id: "debt_credit_stop_relying", label: "Stop relying on debt to survive" }
      ]
    },
    {
      id: "saving_planning",
      label: "Saving & Life Planning Goals",
      goals: [
        { id: "saving_planning_home", label: "Save for a home" },
        { id: "saving_planning_car", label: "Save for a car" },
        { id: "saving_planning_vacation", label: "Save for vacations" },
        { id: "saving_planning_retirement", label: "Save for retirement" },
        { id: "saving_planning_security", label: "Build long-term financial security" },
        { id: "saving_planning_kids", label: "Save for kids / future kids" },
        { id: "saving_planning_rainy_day", label: "Build a 'rainy day' fund" }
      ]
    },
    {
      id: "investing",
      label: "Investing Goals",
      goals: [
        { id: "investing_learn", label: "Learn how to invest" },
        { id: "investing_stock_market", label: "Understand the stock market" },
        { id: "investing_first_time", label: "Start investing for the first time" },
        { id: "investing_grow", label: "Grow my investments" },
        { id: "investing_strategies", label: "Learn long-term investing strategies" },
        { id: "investing_real_estate", label: "Learn real-estate investing" },
        { id: "investing_passive_income", label: "Build passive income" },
        { id: "investing_wealth", label: "Grow my wealth over time" }
      ]
    },
    {
      id: "income_career",
      label: "Income & Career Goals",
      goals: [
        { id: "income_career_increase", label: "Increase my income" },
        { id: "income_career_side_hustle", label: "Start a side hustle" },
        { id: "income_career_business", label: "Start my own business" },
        { id: "income_career_switch", label: "Switch careers" },
        { id: "income_career_negotiate", label: "Learn how to negotiate pay" },
        { id: "income_career_streams", label: "Build multiple income streams" }
      ]
    },
    {
      id: "lifestyle_quality",
      label: "Lifestyle & Quality of Life Goals",
      goals: [
        { id: "lifestyle_quality_bills", label: "Reduce monthly bills" },
        { id: "lifestyle_quality_stress", label: "Stop stressing about money" },
        { id: "lifestyle_quality_comfortable", label: "Live comfortably" },
        { id: "lifestyle_quality_upgrade", label: "Upgrade my lifestyle responsibly" },
        { id: "lifestyle_quality_freedom", label: "Have financial freedom" },
        { id: "lifestyle_quality_travel", label: "Travel more" },
        { id: "lifestyle_quality_flexibility", label: "Have flexibility in life decisions" }
      ]
    },
    {
      id: "family_relationship",
      label: "Family & Relationship Goals",
      goals: [
        { id: "family_relationship_provide", label: "Provide for my family" },
        { id: "family_relationship_wealth", label: "Build generational wealth" },
        { id: "family_relationship_teach_kids", label: "Teach my kids strong money habits" },
        { id: "family_relationship_arguments", label: "Stop money-related arguments" },
        { id: "family_relationship_parents", label: "Support aging parents" },
        { id: "family_relationship_stability", label: "Create stability at home" }
      ]
    },
    {
      id: "confidence_mindset",
      label: "Confidence & Mindset Goals",
      goals: [
        { id: "confidence_mindset_build", label: "Build confidence with money" },
        { id: "confidence_mindset_anxiety", label: "Overcome money anxiety" },
        { id: "confidence_mindset_patterns", label: "Break negative money patterns" },
        { id: "confidence_mindset_decisions", label: "Stop avoiding financial decisions" },
        { id: "confidence_mindset_discipline", label: "Build discipline" },
        { id: "confidence_mindset_control", label: "Feel in control" },
        { id: "confidence_mindset_understand", label: "Understand how money actually works" }
      ]
    },
    {
      id: "big_dream_future",
      label: "Big Dream & Future Vision Goals",
      goals: [
        { id: "big_dream_future_independent", label: "Become financially independent" },
        { id: "big_dream_future_fire", label: "Retire early (FIRE)" },
        { id: "big_dream_future_plan", label: "Create a long-term money plan" },
        { id: "big_dream_future_lifestyle", label: "Build a lifestyle I dream about" },
        { id: "big_dream_future_legacy", label: "Leave wealth behind for the next generation" },
        { id: "big_dream_future_no_stress", label: "Reach a point where money isn't stressful" }
      ]
    },
    {
      id: "real_talk",
      label: ""Real Talk" Personal Goals",
      goals: [
        { id: "real_talk_mistakes", label: "Stop repeating the same financial mistakes" },
        { id: "real_talk_cycle", label: "Break the cycle I grew up with" },
        { id: "real_talk_undo", label: "Undo years of bad habits" },
        { id: "real_talk_prove", label: "Prove to myself I can do this" },
        { id: "real_talk_safe", label: "Feel safe financially" },
        { id: "real_talk_comparing", label: "Stop comparing myself to others" },
        { id: "real_talk_learn", label: "Learn what school never taught me" }
      ]
    }
  ],
  allowCustomGoal: true,
  customGoalField: {
    id: "custom_goal",
    label: "Add your own goal",
    type: "text",
    placeholder: "Describe your financial goal...",
    maxLength: 200
  }
};

// Helper function to get all goals as flat array
export const getAllGoalIds = () => {
  const ids = [];
  FINANCIAL_GOALS_CONFIG.categories.forEach(category => {
    category.goals.forEach(goal => {
      ids.push(goal.id);
    });
  });
  return ids;
};

// Helper function to get goal label by ID
export const getGoalLabel = (goalId) => {
  for (const category of FINANCIAL_GOALS_CONFIG.categories) {
    const goal = category.goals.find(g => g.id === goalId);
    if (goal) return goal.label;
  }
  return goalId; // Fallback to ID if not found (for custom goals)
};
