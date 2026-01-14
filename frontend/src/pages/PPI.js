import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import telemetryService from '../utils/telemetry';
import useAutoSave from '../hooks/useAutoSave';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

/**
 * PPI LAYER ACCESS RULES:
 * -----------------------
 * Layer 1 (L1): ALWAYS FREE - Never locked, no paywall, no restrictions
 * Layers 2-7: May require subscription/payment in future phases
 * 
 * This ensures all users can complete their baseline personality profile.
 */
const PPI_ACCESS_RULES = {
  LAYER_1_ALWAYS_FREE: true,
  FREE_LAYERS: [1],
  PAID_LAYERS: [2, 3, 4, 5, 6, 7]
};

// Likert scale component
const LikertScale = ({ options, selectedValue, onSelect, questionId }) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between text-sm text-gray-500 mb-2">
        <span>{options[0]}</span>
        <span>{options[options.length - 1]}</span>
      </div>
      <div className="flex justify-between gap-2">
        {options.map((label, index) => {
          const value = index + 1; // 1-5 scale
          const isSelected = selectedValue === value;
          return (
            <button
              key={index}
              onClick={() => onSelect(questionId, value)}
              className={`flex-1 py-4 px-2 rounded-lg border-2 transition-all text-center ${
                isSelected
                  ? 'bg-gold border-gold text-navy-900 font-bold shadow-lg scale-105'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-gold hover:bg-yellow-50'
              }`}
              data-testid={`likert-${index + 1}`}
            >
              <div className="text-2xl mb-1">{value}</div>
              <div className="text-xs hidden sm:block">{label}</div>
            </button>
          );
        })}
      </div>
      <div className="text-center text-sm text-gray-400 mt-2">
        1 = {options[0]} &nbsp;|&nbsp; 5 = {options[options.length - 1]}
      </div>
    </div>
  );
};

function PPI({ token, user, onPPIComplete }) {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  
  // Use global auto-save hook
  const { saveProgress, loadProgress, clearProgress, hasSavedProgress } = useAutoSave('ppi', token);

  useEffect(() => {
    fetchQuestions();
    restoreProgress();
  }, []);

  const restoreProgress = async () => {
    const saved = await loadProgress();
    if (saved && saved.answers) {
      // Restore answers from saved progress
      const restoredAnswers = {};
      saved.answers.forEach(ans => {
        const qNum = parseInt(ans.question_id.replace('PPI_Q', ''));
        restoredAnswers[qNum] = ans.selected_option;
      });
      setAnswers(restoredAnswers);
      setCurrentIndex(saved.current_index || 0);
      console.log('Restored PPI progress:', saved.answers.length, 'answers');
    }
  };

  const autoSave = async (newAnswers, newIndex) => {
    // Format answers for auto-save
    const formattedAnswers = Object.entries(newAnswers).map(([question_id, selected_option]) => {
      const question = questions.find(q => q.id === parseInt(question_id));
      return {
        question_id: question?.questionId || `PPI_Q${question_id.toString().padStart(2, '0')}`,
        selected_option: selected_option.toString(),
        question_type: question?.type || 'mcq',
        via_trait: question?.viaTrait,
        weight: question?.weight
      };
    });

    // Use global save
    await saveProgress({ answers: formattedAnswers, current_index: newIndex, total_questions: 30 });
  };

  const fetchQuestions = async () => {
    try {
      // Use personalized PPI endpoint that adapts to user age/experience
      const response = await axios.get(`${API}/content/ppi/personalized`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Handle new VIA-based response format with Likert + MCQ
      if (response.data.items) {
        const questions = response.data.items.map((item, index) => {
          const questionType = item.type || 'mcq';
          
          if (questionType === 'likert') {
            // Likert scale question
            return {
              id: index + 1,
              questionId: item.question_id,
              type: 'likert',
              text: item.prompt,
              options: item.options, // Array: ["Strongly Disagree", ..., "Strongly Agree"]
              viaTrait: item.via_trait,
              weight: item.weight
            };
          } else {
            // Multiple choice question
            const options = {};
            item.options.forEach(opt => {
              const letter = opt.charAt(0); // Extract "A", "B", etc.
              const text = opt.substring(2); // Extract text after "A "
              options[letter] = text;
            });
            return {
              id: index + 1,
              questionId: item.question_id,
              type: 'mcq',
              text: item.prompt,
              options: options,
              viaTrait: item.via_trait,
              weight: item.weight
            };
          }
        });
        setQuestions(questions);
      } else {
        // Fallback to legacy format
        setQuestions(response.data.questions || []);
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch questions:', error);
      setLoading(false);
    }
  };

  const handleAnswer = (questionId, option) => {
    const newAnswers = { ...answers, [questionId]: option };
    setAnswers(newAnswers);
    // Auto-save after each answer
    autoSave(newAnswers, currentIndex);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      // Auto-save progress
      autoSave(answers, newIndex);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Format answers for both Likert and MCQ
      const formattedAnswers = Object.entries(answers).map(([question_id, selected_option]) => {
        const question = questions.find(q => q.id === parseInt(question_id));
        return {
          question_id: question?.questionId || `PPI_Q${question_id.toString().padStart(2, '0')}`,
          selected_option: selected_option.toString(), // Likert: "1"-"5", MCQ: "A"-"D"
          question_type: question?.type || 'mcq',
          via_trait: question?.viaTrait,
          weight: question?.weight
        };
      });

      const response = await axios.post(
        `${API}/ppi/submit`,
        { answers: formattedAnswers },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Clear saved progress after successful submission
      await clearProgress();
      
      // Update user state with PPI completion data
      if (response.data && onPPIComplete) {
        onPPIComplete({
          ppi_completed: true,
          financial_dna: response.data.dna,
          lpi_plan: response.data.lpi_plan
        });
      }
      
      // Log PPI completion telemetry
      if (user?.id) {
        await telemetryService.logPPICompletion(
          user.id,
          'v2-via',
          { totalQuestions: questions.length, answeredQuestions: Object.keys(answers).length },
          user.user_type || 'free'
        );
      }

      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to submit PPI:', error);
      alert('Failed to submit. Please try again.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-navy-900 to-navy-700 flex items-center justify-center">
        <div className="text-white text-xl">Loading questions...</div>
      </div>
    );
  }

  if (showIntro) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-3xl mx-auto py-12">
          {/* Help button at top */}
          <div className="flex justify-end mb-4">
            <button 
              onClick={() => navigate('/dashboard')} 
              className="text-gold hover:text-navy-900 text-3xl font-bold transition-colors bg-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg"
              title="Help - Return to Dashboard"
              data-testid="help-btn"
            >
              ?
            </button>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-navy-900 mb-4" data-testid="ppi-intro-title">
              Personality Profile Questionnaire
            </h1>
            <p className="text-lg text-gray-600">
              Help us understand your unique financial learning style
            </p>
          </div>

          <div className="card">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🎯</div>
            </div>

            <div className="space-y-6 text-left">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <h3 className="font-bold text-navy-900 mb-2">About This Questionnaire</h3>
                <p className="text-gray-700">
                  The Personality Profile Questionnaire helps us understand your unique learning style, 
                  financial personality, and current relationship with money. There are no right or wrong answers—just answer honestly so we can personalize your experience!
                </p>
              </div>

              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                <h3 className="font-bold text-navy-900 mb-2">What you'll do:</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>Answer {questions.length || 30} quick questions about yourself</li>
                  <li>Some questions use a 1-5 scale, others are multiple choice</li>
                  <li>Takes about 7-10 minutes to complete</li>
                  <li>Your responses help personalize your learning journey</li>
                </ul>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                <h3 className="font-bold text-navy-900 mb-2">Tips:</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>Go with your first instinct - don't overthink it</li>
                  <li>Be honest - this helps us serve you better</li>
                  <li>You can navigate back and forth between questions</li>
                  <li>Your progress is automatically saved</li>
                </ul>
              </div>

              {hasSavedProgress && Object.keys(answers).length > 0 && (
                <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded">
                  <h3 className="font-bold text-navy-900 mb-2">📝 You have saved progress!</h3>
                  <p className="text-gray-700">
                    You've already answered {Object.keys(answers).length} of {questions.length || 30} questions. 
                    Click "Continue" to pick up where you left off.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
              <button 
                onClick={() => navigate('/dashboard')} 
                className="btn-primary"
                data-testid="skip-btn"
              >
                Back to Dashboard
              </button>
              <button 
                onClick={() => setShowIntro(false)} 
                className="btn-primary"
                data-testid="start-ppi-btn"
              >
                {hasSavedProgress && Object.keys(answers).length > 0 ? 'Continue Where I Left Off' : "Let's Begin"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 to-navy-700 p-4">
      <div className="max-w-3xl mx-auto py-8">
        {/* Skip button in top right corner */}
        <div className="flex justify-end mb-4">
          <button 
            onClick={() => navigate('/dashboard')} 
            className="bg-gold hover:bg-yellow-500 text-navy-900 px-6 py-2 rounded-lg font-semibold transition-all shadow-lg"
            data-testid="skip-ppi-btn"
          >
            Skip for Now
          </button>
        </div>

        <div className="mb-8">
          <div className="mb-4">
            <span className="text-gold font-semibold text-xl" data-testid="progress-text">
              {currentIndex + 1} / {questions.length}
            </span>
          </div>
          <h2 className="text-white text-2xl font-bold text-center mb-4" data-testid="ppi-title">Mizo Wealth Builder - Personality Profile Questionnaire</h2>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} data-testid="progress-bar"></div>
          </div>
        </div>

        {currentQuestion && (
          <div className="card" data-testid="question-card">
            {/* Question type indicator */}
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {currentQuestion.type === 'likert' ? 'Rate 1-5' : 'Choose one'}
              </span>
              {currentQuestion.viaTrait && (
                <span className="text-xs text-gray-400">
                  {currentQuestion.viaTrait}
                </span>
              )}
            </div>
            
            <h3 className="text-2xl font-semibold text-navy-900 mb-6">{currentQuestion.text}</h3>
            
            {currentQuestion.type === 'likert' ? (
              // Likert scale UI
              <LikertScale
                options={currentQuestion.options}
                selectedValue={answers[currentQuestion.id]}
                onSelect={handleAnswer}
                questionId={currentQuestion.id}
              />
            ) : (
              // Multiple choice UI
              <div className="space-y-3">
                {Object.entries(currentQuestion.options).map(([key, value]) => (
                  <div
                    key={key}
                    className={`quiz-option ${answers[currentQuestion.id] === key ? 'selected' : ''}`}
                    onClick={() => handleAnswer(currentQuestion.id, key)}
                    data-testid={`option-${key}`}
                  >
                    <span className="font-semibold text-gold mr-3">{key}.</span>
                    {value}
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between mt-8">
              <button
                onClick={handleBack}
                disabled={currentIndex === 0}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  currentIndex === 0 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'btn-primary'
                }`}
                data-testid="back-btn"
              >
                ← Back
              </button>
              <button
                onClick={handleNext}
                disabled={!answers[currentQuestion.id] || submitting}
                className="btn-primary"
                data-testid="next-btn"
              >
                {currentIndex === questions.length - 1 ? (submitting ? 'Submitting...' : 'Submit') : 'Next →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PPI;