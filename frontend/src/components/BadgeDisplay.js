import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Award, Lock, Star, Zap, CheckCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Rarity colors
const RARITY_STYLES = {
  common: {
    bg: 'bg-gray-100',
    border: 'border-gray-300',
    text: 'text-gray-600',
    glow: ''
  },
  uncommon: {
    bg: 'bg-green-50',
    border: 'border-green-300',
    text: 'text-green-700',
    glow: 'shadow-green-200'
  },
  rare: {
    bg: 'bg-blue-50',
    border: 'border-blue-300',
    text: 'text-blue-700',
    glow: 'shadow-blue-200'
  },
  legendary: {
    bg: 'bg-purple-50',
    border: 'border-purple-400',
    text: 'text-purple-700',
    glow: 'shadow-purple-300'
  }
};

// Single badge card
const BadgeCard = ({ badge, isUnlocked, onClick }) => {
  const rarity = RARITY_STYLES[badge.rarity] || RARITY_STYLES.common;
  
  return (
    <div
      onClick={() => onClick(badge)}
      className={`relative cursor-pointer rounded-xl p-4 border-2 transition-all hover:scale-105 ${
        isUnlocked 
          ? `${rarity.bg} ${rarity.border} shadow-md ${rarity.glow}` 
          : 'bg-gray-100 border-gray-200 opacity-50'
      }`}
      data-testid={`badge-${badge.id}`}
    >
      {/* Badge icon */}
      <div className={`text-4xl text-center mb-2 ${!isUnlocked && 'grayscale'}`}>
        {isUnlocked ? badge.icon : '🔒'}
      </div>
      
      {/* Badge name */}
      <h4 className={`text-sm font-bold text-center truncate ${
        isUnlocked ? 'text-navy-900' : 'text-gray-400'
      }`}>
        {badge.name}
      </h4>
      
      {/* Rarity indicator */}
      <div className={`text-xs text-center mt-1 ${rarity.text}`}>
        {badge.rarity}
      </div>
      
      {/* Unlocked indicator */}
      {isUnlocked && (
        <div className="absolute -top-2 -right-2">
          <CheckCircle className="w-5 h-5 text-green-500 bg-white rounded-full" />
        </div>
      )}
    </div>
  );
};

// Badge detail modal
const BadgeModal = ({ badge, isUnlocked, onClose }) => {
  if (!badge) return null;
  
  const rarity = RARITY_STYLES[badge.rarity] || RARITY_STYLES.common;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div 
        className={`bg-white rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl ${rarity.glow}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`${rarity.bg} p-6 text-center border-b ${rarity.border}`}>
          <div className={`text-6xl mb-3 ${!isUnlocked && 'grayscale'}`}>
            {badge.icon}
          </div>
          <h3 className="text-xl font-bold text-navy-900">{badge.name}</h3>
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-2 ${rarity.bg} ${rarity.text} border ${rarity.border}`}>
            {badge.rarity.toUpperCase()}
          </span>
        </div>
        
        {/* Body */}
        <div className="p-6">
          <p className="text-gray-700 mb-4">{badge.description}</p>
          
          {isUnlocked && badge.unlocked_at && (
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg">
              <CheckCircle className="w-5 h-5" />
              <span>Earned on {new Date(badge.unlocked_at).toLocaleDateString()}</span>
            </div>
          )}
          
          {!isUnlocked && (
            <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
              <Lock className="w-5 h-5" />
              <span>Complete the requirement to unlock</span>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full py-3 bg-navy-800 text-white rounded-lg font-semibold hover:bg-navy-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Badge grid component
const BadgeGrid = ({ badges, earnedBadgeIds, onBadgeClick }) => {
  const categories = ['ppi_progress', 'achievements', 'topic_completion'];
  const categoryNames = {
    ppi_progress: 'Profile Progress',
    achievements: 'Achievements',
    topic_completion: 'Topic Mastery'
  };
  
  return (
    <div className="space-y-8">
      {categories.map(category => {
        const categoryBadges = badges.filter(b => b.category === category);
        if (categoryBadges.length === 0) return null;
        
        return (
          <div key={category}>
            <h3 className="text-lg font-bold text-navy-900 mb-4 flex items-center gap-2">
              {category === 'ppi_progress' && <Star className="w-5 h-5 text-gold" />}
              {category === 'achievements' && <Zap className="w-5 h-5 text-gold" />}
              {category === 'topic_completion' && <Award className="w-5 h-5 text-gold" />}
              {categoryNames[category]}
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {categoryBadges.map(badge => (
                <BadgeCard
                  key={badge.id}
                  badge={badge}
                  isUnlocked={earnedBadgeIds.includes(badge.id)}
                  onClick={onBadgeClick}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Main badge display component
function BadgeDisplay({ token, compact = false }) {
  const [badges, setBadges] = useState([]);
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBadges();
  }, []);

  const loadBadges = async () => {
    try {
      const [allBadgesRes, userBadgesRes] = await Promise.all([
        axios.get(`${API}/badges`),
        axios.get(`${API}/badges/user/check`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      setBadges(allBadgesRes.data.badges);
      setEarnedBadges(userBadgesRes.data.earned.map(b => b.id));
    } catch (error) {
      console.error('Error loading badges:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBadgeClick = (badge) => {
    setSelectedBadge({
      ...badge,
      unlocked_at: earnedBadges.includes(badge.id) ? new Date().toISOString() : null
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
      </div>
    );
  }

  // Compact mode for dashboard
  if (compact) {
    const recentBadges = badges.filter(b => earnedBadges.includes(b.id)).slice(0, 4);
    
    return (
      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-navy-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-gold" />
            Recent Badges
          </h3>
          <span className="text-sm text-gray-500">
            {earnedBadges.length}/{badges.length}
          </span>
        </div>
        
        {recentBadges.length > 0 ? (
          <div className="flex gap-2">
            {recentBadges.map(badge => (
              <div
                key={badge.id}
                className="w-12 h-12 rounded-lg bg-gold/10 flex items-center justify-center text-2xl cursor-pointer hover:scale-110 transition"
                onClick={() => handleBadgeClick(badge)}
                title={badge.name}
              >
                {badge.icon}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">Complete activities to earn badges!</p>
        )}
        
        <BadgeModal
          badge={selectedBadge}
          isUnlocked={selectedBadge && earnedBadges.includes(selectedBadge.id)}
          onClose={() => setSelectedBadge(null)}
        />
      </div>
    );
  }

  // Full badge display
  return (
    <div>
      {/* Progress header */}
      <div className="bg-gradient-to-r from-navy-800 to-navy-700 rounded-xl p-6 mb-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold mb-1">Your Achievements</h2>
            <p className="text-gray-300">Collect badges by completing activities</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-gold">{earnedBadges.length}</div>
            <div className="text-sm text-gray-400">of {badges.length} badges</div>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mt-4">
          <div className="h-3 bg-navy-900 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-gold to-yellow-400 transition-all duration-500"
              style={{ width: `${(earnedBadges.length / badges.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Badge grid */}
      <BadgeGrid
        badges={badges}
        earnedBadgeIds={earnedBadges}
        onBadgeClick={handleBadgeClick}
      />

      {/* Badge detail modal */}
      <BadgeModal
        badge={selectedBadge}
        isUnlocked={selectedBadge && earnedBadges.includes(selectedBadge.id)}
        onClose={() => setSelectedBadge(null)}
      />
    </div>
  );
}

export default BadgeDisplay;
