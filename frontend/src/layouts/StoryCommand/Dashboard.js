import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Search, Command, Settings, LogOut, X, User, Users, ArrowRight, ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const STORY_GRADIENTS = [
    'from-rose-600 via-pink-600 to-purple-700',
    'from-blue-600 via-indigo-600 to-violet-700',
    'from-emerald-600 via-teal-600 to-cyan-700',
    'from-amber-600 via-orange-600 to-red-700',
    'from-fuchsia-600 via-purple-600 to-indigo-700',
];

export default function StoryCommandDashboard() {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const inputRef = useRef(null);
    const [families, setFamilies] = useState([]);
    const [allChildren, setAllChildren] = useState([]);
    const [stories, setStories] = useState([]);
    const [currentStory, setCurrentStory] = useState(0);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [autoAdvance, setAutoAdvance] = useState(true);

    useEffect(() => { fetchData(); }, []);
    
    // Auto-advance stories every 5 seconds (Instagram-style)
    useEffect(() => {
        if (!autoAdvance || isPaused || stories.length === 0) return;
        const timer = setInterval(() => {
            setCurrentStory(i => i < stories.length - 1 ? i + 1 : 0);
        }, 5000);
        return () => clearInterval(timer);
    }, [autoAdvance, isPaused, stories.length]);

    // Keyboard shortcuts - always active
    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === 'Escape') { setQuery(''); inputRef.current?.blur(); }
            if (e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key === 'k')) {
                e.preventDefault();
                inputRef.current?.focus();
            }
            if (document.activeElement !== inputRef.current) {
                if (e.key === 'ArrowLeft') setCurrentStory(i => Math.max(0, i - 1));
                if (e.key === 'ArrowRight') setCurrentStory(i => Math.min(stories.length - 1, i + 1));
                if (e.key === ' ') { e.preventDefault(); setIsPaused(p => !p); }
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [stories.length]);

    const fetchData = async () => {
        try {
            const res = await axios.get(`${API}/families`);
            const fams = res.data.families || [];
            setFamilies(fams);
            let kids = [];
            for (const fam of fams) {
                const childRes = await axios.get(`${API}/families/${fam.id}/children`);
                kids = [...kids, ...(childRes.data.children || []).map(c => ({ ...c, familyName: fam.family_name }))];
            }
            setAllChildren(kids);

            const storyList = kids.flatMap((child, i) => {
                const identity = child.identity || {};
                const favorites = child.favorites || {};
                const personality = child.personality || {};
                return [
                    { type: 'intro', child, title: identity.full_name, subtitle: child.familyName, gradient: STORY_GRADIENTS[i % STORY_GRADIENTS.length] },
                    favorites.favorite_food && { type: 'favorite', child, title: `Loves ${favorites.favorite_food}`, subtitle: 'Favorite food', gradient: STORY_GRADIENTS[(i+1) % STORY_GRADIENTS.length] },
                    personality.primary_love_language && { type: 'love', child, title: personality.primary_love_language, subtitle: 'Love Language', gradient: STORY_GRADIENTS[(i+2) % STORY_GRADIENTS.length] },
                ].filter(Boolean);
            });
            setStories(storyList.length ? storyList : [{ type: 'empty', title: 'No Stories Yet', subtitle: 'Add children to see stories', gradient: STORY_GRADIENTS[0] }]);
        } catch (err) { toast.error('Failed to load'); }
        finally { setLoading(false); }
    };

    const getSearchResults = () => {
        if (!query.trim()) return [];
        const q = query.toLowerCase();
        const results = [];
        families.forEach(f => {
            if (f.family_name.toLowerCase().includes(q)) results.push({ type: 'family', id: f.id, name: f.family_name, subtitle: `${f.number_of_children || 0} members`, icon: Users });
        });
        allChildren.forEach(c => {
            const name = c.identity?.full_name || '';
            const searchText = `${name} ${c.familyName} ${c.favorites?.favorite_food || ''} ${c.school?.school_name || ''}`.toLowerCase();
            if (searchText.includes(q)) results.push({ type: 'child', id: c.id, name, subtitle: c.familyName, icon: User });
        });
        // Also search for story content and jump to that story
        stories.forEach((s, i) => {
            if (s.title?.toLowerCase().includes(q) && !results.find(r => r.type === 'story' && r.storyIndex === i)) {
                results.push({ type: 'story', storyIndex: i, name: s.title, subtitle: `Story: ${s.subtitle}`, icon: Play });
            }
        });
        return results.slice(0, 10);
    };

    const results = getSearchResults();

    const handleSelect = (item) => {
        setQuery('');
        if (item.type === 'story') {
            setCurrentStory(item.storyIndex);
        } else {
            navigate(item.type === 'family' ? `/family/${item.id}` : `/child/${item.id}`);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, results.length - 1)); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); }
        else if (e.key === 'Enter' && results[selectedIndex]) { e.preventDefault(); handleSelect(results[selectedIndex]); }
    };

    useEffect(() => { setSelectedIndex(0); }, [query]);

    if (loading) {
        return <div className="min-h-screen bg-black flex items-center justify-center"><div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" /></div>;
    }

    const story = stories[currentStory];
    const isSearching = query.length > 0;

    return (
        <div className="min-h-screen bg-black relative overflow-hidden">
            {/* LAYER 1: Full-screen Story (Always visible behind) */}
            <div className={`absolute inset-0 bg-gradient-to-br ${story.gradient} transition-all duration-700 ${isSearching ? 'blur-sm scale-105' : ''}`}>
                <div className="absolute inset-0 bg-black/20" />
                
                {/* Story Progress Bar */}
                <div className="absolute top-4 left-4 right-4 flex gap-1 z-10">
                    {stories.map((_, i) => (
                        <button key={i} onClick={() => setCurrentStory(i)} className="flex-1 h-1 rounded-full overflow-hidden bg-white/30">
                            <div className={`h-full bg-white transition-all duration-300 ${i === currentStory ? (isPaused ? 'w-1/2' : 'animate-progress') : i < currentStory ? 'w-full' : 'w-0'}`} />
                        </button>
                    ))}
                </div>

                {/* Story Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8">
                    {story.child?.identity?.profile_photo && (
                        <div className="w-28 h-28 rounded-full overflow-hidden mb-6 ring-4 ring-white/30 shadow-2xl">
                            <img src={story.child.identity.profile_photo} alt="" className="w-full h-full object-cover" />
                        </div>
                    )}
                    <h1 className="text-5xl font-bold text-white mb-3 drop-shadow-lg">{story.title}</h1>
                    <p className="text-xl text-white/80">{story.subtitle}</p>
                    {story.child && (
                        <Button variant="outline" className="mt-8 border-white/30 text-white hover:bg-white/20" onClick={() => navigate(`/child/${story.child.id}`)}>
                            View Full Profile <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    )}
                </div>

                {/* Story Navigation Touch Zones */}
                <button onClick={() => setCurrentStory(i => Math.max(0, i-1))} className="absolute left-0 top-20 bottom-20 w-1/4" />
                <button onClick={() => setCurrentStory(i => Math.min(stories.length-1, i+1))} className="absolute right-0 top-20 bottom-20 w-1/4" />
                
                {/* Pause indicator */}
                {isPaused && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-black/50 flex items-center justify-center">
                        <Pause className="w-10 h-10 text-white" />
                    </div>
                )}
            </div>

            {/* LAYER 2: Command Palette (Always visible, floating) */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 w-full max-w-xl px-4 z-50">
                <div className={`bg-black/60 backdrop-blur-xl rounded-2xl border transition-all duration-300 ${isSearching ? 'border-white/30 shadow-2xl' : 'border-white/10'}`}>
                    {/* Search Input - Always Visible */}
                    <div className="flex items-center gap-3 px-4 py-3">
                        <Search className={`w-5 h-5 transition-colors ${isSearching ? 'text-white' : 'text-white/40'}`} />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onFocus={() => setIsPaused(true)}
                            onBlur={() => !query && setIsPaused(false)}
                            placeholder="Search or press / to jump anywhere..."
                            className="flex-1 bg-transparent border-none text-white placeholder-white/40 focus:outline-none"
                        />
                        <div className="flex items-center gap-1 text-white/30 text-xs">
                            <kbd className="px-1.5 py-0.5 bg-white/10 rounded">⌘K</kbd>
                        </div>
                    </div>

                    {/* Results - Shown when typing */}
                    {isSearching && (
                        <div className="border-t border-white/10 max-h-80 overflow-y-auto">
                            {results.length > 0 ? results.map((item, i) => {
                                const Icon = item.icon;
                                return (
                                    <button
                                        key={`${item.type}-${item.id || item.storyIndex}-${i}`}
                                        onClick={() => handleSelect(item)}
                                        className={`w-full px-4 py-3 flex items-center gap-3 transition-colors ${i === selectedIndex ? 'bg-white/20' : 'hover:bg-white/10'}`}
                                    >
                                        <Icon className="w-5 h-5 text-white/60" />
                                        <div className="text-left flex-1">
                                            <p className="text-white font-medium">{item.name}</p>
                                            <p className="text-white/50 text-sm">{item.subtitle}</p>
                                        </div>
                                        {item.type === 'story' && <span className="text-xs text-white/40">Jump to story</span>}
                                    </button>
                                );
                            }) : <p className="p-4 text-white/50 text-center">No results for "{query}"</p>}
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center z-40">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="text-white/70 hover:text-white hover:bg-white/10" onClick={() => setIsPaused(p => !p)}>
                        {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                    </Button>
                    <span className="text-white/50 text-sm">{currentStory + 1}/{stories.length}</span>
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="text-white/70 hover:text-white hover:bg-white/10" onClick={() => navigate('/settings')}>
                        <Settings className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-white/70 hover:text-white hover:bg-white/10" onClick={() => { logout(); toast.success('Logged out'); }}>
                        <LogOut className="w-5 h-5" />
                    </Button>
                </div>
            </div>

            <style>{`
                @keyframes progress {
                    from { width: 0%; }
                    to { width: 100%; }
                }
                .animate-progress {
                    animation: progress 5s linear;
                }
            `}</style>
        </div>
    );
}
