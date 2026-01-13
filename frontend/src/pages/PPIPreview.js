import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Eye, Upload, CheckCircle, AlertCircle, Layers, FileJson, BarChart3 } from 'lucide-react';

// Sample PPI questions for preview (will be replaced with uploaded content)
const SAMPLE_QUESTIONS = [
  {
    id: "PPI_Q001",
    layer: 1,
    type: "mcq",
    prompt: "You receive unexpected money. What do you do first?",
    options: [
      "A Think about what I need or want to buy",
      "B Put it aside and decide later",
      "C Research the best use for it",
      "D Feel excited about the possibilities"
    ],
    via_trait: "Self-Regulation",
    weight: 7,
    delta_weights: {
      "A": { "Zest": 0.2, "Self-Regulation": -0.2 },
      "B": { "Prudence": 0.3, "Self-Regulation": 0.2 },
      "C": { "Judgment": 0.3, "Curiosity": 0.2 },
      "D": { "Zest": 0.3, "Hope": 0.2 }
    }
  },
  {
    id: "PPI_Q002",
    layer: 1,
    type: "likert",
    prompt: "I think about future consequences before spending money.",
    via_trait: "Prudence",
    weight: 9
  },
  {
    id: "PPI_Q071",
    layer: 3,
    type: "mcq",
    prompt: "What's the main reason you want to be better with money?",
    options: [
      "A To prove I'm capable and responsible",
      "B To create the life I've always wanted",
      "C To not let down the people who count on me",
      "D To finally feel secure and stop worrying"
    ],
    via_trait: "Hope",
    weight: 8,
    delta_weights: {
      "A": { "Perseverance": 0.3, "Self-Regulation": 0.2 },
      "B": { "Zest": 0.3, "Hope": 0.2 },
      "C": { "Love": 0.3, "Kindness": 0.2 },
      "D": { "Prudence": 0.3, "Hope": 0.1 }
    }
  },
  {
    id: "PPI_Q191",
    layer: 6,
    type: "likert",
    prompt: "I realize I sometimes confuse being careful with being afraid.",
    via_trait: "Bravery",
    weight: 7
  }
];

const LAYER_INFO = {
  1: { name: "Baseline", focus: "What do you DO?", color: "from-emerald-500 to-emerald-600" },
  2: { name: "Situational", focus: "What do you do WHEN...?", color: "from-blue-500 to-blue-600" },
  3: { name: "Motivations", focus: "WHY do you do that?", color: "from-violet-500 to-violet-600" },
  4: { name: "Patterns", focus: "What patterns do you notice?", color: "from-amber-500 to-amber-600" },
  5: { name: "Origins", focus: "Where did this come from?", color: "from-rose-500 to-rose-600" },
  6: { name: "Blind Spots", focus: "What are your blind spots?", color: "from-slate-500 to-slate-600" },
  7: { name: "Meta-Awareness", focus: "What do you understand now?", color: "from-cyan-500 to-cyan-600" }
};

const VIA_TRAITS = [
  "Creativity", "Curiosity", "Judgment", "Love of Learning", "Perspective",
  "Bravery", "Perseverance", "Honesty", "Zest",
  "Love", "Kindness", "Social Intelligence",
  "Teamwork", "Fairness", "Leadership",
  "Forgiveness", "Humility", "Prudence", "Self-Regulation",
  "Appreciation of Beauty", "Gratitude", "Hope", "Humor", "Spirituality"
];

// Likert Scale Preview Component
const LikertPreview = ({ question, selectedValue, onSelect }) => {
  const labels = ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"];
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between text-sm text-gray-500 mb-2">
        <span>Strongly Disagree</span>
        <span>Strongly Agree</span>
      </div>
      <div className="flex justify-between gap-2">
        {labels.map((label, index) => {
          const value = index + 1;
          const isSelected = selectedValue === value;
          return (
            <button
              key={index}
              onClick={() => onSelect(value)}
              className={`flex-1 py-4 px-2 rounded-lg border-2 transition-all text-center ${
                isSelected
                  ? 'bg-gradient-to-r from-amber-400 to-amber-500 border-amber-500 text-slate-900 font-bold shadow-lg scale-105'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-amber-400 hover:bg-amber-50'
              }`}
            >
              <div className="text-2xl mb-1">{value}</div>
              <div className="text-xs hidden sm:block">{label}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// MCQ Preview Component
const MCQPreview = ({ question, selectedOption, onSelect }) => {
  return (
    <div className="space-y-3">
      {question.options.map((opt, index) => {
        const letter = opt.charAt(0);
        const text = opt.substring(2);
        const isSelected = selectedOption === letter;
        
        return (
          <button
            key={letter}
            onClick={() => onSelect(letter)}
            className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
              isSelected
                ? 'bg-gradient-to-r from-amber-400 to-amber-500 border-amber-500 text-slate-900 shadow-lg'
                : 'bg-white border-gray-200 text-gray-700 hover:border-amber-400 hover:bg-amber-50'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                isSelected ? 'bg-white/30' : 'bg-gray-100'
              }`}>
                {letter}
              </span>
              <span className="font-medium">{text}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
};

// Validation Report Component
const ValidationReport = ({ questions }) => {
  const totalQuestions = questions.length;
  const layerCounts = {};
  const traitCounts = {};
  const typeCounts = { likert: 0, mcq: 0 };
  const issues = [];

  questions.forEach(q => {
    // Count by layer
    layerCounts[q.layer] = (layerCounts[q.layer] || 0) + 1;
    
    // Count by trait
    if (q.via_trait) {
      traitCounts[q.via_trait] = (traitCounts[q.via_trait] || 0) + 1;
    }
    
    // Count by type
    if (q.type) {
      typeCounts[q.type] = (typeCounts[q.type] || 0) + 1;
    }
    
    // Check for issues
    if (!q.via_trait) issues.push(`${q.id}: Missing via_trait`);
    if (!q.weight) issues.push(`${q.id}: Missing weight`);
    if (q.type === 'mcq' && (!q.options || q.options.length !== 4)) issues.push(`${q.id}: MCQ should have 4 options`);
  });

  // Check expected counts
  const expectedTotal = 270;
  const expectedLayer1 = 30;
  const expectedOtherLayers = 40;

  if (totalQuestions !== expectedTotal) {
    issues.push(`Total questions: ${totalQuestions} (expected ${expectedTotal})`);
  }

  // Check missing traits
  const missingTraits = VIA_TRAITS.filter(t => !traitCounts[t]);
  if (missingTraits.length > 0) {
    issues.push(`Missing traits: ${missingTraits.join(', ')}`);
  }

  return (
    <div className="bg-slate-800 rounded-2xl p-6 space-y-6">
      <h3 className="text-xl font-bold text-white flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-amber-400" />
        Validation Report
      </h3>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-700 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-amber-400">{totalQuestions}</div>
          <div className="text-sm text-gray-400">Total Questions</div>
        </div>
        <div className="bg-slate-700 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-emerald-400">{Object.keys(layerCounts).length}</div>
          <div className="text-sm text-gray-400">Layers</div>
        </div>
        <div className="bg-slate-700 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-blue-400">{Object.keys(traitCounts).length}</div>
          <div className="text-sm text-gray-400">VIA Traits</div>
        </div>
        <div className="bg-slate-700 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-violet-400">
            {Math.round((typeCounts.likert / totalQuestions) * 100)}%
          </div>
          <div className="text-sm text-gray-400">Likert</div>
        </div>
      </div>

      {/* Layer Distribution */}
      <div>
        <h4 className="text-sm font-semibold text-gray-400 mb-3">Layer Distribution</h4>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6, 7].map(layer => {
            const count = layerCounts[layer] || 0;
            const expected = layer === 1 ? 30 : 40;
            const isCorrect = count === expected;
            return (
              <div key={layer} className="flex items-center gap-3">
                <div className={`w-24 text-sm font-medium bg-gradient-to-r ${LAYER_INFO[layer].color} bg-clip-text text-transparent`}>
                  L{layer}: {LAYER_INFO[layer].name}
                </div>
                <div className="flex-1 bg-slate-700 rounded-full h-4 overflow-hidden">
                  <div 
                    className={`h-full bg-gradient-to-r ${LAYER_INFO[layer].color}`}
                    style={{ width: `${(count / expected) * 100}%` }}
                  />
                </div>
                <div className={`text-sm font-mono ${isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                  {count}/{expected}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Issues */}
      {issues.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Issues Found ({issues.length})
          </h4>
          <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-4 max-h-48 overflow-y-auto">
            <ul className="space-y-1 text-sm text-red-300">
              {issues.slice(0, 10).map((issue, i) => (
                <li key={i}>• {issue}</li>
              ))}
              {issues.length > 10 && (
                <li className="text-red-400 font-medium">... and {issues.length - 10} more</li>
              )}
            </ul>
          </div>
        </div>
      )}

      {issues.length === 0 && (
        <div className="bg-emerald-900/30 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="w-6 h-6 text-emerald-400" />
          <span className="text-emerald-300 font-medium">All validations passed!</span>
        </div>
      )}
    </div>
  );
};

function PPIPreview() {
  const [questions, setQuestions] = useState(SAMPLE_QUESTIONS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showValidation, setShowValidation] = useState(false);
  const [uploadedJson, setUploadedJson] = useState(null);
  const [filterLayer, setFilterLayer] = useState(null);

  const filteredQuestions = filterLayer 
    ? questions.filter(q => q.layer === filterLayer)
    : questions;

  const currentQuestion = filteredQuestions[currentIndex];
  const layerInfo = currentQuestion ? LAYER_INFO[currentQuestion.layer] : null;

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target.result);
          if (json.items) {
            setQuestions(json.items);
            setUploadedJson(json);
            setCurrentIndex(0);
            setAnswers({});
          } else {
            alert('Invalid JSON format. Expected "items" array.');
          }
        } catch (err) {
          alert('Failed to parse JSON: ' + err.message);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleAnswer = (value) => {
    if (currentQuestion) {
      setAnswers({ ...answers, [currentQuestion.id]: value });
    }
  };

  const handleNext = () => {
    if (currentIndex < filteredQuestions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-lg border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-amber-400 to-amber-500 rounded-xl flex items-center justify-center">
                <Eye className="w-5 h-5 text-slate-900" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">PPI Preview Tool</h1>
                <p className="text-sm text-gray-400">Validate & preview questions before integration</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl cursor-pointer transition-colors">
                <Upload className="w-4 h-4 text-amber-400" />
                <span className="text-sm text-white">Upload JSON</span>
                <input 
                  type="file" 
                  accept=".json" 
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              
              <button
                onClick={() => setShowValidation(!showValidation)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
                  showValidation 
                    ? 'bg-amber-500 text-slate-900' 
                    : 'bg-slate-700 hover:bg-slate-600 text-white'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span className="text-sm">Validate</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Validation Panel */}
        {showValidation && (
          <div className="mb-8">
            <ValidationReport questions={questions} />
          </div>
        )}

        {/* Layer Filter */}
        <div className="mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-400 mr-2">Filter by Layer:</span>
            <button
              onClick={() => { setFilterLayer(null); setCurrentIndex(0); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filterLayer === null 
                  ? 'bg-amber-500 text-slate-900' 
                  : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
              }`}
            >
              All ({questions.length})
            </button>
            {[1, 2, 3, 4, 5, 6, 7].map(layer => {
              const count = questions.filter(q => q.layer === layer).length;
              return (
                <button
                  key={layer}
                  onClick={() => { setFilterLayer(layer); setCurrentIndex(0); }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filterLayer === layer 
                      ? `bg-gradient-to-r ${LAYER_INFO[layer].color} text-white` 
                      : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                  }`}
                >
                  L{layer} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Question Card */}
        {currentQuestion && (
          <div className="bg-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            {/* Layer Header */}
            <div className={`bg-gradient-to-r ${layerInfo.color} px-6 py-4`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Layers className="w-5 h-5 text-white/80" />
                  <div>
                    <span className="text-white font-bold">Layer {currentQuestion.layer}:</span>
                    <span className="text-white/80 ml-2">{layerInfo.name}</span>
                  </div>
                </div>
                <div className="text-white/80 text-sm">{layerInfo.focus}</div>
              </div>
            </div>

            {/* Question Content */}
            <div className="p-6 md:p-8">
              {/* Question Meta */}
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <span className="px-3 py-1 bg-slate-700 rounded-full text-sm font-mono text-amber-400">
                  {currentQuestion.id}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  currentQuestion.type === 'likert' 
                    ? 'bg-violet-500/20 text-violet-300' 
                    : 'bg-blue-500/20 text-blue-300'
                }`}>
                  {currentQuestion.type.toUpperCase()}
                </span>
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-sm">
                  {currentQuestion.via_trait}
                </span>
                <span className="px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-sm">
                  Weight: {currentQuestion.weight}
                </span>
              </div>

              {/* Question Text */}
              <h2 className="text-2xl font-bold text-white mb-8 leading-relaxed">
                {currentQuestion.prompt}
              </h2>

              {/* Answer Options */}
              {currentQuestion.type === 'likert' ? (
                <LikertPreview 
                  question={currentQuestion}
                  selectedValue={answers[currentQuestion.id]}
                  onSelect={handleAnswer}
                />
              ) : (
                <MCQPreview 
                  question={currentQuestion}
                  selectedOption={answers[currentQuestion.id]}
                  onSelect={handleAnswer}
                />
              )}

              {/* Delta Weights Toggle */}
              {currentQuestion.type === 'mcq' && currentQuestion.delta_weights && (
                <div className="mt-6 pt-6 border-t border-slate-700">
                  <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showDeltaWeights}
                      onChange={(e) => setShowDeltaWeights(e.target.checked)}
                      className="rounded border-gray-600 bg-slate-700 text-amber-500 focus:ring-amber-500"
                    />
                    Show delta weights on options
                  </label>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="bg-slate-900/50 px-6 py-4 flex items-center justify-between">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              
              <div className="text-center">
                <span className="text-2xl font-bold text-white">{currentIndex + 1}</span>
                <span className="text-gray-400"> / {filteredQuestions.length}</span>
              </div>
              
              <button
                onClick={handleNext}
                disabled={currentIndex === filteredQuestions.length - 1}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-slate-900 font-medium transition-colors"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-800 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-amber-400">
              {Object.keys(answers).length}
            </div>
            <div className="text-sm text-gray-400">Previewed</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-emerald-400">
              {questions.filter(q => q.type === 'likert').length}
            </div>
            <div className="text-sm text-gray-400">Likert Questions</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">
              {questions.filter(q => q.type === 'mcq').length}
            </div>
            <div className="text-sm text-gray-400">MCQ Questions</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-violet-400">
              {questions.filter(q => q.delta_weights).length}
            </div>
            <div className="text-sm text-gray-400">With Delta Weights</div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-bold text-white mb-3">How to Use</h3>
          <ol className="space-y-2 text-gray-400">
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 w-6 h-6 bg-amber-500 text-slate-900 rounded-full flex items-center justify-center text-sm font-bold">1</span>
              <span>Upload your Claude-generated PPI JSON file using the "Upload JSON" button</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 w-6 h-6 bg-amber-500 text-slate-900 rounded-full flex items-center justify-center text-sm font-bold">2</span>
              <span>Click "Validate" to check for missing fields, incorrect counts, and coverage issues</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 w-6 h-6 bg-amber-500 text-slate-900 rounded-full flex items-center justify-center text-sm font-bold">3</span>
              <span>Filter by layer to focus on specific question sets</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 w-6 h-6 bg-amber-500 text-slate-900 rounded-full flex items-center justify-center text-sm font-bold">4</span>
              <span>Navigate through questions to preview how they'll appear to users</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 w-6 h-6 bg-amber-500 text-slate-900 rounded-full flex items-center justify-center text-sm font-bold">5</span>
              <span>For MCQs, check delta_weights to verify trait scoring is correct</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default PPIPreview;
