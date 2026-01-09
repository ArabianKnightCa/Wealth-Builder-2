/**
 * Timeline Calculator - PRODUCTION READY
 * Calculates estimated completion time
 */

const PACE_MULTIPLIERS = {
  high: 1.5,
  medium: 2.0,
  low: 3.0
};

export function calculateTimeline(topicCount, urgency) {
  if (typeof topicCount !== 'number' || topicCount < 0) {
    console.error('Invalid topicCount:', topicCount);
    return {
      estimatedMonths: 0,
      timelineText: "Unable to calculate",
      disclaimer: "Please select at least one topic"
    };
  }
  
  if (topicCount === 0) {
    return {
      estimatedMonths: 0,
      timelineText: "Not started",
      disclaimer: "Select topics to see estimated timeline"
    };
  }
  
  const validUrgencies = ['high', 'medium', 'low'];
  if (!validUrgencies.includes(urgency)) {
    console.warn(`Invalid urgency "${urgency}", defaulting to "medium"`);
    urgency = 'medium';
  }
  
  let baseWeeks = topicCount * 2;
  const paceMultiplier = PACE_MULTIPLIERS[urgency];
  baseWeeks = baseWeeks * paceMultiplier;
  
  const months = Math.ceil(baseWeeks / 4);
  const cappedMonths = Math.min(months, 36);
  
  return {
    estimatedMonths: cappedMonths,
    timelineText: formatTimeEstimate(cappedMonths),
    disclaimer: "Timeline varies by individual situation and pace"
  };
}

function formatTimeEstimate(months) {
  if (months <= 0) return "Less than a month";
  if (months === 1) return "About 1 month";
  if (months <= 2) return "1-2 months";
  if (months <= 3) return "2-3 months";
  if (months <= 6) return "3-6 months";
  if (months <= 12) return `${months - 2}-${months} months`;
  if (months <= 18) return "12-18 months";
  if (months <= 24) return "18-24 months";
  if (months <= 36) return "2-3 years";
  return "3+ years";
}

export { PACE_MULTIPLIERS };
