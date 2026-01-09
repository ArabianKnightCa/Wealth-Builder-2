/**
 * Stage Detection - PRODUCTION READY
 * Detects user's financial stage from topic selections
 */

const CATEGORY_GROUPS = {
  urgent: ['everyday_money', 'confidence_mindset', 'debt_credit', 'honest_reflections'],
  building: ['saving_planning', 'income_career'],
  advanced: ['investing_wealth', 'big_picture'],
  lifestyle: ['lifestyle_wellbeing', 'family_relationships']
};

const ALL_VALID_CATEGORIES = [
  ...CATEGORY_GROUPS.urgent,
  ...CATEGORY_GROUPS.building,
  ...CATEGORY_GROUPS.advanced,
  ...CATEGORY_GROUPS.lifestyle
];

function validateTopicStructure(topic) {
  if (!topic || typeof topic !== 'object') {
    console.error('Invalid topic structure:', topic);
    return false;
  }
  
  if (!topic.id) {
    console.error('Topic missing ID:', topic);
    return false;
  }
  
  if (!topic.category) {
    console.error('Topic missing category:', topic);
    return false;
  }
  
  if (!ALL_VALID_CATEGORIES.includes(topic.category)) {
    console.error(`Unknown category "${topic.category}" for topic ${topic.id}`);
    return false;
  }
  
  return true;
}

function countCategoryGroups(selectedTopics) {
  const counts = {
    urgent: 0,
    building: 0,
    advanced: 0,
    lifestyle: 0
  };
  
  const validTopics = selectedTopics.filter(validateTopicStructure);
  
  if (validTopics.length < selectedTopics.length) {
    console.warn(`Filtered out ${selectedTopics.length - validTopics.length} invalid topics`);
  }
  
  validTopics.forEach(topic => {
    let categorized = false;
    
    Object.keys(CATEGORY_GROUPS).forEach(groupKey => {
      if (CATEGORY_GROUPS[groupKey].includes(topic.category)) {
        counts[groupKey]++;
        categorized = true;
      }
    });
    
    if (!categorized) {
      console.warn(`Topic ${topic.id} with category ${topic.category} not in any group`);
    }
  });
  
  return counts;
}

export function detectUserStage(selectedTopics) {
  // Handle invalid input
  if (!selectedTopics) {
    console.error('selectedTopics is null/undefined');
    return {
      stage: "error",
      stageLabel: "Error",
      description: "unable to detect stage",
      approach: "Please select at least one topic",
      urgency: "medium",
      recommendedPhases: []
    };
  }
  
  if (!Array.isArray(selectedTopics)) {
    console.error('selectedTopics must be an array, got:', typeof selectedTopics);
    return {
      stage: "error",
      stageLabel: "Error",
      description: "invalid data",
      approach: "Please try again",
      urgency: "medium",
      recommendedPhases: []
    };
  }
  
  if (selectedTopics.length === 0) {
    return {
      stage: "no_selection",
      stageLabel: "Getting Started",
      description: "ready to begin your financial journey",
      approach: "Select topics to get personalized recommendations",
      urgency: "low",
      recommendedPhases: []
    };
  }
  
  const totalTopics = selectedTopics.length;
  const groupCounts = countCategoryGroups(selectedTopics);
  
  // STAGE 1: Crisis/Stabilization
  if (groupCounts.urgent >= 3 && totalTopics >= 4) {
    return {
      stage: "crisis_stabilization",
      stageLabel: "Stabilization Phase",
      description: "dealing with immediate financial challenges and working to create stability",
      approach: "Address urgent needs first, then build foundation for growth",
      urgency: "high",
      recommendedPhases: [
        { name: "Stabilize", groups: ["urgent"] },
        { name: "Build", groups: ["building"] },
        { name: "Grow", groups: ["advanced"] }
      ]
    };
  }
  
  // STAGE 2: Wealth Building Focus
  if (groupCounts.advanced >= 2 && groupCounts.urgent <= 1) {
    return {
      stage: "wealth_building",
      stageLabel: "Wealth Building Phase",
      description: "ready to focus on long-term wealth accumulation and investing",
      approach: "Quick foundation check, then focus on growth strategies",
      urgency: "low",
      recommendedPhases: [
        { name: "Foundation Check", groups: ["urgent"] },
        { name: "Build Wealth", groups: ["advanced", "building"] }
      ]
    };
  }
  
  // STAGE 3: Income Maximization
  if (groupCounts.building >= 3) {
    return {
      stage: "income_maximization",
      stageLabel: "Income Growth Phase",
      description: "focused on increasing your earning power and building income streams",
      approach: "Maximize income first, then put that money to work",
      urgency: "medium",
      recommendedPhases: [
        { name: "Boost Income", groups: ["building"] },
        { name: "Stabilize & Grow", groups: ["urgent", "advanced"] }
      ]
    };
  }
  
  // STAGE 4: Comprehensive Transformation
  if (totalTopics >= 8) {
    return {
      stage: "comprehensive_transformation",
      stageLabel: "Comprehensive Transformation",
      description: "working on multiple aspects of your financial life simultaneously",
      approach: "Prioritize by urgency, then layer in growth strategies",
      urgency: "medium",
      recommendedPhases: [
        { name: "Address Urgent Needs", groups: ["urgent"] },
        { name: "Build Capacity", groups: ["building"] },
        { name: "Grow & Optimize", groups: ["advanced", "lifestyle"] }
      ]
    };
  }
  
  // STAGE 5: Balanced Improvement (Default)
  return {
    stage: "balanced_improvement",
    stageLabel: "Balanced Improvement",
    description: "working on improving your overall financial situation",
    approach: "Start with foundation, progress to growth",
    urgency: "medium",
    recommendedPhases: [
      { name: "Foundation First", groups: ["urgent"] },
      { name: "Growth Second", groups: ["building", "advanced"] }
    ]
  };
}

export { CATEGORY_GROUPS, ALL_VALID_CATEGORIES };
