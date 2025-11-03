import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function LPIChapter({ token }) {
  const { chapterId } = useParams();
  const navigate = useNavigate();
  const [chapter, setChapter] = useState(null);
  const [currentView, setCurrentView] = useState('lessons'); // 'lessons' or 'quiz'
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchChapter();
  }, [chapterId]);

  const fetchChapter = async () => {
    try {
      const response = await axios.get(`${API}/content/lpi`);
      const found = response.data.chapters.find(ch => ch.id === chapterId);
      setChapter(found);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch chapter:', error);
      setLoading(false);
    }
  };

  const handleQuizAnswer = (questionId, option) => {
    setQuizAnswers({ ...quizAnswers, [questionId]: option });
  };

  const handleSubmitQuiz = async () => {
    setSubmitting(true);
    try {
      const formattedAnswers = Object.entries(quizAnswers).map(([question_id, selected_option]) => ({
        question_id,
        selected_option
      }));

      const response = await axios.post(
        `${API}/lpi/quiz/submit`,
        { chapter_id: chapterId, answers: formattedAnswers },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setQuizResult(response.data);
    } catch (error) {
      console.error('Failed to submit quiz:', error);
      alert('Failed to submit quiz. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleContinue = () => {
    if (quizResult?.passed && quizResult?.next_chapter) {
      navigate(`/chapter/${quizResult.next_chapter}`);
      window.location.reload();
    } else if (chapterId === 'CH10' && quizResult?.passed) {
      navigate('/completed');
    } else {
      navigate('/dashboard');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-navy-900 text-xl">Loading chapter...</div>
      </div>
    );
  }

  if (!chapter) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-navy-900 text-xl">Chapter not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-navy-900 text-white p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold" data-testid="chapter-title">Wealth Builder - {chapter.title}</h1>
          <button 
            onClick={() => navigate('/dashboard')} 
            className="text-gold hover:underline"
            data-testid="back-to-dashboard-btn"
          >
            Back to Dashboard
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-8">
        {!quizResult && currentView === 'lessons' && (
          <div>
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-navy-900 mb-6">Lessons</h2>
              <div className="space-y-6">
                {chapter.lessons.map((lesson, index) => (
                  <div key={lesson.id} className="card" data-testid={`lesson-${index + 1}`}>
                    <h3 className="text-xl font-semibold text-navy-900 mb-3">
                      Lesson {index + 1}
                    </h3>
                    <p className="text-gray-700 text-lg leading-relaxed">{lesson.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-center">
              <button
                onClick={() => setCurrentView('quiz')}
                className="btn-primary"
                data-testid="start-quiz-btn"
              >
                Start Quiz
              </button>
            </div>
          </div>
        )}

        {!quizResult && currentView === 'quiz' && (
          <div>
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-navy-900 mb-2">Quiz</h2>
              <p className="text-gray-600">Answer all questions correctly to unlock the next chapter (50% required to pass)</p>
            </div>

            <div className="space-y-8">
              {chapter.quiz.map((question, index) => (
                <div key={question.id} className="card" data-testid={`quiz-question-${index + 1}`}>
                  <h3 className="text-xl font-semibold text-navy-900 mb-4">
                    Question {index + 1}: {question.text}
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(question.options).map(([key, value]) => (
                      <div
                        key={key}
                        className={`quiz-option ${quizAnswers[question.id] === key ? 'selected' : ''}`}
                        onClick={() => handleQuizAnswer(question.id, key)}
                        data-testid={`quiz-option-${key}`}
                      >
                        <span className="font-semibold text-gold mr-3">{key}.</span>
                        {value}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center gap-4 mt-8">
              <button
                onClick={() => setCurrentView('lessons')}
                className="btn-secondary"
                data-testid="back-to-lessons-btn"
              >
                Back to Lessons
              </button>
              <button
                onClick={handleSubmitQuiz}
                disabled={Object.keys(quizAnswers).length < chapter.quiz.length || submitting}
                className="btn-primary"
                data-testid="submit-quiz-btn"
              >
                {submitting ? 'Submitting...' : 'Submit Quiz'}
              </button>
            </div>
          </div>
        )}

        {quizResult && (
          <div className="card text-center" data-testid="quiz-result">
            <div className="mb-6">
              {quizResult.passed ? (
                <div className="text-6xl mb-4">🎉</div>
              ) : (
                <div className="text-6xl mb-4">💪</div>
              )}
              <h2 className="text-3xl font-bold text-navy-900 mb-2">
                {quizResult.passed ? 'Congratulations!' : 'Keep Learning!'}
              </h2>
              <p className="text-xl text-gray-700 mb-4">
                Your Score: <span className="font-bold text-gold" data-testid="quiz-score">{quizResult.score.toFixed(0)}%</span>
              </p>
              <p className="text-gray-600">
                You got {quizResult.correct_count} out of {quizResult.total_questions} questions correct
              </p>
            </div>

            {quizResult.passed ? (
              <div>
                <p className="text-lg text-navy-900 mb-6">
                  {quizResult.next_chapter ? 'Great job! The next chapter is now unlocked.' : 'You\'ve completed all chapters!'}
                </p>
                <button
                  onClick={handleContinue}
                  className="btn-primary"
                  data-testid="continue-btn"
                >
                  {quizResult.next_chapter ? 'Continue to Next Chapter' : 'Complete Journey'}
                </button>
              </div>
            ) : (
              <div>
                <p className="text-lg text-navy-900 mb-6">
                  You need 50% or higher to unlock the next chapter. Review the lessons and try again!
                </p>
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => { setCurrentView('lessons'); setQuizResult(null); setQuizAnswers({}); }}
                    className="btn-secondary"
                    data-testid="review-lessons-btn"
                  >
                    Review Lessons
                  </button>
                  <button
                    onClick={handleContinue}
                    className="btn-primary"
                    data-testid="back-dashboard-btn"
                  >
                    Back to Dashboard
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default LPIChapter;