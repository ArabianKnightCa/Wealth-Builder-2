import React from 'react';

function RegistrationIntro({ onStart }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gold rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gold rounded-full filter blur-3xl"></div>
      </div>

      <div className="max-w-4xl w-full relative z-10">
        {/* Logo/Brand */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-gold mb-4 tracking-tight">
            Mizo Wealth Builder
          </h1>
          <div className="w-24 h-1 bg-gold mx-auto"></div>
        </div>

        {/* Main Content */}
        <div className="bg-navy-800 bg-opacity-90 backdrop-blur-lg rounded-2xl p-8 md:p-12 shadow-2xl border-2 border-gold border-opacity-30">
          <div className="space-y-6">
            {/* Opening Statement */}
            <div className="text-center mb-8">
              <p className="text-2xl md:text-3xl font-light leading-relaxed text-gold italic">
                This app isn't made for everyone.
              </p>
              <p className="text-2xl md:text-3xl font-semibold mt-2 leading-relaxed text-white">
                It's made for people who are ready to <span className="text-gold">rise</span>.
              </p>
            </div>

            <div className="w-16 h-0.5 bg-gold mx-auto my-8"></div>

            {/* Body Content */}
            <div className="space-y-5 text-lg md:text-xl leading-relaxed text-gray-100">
              <p className="leading-loose">
                Ready to <span className="text-gold font-semibold">leave behind</span> the cycle of stress and uncertainty.
              </p>
              <p className="leading-loose">
                Ready to <span className="text-gold font-semibold">replace guesswork</span> with clarity.
              </p>
              <p className="leading-loose">
                Ready to <span className="text-gold font-semibold">build a financial life</span> that feels intentional, elevated, and truly yours.
              </p>
            </div>

            <div className="w-16 h-0.5 bg-gold mx-auto my-8"></div>

            {/* If You're Section */}
            <div className="space-y-4 text-lg md:text-xl leading-relaxed pl-6 border-l-4 border-gold">
              <p className="text-gray-100">
                If you're tired of settling for <span className="italic text-yellow-300">"just getting by"</span>…
              </p>
              <p className="text-gray-100">
                If you're ready to <span className="text-gold font-semibold">transform your habits</span> and design a future with purpose…
              </p>
              <p className="text-gray-100">
                If you want a system that gives you <span className="text-gold font-semibold">tools, structure, and strategy</span>—not noise—
              </p>
            </div>

            <div className="text-center my-8">
              <p className="text-2xl md:text-3xl font-bold text-gold">
                You've found your place.
              </p>
            </div>

            <div className="w-16 h-0.5 bg-gold mx-auto my-8"></div>

            {/* Crafted For Section */}
            <div className="space-y-5 text-lg md:text-xl leading-relaxed text-gray-100">
              <p className="leading-loose">
                This experience is crafted for individuals who <span className="text-gold font-semibold">know they can do more</span>—and are willing to put in the work to prove it.
              </p>
              <p className="leading-loose">
                For people who value <span className="text-gold font-semibold">progress, growth, and a roadmap</span> they can trust.
              </p>
            </div>

            <div className="w-16 h-0.5 bg-gold mx-auto my-8"></div>

            {/* Call to Action */}
            <div className="space-y-4 text-center">
              <p className="text-xl md:text-2xl text-gray-100 leading-relaxed">
                Bring your <span className="text-gold font-bold">ambition</span>. 
                Bring your <span className="text-gold font-bold">curiosity</span>. 
                Bring your <span className="text-gold font-bold">willingness to level up</span>.
              </p>
              <p className="text-lg md:text-xl text-gray-100 leading-relaxed">
                We'll meet you with a framework that helps you <span className="text-gold font-semibold">rethink money</span>, 
                <span className="text-gold font-semibold"> rebuild habits</span>, and <span className="text-gold font-semibold">reshape</span> your entire financial trajectory.
              </p>
            </div>

            <div className="my-10">
              <p className="text-3xl md:text-4xl font-bold text-center text-white leading-tight">
                This is your moment to <span className="text-gold">take control</span>.
              </p>
              <p className="text-xl md:text-2xl text-center text-gray-100 mt-4">
                Let's elevate your financial life—one deliberate step at a time.
              </p>
            </div>

            {/* Start Button */}
            <div className="text-center mt-12">
              <button
                onClick={onStart}
                className="bg-gold hover:bg-yellow-500 text-navy-900 px-12 py-4 rounded-lg text-xl font-bold transition-all transform hover:scale-105 shadow-lg hover:shadow-2xl"
                data-testid="start-journey-btn"
              >
                Begin Your Journey
              </button>
              <p className="text-sm text-gray-400 mt-4">
                Your transformation starts now
              </p>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center mt-8 text-gray-300 text-sm">
          <p>Step 0 of 4 • Registration Introduction</p>
        </div>
      </div>
    </div>
  );
}

export default RegistrationIntro;
