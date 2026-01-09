import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Search, ChevronDown, ChevronUp, Check, X, AlertTriangle, Info } from 'lucide-react';
import { TOPIC_CATALOG, TOPIC_CATEGORIES, getTopicsByCategory } from '../data/topicCatalog';
import { searchTopics, highlightMatches } from '../lib/topicSearch';
import { detectConflicts, getNextConflictToShow } from '../lib/conflictDetector';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Tooltip component for topic descriptions
const TopicTooltip = ({ topic, isVisible, position }) => {
  if (!isVisible || !topic) return null;
  
  return (
    <div 
      className="absolute z-50 w-80 p-4 bg-navy-800 text-white rounded-xl shadow-2xl border border-gold/30"
      style={{ 
        top: position?.top || 0, 
        left: position?.left || 0,
        transform: 'translateY(-100%) translateX(-50%)'
      }}
    >
      <h4 className="font-bold text-gold mb-2">{topic.label}</h4>
      <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
        {topic.tooltipDescription}
      </p>
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
        <div className="w-3 h-3 bg-navy-800 rotate-45 border-r border-b border-gold/30"></div>
      </div>
    </div>
  );
};

// Conflict warning modal
const ConflictModal = ({ conflict, onDismiss, onAdjust }) => {
  if (!conflict) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        <div className="bg-red-600 p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-white" />
            <h3 className="text-xl font-bold text-white">{conflict.title}</h3>
          </div>
        </div>
        <div className="p-6">
          <p className="text-gray-700 mb-4">{conflict.message}</p>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <p className="text-sm text-yellow-800">
              <strong>Recommendation:</strong> {conflict.recommendation}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onAdjust}
              className="flex-1 py-3 px-4 bg-navy-800 text-white rounded-lg font-semibold hover:bg-navy-700 transition"
              data-testid="conflict-adjust-btn"
            >
              Adjust My Topics
            </button>
            <button
              onClick={onDismiss}
              className="flex-1 py-3 px-4 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
              data-testid="conflict-keep-btn"
            >
              Keep Both Anyway
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Single topic item
const TopicItem = ({ topic, isSelected, onToggle, onHover, onLeave }) => {
  return (
    <div
      className={`relative flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
        isSelected
          ? 'bg-gold/20 border-2 border-gold'
          : 'bg-gray-50 border-2 border-transparent hover:border-gray-300 hover:bg-gray-200'
      }`}
      onClick={() => onToggle(topic)}
      onMouseEnter={(e) => onHover(topic, e)}
      onMouseLeave={onLeave}
      data-testid={`topic-item-${topic.id}`}
    >
      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${
        isSelected ? 'bg-gold border-gold' : 'border-gray-400'
      }`}>
        {isSelected && <Check className="w-4 h-4 text-navy-900" />}
      </div>
      <span className={`flex-1 text-sm ${isSelected ? 'font-semibold text-navy-900' : 'text-gray-700'}`}>
        {topic.label}
      </span>
      <Info className="w-4 h-4 text-gray-400" />
    </div>
  );
};

// Category accordion
const CategoryAccordion = ({ category, topics, selectedTopics, onToggleTopic, onSelectAll, onHover, onLeave }) => {
  const [isOpen, setIsOpen] = useState(true);
  const selectedCount = topics.filter(t => selectedTopics.includes(t.id)).length;
  const allSelected = selectedCount === topics.length;
  
  return (
    <div className="border-2 border-gray-200 rounded-xl overflow-hidden mb-4" data-testid={`category-${category.id}`}>
      <button
        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-200 transition"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{category.icon}</span>
          <div className="text-left">
            <h3 className="font-bold text-navy-900">{category.name}</h3>
            <p className="text-xs text-gray-500">{category.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-600">
            {selectedCount}/{topics.length} selected
          </span>
          {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </button>
      
      {isOpen && (
        <div className="p-4 bg-white">
          <button
            onClick={(e) => { e.stopPropagation(); onSelectAll(category.id, !allSelected); }}
            className={`mb-3 text-sm font-medium px-3 py-1 rounded-full transition ${
              allSelected 
                ? 'bg-gray-200 text-gray-600 hover:bg-gray-300' 
                : 'bg-gold/20 text-gold hover:bg-gold/30'
            }`}
            data-testid={`select-all-${category.id}`}
          >
            {allSelected ? 'Deselect All' : 'Select All'}
          </button>
          <div className="grid gap-2">
            {topics.map(topic => (
              <TopicItem
                key={topic.id}
                topic={topic}
                isSelected={selectedTopics.includes(topic.id)}
                onToggle={onToggleTopic}
                onHover={onHover}
                onLeave={onLeave}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

function TopicSelection({ token, user, onComplete }) {
  const navigate = useNavigate();
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredTopic, setHoveredTopic] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState(null);
  const [activeConflict, setActiveConflict] = useState(null);
  const [dismissedConflicts, setDismissedConflicts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load existing topics on mount
  useEffect(() => {
    loadExistingTopics();
  }, []);

  const loadExistingTopics = async () => {
    try {
      const response = await axios.get(`${API}/topics/user`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.has_topics) {
        setSelectedTopics(response.data.topic_ids);
      }
    } catch (error) {
      console.error('Error loading topics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get selected topic objects for conflict detection
  const selectedTopicObjects = useMemo(() => {
    return selectedTopics.map(id => TOPIC_CATALOG.find(t => t.id === id)).filter(Boolean);
  }, [selectedTopics]);

  // Check for conflicts when selection changes
  useEffect(() => {
    const conflict = getNextConflictToShow(selectedTopicObjects, dismissedConflicts);
    if (conflict && !activeConflict) {
      setActiveConflict(conflict);
    }
  }, [selectedTopicObjects, dismissedConflicts]);

  // Filter topics by search
  const filteredTopics = useMemo(() => {
    if (!searchQuery.trim()) return null;
    return searchTopics(TOPIC_CATALOG, searchQuery);
  }, [searchQuery]);

  // Categories with topics
  const categoriesWithTopics = useMemo(() => {
    return Object.values(TOPIC_CATEGORIES)
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map(cat => ({
        ...cat,
        topics: getTopicsByCategory(cat.id)
      }));
  }, []);

  const handleToggleTopic = useCallback((topic) => {
    setSelectedTopics(prev => {
      if (prev.includes(topic.id)) {
        return prev.filter(id => id !== topic.id);
      }
      return [...prev, topic.id];
    });
  }, []);

  const handleSelectAll = useCallback((categoryId, select) => {
    const categoryTopics = getTopicsByCategory(categoryId);
    const categoryIds = categoryTopics.map(t => t.id);
    
    setSelectedTopics(prev => {
      if (select) {
        return [...new Set([...prev, ...categoryIds])];
      }
      return prev.filter(id => !categoryIds.includes(id));
    });
  }, []);

  const handleHover = useCallback((topic, event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      top: rect.top + window.scrollY,
      left: rect.left + rect.width / 2
    });
    // Delay tooltip show
    setTimeout(() => setHoveredTopic(topic), 250);
  }, []);

  const handleLeave = useCallback(() => {
    setHoveredTopic(null);
  }, []);

  const handleConflictDismiss = () => {
    if (activeConflict) {
      setDismissedConflicts(prev => [...prev, activeConflict.type]);
    }
    setActiveConflict(null);
  };

  const handleConflictAdjust = () => {
    // Remove conflicting topics
    if (activeConflict?.affectedTopics) {
      const affectedIds = activeConflict.affectedTopics.map(t => t.id);
      setSelectedTopics(prev => prev.filter(id => !affectedIds.includes(id)));
    }
    setActiveConflict(null);
  };

  const handleSaveAndContinue = async () => {
    if (selectedTopics.length === 0) {
      alert('Please select at least one topic');
      return;
    }

    setSaving(true);
    try {
      await axios.post(`${API}/topics/select`, 
        { topic_ids: selectedTopics },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Navigate to summary or callback
      if (onComplete) {
        onComplete(selectedTopics);
      } else {
        navigate('/topic-summary');
      }
    } catch (error) {
      console.error('Error saving topics:', error);
      alert('Failed to save topics. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-navy-900 to-navy-700 flex items-center justify-center">
        <div className="text-white text-xl">Loading topics...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-navy-900 to-navy-700 text-white py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">What brings you here?</h1>
          <p className="text-gray-300">
            Select the financial topics you want to explore. You can always change these later.
          </p>
        </div>
      </div>

      {/* Search bar */}
      <div className="sticky top-0 z-40 bg-white border-b shadow-sm py-4 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-gold focus:outline-none"
              data-testid="topic-search-input"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2"
              >
                <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
          <div className="flex items-center justify-between mt-3">
            <span className="text-sm text-gray-600">
              {selectedTopics.length} topic{selectedTopics.length !== 1 ? 's' : ''} selected
            </span>
            <span className="text-sm text-gray-500">
              67 topics available
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto py-6 px-4">
        {/* Search results */}
        {filteredTopics && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-700">
              Search Results ({filteredTopics.length})
            </h3>
            {filteredTopics.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No topics found matching "{searchQuery}"</p>
            ) : (
              <div className="grid gap-2 bg-white rounded-xl p-4 border-2 border-gray-200">
                {filteredTopics.map(topic => (
                  <TopicItem
                    key={topic.id}
                    topic={topic}
                    isSelected={selectedTopics.includes(topic.id)}
                    onToggle={handleToggleTopic}
                    onHover={handleHover}
                    onLeave={handleLeave}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Categories */}
        {!filteredTopics && categoriesWithTopics.map(category => (
          <CategoryAccordion
            key={category.id}
            category={category}
            topics={category.topics}
            selectedTopics={selectedTopics}
            onToggleTopic={handleToggleTopic}
            onSelectAll={handleSelectAll}
            onHover={handleHover}
            onLeave={handleLeave}
          />
        ))}
      </div>

      {/* Footer with continue button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg py-4 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-lg font-bold text-navy-900">
              {selectedTopics.length} selected
            </span>
            <span className="text-sm text-gray-500">
              (minimum 1 required)
            </span>
            <button
              onClick={() => navigate('/ppi-layers')}
              className="text-sm text-gray-400 hover:text-gray-600 underline transition"
              data-testid="skip-topics-btn"
            >
              Skip for now
            </button>
          </div>
          <button
            onClick={handleSaveAndContinue}
            disabled={selectedTopics.length === 0 || saving}
            className={`px-8 py-3 rounded-xl font-bold transition ${
              selectedTopics.length > 0
                ? 'bg-gradient-to-r from-gold to-yellow-400 text-navy-900 hover:shadow-lg'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            data-testid="continue-btn"
          >
            {saving ? 'Saving...' : 'Continue →'}
          </button>
        </div>
      </div>

      {/* Tooltip */}
      <TopicTooltip
        topic={hoveredTopic}
        isVisible={!!hoveredTopic}
        position={tooltipPosition}
      />

      {/* Conflict modal */}
      <ConflictModal
        conflict={activeConflict}
        onDismiss={handleConflictDismiss}
        onAdjust={handleConflictAdjust}
      />
    </div>
  );
}

export default TopicSelection;
