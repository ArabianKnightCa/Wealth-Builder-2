/**
 * Global Auto-Save Hook
 * 
 * A unified progress saving system that works across all features:
 * - PPI (Personality Profile Inventory)
 * - LPI (Learning Path / Lessons)
 * - Quizzes
 * - Onboarding
 * - Any future feature
 * 
 * Usage:
 * const { saveProgress, loadProgress, clearProgress, hasSavedProgress } = useAutoSave('ppi', token);
 * 
 * // Save progress
 * saveProgress({ answers: [...], current_index: 5 });
 * 
 * // Load saved progress
 * const progress = await loadProgress();
 * if (progress) { ... }
 * 
 * // Clear after completion
 * clearProgress();
 */

import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export function useAutoSave(feature, token) {
  const [hasSavedProgress, setHasSavedProgress] = useState(false);
  const [savedData, setSavedData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load progress on mount
  useEffect(() => {
    if (token && feature) {
      loadProgress();
    }
  }, [token, feature]);

  const saveProgress = useCallback(async (data, metadata = {}) => {
    if (!token || !feature) return;

    try {
      await axios.post(
        `${API}/progress/save`,
        { feature, data, metadata },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setHasSavedProgress(true);
      setSavedData(data);
      return true;
    } catch (error) {
      console.error(`Auto-save failed for ${feature}:`, error);
      return false;
    }
  }, [token, feature]);

  const loadProgress = useCallback(async () => {
    if (!token || !feature) return null;

    setIsLoading(true);
    try {
      const response = await axios.get(
        `${API}/progress/${feature}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.has_progress) {
        setHasSavedProgress(true);
        setSavedData(response.data.progress.data);
        setIsLoading(false);
        return response.data.progress.data;
      }
      
      setHasSavedProgress(false);
      setSavedData(null);
      setIsLoading(false);
      return null;
    } catch (error) {
      console.error(`Failed to load progress for ${feature}:`, error);
      setIsLoading(false);
      return null;
    }
  }, [token, feature]);

  const clearProgress = useCallback(async () => {
    if (!token || !feature) return;

    try {
      await axios.delete(
        `${API}/progress/${feature}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setHasSavedProgress(false);
      setSavedData(null);
      return true;
    } catch (error) {
      console.error(`Failed to clear progress for ${feature}:`, error);
      return false;
    }
  }, [token, feature]);

  return {
    saveProgress,
    loadProgress,
    clearProgress,
    hasSavedProgress,
    savedData,
    isLoading
  };
}

/**
 * Get all saved progress across all features
 * Useful for dashboard to show "Resume" buttons
 */
export async function getAllProgress(token) {
  try {
    const response = await axios.get(
      `${API}/progress`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data.progress;
  } catch (error) {
    console.error('Failed to get all progress:', error);
    return {};
  }
}

export default useAutoSave;
