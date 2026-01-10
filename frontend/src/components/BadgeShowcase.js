import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trophy, ChevronRight, X, Star, Lock } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Rarity colors and styles
const RARITY_STYLES = {
  common: {
    bg: 'bg-gray-100',
    border: 'border-gray-300',
    text: 'text-gray-600',
    ring: '#9CA3AF'
  },
  uncommon: {
    bg: 'bg-green-50',
    border: 'border-green-400',
    text: 'text-green-700',
    ring: '#22C55E'
  },
  rare: {
    bg: 'bg-blue-50',
    border: 'border-blue-400',
    text: 'text-blue-700',
    ring: '#3B82F6'
  },
  epic: {
    bg: 'bg-purple-50',
    border: 'border-purple-400',
    text: 'text-purple-700',
    ring: '#A855F7'
  },
  legendary: {
    bg: 'bg-amber-50',
    border: 'border-amber-400',
    text: 'text-amber-700',
    ring: '#F59E0B'
  }
};

/**
 * Progress Ring Component - Circular progress indicator
 */
const ProgressRing = ({ progress, size = 120, strokeWidth = 8 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#E5E7EB"
        strokeWidth={strokeWidth}
      />
      {/* Progress circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="url(#progressGradient)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-all duration-1000 ease-out"
      />
      {/* Gradient definition */}
      <defs>
        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#F5A623" />
          <stop offset="100%" stopColor="#FFD700" />
        </linearGradient>
      </defs>
    </svg>
  );
};

/**
 * Option 5: Progress Ring with Recent Badges Widget
 */
export const BadgeProgressWidget = ({ token, onViewAll }) => {
  const [badges, setBadges] = useState([]);
  const [userBadges, setUserBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBadges();
  }, [token]);

  const loadBadges = async () => {
    try {
      // Load all available badges
      const catalogRes = await axios.get(`${API}/badges/catalog`);
      setBadges(catalogRes.data || []);

      // Load user's earned badges
      const userRes = await axios.get(`${API}/badges/user`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserBadges(userRes.data?.badges || userRes.data || []);
    } catch (error) {
      console.error('Error loading badges:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalBadges = badges.length || 50;
  const earnedCount = userBadges.length;
  const progress = totalBadges > 0 ? Math.round((earnedCount / totalBadges) * 100) : 0;
  
  // Get recent badges (last 5)
  const recentBadges = userBadges
    .sort((a, b) => new Date(b.earned_at || 0) - new Date(a.earned_at || 0))
    .slice(0, 5);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100 animate-pulse">
        <div className="h-32 bg-gray-200 rounded-full w-32 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100 hover:shadow-xl transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-navy-900 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-gold" />
          My Badges
        </h3>
        <button 
          onClick={onViewAll}
          className="text-sm text-gold hover:text-gold/80 flex items-center gap-1"
        >
          View All <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Progress Ring */}
      <div className="flex flex-col items-center mb-4">
        <div className="relative">
          <ProgressRing progress={progress} size={120} strokeWidth={10} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-navy-900">{earnedCount}</span>
            <span className="text-xs text-gray-500">of {totalBadges}</span>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-2">{progress}% collected</p>
      </div>

      {/* Recent Badges */}
      <div className="border-t pt-4">
        <p className="text-xs text-gray-500 mb-3 uppercase tracking-wider">Recent Achievements</p>
        {recentBadges.length > 0 ? (
          <div className="flex justify-center gap-2 flex-wrap">
            {recentBadges.map((badge, idx) => (
              <div 
                key={badge.id || idx}
                className="group relative"
                title={badge.name}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl
                  ${RARITY_STYLES[badge.rarity]?.bg || 'bg-gray-100'}
                  ${RARITY_STYLES[badge.rarity]?.border || 'border-gray-300'}
                  border-2 transform group-hover:scale-110 transition-transform cursor-pointer`}
                >
                  {badge.icon || '🏆'}
                </div>
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 
                  bg-navy-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 
                  transition-opacity whitespace-nowrap pointer-events-none z-10">
                  {badge.name}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-400 text-sm">No badges earned yet. Start learning!</p>
        )}
      </div>
    </div>
  );
};

/**
 * Option 4: Trophy Case Grid (Full Page Component)
 */
export const TrophyCaseGrid = ({ token, isOpen, onClose }) => {
  const [badges, setBadges] = useState([]);
  const [userBadges, setUserBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [filter, setFilter] = useState('all'); // all, earned, locked

  useEffect(() => {
    if (isOpen) {
      loadBadges();
    }
  }, [isOpen, token]);

  const loadBadges = async () => {
    setLoading(true);
    try {
      const catalogRes = await axios.get(`${API}/badges/catalog`);
      setBadges(catalogRes.data || []);

      const userRes = await axios.get(`${API}/badges/user`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserBadges(userRes.data?.badges || userRes.data || []);
    } catch (error) {
      console.error('Error loading badges:', error);
    } finally {
      setLoading(false);
    }
  };

  const earnedBadgeIds = new Set(userBadges.map(b => b.id || b.badge_id));
  
  const filteredBadges = badges.filter(badge => {
    const isEarned = earnedBadgeIds.has(badge.id);
    if (filter === 'earned') return isEarned;
    if (filter === 'locked') return !isEarned;
    return true;
  });

  // Group badges by category
  const badgesByCategory = filteredBadges.reduce((acc, badge) => {
    const cat = badge.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(badge);
    return acc;
  }, {});

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-navy-900 to-navy-700 text-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Trophy className="w-8 h-8 text-gold" />
                <div>
                  <h2 className="text-2xl font-bold">Trophy Case</h2>
                  <p className="text-gray-300 text-sm">
                    {userBadges.length} of {badges.length} badges collected
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 mt-4">
              {['all', 'earned', 'locked'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                    filter === f 
                      ? 'bg-gold text-navy-900' 
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  {f === 'all' ? `All (${badges.length})` : 
                   f === 'earned' ? `Earned (${userBadges.length})` :
                   `Locked (${badges.length - userBadges.length})`}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(85vh-180px)]">
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-gold"></div>
              </div>
            ) : (
              Object.entries(badgesByCategory).map(([category, categoryBadges]) => (
                <div key={category} className="mb-8">
                  <h3 className="text-lg font-bold text-navy-900 mb-4 flex items-center gap-2">
                    <Star className="w-5 h-5 text-gold" />
                    {category}
                  </h3>
                  <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
                    {categoryBadges.map(badge => {
                      const isEarned = earnedBadgeIds.has(badge.id);
                      const rarity = RARITY_STYLES[badge.rarity] || RARITY_STYLES.common;
                      
                      return (
                        <div
                          key={badge.id}
                          onClick={() => setSelectedBadge({ ...badge, isEarned })}
                          className={`relative cursor-pointer rounded-xl p-3 border-2 transition-all 
                            hover:scale-105 hover:shadow-lg ${
                            isEarned 
                              ? `${rarity.bg} ${rarity.border}` 
                              : 'bg-gray-100 border-gray-200 opacity-60'
                          }`}
                        >
                          <div className={`text-3xl text-center ${!isEarned && 'grayscale'}`}>
                            {isEarned ? (badge.icon || '🏆') : <Lock className="w-8 h-8 mx-auto text-gray-400" />}
                          </div>
                          <p className={`text-xs text-center mt-1 truncate font-medium ${
                            isEarned ? 'text-navy-900' : 'text-gray-400'
                          }`}>
                            {badge.name}
                          </p>
                          {/* Rarity dot */}
                          <div 
                            className="absolute top-1 right-1 w-2 h-2 rounded-full"
                            style={{ backgroundColor: rarity.ring }}
                            title={badge.rarity}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Badge Detail Modal */}
      {selectedBadge && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/30"
            onClick={() => setSelectedBadge(null)}
          />
          <div className={`relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full
            border-4 ${RARITY_STYLES[selectedBadge.rarity]?.border || 'border-gray-300'}`}>
            <button 
              onClick={() => setSelectedBadge(null)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="text-center">
              <div className={`text-6xl mb-4 ${!selectedBadge.isEarned && 'grayscale'}`}>
                {selectedBadge.isEarned ? (selectedBadge.icon || '🏆') : '🔒'}
              </div>
              <h3 className="text-xl font-bold text-navy-900 mb-1">{selectedBadge.name}</h3>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3
                ${RARITY_STYLES[selectedBadge.rarity]?.bg} ${RARITY_STYLES[selectedBadge.rarity]?.text}`}>
                {selectedBadge.rarity?.toUpperCase()}
              </span>
              <p className="text-gray-600 text-sm mb-4">{selectedBadge.description}</p>
              
              {selectedBadge.isEarned ? (
                <div className="bg-green-50 text-green-700 rounded-lg p-3 text-sm">
                  ✅ Earned on {new Date(selectedBadge.earned_at || Date.now()).toLocaleDateString()}
                </div>
              ) : (
                <div className="bg-gray-50 text-gray-600 rounded-lg p-3 text-sm">
                  🎯 {selectedBadge.criteria || 'Complete the required challenge to unlock'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default { BadgeProgressWidget, TrophyCaseGrid };
