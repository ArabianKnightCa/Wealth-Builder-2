/**
 * Post-Selection Summary Generator - PRODUCTION READY
 * Orchestrates all logic for summary screen
 */

import { detectUserStage } from './stageDetector';
import { groupTopicsByTheme } from './topicGrouper';
import { calculateTimeline } from './timelineCalculator';

export function generatePostSelectionSummary(selectedTopics) {
  // Validate input
  if (!selectedTopics || !Array.isArray(selectedTopics) || selectedTopics.length === 0) {
    console.error('generatePostSelectionSummary: Invalid input');
    return createFallbackSummary();
  }
  
  try {
    // Step 1: Detect stage
    const stageInfo = detectUserStage(selectedTopics);
    
    // Step 2: Group topics by theme
    const groupedThemes = groupTopicsByTheme(selectedTopics);
    
    // Step 3: Calculate timeline
    const timeline = calculateTimeline(selectedTopics.length, stageInfo.urgency);
    
    // Step 4: Generate sequence explanation
    const sequenceExplanation = generateSequenceExplanation(stageInfo, groupedThemes);
    
    // Step 5: Generate next steps
    const nextSteps = generateNextSteps(stageInfo, selectedTopics.length);
    
    return {
      success: true,
      topicCount: selectedTopics.length,
      stage: stageInfo,
      groupedThemes: groupedThemes,
      timeline: timeline,
      sequenceExplanation: sequenceExplanation,
      nextSteps: nextSteps
    };
    
  } catch (error) {
    console.error('Error generating summary:', error);
    return {
      success: false,
      error: error.message,
      fallback: createFallbackSummary()
    };
  }
}

function generateSequenceExplanation(stageInfo, themes) {
  const explanation = {
    introduction: `Based on what you selected, you're ${stageInfo.description}.`,
    reasoning: [stageInfo.approach],
    phases: []
  };
  
  if (stageInfo.recommendedPhases && stageInfo.recommendedPhases.length > 0) {
    stageInfo.recommendedPhases.forEach((phase, index) => {
      let reason = '';
      
      switch (index) {
        case 0:
          reason = `We'll start with ${phase.name.toLowerCase()} because these topics address your most immediate needs.`;
          break;
        case 1:
          reason = `Next, we'll move to ${phase.name.toLowerCase()} to build on your stable foundation.`;
          break;
        case 2:
          reason = `Finally, ${phase.name.toLowerCase()} to optimize and scale your financial life.`;
          break;
        default:
          reason = `Then ${phase.name.toLowerCase()} to continue your progress.`;
      }
      
      explanation.phases.push({
        name: phase.name,
        reason: reason
      });
    });
  }
  
  return explanation;
}

function generateNextSteps(stageInfo, topicCount) {
  const nextSteps = [];
  
  if (stageInfo.urgency === "high") {
    nextSteps.push({
      action: "Start with your first lesson today",
      reason: "You've identified urgent financial challenges—momentum matters"
    });
  }
  
  if (topicCount >= 8) {
    nextSteps.push({
      action: "Focus on one theme at a time",
      reason: "You're ambitious, but depth beats breadth in financial learning"
    });
  }
  
  nextSteps.push({
    action: "Check your progress weekly",
    reason: "Visit Settings → My Topics to see how far you've come"
  });
  
  return nextSteps;
}

function createFallbackSummary() {
  return {
    topicCount: 0,
    stage: {
      stage: "unknown",
      stageLabel: "Getting Started",
      description: "ready to begin your financial journey",
      approach: "We'll help you explore your selected topics",
      urgency: "medium"
    },
    groupedThemes: [],
    timeline: {
      estimatedMonths: 6,
      timelineText: "3-6 months",
      disclaimer: "Timeline varies by individual situation"
    },
    sequenceExplanation: {
      introduction: "Let's start your financial learning journey.",
      reasoning: ["We'll guide you through your topics step by step."],
      phases: []
    },
    nextSteps: [
      {
        action: "Select your topics",
        reason: "Tell us what you want to learn"
      }
    ]
  };
}
