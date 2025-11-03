import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function PPI({ token }) {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const response = await axios.get(`${API}/content/ppi`);
      setQuestions(response.data.questions);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch questions:', error);
      setLoading(false);
    }
  };

  const handleAnswer = (questionId, option) => {
    setAnswers({ ...answers, [questionId]: option });
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
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
      const formattedAnswers = Object.entries(answers).map(([question_id, selected_option]) => ({
        question_id,
        selected_option
      }));

      await axios.post(
        `${API}/ppi/submit`,
        { answers: formattedAnswers },
        { headers: { Authorization: `Bearer ${token}` } }
      );

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
              Personality Profile
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
                <h3 className="font-bold text-navy-900 mb-2">What is the Personality Profile (PPI)?</h3>
                <p className="text-gray-700">
                  The Personal Financial Inventory helps us understand your unique learning style, 
                  financial personality, and current relationship with money. There are no right or wrong answers—just answer honestly so we can personalize your experience!
                </p>
              </div>

              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                <h3 className="font-bold text-navy-900 mb-2">What you'll do:</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>Answer 20 quick questions about yourself</li>
                  <li>Choose the option that feels most natural to you</li>
                  <li>Takes about 5-7 minutes to complete</li>
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
            </div>

            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
              <button 
                onClick={() => navigate('/dashboard')} 
                className="px-6 py-3 border-2 border-navy-900 text-navy-900 rounded-lg font-semibold hover:bg-navy-900 hover:text-white transition-all"
                data-testid="skip-btn"
              >
                Skip for Now
              </button>
              <button 
                onClick={() => setShowIntro(false)} 
                className="btn-primary"
                data-testid="start-ppi-btn"
              >
                Let's Begin
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
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-white text-2xl font-bold" data-testid="ppi-title">Wealth Builder - Personal Financial Inventory</h2>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/dashboard')} 
                className="text-gold hover:text-white text-3xl font-bold transition-colors"
                title="Help - Return to Dashboard"
                data-testid="help-btn"
              >
                ?
              </button>
              <span className="text-gold font-semibold" data-testid="progress-text">
                {currentIndex + 1} / {questions.length}
              </span>
            </div>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} data-testid="progress-bar"></div>
          </div>
        </div>

        {currentQuestion && (
          <div className="card" data-testid="question-card">
            <h3 className="text-2xl font-semibold text-navy-900 mb-6">{currentQuestion.text}</h3>
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

            <div className="flex justify-between mt-8">
              <button
                onClick={handleBack}
                disabled={currentIndex === 0}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  currentIndex === 0 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-navy-900 text-white hover:bg-navy-800'
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