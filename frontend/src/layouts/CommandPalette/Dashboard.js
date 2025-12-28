import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Search, Command, ArrowRight, User, Users, Settings, LogOut, Clock, Star, ChevronRight } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function CommandPaletteDashboard() {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const inputRef = useRef(null);
    const [families, setFamilies] = useState([]);
    const [allChildren, setAllChildren] = useState([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [recentSearches, setRecentSearches] = useState([]);

    useEffect(() => { fetchData(); loadRecentSearches(); }, []);
    useEffect(() => { inputRef.current?.focus(); }, [loading]);

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
        } catch (err) { toast.error('Failed to load'); }
        finally { setLoading(false); }
    };

    const loadRecentSearches = () => {
        const recent = JSON.parse(localStorage.getItem('ourcircle_recent_searches') || '[]');
        setRecentSearches(recent);
    };

    const saveRecentSearch = (item) => {
        const recent = JSON.parse(localStorage.getItem('ourcircle_recent_searches') || '[]');
        const filtered = recent.filter(r => r.id !== item.id);
        const updated = [item, ...filtered].slice(0, 5);
        localStorage.setItem('ourcircle_recent_searches', JSON.stringify(updated));
        setRecentSearches(updated);
    };

    const getSearchResults = useCallback(() => {
        if (!query.trim()) return [];
        const q = query.toLowerCase();
        const results = [];

        // Search families
        families.forEach(f => {
            if (f.family_name.toLowerCase().includes(q)) {
                results.push({ type: 'family', id: f.id, name: f.family_name, subtitle: `${f.number_of_children || 0} members`, icon: Users });
            }
        });

        // Search children
        allChildren.forEach(c => {
            const name = c.identity?.full_name || '';
            const school = c.school?.school_name || '';
            const grade = c.school?.grade || '';
            const favorites = Object.values(c.favorites || {}).join(' ');
            const searchText = `${name} ${school} ${grade} ${favorites} ${c.familyName}`.toLowerCase();

            if (searchText.includes(q)) {
                results.push({
                    type: 'child',
                    id: c.id,
                    name: name,
                    subtitle: `${c.familyName} • ${school || 'No school'}`,
                    icon: User,
                    matches: []
                });
            }
        });

        return results.slice(0, 10);
    }, [query, families, allChildren]);

    const results = getSearchResults();

    const handleSelect = (item) => {
        saveRecentSearch(item);
        if (item.type === 'family') {
            navigate(`/family/${item.id}`);
        } else {
            navigate(`/child/${item.id}`);
        }
    };

    const handleKeyDown = (e) => {
        const items = query ? results : recentSearches;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(i => Math.min(i + 1, items.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(i => Math.max(i - 1, 0));
        } else if (e.key === 'Enter' && items[selectedIndex]) {
            handleSelect(items[selectedIndex]);
        }
    };

    useEffect(() => { setSelectedIndex(0); }, [query]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const displayItems = query ? results : recentSearches;

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            {/* Minimal Header */}
            <header className="border-b border-slate-800 px-6 py-3 flex justify-between items-center">
                <div className="flex items-center gap-2 text-slate-400">
                    <Command className="w-5 h-5" />
                    <span className="text-sm font-mono">command_palette</span>
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="text-slate-500" onClick={() => navigate('/settings')}>
                        <Settings className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-slate-500" onClick={() => { logout(); toast.success('Logged out'); }}>
                        <LogOut className="w-4 h-4" />
                    </Button>
                </div>
            </header>

            {/* Command Input */}
            <div className="max-w-3xl mx-auto px-6 py-12">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-500" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type to search... (e.g., 'Adam school 2023')"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl py-4 px-14 text-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <kbd className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-400">↑↓</kbd>
                        <kbd className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-400">↵</kbd>
                    </div>
                </div>

                {/* Results */}
                <div className="mt-6 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                    {/* Section Header */}
                    <div className="px-4 py-2 border-b border-slate-800 flex items-center gap-2">
                        {query ? (
                            <><Search className="w-3 h-3 text-slate-500" /><span className="text-xs text-slate-500">Results ({results.length})</span></>
                        ) : (
                            <><Clock className="w-3 h-3 text-slate-500" /><span className="text-xs text-slate-500">Recent</span></>
                        )}
                    </div>

                    {/* Items */}
                    {displayItems.length > 0 ? (
                        displayItems.map((item, i) => {
                            const Icon = item.icon || User;
                            return (
                                <button
                                    key={`${item.type}-${item.id}`}
                                    onClick={() => handleSelect(item)}
                                    className={`w-full px-4 py-3 flex items-center gap-4 transition-colors ${i === selectedIndex ? 'bg-cyan-500/20 text-cyan-400' : 'hover:bg-slate-800 text-slate-300'}`}
                                >
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${i === selectedIndex ? 'bg-cyan-500/20' : 'bg-slate-800'}`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <p className="font-medium font-mono">{item.name}</p>
                                        <p className="text-sm text-slate-500">{item.subtitle}</p>
                                    </div>
                                    <ChevronRight className={`w-4 h-4 ${i === selectedIndex ? 'text-cyan-400' : 'text-slate-600'}`} />
                                </button>
                            );
                        })
                    ) : (
                        <div className="px-4 py-8 text-center text-slate-500">
                            {query ? (
                                <p>No results for "{query}"</p>
                            ) : (
                                <p>Start typing to search</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="mt-6 grid grid-cols-3 gap-3">
                    {families.slice(0, 3).map(f => (
                        <button
                            key={f.id}
                            onClick={() => navigate(`/family/${f.id}`)}
                            className="p-4 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors text-left group"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <Users className="w-4 h-4 text-slate-500" />
                                <ArrowRight className="w-3 h-3 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <p className="font-mono text-sm text-slate-300">{f.family_name}</p>
                            <p className="text-xs text-slate-600">{f.number_of_children || 0} members</p>
                        </button>
                    ))}
                </div>

                {/* Stats Footer */}
                <div className="mt-8 flex items-center justify-center gap-6 text-slate-600 text-sm font-mono">
                    <span>{families.length} families</span>
                    <span>•</span>
                    <span>{allChildren.length} profiles</span>
                    <span>•</span>
                    <span>instant search</span>
                </div>
            </div>
        </div>
    );
}
