import React from 'react';
import { useNavigate } from 'react-router-dom';

function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 relative overflow-hidden">
      {/* Decorative background elements - matching Registration Intro */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gold rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gold rounded-full filter blur-3xl"></div>
      </div>

      {/* Hero Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 min-h-screen flex flex-col justify-center">
        {/* Testing Panel Link at Top Right */}
        <div className="absolute top-4 right-4">
          <button 
            onClick={() => navigate('/admin')} 
            className="bg-gold text-navy-900 px-4 py-2 rounded-lg font-semibold hover:bg-yellow-500 transition-all text-sm shadow-lg"
            data-testid="testing-panel-top-btn"
          >
            🧪 Testing Panel
          </button>
        </div>

        <div className="text-center mb-12">
          {/* Logo/Brand */}
          <h1 className="text-5xl md:text-7xl font-bold text-gold mb-4 tracking-tight" data-testid="welcome-title">
            Mizo Wealth Builder
          </h1>
          <div className="w-24 h-1 bg-gold mx-auto mb-8"></div>
          <h2 className="text-3xl md:text-4xl font-light text-white mb-6 leading-tight">
            Master Your Money, <span className="text-gold font-semibold">Build Your Wealth</span>
          </h2>
        </div>

        {/* Main Content Card - matching Registration Intro style */}
        <div className="bg-navy-800 bg-opacity-90 backdrop-blur-lg rounded-2xl p-8 md:p-12 shadow-2xl border-2 border-gold border-opacity-30 mb-12">
          <div className="space-y-8">
            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-gray-100 text-center leading-relaxed max-w-3xl mx-auto">
              Transform your financial knowledge through <span className="text-gold font-semibold">personalized lessons</span>, 
              interactive quizzes, and proven strategies that empower you to <span className="text-gold font-semibold">take control</span> of your wealth.
            </p>

            <div className="w-16 h-0.5 bg-gold mx-auto my-6"></div>

            {/* Value Props */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="space-y-2">
                <div className="text-gold text-3xl mb-2">★★★★★</div>
                <p className="text-gray-100 font-medium">Trusted Learning</p>
                <p className="text-gray-300 text-sm">Proven Framework</p>
              </div>
              <div className="space-y-2">
                <div className="text-gold text-3xl mb-2 font-bold">100%</div>
                <p className="text-gray-100 font-medium">Free for POC Testers</p>
                <p className="text-gray-300 text-sm">No Hidden Fees</p>
              </div>
              <div className="space-y-2">
                <div className="text-gold text-3xl mb-2">⚡</div>
                <p className="text-gray-100 font-medium">Quick Setup</p>
                <p className="text-gray-300 text-sm">Start Learning Now</p>
              </div>
            </div>

            <div className="w-16 h-0.5 bg-gold mx-auto my-6"></div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-2xl mx-auto">
              <button 
                onClick={() => navigate('/register')} 
                className="bg-gold hover:bg-yellow-500 text-navy-900 px-10 py-4 rounded-lg text-xl font-bold transition-all transform hover:scale-105 shadow-lg hover:shadow-2xl w-full sm:w-auto"
                data-testid="get-started-btn"
              >
                Start Your Journey Free
              </button>
              <button 
                onClick={() => navigate('/login')} 
                className="bg-white bg-opacity-10 hover:bg-opacity-20 text-white border-2 border-gold px-10 py-4 rounded-lg text-xl font-semibold transition-all w-full sm:w-auto"
                data-testid="login-btn"
              >
                Sign In
              </button>
            </div>

            <p className="text-center text-gray-300 text-sm mt-4">
              Your transformation starts with one click
            </p>
          </div>
        </div>
        {/* Footer */}
        <div className="text-center text-gray-300">
          <p className="text-sm">© 2025 Mizo Wealth Builder. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}

export default Welcome;