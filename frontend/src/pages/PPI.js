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

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 to-navy-700 p-4">
      <div className="max-w-3xl mx-auto py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-white text-2xl font-bold" data-testid="ppi-title">Wealth Builder - Personal Financial Inventory</h2>
            <span className="text-gold font-semibold" data-testid="progress-text">
              {currentIndex + 1} / {questions.length}
            </span>
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
                className="btn-secondary"
                data-testid="back-btn"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                disabled={!answers[currentQuestion.id] || submitting}
                className="btn-primary"
                data-testid="next-btn"
              >
                {currentIndex === questions.length - 1 ? (submitting ? 'Submitting...' : 'Submit') : 'Next'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PPI;