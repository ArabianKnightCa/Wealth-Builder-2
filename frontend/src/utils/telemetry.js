import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

/**
 * Telemetry utility for tracking user events
 */
class TelemetryService {
  constructor() {
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = null;
  }

  generateSessionId() {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log user session start
   */
  async logSessionStart(userId, userTier = 'free', deviceType = 'web', appVersion = '1.0.0') {
    try {
      this.sessionStartTime = new Date().toISOString();
      
      await axios.post(`${API}/telemetry/session`, {
        userId,
        sessionId: this.sessionId,
        sessionStart: this.sessionStartTime,
        sessionEnd: null,
        deviceType,
        userTier,
        appVersion
      });
      
      console.log('✅ Session started:', this.sessionId);
    } catch (error) {
      console.error('Failed to log session start:', error);
    }
  }

  /**
   * Log user session end
   */
  async logSessionEnd(userId, userTier = 'free', deviceType = 'web', appVersion = '1.0.0') {
    try {
      const sessionEnd = new Date().toISOString();
      
      await axios.post(`${API}/telemetry/session`, {
        userId,
        sessionId: this.sessionId,
        sessionStart: this.sessionStartTime || sessionEnd,
        sessionEnd,
        deviceType,
        userTier,
        appVersion
      });
      
      console.log('✅ Session ended:', this.sessionId);
    } catch (error) {
      console.error('Failed to log session end:', error);
    }
  }

  /**
   * Log onboarding step completion
   */
  async logOnboardingStep(userId, stepName, completed = true, userTier = 'free') {
    try {
      await axios.post(`${API}/telemetry/onboarding`, {
        userId,
        stepName,
        completed,
        timestamp: new Date().toISOString(),
        userTier
      });
      
      console.log(`✅ Onboarding step logged: ${stepName}`);
    } catch (error) {
      console.error('Failed to log onboarding step:', error);
    }
  }

  /**
   * Log PPI completion
   */
  async logPPICompletion(userId, ppiVersion = 'v1', ppiCategorySummary = null, userTier = 'free') {
    try {
      await axios.post(`${API}/telemetry/ppi-completed`, {
        userId,
        ppiVersion,
        ppiCategorySummary,
        timestamp: new Date().toISOString(),
        userTier
      });
      
      console.log('✅ PPI completion logged');
    } catch (error) {
      console.error('Failed to log PPI completion:', error);
    }
  }

  /**
   * Log topic completion
   */
  async logTopicCompletion(
    userId,
    topicId,
    chapterId,
    difficultyTier,
    timeSpentSeconds,
    accuracy,
    retries = 0,
    userTier = 'free',
    householdId = null
  ) {
    try {
      await axios.post(`${API}/telemetry/topic-completed`, {
        userId,
        topicId,
        chapterId,
        difficultyTier,
        timeSpentSeconds,
        accuracy,
        retries,
        timestamp: new Date().toISOString(),
        userTier,
        householdId
      });
      
      console.log(`✅ Topic completion logged: ${chapterId}`);
    } catch (error) {
      console.error('Failed to log topic completion:', error);
    }
  }

  /**
   * Log quiz attempt
   */
  async logQuizAttempt(
    userId,
    quizId,
    topicId,
    chapterId,
    score,
    maxScore,
    accuracy,
    timeSpentSeconds,
    userTier = 'free',
    householdId = null
  ) {
    try {
      await axios.post(`${API}/telemetry/quiz-attempt`, {
        userId,
        quizId,
        topicId,
        chapterId,
        score,
        maxScore,
        accuracy,
        timeSpentSeconds,
        timestamp: new Date().toISOString(),
        userTier,
        householdId
      });
      
      console.log(`✅ Quiz attempt logged: ${quizId}`);
    } catch (error) {
      console.error('Failed to log quiz attempt:', error);
    }
  }

  /**
   * Log subscription change
   */
  async logSubscriptionChange(
    userId,
    toTier,
    fromTier = null,
    householdId = null,
    householdSize = null
  ) {
    try {
      await axios.post(`${API}/telemetry/subscription-change`, {
        userId,
        fromTier,
        toTier,
        timestamp: new Date().toISOString(),
        householdId,
        householdSize
      });
      
      console.log(`✅ Subscription change logged: ${fromTier} -> ${toTier}`);
    } catch (error) {
      console.error('Failed to log subscription change:', error);
    }
  }
}

// Create a singleton instance
const telemetryService = new TelemetryService();

export default telemetryService;
