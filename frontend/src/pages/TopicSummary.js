import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Clock, Target, ArrowRight, CheckCircle, Sparkles, TrendingUp } from 'lucide-react';
import { TOPIC_CATALOG } from '../data/topicCatalog';
import { generatePostSelectionSummary } from '../lib/summaryGenerator';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Stage badge component
const StageBadge = ({ stage }) => {
  const urgencyColors = {
    high: 'bg-red-100 text-red-800 border-red-300',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    low: 'bg-green-100 text-green-800 border-green-300'
  };
  
  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 ${urgencyColors[stage.urgency] || urgencyColors.medium}`}>
      <Target className="w-5 h-5" />
      <span className="font-bold">{stage.stageLabel}</span>
    </div>
  );
};

// Theme card component
const ThemeCard = ({ theme, index }) => {
  return (
    <div 
      className="bg-white rounded-xl p-5 border-2 border-gray-200 hover:border-gold transition"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex items-start justify-between mb-3">
        <h4 className="font-bold text-navy-900">{theme.name}</h4>
        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
          {theme.topics.length} topic{theme.topics.length !== 1 ? 's' : ''}
        </span>
      </div>
      <p className="text-sm text-gray-600 mb-3">{theme.description}</p>
      <div className="flex flex-wrap gap-1">
        {theme.topics.slice(0, 3).map(topic => (
          <span key={topic.id} className="text-xs bg-gold/10 text-gold px-2 py-1 rounded">
            {topic.label.slice(0, 30)}...
          </span>
        ))}
        {theme.topics.length > 3 && (
          <span className="text-xs text-gray-400">+{theme.topics.length - 3} more</span>
        )}
      </div>
    </div>
  );
};

// Phase card component
const PhaseCard = ({ phase, index }) => {
  return (
    <div className="flex items-start gap-4">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-gold to-yellow-400 flex items-center justify-center text-navy-900 font-bold">
        {index + 1}
      </div>
      <div className="flex-1">
        <h4 className="font-bold text-navy-900">{phase.name}</h4>
        <p className="text-sm text-gray-600">{phase.reason}</p>
      </div>
    </div>
  );
};

// Next step card
const NextStepCard = ({ step, index }) => {
  return (
    <div className="bg-gradient-to-r from-navy-800 to-navy-700 rounded-xl p-4 text-white">
      <div className="flex items-center gap-3 mb-2">
        <CheckCircle className="w-5 h-5 text-gold" />
        <span className="font-semibold">{step.action}</span>
      </div>
      <p className="text-sm text-gray-300 ml-8">{step.reason}</p>
    </div>
  );
};

function TopicSummary({ token, user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    loadTopicsAndGenerateSummary();
  }, []);

  const loadTopicsAndGenerateSummary = async () => {
    try {
      // Load user's selected topics
      const response = await axios.get(`${API}/topics/user`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.has_topics) {
        const topicIds = response.data.topic_ids;
        setSelectedTopics(topicIds);
        
        // Convert IDs to full topic objects
        const topicObjects = topicIds
          .map(id => TOPIC_CATALOG.find(t => t.id === id))
          .filter(Boolean);
        
        // Generate summary using our lib
        const generatedSummary = generatePostSelectionSummary(topicObjects);
        setSummary(generatedSummary);
      } else {
        // No topics selected, redirect back
        navigate('/topics');
      }
    } catch (error) {
      console.error('Error loading summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartLearning = () => {
    navigate('/ppi');
  };

  const handleEditTopics = () => {
    navigate('/topics');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-navy-900 to-navy-700 flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-gold mx-auto mb-4 animate-pulse" />
          <p className="text-white text-xl">Analyzing your selections...</p>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No topics selected yet</p>
          <button
            onClick={() => navigate('/topics')}
            className="px-6 py-3 bg-gold text-navy-900 rounded-lg font-bold"
          >
            Select Topics
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Hero section */}
      <div className="bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-6">
            <StageBadge stage={summary.stage} />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Your Personalized Path
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            {summary.sequenceExplanation.introduction}
          </p>
          
          {/* Stats row */}
          <div className="flex justify-center gap-8 mt-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-gold">{summary.topicCount}</div>
              <div className="text-sm text-gray-400">Topics Selected</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-gold">{summary.groupedThemes.length}</div>
              <div className="text-sm text-gray-400">Focus Areas</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <Clock className="w-5 h-5 text-gold" />
                <span className="text-4xl font-bold text-gold">{summary.timeline.timelineText}</span>
              </div>
              <div className="text-sm text-gray-400">Estimated Timeline</div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
        
        {/* Grouped themes */}
        <section>
          <h2 className="text-2xl font-bold text-navy-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-gold" />
            Your Focus Areas
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {summary.groupedThemes.map((theme, index) => (
              <ThemeCard key={theme.slug} theme={theme} index={index} />
            ))}
          </div>
        </section>

        {/* Recommended sequence */}
        {summary.sequenceExplanation.phases.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-navy-900 mb-4">
              Recommended Learning Path
            </h2>
            <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
              <p className="text-gray-600 mb-6">{summary.sequenceExplanation.reasoning[0]}</p>
              <div className="space-y-6">
                {summary.sequenceExplanation.phases.map((phase, index) => (
                  <PhaseCard key={phase.name} phase={phase} index={index} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Next steps */}
        <section>
          <h2 className="text-2xl font-bold text-navy-900 mb-4">
            Your Next Steps
          </h2>
          <div className="space-y-3">
            {summary.nextSteps.map((step, index) => (
              <NextStepCard key={index} step={step} index={index} />
            ))}
          </div>
        </section>

        {/* Freedom statement */}
        <section className="bg-gradient-to-r from-gold/10 to-yellow-100 rounded-xl p-6 border-2 border-gold/30">
          <div className="flex items-start gap-4">
            <Sparkles className="w-8 h-8 text-gold flex-shrink-0" />
            <div>
              <h3 className="font-bold text-navy-900 mb-2">Remember: You&apos;re in Control</h3>
              <p className="text-gray-700">
                This path is a recommendation, not a requirement. You can explore topics in any order, 
                skip ahead, or change your selections anytime from Settings → My Topics.
              </p>
            </div>
          </div>
        </section>

        {/* Timeline disclaimer */}
        <p className="text-center text-sm text-gray-500">
          {summary.timeline.disclaimer}
        </p>
      </div>

      {/* Fixed footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg py-4 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={handleEditTopics}
            className="px-6 py-3 text-gray-600 hover:text-navy-900 font-medium transition"
          >
            ← Edit Topics
          </button>
          <button
            onClick={handleStartLearning}
            className="px-8 py-3 bg-gradient-to-r from-gold to-yellow-400 text-navy-900 rounded-xl font-bold hover:shadow-lg transition flex items-center gap-2"
            data-testid="start-learning-btn"
          >
            Let&apos;s Start Learning!
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default TopicSummary;
