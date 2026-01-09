/**
 * Conflict Detection - PRODUCTION READY
 * Detects contradictory topic selections
 */

const CONFLICTS = {
  DEBT_VS_SPENDING: 'debt_vs_spending',
  INCOME_OVERLOAD: 'income_overload',
  LIFESTYLE_VS_WEALTH: 'lifestyle_vs_wealth',
  REDUNDANT_DEBT: 'redundant_debt'
};

export function detectConflicts(selectedTopics) {
  if (!selectedTopics || !Array.isArray(selectedTopics) || selectedTopics.length === 0) {
    return [];
  }
  
  const validTopics = selectedTopics.filter(topic => 
    topic && topic.id && topic.category
  );
  
  if (validTopics.length === 0) {
    console.warn('No valid topics to check for conflicts');
    return [];
  }
  
  const conflicts = [];
  
  if (checkDebtVsSpending(validTopics)) {
    conflicts.push({
      type: CONFLICTS.DEBT_VS_SPENDING,
      priority: 1,
      title: "Debt vs. Discretionary Spending",
      message: "You've selected debt management topics AND discretionary spending goals. While both are valid, focusing on debt first typically accelerates your overall progress.",
      recommendation: "Consider prioritizing debt reduction before travel or major purchases.",
      affectedTopics: getAffectedTopics(validTopics, ['debt_credit'], ['lifestyle_wellbeing_travel', 'saving_planning_purchase'])
    });
  }
  
  if (checkIncomeOverload(validTopics)) {
    conflicts.push({
      type: CONFLICTS.INCOME_OVERLOAD,
      priority: 2,
      title: "Income Topic Overload",
      message: "You've selected 4+ income-related topics. This might spread your focus too thin.",
      recommendation: "Consider focusing on 1-2 income strategies first, then expanding.",
      affectedTopics: getAffectedTopics(validTopics, ['income_career'], [])
    });
  }
  
  if (checkLifestyleVsWealth(validTopics)) {
    conflicts.push({
      type: CONFLICTS.LIFESTYLE_VS_WEALTH,
      priority: 3,
      title: "Lifestyle Upgrade vs. Wealth Building",
      message: "Lifestyle upgrades and aggressive wealth building can compete for the same dollars.",
      recommendation: "Define clear boundaries for each goal to avoid conflict.",
      affectedTopics: getAffectedTopics(validTopics, [], ['lifestyle_wellbeing_upgrade', 'investing_wealth_building', 'family_relationships_generational'])
    });
  }
  
  if (checkRedundantDebt(validTopics)) {
    conflicts.push({
      type: CONFLICTS.REDUNDANT_DEBT,
      priority: 4,
      title: "Multiple Debt Topics",
      message: "You've selected 4+ debt-related topics. These often overlap significantly.",
      recommendation: "The 'overwhelmed by debt' topic covers most debt strategies comprehensively.",
      affectedTopics: getAffectedTopics(validTopics, ['debt_credit'], [])
    });
  }
  
  return conflicts.sort((a, b) => a.priority - b.priority);
}

function checkDebtVsSpending(topics) {
  const hasDebt = topics.some(t => t.category === 'debt_credit');
  const hasDiscretionary = topics.some(t => 
    t.id === 'lifestyle_wellbeing_travel' || 
    t.id === 'saving_planning_purchase' ||
    t.id === 'lifestyle_wellbeing_upgrade' ||
    t.id === 'lifestyle_wellbeing_treat'
  );
  return hasDebt && hasDiscretionary;
}

function checkIncomeOverload(topics) {
  const incomeTopics = topics.filter(t => t.category === 'income_career');
  const uniqueIncomeTopics = new Set(incomeTopics.map(t => t.id));
  return uniqueIncomeTopics.size >= 4;
}

function checkLifestyleVsWealth(topics) {
  const hasLifestyleUpgrade = topics.some(t => 
    t.id === 'lifestyle_wellbeing_upgrade'
  );
  const hasWealthBuilding = topics.some(t => 
    t.id === 'investing_wealth_building' || 
    t.id === 'family_relationships_generational' ||
    t.id === 'big_picture_wealth'
  );
  return hasLifestyleUpgrade && hasWealthBuilding;
}

function checkRedundantDebt(topics) {
  const debtTopics = topics.filter(t => t.category === 'debt_credit');
  const uniqueDebtTopics = new Set(debtTopics.map(t => t.id));
  return uniqueDebtTopics.size >= 4;
}

function getAffectedTopics(topics, categories, specificIds) {
  const affected = [];
  
  categories.forEach(cat => {
    const categoryTopics = topics.filter(t => t.category === cat);
    affected.push(...categoryTopics);
  });
  
  specificIds.forEach(id => {
    const specificTopic = topics.find(t => t.id === id);
    if (specificTopic) {
      affected.push(specificTopic);
    }
  });
  
  return [...new Map(affected.map(t => [t.id, t])).values()];
}

export function getNextConflictToShow(selectedTopics, resolvedConflicts = []) {
  const allConflicts = detectConflicts(selectedTopics);
  const unresolvedConflicts = allConflicts.filter(conflict => 
    !resolvedConflicts.includes(conflict.type)
  );
  return unresolvedConflicts.length > 0 ? unresolvedConflicts[0] : null;
}

export { CONFLICTS };
