import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

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
      const [chaptersRes, progressRes] = await Promise.all([
        axios.get(`${API}/content/lpi`),
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
      <nav className="bg-navy-900 text-white p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold" data-testid="dashboard-title">Wealth Builder</h1>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/dashboard')} 
              className="text-gold hover:text-white text-2xl transition-colors"
              title="Help - Return to Dashboard"
              data-testid="help-btn"
            >
              ?
            </button>
            <span data-testid="user-name">Welcome, {user.first_name}!</span>
            <button 
              onClick={() => navigate('/settings')} 
              className="text-gold hover:underline"
              data-testid="settings-btn"
            >
              Settings
            </button>
            <button 
              onClick={onLogout} 
              className="text-gold hover:underline"
              data-testid="logout-btn"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-navy-900 mb-2">Your Learning Path</h2>
          <p className="text-gray-600">Complete each chapter to unlock the next one. Score 50% or higher on quizzes to progress.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {chapters.map((chapter, index) => {
            const chapterProgress = getChapterProgress(chapter.id);
            const isUnlocked = isChapterUnlocked(chapter.id) || index === 0; // Chapter 1 always unlocked
            const isCompleted = chapterProgress?.quiz_score >= 50;

            return (
              <div
                key={chapter.id}
                className={`chapter-card ${!isUnlocked ? 'locked' : ''}`}
                onClick={() => isUnlocked && navigate(`/chapter/${chapter.id}`)}
                data-testid={`chapter-${chapter.id}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-navy-900 mb-2">
                      {chapter.title}
                    </h3>
                    <p className="text-sm text-gray-600">Chapter {index + 1}</p>
                  </div>
                  {isCompleted && <span className="text-2xl">✓</span>}
                  {!isUnlocked && <span className="text-2xl">🔒</span>}
                </div>
                
                {chapterProgress && chapterProgress.quiz_score !== null && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600">Quiz Score: <span className="font-bold text-gold">{chapterProgress.quiz_score.toFixed(0)}%</span></p>
                  </div>
                )}
                
                {!isUnlocked && index !== 0 && (
                  <p className="text-sm text-gray-500 mt-2">Complete previous chapter to unlock</p>
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