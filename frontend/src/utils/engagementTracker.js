import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

/**
 * Content Engagement Tracker
 * Tracks detailed lesson engagement metrics
 */
class EngagementTracker {
  constructor() {
    this.currentLesson = null;
    this.startTime = null;
    this.scrollDepth = 0;
    this.hasReachedEnd = false;
  }

  /**
   * Determine age band
   */
  getAgeBand(age) {
    if (age <= 12) return 'child';
    if (age <= 18) return 'teen';
    return 'adult';
  }

  /**
   * Start tracking a lesson
   */
  startLesson(chapterId, lessonId, lessonTitle, userData) {
    const age = userData.age || 18;
    this.currentLesson = {
      chapterId,
      lessonId,
      lessonTitle,
      userId: userData.id,
      profileId: userData.currentProfile?.id,
      age: age,
      ageBand: this.getAgeBand(age),
      experienceLevel: userData.experience_level || 1,
      dnaProfile: userData.dna_profile,
      startedAt: new Date().toISOString(),
      isReread: this.checkIfReread(lessonId)
    };
    
    this.startTime = Date.now();
    this.scrollDepth = 0;
    this.hasReachedEnd = false;

    // Set up scroll tracking
    this.setupScrollTracking();

    // Mark as viewed in localStorage for reread detection
    this.markAsViewed(lessonId);
  }

  /**
   * Track scroll depth
   */
  setupScrollTracking() {
    if (typeof window === 'undefined') return;

    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      
      const scrollPercentage = Math.min(
        100,
        Math.round(((scrollTop + windowHeight) / documentHeight) * 100)
      );

      this.scrollDepth = Math.max(this.scrollDepth, scrollPercentage);

      // Consider "completed" if scrolled to 90%+
      if (scrollPercentage >= 90) {
        this.hasReachedEnd = true;
      }
    };

    window.addEventListener('scroll', handleScroll);
    this.scrollHandler = handleScroll;
  }

  /**
   * End lesson tracking and send data
   */
  async endLesson() {
    if (!this.currentLesson || !this.startTime) return;

    // Calculate time spent
    const timeSpentSeconds = Math.floor((Date.now() - this.startTime) / 1000);

    // Remove scroll listener
    if (this.scrollHandler) {
      window.removeEventListener('scroll', this.scrollHandler);
    }

    // Prepare telemetry data
    const engagementData = {
      ...this.currentLesson,
      completedAt: new Date().toISOString(),
      timeSpentSeconds,
      scrollDepth: this.scrollDepth,
      completed: this.hasReachedEnd,
      wasPersonalized: true // Assuming all content is personalized now
    };

    // Send to backend
    try {
      await axios.post(`${API}/telemetry/lesson-engagement`, engagementData);
      console.log('✓ Lesson engagement tracked:', {
        lesson: this.currentLesson.lessonTitle,
        time: timeSpentSeconds,
        completed: this.hasReachedEnd
      });
    } catch (error) {
      console.error('Failed to track lesson engagement:', error);
    }

    // Reset
    this.currentLesson = null;
    this.startTime = null;
  }

  /**
   * Check if this is a reread
   */
  checkIfReread(lessonId) {
    if (typeof window === 'undefined') return false;
    const viewedLessons = JSON.parse(localStorage.getItem('viewedLessons') || '[]');
    return viewedLessons.includes(lessonId);
  }

  /**
   * Mark lesson as viewed for future reread detection
   */
  markAsViewed(lessonId) {
    if (typeof window === 'undefined') return;
    const viewedLessons = JSON.parse(localStorage.getItem('viewedLessons') || '[]');
    if (!viewedLessons.includes(lessonId)) {
      viewedLessons.push(lessonId);
      localStorage.setItem('viewedLessons', JSON.stringify(viewedLessons));
    }
  }

  /**
   * Quick track without detailed metrics (for backwards compatibility)
   */
  async quickTrack(chapterId, lessonId, lessonTitle, userData, timeSpent = 60) {
    const age = userData.age || 18;
    const engagementData = {
      userId: userData.id,
      profileId: userData.currentProfile?.id,
      chapterId,
      lessonId,
      lessonTitle,
      age: age,
      ageBand: this.getAgeBand(age),
      experienceLevel: userData.experience_level || 1,
      dnaProfile: userData.dna_profile,
      startedAt: new Date(Date.now() - timeSpent * 1000).toISOString(),
      completedAt: new Date().toISOString(),
      timeSpentSeconds: timeSpent,
      scrollDepth: 100,
      completed: true,
      isReread: this.checkIfReread(lessonId),
      wasPersonalized: true
    };

    try {
      await axios.post(`${API}/telemetry/lesson-engagement`, engagementData);
    } catch (error) {
      console.error('Failed to quick track:', error);
    }
  }
}

// Export singleton instance
const engagementTracker = new EngagementTracker();
export default engagementTracker;
