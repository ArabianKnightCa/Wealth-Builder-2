import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import BadgeDisplay from '../components/BadgeDisplay';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function Dashboard({ user, token, onLogout }) {
  const navigate = useNavigate();
  const [chapters, setChapters] = useState([]);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Check if PPI is completed first
      const progressCheck = await axios.get(`${API}/progress`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // If PPI not completed, allow dashboard but show message
      // User can navigate to PPI via ? button if needed
      const [chaptersRes, progressRes] = await Promise.all([
        axios.get(`${API}/content/lpi`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/lpi/progress`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setChapters(chaptersRes.data.chapters);
      setProgress(progressRes.data.progress);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getChapterProgress = (chapterId) => {
    return progress.find(p => p.chapter_id === chapterId);
  };

  const isChapterUnlocked = (chapterId) => {
    return progress.some(p => p.chapter_id === chapterId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-navy-900 text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progress HUD */}
      <div className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Overall Progress */}
            <div>
              <p className="text-sm text-gray-600 mb-2">Overall Progress</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${(progress.filter(p => p.quiz_completed_at).length / chapters.length) * 100}%` }}
                    data-testid="overall-progress-bar"
                  ></div>
                </div>
                <span className="text-sm font-semibold text-navy-900">
                  {progress.filter(p => p.quiz_completed_at).length} / {chapters.length} Chapters
                </span>
              </div>
            </div>

            {/* Average Quiz Score */}
            <div>
              <p className="text-sm text-gray-600 mb-2">Average Quiz Score</p>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-gold" data-testid="average-score">
                  {progress.filter(p => p.quiz_score !== null && p.quiz_score !== undefined).length > 0
                    ? Math.round(
                        progress.filter(p => p.quiz_score !== null && p.quiz_score !== undefined)
                          .reduce((sum, p) => sum + p.quiz_score, 0) / 
                        progress.filter(p => p.quiz_score !== null && p.quiz_score !== undefined).length
                      )
                    : 0}%
                </span>
                <span className="text-sm text-gray-600">
                  across {progress.filter(p => p.quiz_score !== null && p.quiz_score !== undefined).length} completed quizzes
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-navy-900 mb-2">Your Learning Path</h2>
          <p className="text-gray-600">Complete each chapter's quiz to unlock the next one.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {chapters.map((chapter, index) => {
            const chapterProgress = getChapterProgress(chapter.id);
            const isCompleted = chapterProgress?.quiz_score >= 50;
            const isUnlocked = isChapterUnlocked(chapter.id);

            return (
              <div
                key={chapter.id}
                className={`chapter-card ${!isUnlocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => isUnlocked && navigate(`/chapter/${chapter.id}`)}
                data-testid={`chapter-${chapter.id}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm text-gold font-semibold mb-1">Chapter {index + 1}</p>
                    <h3 className="text-xl font-bold text-navy-900">
                      {chapter.title}
                    </h3>
                  </div>
                  {isCompleted && <span className="text-2xl">✓</span>}
                  {!isUnlocked && <span className="text-xl">🔒</span>}
                </div>
                
                {chapterProgress && chapterProgress.quiz_score !== null && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600">Quiz Score: <span className="font-bold text-gold">{chapterProgress.quiz_score.toFixed(0)}%</span></p>
                  </div>
                )}
                
                {!isUnlocked && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-500">Complete previous chapter to unlock</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;