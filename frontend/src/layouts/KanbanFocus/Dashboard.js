import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Settings, LogOut, GraduationCap, Heart, Camera, Target, X, ChevronRight, User, Sparkles, ZoomIn, Focus } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const COLUMNS = [
    { id: 'school', label: 'School', icon: GraduationCap, color: 'bg-blue-500', gradient: 'from-blue-500 to-indigo-600' },
    { id: 'health', label: 'Health', icon: Heart, color: 'bg-rose-500', gradient: 'from-rose-500 to-pink-600' },
    { id: 'moments', label: 'Moments', icon: Camera, color: 'bg-purple-500', gradient: 'from-purple-500 to-violet-600' },
    { id: 'goals', label: 'Goals', icon: Target, color: 'bg-emerald-500', gradient: 'from-emerald-500 to-teal-600' },
];

export default function KanbanFocusDashboard() {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [allChildren, setAllChildren] = useState([]);
    const [loading, setLoading] = useState(true);
    const [focusedCard, setFocusedCard] = useState(null);
    const [focusIntensity, setFocusIntensity] = useState(0); // 0 to 100 for animation

    useEffect(() => { fetchData(); }, []);

    // Animate focus intensity
    useEffect(() => {
        if (focusedCard) {
            const timer = setTimeout(() => setFocusIntensity(100), 50);
            return () => clearTimeout(timer);
        } else {
            setFocusIntensity(0);
        }
    }, [focusedCard]);

    const fetchData = async () => {
        try {
            const res = await axios.get(`${API}/families`);
            const fams = res.data.families || [];
            let kids = [];
            for (const fam of fams) {
                const childRes = await axios.get(`${API}/families/${fam.id}/children`);
                kids = [...kids, ...(childRes.data.children || []).map(c => ({ ...c, familyName: fam.family_name }))];
            }
            setAllChildren(kids);
        } catch (err) { toast.error('Failed to load'); }
        finally { setLoading(false); }
    };

    const getColumnCards = (columnId, child) => {
        const school = child.school || {};
        const favorites = child.favorites || {};
        const personality = child.personality || {};
        
        switch(columnId) {
            case 'school':
                return [
                    school.school_name && { id: `${child.id}-school`, label: 'School', value: school.school_name, detail: school.grade ? `Grade ${school.grade}` : null, extra: school.favorite_subject ? `Loves ${school.favorite_subject}` : null },
                    school.best_school_memory && { id: `${child.id}-memory`, label: 'Best Memory', value: school.best_school_memory },
                ].filter(Boolean);
            case 'health':
                return [
                    personality.phobias?.length && { id: `${child.id}-phobias`, label: 'Be Careful', value: personality.phobias.join(', '), important: true },
                    favorites.favorite_food && { id: `${child.id}-food`, label: 'Comfort Food', value: favorites.favorite_food },
                ].filter(Boolean);
            case 'moments':
                return [
                    favorites.favorite_show && { id: `${child.id}-show`, label: 'Watching', value: favorites.favorite_show },
                    favorites.favorite_game && { id: `${child.id}-game`, label: 'Playing', value: favorites.favorite_game },
                    favorites.best_song && { id: `${child.id}-song`, label: 'Listening', value: favorites.best_song },
                ].filter(Boolean);
            case 'goals':
                return [
                    personality.strengths?.length && { id: `${child.id}-strengths`, label: 'Strengths', value: personality.strengths.slice(0,3).join(', ') },
                    personality.primary_love_language && { id: `${child.id}-love`, label: 'Love Language', value: personality.primary_love_language, highlight: true },
                    personality.known_for && { id: `${child.id}-known`, label: 'Known For', value: personality.known_for },
                ].filter(Boolean);
            default:
                return [];
        }
    };

    const handleFocus = (card, child, column) => {
        setFocusedCard({ ...card, child, column });
    };

    const exitFocus = () => {
        setFocusIntensity(0);
        setTimeout(() => setFocusedCard(null), 300);
    };

    if (loading) {
        return <div className="min-h-screen bg-slate-100 flex items-center justify-center"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;
    }

    // Calculate which column and card is focused for highlighting
    const focusedColumnId = focusedCard?.column?.id;
    const focusedCardId = focusedCard?.id;

    return (
        <div className="min-h-screen bg-slate-100 relative overflow-hidden">
            {/* Header - fades during focus */}
            <header 
                className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-40 transition-all duration-500"
                style={{ opacity: focusedCard ? 0.3 : 1, filter: focusedCard ? 'blur(2px)' : 'none' }}
            >
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            One Thing at a Time
                            <Focus className="w-5 h-5 text-blue-500" />
                        </h1>
                        <p className="text-sm text-slate-500">Kanban + Focus Mode Hybrid</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}><Settings className="w-5 h-5" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => { logout(); toast.success('Logged out'); }}><LogOut className="w-5 h-5" /></Button>
                    </div>
                </div>
            </header>

            {/* HYBRID: Kanban Board that dims when focused */}
            <div 
                className="p-6 overflow-x-auto transition-all duration-500"
                style={{ 
                    filter: focusedCard ? `blur(${focusIntensity / 20}px)` : 'none',
                    transform: focusedCard ? `scale(${1 - focusIntensity / 500})` : 'scale(1)',
                }}
            >
                <div className="flex gap-6 min-w-max">
                    {COLUMNS.map(column => {
                        const Icon = column.icon;
                        const isColumnFocused = focusedColumnId === column.id;
                        
                        return (
                            <div 
                                key={column.id} 
                                className={`w-72 flex-shrink-0 transition-all duration-500 ${focusedCard && !isColumnFocused ? 'opacity-20' : ''}`}
                            >
                                {/* Column Header */}
                                <div className={`${column.color} text-white p-3 rounded-t-xl flex items-center gap-2`}>
                                    <Icon className="w-5 h-5" />
                                    <span className="font-semibold">{column.label}</span>
                                </div>

                                {/* Column Content */}
                                <div className="bg-white/80 backdrop-blur p-3 rounded-b-xl min-h-[400px] space-y-3 border border-slate-200">
                                    {allChildren.map(child => {
                                        const cards = getColumnCards(column.id, child);
                                        if (cards.length === 0) return null;

                                        return (
                                            <div key={`${child.id}-${column.id}`}>
                                                {/* Child Avatar */}
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="w-6 h-6 rounded-full bg-slate-200 overflow-hidden">
                                                        {child.identity?.profile_photo ? (
                                                            <img src={child.identity.profile_photo} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                                <User className="w-3 h-3" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className="text-xs font-medium text-slate-500">{child.identity?.full_name?.split(' ')[0]}</span>
                                                </div>

                                                {/* Cards */}
                                                {cards.map((card) => {
                                                    const isThisCardFocused = focusedCardId === card.id;
                                                    return (
                                                        <button
                                                            key={card.id}
                                                            onClick={() => handleFocus(card, child, column)}
                                                            className={`w-full bg-white rounded-lg p-3 shadow-sm hover:shadow-lg transition-all text-left group relative overflow-hidden ${
                                                                card.important ? 'border-l-4 border-rose-400' : 'border border-slate-100'
                                                            } ${card.highlight ? 'ring-2 ring-purple-200' : ''} ${
                                                                isThisCardFocused ? 'ring-2 ring-blue-500 scale-105 z-10' : ''
                                                            }`}
                                                        >
                                                            {/* Focus hint */}
                                                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <ZoomIn className="w-4 h-4 text-slate-300" />
                                                            </div>
                                                            
                                                            <p className="text-xs text-slate-400 mb-1">{card.label}</p>
                                                            <p className="text-sm text-slate-700 font-medium pr-6">{card.value}</p>
                                                            {card.detail && <p className="text-xs text-slate-400 mt-1">{card.detail}</p>}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })}

                                    {allChildren.every(c => getColumnCards(column.id, c).length === 0) && (
                                        <div className="text-center py-8 text-slate-300">
                                            <Icon className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                            <p className="text-sm">No items</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* FOCUS OVERLAY - Appears over the kanban */}
            {focusedCard && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center transition-all duration-500"
                    style={{ 
                        backgroundColor: `rgba(0, 0, 0, ${focusIntensity / 120})`,
                    }}
                    onClick={exitFocus}
                >
                    {/* The focused card - grows from original position */}
                    <div 
                        className="relative transition-all duration-500 ease-out"
                        style={{
                            transform: `scale(${0.8 + (focusIntensity / 500)})`,
                            opacity: focusIntensity / 100,
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Close instruction */}
                        <div className="absolute -top-16 left-1/2 -translate-x-1/2 text-white/60 text-sm flex items-center gap-2">
                            <span>Click anywhere to exit focus</span>
                            <span className="text-xs bg-white/10 px-2 py-0.5 rounded">ESC</span>
                        </div>

                        {/* Main focus card */}
                        <div className={`w-96 bg-gradient-to-br ${focusedCard.column.gradient} rounded-3xl shadow-2xl overflow-hidden`}>
                            {/* Header with child info */}
                            <div className="p-6 text-white">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-16 h-16 rounded-full bg-white/20 overflow-hidden ring-4 ring-white/30">
                                        {focusedCard.child.identity?.profile_photo ? (
                                            <img src={focusedCard.child.identity.profile_photo} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <User className="w-8 h-8 text-white/70" />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold">{focusedCard.child.identity?.full_name}</h3>
                                        <p className="text-white/70">{focusedCard.child.familyName}</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-2 text-white/80 text-sm">
                                    {React.createElement(focusedCard.column.icon, { className: 'w-4 h-4' })}
                                    <span>{focusedCard.column.label}</span>
                                    {focusedCard.important && (
                                        <span className="ml-2 px-2 py-0.5 bg-white/20 rounded text-xs">Important</span>
                                    )}
                                </div>
                            </div>

                            {/* Focus content - the ONE thing */}
                            <div className="bg-white p-8">
                                <p className="text-sm text-slate-500 mb-2">{focusedCard.label}</p>
                                <h2 className="text-3xl font-bold text-slate-800 mb-4 leading-tight">{focusedCard.value}</h2>
                                
                                {focusedCard.detail && (
                                    <p className="text-slate-600 mb-4">{focusedCard.detail}</p>
                                )}
                                
                                {focusedCard.extra && (
                                    <div className="flex items-center gap-2 text-slate-500 mb-4">
                                        <Sparkles className="w-4 h-4" />
                                        <span>{focusedCard.extra}</span>
                                    </div>
                                )}

                                {/* Action button */}
                                <Button 
                                    className="w-full mt-4" 
                                    onClick={() => navigate(`/child/${focusedCard.child.id}`)}
                                >
                                    View Full Profile <ChevronRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        </div>

                        {/* Close button */}
                        <button 
                            onClick={exitFocus}
                            className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-slate-100 transition-colors"
                        >
                            <X className="w-5 h-5 text-slate-600" />
                        </button>
                    </div>
                </div>
            )}

            {/* Keyboard listener for ESC */}
            {focusedCard && (
                <div 
                    tabIndex={0} 
                    onKeyDown={(e) => e.key === 'Escape' && exitFocus()}
                    className="fixed inset-0 z-40"
                    style={{ outline: 'none' }}
                    ref={el => el?.focus()}
                />
            )}
        </div>
    );
}
