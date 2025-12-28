import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Search, Command, Settings, LogOut, ChevronUp, ChevronDown, X, User, Users, ArrowRight, Play } from 'lucide-react';
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
    const [commandOpen, setCommandOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);

    useEffect(() => { fetchData(); }, []);
    useEffect(() => {
        const handleKey = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setCommandOpen(true);
            }
            if (e.key === 'Escape') setCommandOpen(false);
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, []);
    useEffect(() => { if (commandOpen) inputRef.current?.focus(); }, [commandOpen]);

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

            // Generate stories
            const storyList = kids.flatMap((child, i) => {
                const identity = child.identity || {};
                const favorites = child.favorites || {};
                const personality = child.personality || {};
                return [
                    { type: 'intro', child, title: identity.full_name, subtitle: child.familyName, gradient: STORY_GRADIENTS[i % STORY_GRADIENTS.length] },
                    favorites.favorite_food && { type: 'favorite', child, title: `Loves ${favorites.favorite_food}`, subtitle: 'Current favorite', gradient: STORY_GRADIENTS[(i+1) % STORY_GRADIENTS.length] },
                    personality.primary_love_language && { type: 'love', child, title: personality.primary_love_language, subtitle: 'Love Language', gradient: STORY_GRADIENTS[(i+2) % STORY_GRADIENTS.length] },
                ].filter(Boolean);
            });
            setStories(storyList.length ? storyList : [{ type: 'empty', title: 'No Stories Yet', subtitle: 'Add children to see stories', gradient: STORY_GRADIENTS[0] }]);
        } catch (err) { toast.error('Failed to load'); }
        finally { setLoading(false); }
    };

    const nextStory = () => setCurrentStory(i => Math.min(i + 1, stories.length - 1));
    const prevStory = () => setCurrentStory(i => Math.max(i - 1, 0));

    const getSearchResults = () => {
        if (!query.trim()) return [];
        const q = query.toLowerCase();
        const results = [];
        families.forEach(f => {
            if (f.family_name.toLowerCase().includes(q)) results.push({ type: 'family', id: f.id, name: f.family_name, icon: Users });
        });
        allChildren.forEach(c => {
            if ((c.identity?.full_name || '').toLowerCase().includes(q)) results.push({ type: 'child', id: c.id, name: c.identity?.full_name, icon: User });
        });
        return results.slice(0, 8);
    };

    const results = getSearchResults();

    const handleSelect = (item) => {
        setCommandOpen(false);
        setQuery('');
        navigate(item.type === 'family' ? `/family/${item.id}` : `/child/${item.id}`);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, results.length - 1)); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); }
        else if (e.key === 'Enter' && results[selectedIndex]) handleSelect(results[selectedIndex]);
    };

    if (loading) {
        return <div className="min-h-screen bg-black flex items-center justify-center"><div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" /></div>;
    }

    const story = stories[currentStory];

    return (
        <div className="min-h-screen bg-black relative overflow-hidden">
            {/* Full-screen Story */}
            <div className={`absolute inset-0 bg-gradient-to-br ${story.gradient} transition-all duration-500`}>
                <div className="absolute inset-0 bg-black/20" />
                
                {/* Story Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8">
                    {story.child?.identity?.profile_photo && (
                        <div className="w-24 h-24 rounded-full overflow-hidden mb-6 ring-4 ring-white/30">
                            <img src={story.child.identity.profile_photo} alt="" className="w-full h-full object-cover" />
                        </div>
                    )}
                    <h1 className="text-5xl font-bold text-white mb-3 drop-shadow-lg">{story.title}</h1>
                    <p className="text-xl text-white/80">{story.subtitle}</p>
                    {story.child && (
                        <Button 
                            variant="outline" 
                            className="mt-8 border-white/30 text-white hover:bg-white/20"
                            onClick={() => navigate(`/child/${story.child.id}`)}
                        >
                            View Profile <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    )}
                </div>

                {/* Story Progress */}
                <div className="absolute top-4 left-4 right-4 flex gap-1">
                    {stories.map((_, i) => (
                        <div key={i} className={`flex-1 h-1 rounded-full transition-all ${i === currentStory ? 'bg-white' : i < currentStory ? 'bg-white/60' : 'bg-white/20'}`} />
                    ))}
                </div>

                {/* Navigation Zones */}
                <button onClick={prevStory} className="absolute left-0 top-0 bottom-0 w-1/3 focus:outline-none" />
                <button onClick={nextStory} className="absolute right-0 top-0 bottom-0 w-1/3 focus:outline-none" />

                {/* Story Navigation Arrows */}
                {currentStory > 0 && <ChevronUp className="absolute top-1/2 left-4 w-8 h-8 text-white/50" />}
                {currentStory < stories.length - 1 && <ChevronDown className="absolute top-1/2 right-4 w-8 h-8 text-white/50" />}
            </div>

            {/* Floating Controls */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 z-20">
                <button
                    onClick={() => setCommandOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/40 backdrop-blur-xl border border-white/20 text-white hover:bg-black/60 transition-colors"
                >
                    <Command className="w-4 h-4" />
                    <span className="text-sm">⌘K to search</span>
                </button>
            </div>

            {/* Top Controls */}
            <div className="absolute top-6 right-6 flex gap-2 z-20">
                <Button variant="ghost" size="icon" className="text-white/70 hover:text-white hover:bg-white/10" onClick={() => navigate('/settings')}>
                    <Settings className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-white/70 hover:text-white hover:bg-white/10" onClick={() => { logout(); toast.success('Logged out'); }}>
                    <LogOut className="w-5 h-5" />
                </Button>
            </div>

            {/* Command Palette Overlay */}
            {commandOpen && (
                <div className="absolute inset-0 z-50 flex items-start justify-center pt-20" onClick={() => setCommandOpen(false)}>
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                    <div className="relative w-full max-w-xl bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                        {/* Search Input */}
                        <div className="flex items-center gap-3 p-4 border-b border-white/10">
                            <Search className="w-5 h-5 text-white/50" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Search families, children, memories..."
                                className="flex-1 bg-transparent border-none text-white placeholder-white/40 text-lg focus:outline-none"
                            />
                            <button onClick={() => setCommandOpen(false)} className="text-white/50 hover:text-white"><X className="w-5 h-5" /></button>
                        </div>

                        {/* Results */}
                        <div className="max-h-80 overflow-y-auto">
                            {results.length > 0 ? results.map((item, i) => {
                                const Icon = item.icon;
                                return (
                                    <button
                                        key={`${item.type}-${item.id}`}
                                        onClick={() => handleSelect(item)}
                                        className={`w-full px-4 py-3 flex items-center gap-3 transition-colors ${i === selectedIndex ? 'bg-white/10' : 'hover:bg-white/5'}`}
                                    >
                                        <Icon className="w-5 h-5 text-white/50" />
                                        <span className="text-white">{item.name}</span>
                                        <ArrowRight className="w-4 h-4 text-white/30 ml-auto" />
                                    </button>
                                );
                            }) : query && <p className="p-4 text-white/50 text-center">No results</p>}
                            {!query && (
                                <div className="p-4 text-center text-white/40">
                                    <p>Start typing to search...</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
