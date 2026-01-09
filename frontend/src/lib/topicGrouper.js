/**
 * Theme Grouping - PRODUCTION READY
 * Groups topics by theme for post-selection summary
 */

const CATEGORY_TO_THEME = {
  everyday_money: {
    themeName: "Financial Foundation",
    themeSlug: "foundation",
    priority: 1,
    description: "Building organizational systems and safety nets that create stability and reduce financial stress."
  },
  confidence_mindset: {
    themeName: "Mindset & Confidence",
    themeSlug: "mindset",
    priority: 2,
    description: "Addressing psychological barriers and beliefs that have held you back."
  },
  debt_credit: {
    themeName: "Debt Management",
    themeSlug: "debt",
    priority: 3,
    description: "Learning strategic approaches to tackle debt and rebuild credit."
  },
  saving_planning: {
    themeName: "Saving & Planning",
    themeSlug: "saving",
    priority: 4,
    description: "Building safety nets and creating plans for major life events."
  },
  income_career: {
    themeName: "Income Growth",
    themeSlug: "income",
    priority: 5,
    description: "Exploring strategies to increase earning power."
  },
  investing_wealth: {
    themeName: "Wealth Building",
    themeSlug: "wealth",
    priority: 6,
    description: "Understanding investing and creating systems for long-term wealth."
  },
  lifestyle_wellbeing: {
    themeName: "Lifestyle & Quality of Life",
    themeSlug: "lifestyle",
    priority: 7,
    description: "Learning to enjoy money guilt-free while maintaining financial health."
  },
  family_relationships: {
    themeName: "Family & Relationships",
    themeSlug: "family",
    priority: 8,
    description: "Navigating money conversations and planning for family's future."
  },
  big_picture: {
    themeName: "Big Picture Vision",
    themeSlug: "vision",
    priority: 9,
    description: "Working toward major life goals like retirement and financial independence."
  },
  honest_reflections: {
    themeName: "Personal Growth",
    themeSlug: "growth",
    priority: 10,
    description: "Recovering from past mistakes and building stability."
  }
};

export function groupTopicsByTheme(selectedTopics) {
  if (!selectedTopics || !Array.isArray(selectedTopics)) {
    console.error('groupTopicsByTheme: Invalid input');
    return [];
  }
  
  if (selectedTopics.length === 0) {
    return [];
  }
  
  const themeMap = {};
  const orphanedTopics = [];
  
  selectedTopics.forEach(topic => {
    if (!topic || !topic.id || !topic.category) {
      console.warn('Invalid topic structure, skipping:', topic);
      return;
    }
    
    const themeInfo = CATEGORY_TO_THEME[topic.category];
    
    if (!themeInfo) {
      console.warn(`No theme mapping found for category: ${topic.category}, topic: ${topic.id}`);
      orphanedTopics.push(topic);
      return;
    }
    
    const themeSlug = themeInfo.themeSlug;
    
    if (!themeMap[themeSlug]) {
      themeMap[themeSlug] = {
        slug: themeSlug,
        name: themeInfo.themeName,
        description: themeInfo.description,
        priority: themeInfo.priority,
        topics: []
      };
    }
    
    themeMap[themeSlug].topics.push({
      id: topic.id,
      label: topic.label || topic.id,
      category: topic.category
    });
  });
  
  // Handle orphaned topics
  if (orphanedTopics.length > 0) {
    console.warn(`${orphanedTopics.length} topics have unknown categories:`, orphanedTopics.map(t => t.id));
    
    themeMap['other'] = {
      slug: 'other',
      name: 'Other Topics',
      description: 'Topics that need categorization.',
      priority: 99,
      topics: orphanedTopics.map(topic => ({
        id: topic.id,
        label: topic.label || topic.id,
        category: topic.category
      }))
    };
  }
  
  return Object.values(themeMap).sort((a, b) => a.priority - b.priority);
}

export function getThemeByCategory(categorySlug) {
  if (!categorySlug || typeof categorySlug !== 'string') {
    console.error('getThemeByCategory: Invalid category slug');
    return null;
  }
  
  return CATEGORY_TO_THEME[categorySlug] || null;
}

export { CATEGORY_TO_THEME };
