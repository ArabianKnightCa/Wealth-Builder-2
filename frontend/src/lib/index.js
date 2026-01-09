/**
 * Wealth Builder Utility Library Index
 * Export all utility modules from a single entry point
 */

// Profile Accuracy
export { 
  getProfileAccuracy, 
  getAccuracyLabel, 
  getNextMilestone,
  ACCURACY_BY_LAYER 
} from './profileAccuracy';

// Stage Detection
export { 
  detectUserStage,
  CATEGORY_GROUPS,
  ALL_VALID_CATEGORIES 
} from './stageDetector';

// Topic Grouping
export { 
  groupTopicsByTheme, 
  getThemeByCategory,
  CATEGORY_TO_THEME 
} from './topicGrouper';

// Timeline Calculator
export { 
  calculateTimeline,
  PACE_MULTIPLIERS 
} from './timelineCalculator';

// Conflict Detection
export { 
  detectConflicts, 
  getNextConflictToShow,
  CONFLICTS 
} from './conflictDetector';

// Topic Search
export { 
  searchTopics, 
  highlightMatches, 
  getSearchSuggestions 
} from './topicSearch';

// Summary Generator
export { 
  generatePostSelectionSummary 
} from './summaryGenerator';
