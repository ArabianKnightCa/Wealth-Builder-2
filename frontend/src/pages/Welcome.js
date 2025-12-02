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
        </div>

        {/* Main Content Card - matching Registration Intro style */}
        <div className="bg-navy-800 bg-opacity-90 backdrop-blur-lg rounded-2xl p-8 md:p-12 shadow-2xl border-2 border-gold border-opacity-30 mb-12">
          <div className="space-y-8">
            {/* Opening Statement */}
            <div className="text-center mb-6">
              <p className="text-2xl md:text-3xl text-white leading-relaxed">
                Your financial life doesn't have to feel <span className="text-gold font-semibold">overwhelming</span>.
              </p>
              <p className="text-2xl md:text-3xl text-white mt-4 leading-relaxed">
                It can feel <span className="text-gold font-semibold">intentional</span>.
              </p>
            </div>

            <div className="w-16 h-0.5 bg-gold mx-auto my-6"></div>

            {/* Core Message */}
            <div className="space-y-5 text-lg md:text-xl text-gray-100 leading-relaxed">
              <p className="leading-loose">
                This isn't about <span className="italic text-yellow-300">quick fixes</span> or empty promises.
              </p>
              <p className="leading-loose">
                It's about <span className="text-gold font-semibold">real clarity</span>. <span className="text-gold font-semibold">Real tools</span>. <span className="text-gold font-semibold">Real transformation</span>.
              </p>
              <p className="leading-loose">
                A system built for people who are ready to <span className="text-gold font-semibold">take control</span>, 
                build <span className="text-gold font-semibold">lasting habits</span>, and create a financial future that reflects their <span className="text-gold font-semibold">values</span>.
              </p>
            </div>

            <div className="w-16 h-0.5 bg-gold mx-auto my-6"></div>

            {/* What You'll Get */}
            <div className="text-center space-y-4">
              <p className="text-xl md:text-2xl text-gray-100">
                You'll learn to <span className="text-gold font-bold">master money</span> without the stress.
              </p>
              <p className="text-lg md:text-xl text-gray-100">
                Build wealth without losing yourself in the process.
              </p>
              <p className="text-lg md:text-xl text-gray-100">
                Create a life where your finances <span className="text-gold font-semibold">support your dreams</span>, not limit them.
              </p>
            </div>

            <div className="w-16 h-0.5 bg-gold mx-auto my-6"></div>

            {/* Call to Action */}
            <div className="text-center">
              <p className="text-2xl md:text-3xl font-bold text-white mb-4">
                If you're ready to <span className="text-gold">rise</span>...
              </p>
              <p className="text-xl md:text-2xl text-gray-100 mb-8">
                Your journey starts here.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-2xl mx-auto">
              <button 
                onClick={() => navigate('/register')} 
                className="bg-gold hover:bg-yellow-500 text-navy-900 px-10 py-4 rounded-lg text-xl font-bold transition-all transform hover:scale-105 shadow-lg hover:shadow-2xl w-full sm:w-auto"
                data-testid="get-started-btn"
              >
                Begin Your Journey Free
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
              100% Free for POC Testers • No Credit Card Required
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