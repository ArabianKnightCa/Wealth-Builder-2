import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Clock, Target, CheckCircle, Lock, Star, Zap, Award } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Layer option card
const LayerOption = ({ option, isSelected, onSelect, isRecommended }) => {
  return (
    <div
      onClick={() => onSelect(option.id)}
      className={`relative cursor-pointer rounded-2xl p-6 border-3 transition-all ${
        isSelected
          ? 'border-gold bg-gold/10 shadow-lg scale-[1.02]'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow'
      }`}
      data-testid={`layer-option-${option.id}`}
    >
      {isRecommended && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-gradient-to-r from-gold to-yellow-400 text-navy-900 text-xs font-bold px-3 py-1 rounded-full">
            RECOMMENDED
          </span>
        </div>
      )}
      
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-navy-900">{option.name}</h3>
          <p className="text-sm text-gray-500">{option.description}</p>
        </div>
        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
          isSelected ? 'bg-gold border-gold' : 'border-gray-300'
        }`}>
          {isSelected && <CheckCircle className="w-4 h-4 text-navy-900" />}
        </div>
      </div>
      
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2 text-gray-600">
          <Clock className="w-4 h-4" />
          <span>{option.timeMinutes} min</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Target className="w-4 h-4" />
          <span>{option.accuracy}% accuracy</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <span>{option.layers} layer{option.layers !== 1 ? 's' : ''}</span>
        </div>
      </div>
      
      {/* Accuracy bar */}
      <div className="mt-4">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-gold to-yellow-400 transition-all duration-500"
            style={{ width: `${option.accuracy}%` }}
          />
        </div>
      </div>
    </div>
  );
};

// Layer detail card (for complete option)
const LayerDetailCard = ({ layer, isCompleted, isUnlocked }) => {
  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl ${
      isCompleted ? 'bg-green-50' : isUnlocked ? 'bg-gray-50' : 'bg-gray-100 opacity-60'
    }`}>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
        isCompleted 
          ? 'bg-green-500 text-white' 
          : isUnlocked 
            ? 'bg-gold text-navy-900' 
            : 'bg-gray-300 text-gray-500'
      }`}>
        {isCompleted ? (
          <CheckCircle className="w-5 h-5" />
        ) : isUnlocked ? (
          <span className="font-bold">{layer.layer}</span>
        ) : (
          <Lock className="w-4 h-4" />
        )}
      </div>
      <div className="flex-1">
        <h4 className="font-semibold text-navy-900">Layer {layer.layer}: {layer.name}</h4>
        <p className="text-xs text-gray-500">{layer.questions} questions · {layer.minutes} min</p>
      </div>
      <div className="text-right">
        <span className={`text-sm font-medium ${
          isCompleted ? 'text-green-600' : 'text-gray-500'
        }`}>
          {layer.accuracy}%
        </span>
      </div>
    </div>
  );
};

function PPILayerSelector({ token, user, onSelectLayers }) {
  const navigate = useNavigate();
  const [selectedOption, setSelectedOption] = useState('balanced');
  const [layers, setLayers] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  const options = [
    {
      id: 'quick',
      name: 'Quick Start',
      description: 'Get basic personalization fast',
      layers: 1,
      timeMinutes: 5,
      accuracy: 60
    },
    {
      id: 'balanced',
      name: 'Balanced',
      description: 'Good accuracy with reasonable time',
      layers: 3,
      timeMinutes: 20,
      accuracy: 85
    },
    {
      id: 'complete',
      name: 'Complete Profile',
      description: 'Maximum personalization and insights',
      layers: 7,
      timeMinutes: 45,
      accuracy: 99
    }
  ];

  useEffect(() => {
    loadLayersAndProgress();
  }, []);

  const loadLayersAndProgress = async () => {
    try {
      const [layersRes, progressRes] = await Promise.all([
        axios.get(`${API}/ppi/layers`),
        axios.get(`${API}/ppi/progress`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      setLayers(layersRes.data.layers);
      setProgress(progressRes.data);
      
      // Auto-select based on progress
      if (progressRes.data.completed_count > 0) {
        if (progressRes.data.completed_count >= 7) {
          setSelectedOption('complete');
        } else if (progressRes.data.completed_count >= 3) {
          setSelectedOption('balanced');
        }
      }
    } catch (error) {
      console.error('Error loading layers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    const option = options.find(o => o.id === selectedOption);
    if (onSelectLayers) {
      onSelectLayers(option.layers);
    } else {
      // Navigate to PPI with selected layers
      navigate(`/ppi?layers=${option.layers}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-navy-900 to-navy-700 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-navy-900 to-navy-700 text-white py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <Award className="w-16 h-16 text-gold mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-3">Your Personality Profile</h1>
          <p className="text-gray-300 max-w-xl mx-auto">
            Answer questions about your financial personality to unlock personalized content. 
            Choose how deep you want to go.
          </p>
          
          {progress && progress.completed_count > 0 && (
            <div className="mt-6 inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span>{progress.completed_count} layer{progress.completed_count !== 1 ? 's' : ''} completed</span>
              <span className="text-gold font-bold">({progress.profile_accuracy}% accuracy)</span>
            </div>
          )}
        </div>
      </div>

      {/* Options */}
      <div className="max-w-3xl mx-auto py-8 px-4">
        <h2 className="text-xl font-bold text-navy-900 mb-6">Choose Your Path</h2>
        
        <div className="space-y-4">
          {options.map(option => (
            <LayerOption
              key={option.id}
              option={option}
              isSelected={selectedOption === option.id}
              onSelect={setSelectedOption}
              isRecommended={option.id === 'balanced'}
            />
          ))}
        </div>

        {/* Layer breakdown for complete option */}
        {selectedOption === 'complete' && layers.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-bold text-navy-900 mb-4">All 7 Layers</h3>
            <div className="space-y-2">
              {layers.map(layer => (
                <LayerDetailCard
                  key={layer.layer}
                  layer={layer}
                  isCompleted={progress?.completed_layers?.includes(layer.layer)}
                  isUnlocked={true}
                />
              ))}
            </div>
          </div>
        )}

        {/* Benefits */}
        <div className="mt-8 bg-gradient-to-r from-gold/10 to-yellow-50 rounded-xl p-6 border-2 border-gold/30">
          <h3 className="font-bold text-navy-900 mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-gold" />
            Why Complete Your Profile?
          </h3>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
              <span><strong>Personalized Content:</strong> Lessons adapted to your learning style and personality</span>
            </li>
            <li className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
              <span><strong>DNA Trait Report:</strong> Discover your financial strengths and growth areas</span>
            </li>
            <li className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
              <span><strong>Earn Badges:</strong> Unlock achievements as you complete layers</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg py-4 px-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-lg font-bold text-navy-900">
              {options.find(o => o.id === selectedOption)?.name}
            </span>
            <span className="text-sm text-gray-500">
              {options.find(o => o.id === selectedOption)?.timeMinutes} min · {options.find(o => o.id === selectedOption)?.accuracy}% accuracy
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/ppi')}
              className="text-sm text-gray-400 hover:text-gray-600 underline transition"
              data-testid="skip-layer-selection-btn"
            >
              Use default
            </button>
            <button
              onClick={handleContinue}
              className="px-8 py-3 bg-gradient-to-r from-gold to-yellow-400 text-navy-900 rounded-xl font-bold hover:shadow-lg transition"
              data-testid="start-ppi-btn"
            >
              Start Profile →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PPILayerSelector;
