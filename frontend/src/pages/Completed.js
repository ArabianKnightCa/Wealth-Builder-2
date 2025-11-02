import React from 'react';
import { useNavigate } from 'react-router-dom';

function Completed({ onLogout }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        <div className="fireworks mb-8">
          <div className="text-8xl mb-4">🎉🎆🎊</div>
        </div>
        
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12">
          <h1 className="text-5xl font-bold text-white mb-4" data-testid="completed-title">
            Congratulations!
          </h1>
          <p className="text-2xl text-gold mb-6">
            You've Completed Your Financial Education Journey
          </p>
          <p className="text-lg text-gray-300 mb-8">
            You've mastered all 10 chapters and demonstrated your understanding of essential financial concepts.
            You're now equipped with the knowledge to make informed financial decisions!
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/5 rounded-lg p-6">
              <div className="text-4xl mb-2">✓</div>
              <h3 className="text-white font-semibold mb-2">20 Questions</h3>
              <p className="text-gray-300 text-sm">Personality Profile Complete</p>
            </div>
            <div className="bg-white/5 rounded-lg p-6">
              <div className="text-4xl mb-2">📚</div>
              <h3 className="text-white font-semibold mb-2">10 Chapters</h3>
              <p className="text-gray-300 text-sm">All Lessons Mastered</p>
            </div>
            <div className="bg-white/5 rounded-lg p-6">
              <div className="text-4xl mb-2">🏆</div>
              <h3 className="text-white font-semibold mb-2">30 Quizzes</h3>
              <p className="text-gray-300 text-sm">All Passed Successfully</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => navigate('/dashboard')} 
              className="btn-primary"
              data-testid="dashboard-btn"
            >
              View Dashboard
            </button>
            <button 
              onClick={onLogout} 
              className="btn-secondary"
              data-testid="logout-btn"
            >
              Logout
            </button>
          </div>
        </div>

        <p className="text-gray-400 mt-8">
          Keep practicing these concepts in your daily financial decisions!
        </p>
      </div>
    </div>
  );
}

export default Completed;