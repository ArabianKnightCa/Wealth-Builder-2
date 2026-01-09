/**
 * Topic Search - PRODUCTION READY
 * Fuzzy search with special character handling
 */

function normalizeText(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '');
}

function calculateRelevance(topic, query) {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return 0;
  
  const normalizedLabel = normalizeText(topic.label || '');
  const normalizedDescription = normalizeText(topic.tooltipDescription || topic.tooltip_description || '');
  
  let score = 0;
  
  if (normalizedLabel === normalizedQuery) {
    score += 100;
  } else if (normalizedLabel.startsWith(normalizedQuery)) {
    score += 80;
  } else if (normalizedLabel.includes(normalizedQuery)) {
    score += 60;
  }
  
  if (normalizedDescription.includes(normalizedQuery)) {
    score += 20;
  }
  
  const queryWords = normalizedQuery.split(' ').filter(w => w.length >= 3);
  const labelWords = normalizedLabel.split(' ');
  
  queryWords.forEach(queryWord => {
    labelWords.forEach(labelWord => {
      if (labelWord.startsWith(queryWord)) {
        score += 10;
      }
    });
  });
  
  return score;
}

export function searchTopics(allTopics, query, options = {}) {
  const {
    minScore = 10,
    maxResults = 50,
    includeDescriptions = true
  } = options;
  
  if (!allTopics || !Array.isArray(allTopics)) {
    console.error('searchTopics: Invalid topics array');
    return [];
  }
  
  if (!query || typeof query !== 'string') {
    console.warn('searchTopics: Invalid query');
    return allTopics.slice(0, maxResults);
  }
  
  const trimmedQuery = query.trim();
  if (trimmedQuery === '') {
    return allTopics.slice(0, maxResults);
  }
  
  const validTopics = allTopics.filter(topic => 
    topic && topic.id && (topic.label || topic.tooltipDescription)
  );
  
  const scoredTopics = validTopics.map(topic => ({
    ...topic,
    relevance: calculateRelevance(topic, trimmedQuery)
  }));
  
  const results = scoredTopics
    .filter(topic => topic.relevance >= minScore)
    .sort((a, b) => {
      if (b.relevance !== a.relevance) {
        return b.relevance - a.relevance;
      }
      return (a.label || '').localeCompare(b.label || '');
    })
    .slice(0, maxResults);
  
  return results;
}

export function highlightMatches(text, query) {
  if (!text || typeof text !== 'string') return '';
  if (!query || typeof query !== 'string') return text;
  
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return text;
  
  const escapedQuery = trimmedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  try {
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  } catch (error) {
    console.error('highlightMatches: Regex error', error);
    return text;
  }
}

export function getSearchSuggestions(allTopics, partialQuery) {
  if (!partialQuery || typeof partialQuery !== 'string' || partialQuery.length < 2) {
    return [];
  }
  
  return searchTopics(allTopics, partialQuery, {
    minScore: 30,
    maxResults: 5
  });
}
