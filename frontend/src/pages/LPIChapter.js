import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function LPIChapter({ token }) {
  const { chapterId } = useParams();
  const navigate = useNavigate();
  const [chapter, setChapter] = useState(null);
  const [currentView, setCurrentView] = useState('lesson'); // 'lesson', 'takeaway', or 'quiz'
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
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

      // Store quiz result with detailed breakdown
      const result = response.data;
      const detailedResult = {
        ...result,
        userAnswers: quizAnswers,
        questions: chapter.quiz
      };
      
      setQuizResult(detailedResult);
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
          <div>
            <p className="text-gold text-sm font-semibold mb-1">Chapter {chapterId.replace('CH', '').replace(/^0+/, '')}</p>
            <h1 className="text-2xl font-bold" data-testid="chapter-title">
              {chapter.title}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/dashboard')} 
              className="text-gold hover:text-white text-2xl font-bold transition-colors"
              title="Help - Return to Dashboard"
              data-testid="help-btn"
            >
              ?
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-8">
        {!quizResult && currentView === 'lesson' && (
          <div>
            <div className="mb-6">
              <p className="text-sm text-gray-500 mb-2">
                Lesson {currentLessonIndex + 1} of {chapter.lessons.length}
              </p>
              <div className="progress-bar mb-4">
                <div 
                  className="progress-fill" 
                  style={{ width: `${((currentLessonIndex + 1) / chapter.lessons.length) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="card" data-testid={`lesson-${currentLessonIndex + 1}`}>
              <h2 className="text-3xl font-bold text-navy-900 mb-6">
                {chapter.lessons[currentLessonIndex].title}
              </h2>
              <p className="text-gray-700 text-lg leading-relaxed">
                {chapter.lessons[currentLessonIndex].text}
              </p>
            </div>

            <div className="flex justify-between mt-8">
              <button
                onClick={() => {
                  if (currentLessonIndex > 0) {
                    setCurrentLessonIndex(currentLessonIndex - 1);
                  }
                }}
                disabled={currentLessonIndex === 0}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  currentLessonIndex === 0 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-gold text-navy-900 hover:bg-gold-dark'
                }`}
                data-testid="prev-lesson-btn"
              >
                ← Go Back
              </button>
              <button
                onClick={() => {
                  if (currentLessonIndex < chapter.lessons.length - 1) {
                    setCurrentLessonIndex(currentLessonIndex + 1);
                  } else {
                    setCurrentView('takeaway');
                  }
                }}
                className="btn-primary"
                data-testid="next-lesson-btn"
              >
                {currentLessonIndex === chapter.lessons.length - 1 ? 'Continue to Summary →' : 'Next →'}
              </button>
            </div>
          </div>
        )}

        {!quizResult && currentView === 'takeaway' && (
          <div>
            <div className="card text-center bg-gradient-to-br from-gold/10 to-yellow-50">
              <div className="text-6xl mb-6">📝</div>
              <h2 className="text-3xl font-bold text-navy-900 mb-6">Chapter Summary</h2>
              <div className="text-left bg-white p-6 rounded-lg border-l-4 border-gold">
                <div className="flex items-start gap-3 mb-4">
                  <span className="text-2xl">💡</span>
                  <p className="text-sm font-semibold text-gold uppercase tracking-wide">Key Takeaway</p>
                </div>
                <p className="text-lg text-gray-700 leading-relaxed">
                  {chapter.lessons.map((lesson, idx) => lesson.takeaway).join(' ')}
                </p>
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <button
                onClick={() => {
                  setCurrentView('lesson');
                  setCurrentLessonIndex(chapter.lessons.length - 1);
                }}
                className="px-6 py-3 border-2 border-navy-900 text-navy-900 rounded-lg font-semibold hover:bg-navy-900 hover:text-white transition-all"
                data-testid="back-btn"
              >
                ← Go Back
              </button>
              <button
                onClick={() => setCurrentView('quiz')}
                className="btn-primary"
                data-testid="start-quiz-btn"
              >
                Start Quiz →
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

            <div className="flex justify-between gap-4 mt-8">
              <button
                onClick={() => setCurrentView('takeaway')}
                className="btn-secondary"
                data-testid="back-to-summary-btn"
              >
                ← Go Back
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
          <div>
            {/* Score Summary */}
            <div className="card text-center mb-8" data-testid="quiz-result">
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
            </div>

            {/* Detailed Results */}
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-navy-900 mb-4">Quiz Review</h3>
              <div className="space-y-6">
                {quizResult.questions.map((question, idx) => {
                  const userAnswer = quizResult.userAnswers[question.id];
                  const isCorrect = userAnswer === question.correct;
                  
                  return (
                    <div key={question.id} className={`card border-l-4 ${isCorrect ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
                      <div className="flex items-start gap-3 mb-4">
                        <span className={`text-2xl ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                          {isCorrect ? '✓' : '✗'}
                        </span>
                        <div className="flex-1">
                          <h4 className="font-bold text-navy-900 mb-3">
                            Question {idx + 1}: {question.text}
                          </h4>

                          {/* Show all options with highlighting */}
                          <div className="space-y-2 mb-4">
                            {Object.entries(question.options).map(([key, value]) => {
                              const isUserAnswer = userAnswer === key;
                              const isCorrectAnswer = question.correct === key;
                              
                              let bgColor = 'bg-white';
                              let borderColor = 'border-gray-200';
                              let textColor = 'text-gray-700';
                              
                              if (isCorrectAnswer) {
                                bgColor = 'bg-green-100';
                                borderColor = 'border-green-500';
                                textColor = 'text-green-900';
                              }
                              
                              if (isUserAnswer && !isCorrect) {
                                bgColor = 'bg-red-100';
                                borderColor = 'border-red-500';
                                textColor = 'text-red-900';
                              }
                              
                              return (
                                <div 
                                  key={key} 
                                  className={`p-3 rounded border-2 ${borderColor} ${bgColor}`}
                                >
                                  <span className={`font-semibold ${textColor}`}>{key}.</span> 
                                  <span className={textColor}> {value}</span>
                                  {isCorrectAnswer && (
                                    <span className="ml-2 text-green-600 font-bold">✓ Correct Answer</span>
                                  )}
                                  {isUserAnswer && !isCorrect && (
                                    <span className="ml-2 text-red-600 font-bold">✗ Your Answer</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Explanation - ONLY for incorrect answers */}
                          {!isCorrect && (
                            <div className="p-4 rounded bg-yellow-50 border-l-4 border-yellow-500">
                              <p className="font-semibold text-navy-900 mb-2">
                                Why this is incorrect:
                              </p>
                              <p className="text-gray-700">{question.rationale}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {quizResult.passed ? (
                <>
                  {quizResult.next_chapter && (
                    <button
                      onClick={handleContinue}
                      className="btn-primary"
                      data-testid="continue-btn"
                    >
                      Continue to Next Chapter →
                    </button>
                  )}
                  {!quizResult.next_chapter && (
                    <button
                      onClick={handleContinue}
                      className="btn-primary"
                      data-testid="complete-btn"
                    >
                      Complete Journey 🎉
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button
                    onClick={() => { 
                      setCurrentView('lesson'); 
                      setCurrentLessonIndex(0);
                      setQuizResult(null); 
                      setQuizAnswers({}); 
                    }}
                    className="btn-secondary"
                    data-testid="review-lessons-btn"
                  >
                    ← Review Lessons
                  </button>
                  <button
                    onClick={() => {
                      setQuizResult(null);
                      setQuizAnswers({});
                      setCurrentView('quiz');
                    }}
                    className="btn-primary"
                    data-testid="retake-quiz-btn"
                  >
                    Retake Quiz
                  </button>
                </>
              )}
              <button
                onClick={handleContinue}
                className="btn-secondary"
                data-testid="back-dashboard-btn"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default LPIChapter;