/**
 * Badge Catalog - 14 Achievement Badges
 * With unlock conditions and metadata
 */

export const BADGE_CATALOG = [
  // ==================== PPI PROGRESS BADGES ====================
  {
    id: "foundation_builder",
    name: "Foundation Builder",
    icon: "🎖️",
    iconType: "emoji",
    description: "Completed Layer 1 of your Personality Profile. You've taken the first step in understanding what drives your financial decisions.",
    unlockCondition: {
      type: "ppi_layer_complete",
      layer: 1
    },
    tierRequired: "free",
    rarity: "common",
    color: "#CD7F32",
    displayOrder: 1,
    category: "ppi_progress"
  },
  {
    id: "profile_seeker",
    name: "Profile Seeker",
    icon: "🧭",
    iconType: "emoji",
    description: "Completed Layer 3 of your Personality Profile. You're committed to understanding yourself at a deeper level.",
    unlockCondition: {
      type: "ppi_layer_complete",
      layer: 3
    },
    tierRequired: "plus",
    rarity: "uncommon",
    color: "#C0C0C0",
    displayOrder: 2,
    category: "ppi_progress"
  },
  {
    id: "deep_diver",
    name: "Deep Diver",
    icon: "🏅",
    iconType: "emoji",
    description: "Completed Layer 5 of your Personality Profile. You're exploring the nuances of your financial personality with impressive depth.",
    unlockCondition: {
      type: "ppi_layer_complete",
      layer: 5
    },
    tierRequired: "pro",
    rarity: "rare",
    color: "#FFD700",
    displayOrder: 3,
    category: "ppi_progress"
  },
  {
    id: "dna_master",
    name: "DNA Master",
    icon: "🏆",
    iconType: "emoji",
    description: "Completed all 7 layers - Full DNA Profile unlocked! You've achieved maximum personality insight and personalization.",
    unlockCondition: {
      type: "ppi_layer_complete",
      layer: 7
    },
    tierRequired: "platinum",
    rarity: "legendary",
    color: "#9333EA",
    displayOrder: 4,
    category: "ppi_progress"
  },

  // ==================== ACHIEVEMENT BADGES ====================
  {
    id: "quick_thinker",
    name: "Quick Thinker",
    icon: "⚡",
    iconType: "emoji",
    description: "Completed a PPI layer in under 5 minutes. You know yourself well and answer with confidence!",
    unlockCondition: {
      type: "ppi_layer_speed",
      maxMinutes: 5
    },
    tierRequired: "free",
    rarity: "common",
    color: "#F59E0B",
    displayOrder: 5,
    category: "achievements"
  },
  {
    id: "hundred_percent",
    name: "100% Complete",
    icon: "💯",
    iconType: "emoji",
    description: "Answered every question in a layer without skipping any. Your commitment to accuracy shows!",
    unlockCondition: {
      type: "ppi_layer_no_skips",
      minAnswered: 30
    },
    tierRequired: "free",
    rarity: "uncommon",
    color: "#10B981",
    displayOrder: 6,
    category: "achievements"
  },
  {
    id: "data_driven",
    name: "Data Driven",
    icon: "📊",
    iconType: "emoji",
    description: "Completed 3+ PPI layers. You're building a comprehensive understanding of your financial personality.",
    unlockCondition: {
      type: "ppi_layers_count",
      minLayers: 3
    },
    tierRequired: "plus",
    rarity: "uncommon",
    color: "#3B82F6",
    displayOrder: 7,
    category: "achievements"
  },
  {
    id: "self_aware",
    name: "Self-Aware",
    icon: "🧠",
    iconType: "emoji",
    description: "Completed 5+ PPI layers. Your self-knowledge is impressive and will guide you well.",
    unlockCondition: {
      type: "ppi_layers_count",
      minLayers: 5
    },
    tierRequired: "pro",
    rarity: "rare",
    color: "#8B5CF6",
    displayOrder: 8,
    category: "achievements"
  },
  {
    id: "honest_contributor",
    name: "Honest Contributor",
    icon: "✨",
    iconType: "emoji",
    description: "Showed thoughtful variation in your responses. Your authenticity makes your profile more accurate.",
    unlockCondition: {
      type: "ppi_response_variance",
      minVariance: 0.5
    },
    tierRequired: "free",
    rarity: "common",
    color: "#EC4899",
    displayOrder: 9,
    category: "achievements"
  },
  {
    id: "reflective",
    name: "Reflective",
    icon: "🤔",
    iconType: "emoji",
    description: "Took time on challenging questions. Your thoughtfulness leads to better insights.",
    unlockCondition: {
      type: "ppi_avg_time_per_question",
      minSeconds: 15
    },
    tierRequired: "free",
    rarity: "common",
    color: "#6366F1",
    displayOrder: 10,
    category: "achievements"
  },

  // ==================== TOPIC COMPLETION BADGES ====================
  {
    id: "topic_starter",
    name: "Topic Starter",
    icon: "🌱",
    iconType: "emoji",
    description: "Completed your first topic! Every journey begins with a single step.",
    unlockCondition: {
      type: "topics_completed_count",
      minTopics: 1
    },
    tierRequired: "free",
    rarity: "common",
    color: "#22C55E",
    displayOrder: 11,
    category: "topic_completion"
  },
  {
    id: "topic_explorer",
    name: "Topic Explorer",
    icon: "🗺️",
    iconType: "emoji",
    description: "Completed 3 different topics. You're building breadth in your financial knowledge.",
    unlockCondition: {
      type: "topics_completed_count",
      minTopics: 3
    },
    tierRequired: "free",
    rarity: "uncommon",
    color: "#14B8A6",
    displayOrder: 12,
    category: "topic_completion"
  },
  {
    id: "topic_champion",
    name: "Topic Champion",
    icon: "⭐",
    iconType: "emoji",
    description: "Completed 5 topics. You're demonstrating real commitment to financial mastery.",
    unlockCondition: {
      type: "topics_completed_count",
      minTopics: 5
    },
    tierRequired: "plus",
    rarity: "rare",
    color: "#F59E0B",
    displayOrder: 13,
    category: "topic_completion"
  },
  {
    id: "learning_machine",
    name: "Learning Machine",
    icon: "🚀",
    iconType: "emoji",
    description: "Completed 10+ topics. You're unstoppable in your pursuit of financial knowledge!",
    unlockCondition: {
      type: "topics_completed_count",
      minTopics: 10
    },
    tierRequired: "pro",
    rarity: "legendary",
    color: "#EF4444",
    displayOrder: 14,
    category: "topic_completion"
  }
];

// Badge category metadata
export const BADGE_CATEGORIES = {
  ppi_progress: {
    id: "ppi_progress",
    name: "Profile Progress",
    description: "Badges earned by completing PPI layers",
    displayOrder: 1
  },
  achievements: {
    id: "achievements",
    name: "Achievements",
    description: "Special accomplishments during your journey",
    displayOrder: 2
  },
  topic_completion: {
    id: "topic_completion",
    name: "Topic Mastery",
    description: "Badges earned by completing topics",
    displayOrder: 3
  }
};

// Unlock condition type descriptions
export const UNLOCK_CONDITION_TYPES = {
  ppi_layer_complete: "User completed specific PPI layer",
  ppi_layer_speed: "User completed layer within time limit",
  ppi_layer_no_skips: "User answered all questions in layer",
  ppi_layers_count: "User completed minimum number of layers",
  ppi_response_variance: "User showed variation in responses (not straight-line)",
  ppi_avg_time_per_question: "Average time per question meets minimum",
  topics_completed_count: "User completed minimum number of topics"
};

// Rarity definitions
export const RARITY_LEVELS = {
  common: {
    id: "common",
    name: "Common",
    color: "#78716C",
    displayOrder: 1
  },
  uncommon: {
    id: "uncommon",
    name: "Uncommon",
    color: "#22C55E",
    displayOrder: 2
  },
  rare: {
    id: "rare",
    name: "Rare",
    color: "#3B82F6",
    displayOrder: 3
  },
  legendary: {
    id: "legendary",
    name: "Legendary",
    color: "#9333EA",
    displayOrder: 4
  }
};

// Helper functions
export function getBadgeById(id) {
  return BADGE_CATALOG.find(badge => badge.id === id) || null;
}

export function getBadgesByCategory(categoryId) {
  return BADGE_CATALOG
    .filter(badge => badge.category === categoryId)
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

export function getBadgesByRarity(rarity) {
  return BADGE_CATALOG.filter(badge => badge.rarity === rarity);
}

export function checkBadgeUnlock(badge, userData) {
  if (!badge || !badge.unlockCondition || !userData) {
    return false;
  }

  const { type } = badge.unlockCondition;

  switch (type) {
    case 'ppi_layer_complete':
      return (userData.completedLayers || 0) >= badge.unlockCondition.layer;
    
    case 'ppi_layer_speed':
      return userData.lastLayerTimeMinutes !== undefined && 
             userData.lastLayerTimeMinutes <= badge.unlockCondition.maxMinutes;
    
    case 'ppi_layer_no_skips':
      return userData.lastLayerAnsweredCount !== undefined &&
             userData.lastLayerAnsweredCount >= badge.unlockCondition.minAnswered;
    
    case 'ppi_layers_count':
      return (userData.completedLayers || 0) >= badge.unlockCondition.minLayers;
    
    case 'ppi_response_variance':
      return userData.responseVariance !== undefined &&
             userData.responseVariance >= badge.unlockCondition.minVariance;
    
    case 'ppi_avg_time_per_question':
      return userData.avgTimePerQuestion !== undefined &&
             userData.avgTimePerQuestion >= badge.unlockCondition.minSeconds;
    
    case 'topics_completed_count':
      return (userData.completedTopics || 0) >= badge.unlockCondition.minTopics;
    
    default:
      console.warn(`Unknown badge unlock condition type: ${type}`);
      return false;
  }
}

export function getUnlockedBadges(userData) {
  return BADGE_CATALOG.filter(badge => checkBadgeUnlock(badge, userData));
}

export function getLockedBadges(userData) {
  return BADGE_CATALOG.filter(badge => !checkBadgeUnlock(badge, userData));
}

export function getNextUnlockableBadges(userData, limit = 3) {
  const locked = getLockedBadges(userData);
  // Sort by how close user is to unlocking
  return locked
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .slice(0, limit);
}
