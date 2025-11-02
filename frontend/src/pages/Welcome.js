import React from 'react';
import { useNavigate } from 'react-router-dom';

function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full text-center">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-white mb-4" data-testid="welcome-title">
            Financial Education
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Master your money, build your future
          </p>
        </div>
        
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-8">
          <p className="text-lg text-white mb-6">
            Learn essential financial concepts through personalized lessons and interactive quizzes.
            Build habits that lead to financial success.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="text-center">
              <div className="text-4xl mb-2">📊</div>
              <h3 className="text-white font-semibold mb-2">20 Profile Questions</h3>
              <p className="text-gray-300 text-sm">Understand your financial personality</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-2">📚</div>
              <h3 className="text-white font-semibold mb-2">10 Learning Chapters</h3>
              <p className="text-gray-300 text-sm">Master key financial concepts</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-2">🎯</div>
              <h3 className="text-white font-semibold mb-2">Track Your Progress</h3>
              <p className="text-gray-300 text-sm">Unlock chapters as you learn</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={() => navigate('/register')} 
            className="btn-primary"
            data-testid="get-started-btn"
          >
            Get Started
          </button>
          <button 
            onClick={() => navigate('/login')} 
            className="btn-secondary"
            data-testid="login-btn"
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
}

export default Welcome;