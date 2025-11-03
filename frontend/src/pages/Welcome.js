import React from 'react';
import { useNavigate } from 'react-router-dom';

function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>

        {/* Hero Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          {/* Testing Panel Link at Top */}
          <div className="absolute top-4 right-4">
            <button 
              onClick={() => navigate('/admin')} 
              className="bg-gold text-navy-900 px-4 py-2 rounded-lg font-semibold hover:bg-gold-hover transition-all text-sm"
              data-testid="testing-panel-top-btn"
            >
              🧪 Testing Panel
            </button>
          </div>

          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 bg-gold/20 rounded-full mb-8">
              <span className="text-gold font-semibold text-sm">Your Financial Future Starts Here</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight" data-testid="welcome-title">
              Wealth Builder
            </h1>
            <h2 className="text-3xl md:text-4xl font-semibold text-gold mb-6">
              Master Your Money, Build Your Wealth
            </h2>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Transform your financial knowledge through personalized lessons, interactive quizzes, 
              and proven strategies that empower you to take control of your wealth.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <button 
                onClick={() => navigate('/register')} 
                className="btn-primary text-lg px-8 py-4"
                data-testid="get-started-btn"
              >
                Start Your Journey Free
              </button>
              <button 
                onClick={() => navigate('/login')} 
                className="btn-secondary text-lg px-8 py-4"
                data-testid="login-btn"
              >
                Sign In
              </button>
            </div>

            {/* Social Proof */}
            <div className="flex items-center justify-center gap-8 text-gray-400 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gold text-2xl">★★★★★</span>
                <span>Trusted Learning</span>
              </div>
              <div className="hidden sm:block h-4 w-px bg-gray-600"></div>
              <div>
                <span className="text-gold font-bold">100%</span> Free for POC Testers
              </div>
              <div className="hidden sm:block h-4 w-px bg-gray-600"></div>
              <div>
                <span className="text-gold font-bold">Quick Setup</span> - Start Learning
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-navy-900 mb-4">
            Everything You Need to Succeed
          </h2>
          <p className="text-xl text-gray-600">
            A comprehensive, step-by-step path to financial mastery
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-gradient-to-br from-blue-50 to-white p-8 rounded-2xl border border-blue-100 hover:shadow-xl transition-all">
            <div className="w-16 h-16 bg-gradient-to-br from-navy-700 to-navy-900 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <span className="text-3xl">📊</span>
            </div>
            <h3 className="text-2xl font-bold text-navy-900 mb-3">Personal Financial Profile</h3>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Begin with a 20-question assessment that identifies your unique learning style, 
              financial personality, and current knowledge level.
            </p>
            <div className="flex items-center justify-center text-gold font-semibold">
              <span>Discover Your Style</span>
              <span className="ml-2">→</span>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="bg-gradient-to-br from-amber-50 to-white p-8 rounded-2xl border border-amber-100 hover:shadow-xl transition-all">
            <div className="w-16 h-16 bg-gradient-to-br from-gold to-yellow-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <span className="text-3xl">📚</span>
            </div>
            <h3 className="text-2xl font-bold text-navy-900 mb-3">10 Expert-Crafted Chapters</h3>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Master essential concepts from budgeting basics to investment strategies. 
              Each chapter includes engaging lessons and knowledge-check quizzes.
            </p>
            <div className="flex items-center justify-center text-gold font-semibold">
              <span>Start Learning</span>
              <span className="ml-2">→</span>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="bg-gradient-to-br from-green-50 to-white p-8 rounded-2xl border border-green-100 hover:shadow-xl transition-all">
            <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-green-800 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <span className="text-3xl">🎯</span>
            </div>
            <h3 className="text-2xl font-bold text-navy-900 mb-3">Track Your Progress</h3>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Unlock chapters as you master concepts. Visual progress tracking keeps you 
              motivated and shows exactly how far you've come.
            </p>
            <div className="flex items-center justify-center text-gold font-semibold">
              <span>See Your Growth</span>
              <span className="ml-2">→</span>
            </div>
          </div>
        </div>
      </div>

      {/* What You'll Learn Section */}
      <div className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-navy-900 mb-4">
              Your Learning Journey
            </h2>
            <p className="text-xl text-gray-600">
              10 powerful chapters that build your financial confidence
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[
              { icon: "💰", title: "The Power of a Dollar", desc: "Transform small savings into lasting wealth" },
              { icon: "🤔", title: "Needs, Wants, and Whys", desc: "Master mindful spending decisions" },
              { icon: "⏰", title: "Time Is Currency", desc: "Invest your time as wisely as your money" },
              { icon: "💵", title: "Save Before You Spend", desc: "Build the pay-yourself-first habit" },
              { icon: "📈", title: "Compound Growth Magic", desc: "Harness the power of compound interest" },
              { icon: "📊", title: "Budget Like a Boss", desc: "Take control with strategic budgeting" },
              { icon: "💳", title: "Credit Confidence", desc: "Build and maintain excellent credit" },
              { icon: "🛍️", title: "Smart Spending", desc: "Make purchases that align with your values" },
              { icon: "💼", title: "Grow While You Earn", desc: "Maximize your income potential" },
              { icon: "🌟", title: "Give, Grow, and Glow", desc: "Use wealth to create positive impact" }
            ].map((chapter, idx) => (
              <div key={idx} className="flex items-start gap-4 bg-white p-6 rounded-xl hover:shadow-lg transition-all">
                <div className="text-4xl">{chapter.icon}</div>
                <div>
                  <h4 className="font-bold text-navy-900 text-lg mb-1">
                    {idx + 1}. {chapter.title}
                  </h4>
                  <p className="text-gray-600">{chapter.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-navy-900 mb-4">
            How It Works
          </h2>
          <p className="text-xl text-gray-600">
            Your path to financial mastery in three simple steps
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-green-800 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-6">
              1
            </div>
            <h3 className="text-2xl font-bold text-navy-900 mb-3">Take the Assessment</h3>
            <p className="text-gray-600 leading-relaxed">
              Complete our 20-question profile to personalize your learning experience to your unique style and goals.
            </p>
          </div>

          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-green-800 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-6">
              2
            </div>
            <h3 className="text-2xl font-bold text-navy-900 mb-3">Learn & Progress</h3>
            <p className="text-gray-600 leading-relaxed">
              Work through 10 engaging chapters at your own pace. Each chapter unlocks after you demonstrate mastery.
            </p>
          </div>

          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-green-800 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-6">
              3
            </div>
            <h3 className="text-2xl font-bold text-navy-900 mb-3">Master Your Money</h3>
            <p className="text-gray-600 leading-relaxed">
              Apply your new knowledge to real-world decisions and watch your financial confidence soar.
            </p>
          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Financial Future?
          </h2>
          <p className="text-xl text-gray-300 mb-10">
            Join thousands of learners who are taking control of their finances. 
            Start your journey today—100% free for POC testers.
          </p>
          <div className="flex justify-center">
            <button 
              onClick={() => navigate('/register')} 
              className="btn-primary text-lg px-10 py-5 text-xl"
            >
              Start Learning Now
            </button>
          </div>
          <p className="text-gray-400 mt-6">
            No credit card required • Quick registration
          </p>
        </div>
      </div>

      {/* Footer with Testing Link */}
      <div className="bg-navy-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <button 
            onClick={() => navigate('/admin')} 
            className="bg-gold text-navy-900 px-6 py-3 rounded-lg font-semibold hover:bg-gold-hover transition-all mb-4"
            data-testid="testing-panel-btn"
          >
            🧪 Testing Panel
          </button>
          <p className="text-gray-500 text-sm">© 2025 Wealth Builder. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}

export default Welcome;