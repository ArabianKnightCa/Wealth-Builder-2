import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Settings, LogOut, GraduationCap, Heart, Camera, Target, X, ChevronRight, User, Sparkles } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const COLUMNS = [
    { id: 'school', label: 'School', icon: GraduationCap, color: 'bg-blue-500', lightBg: 'bg-blue-50', darkBg: 'bg-blue-900' },
    { id: 'health', label: 'Health', icon: Heart, color: 'bg-red-500', lightBg: 'bg-red-50', darkBg: 'bg-red-900' },
    { id: 'moments', label: 'Moments', icon: Camera, color: 'bg-purple-500', lightBg: 'bg-purple-50', darkBg: 'bg-purple-900' },
    { id: 'goals', label: 'Goals', icon: Target, color: 'bg-green-500', lightBg: 'bg-green-50', darkBg: 'bg-green-900' },
];

export default function KanbanFocusDashboard() {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [families, setFamilies] = useState([]);
    const [allChildren, setAllChildren] = useState([]);
    const [loading, setLoading] = useState(true);
    const [focusedCard, setFocusedCard] = useState(null);

    useEffect(() => { fetchData(); }, []);

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

    const getColumnCards = (columnId, child) => {
        const school = child.school || {};
        const favorites = child.favorites || {};
        const personality = child.personality || {};
        
        switch(columnId) {
            case 'school':
                return [
                    school.school_name && { label: 'School', value: school.school_name, detail: school.grade ? `Grade ${school.grade}` : null },
                    school.favorite_subject && { label: 'Best Subject', value: school.favorite_subject },
                    school.best_school_memory && { label: 'Memory', value: school.best_school_memory },
                ].filter(Boolean);
            case 'health':
                return [
                    personality.phobias?.length && { label: 'Careful With', value: personality.phobias.join(', '), important: true },
                    favorites.favorite_food && { label: 'Loves to Eat', value: favorites.favorite_food },
                ].filter(Boolean);
            case 'moments':
                return [
                    favorites.favorite_show && { label: 'Watching', value: favorites.favorite_show },
                    favorites.favorite_game && { label: 'Playing', value: favorites.favorite_game },
                    favorites.best_song && { label: 'Listening', value: favorites.best_song },
                ].filter(Boolean);
            case 'goals':
                return [
                    personality.strengths?.length && { label: 'Strengths', value: personality.strengths.slice(0,2).join(', ') },
                    personality.primary_love_language && { label: 'Love Language', value: personality.primary_love_language },
                    personality.known_for && { label: 'Known For', value: personality.known_for },
                ].filter(Boolean);
            default:
                return [];
        }
    };

    if (loading) {
        return <div className="min-h-screen bg-slate-100 flex items-center justify-center"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;
    }

    return (
        <div className="min-h-screen bg-slate-100 relative">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-40">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">One Thing at a Time</h1>
                        <p className="text-sm text-slate-500">Tap any card to focus</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}><Settings className="w-5 h-5" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => { logout(); toast.success('Logged out'); }}><LogOut className="w-5 h-5" /></Button>
                    </div>
                </div>
            </header>

            {/* Kanban Board */}
            <div className="p-6 overflow-x-auto">
                <div className="flex gap-6 min-w-max">
                    {COLUMNS.map(column => {
                        const Icon = column.icon;
                        const hasCards = allChildren.some(c => getColumnCards(column.id, c).length > 0);

                        return (
                            <div key={column.id} className="w-72 flex-shrink-0">
                                {/* Column Header */}
                                <div className={`${column.color} text-white p-3 rounded-t-xl flex items-center gap-2`}>
                                    <Icon className="w-5 h-5" />
                                    <span className="font-semibold">{column.label}</span>
                                </div>

                                {/* Column Content */}
                                <div className={`${column.lightBg} p-3 rounded-b-xl min-h-[400px] space-y-3`}>
                                    {allChildren.map(child => {
                                        const cards = getColumnCards(column.id, child);
                                        if (cards.length === 0) return null;

                                        return (
                                            <div key={`${child.id}-${column.id}`}>
                                                {/* Child Header */}
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="w-6 h-6 rounded-full bg-white overflow-hidden">
                                                        {child.identity?.profile_photo ? (
                                                            <img src={child.identity.profile_photo} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                                <User className="w-3 h-3" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className="text-xs font-medium text-slate-600">{child.identity?.full_name?.split(' ')[0]}</span>
                                                </div>

                                                {/* Cards */}
                                                {cards.map((card, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => setFocusedCard({ ...card, child, column })}
                                                        className={`w-full bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-all text-left group ${card.important ? 'border-l-4 border-red-400' : ''}`}
                                                    >
                                                        <p className="text-xs text-slate-400 mb-1">{card.label}</p>
                                                        <p className="text-sm text-slate-700 font-medium">{card.value}</p>
                                                        {card.detail && <p className="text-xs text-slate-400 mt-1">{card.detail}</p>}
                                                    </button>
                                                ))}
                                            </div>
                                        );
                                    })}

                                    {!hasCards && (
                                        <div className="text-center py-8 text-slate-400">
                                            <Icon className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                            <p className="text-sm">No {column.label.toLowerCase()} items</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Focus Mode Overlay */}
            {focusedCard && (
                <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setFocusedCard(null)}>
                    {/* Darkened Background */}
                    <div className="absolute inset-0 bg-black/90 transition-opacity" />
                    
                    {/* Focused Card */}
                    <div 
                        className="relative w-full max-w-lg mx-4"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button onClick={() => setFocusedCard(null)} className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center z-10">
                            <X className="w-5 h-5 text-slate-600" />
                        </button>

                        {/* Card Content */}
                        <div className={`${focusedCard.column.darkBg} rounded-2xl overflow-hidden shadow-2xl`}>
                            {/* Header */}
                            <div className={`${focusedCard.column.color} p-6`}>
                                <div className="flex items-center gap-3 mb-4">
                                    {focusedCard.child.identity?.profile_photo ? (
                                        <img src={focusedCard.child.identity.profile_photo} alt="" className="w-14 h-14 rounded-full object-cover ring-4 ring-white/30" />
                                    ) : (
                                        <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                                            <User className="w-7 h-7 text-white" />
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="text-xl font-bold text-white">{focusedCard.child.identity?.full_name}</h3>
                                        <p className="text-white/70 text-sm">{focusedCard.child.familyName}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-white/80">
                                    {React.createElement(focusedCard.column.icon, { className: 'w-4 h-4' })}
                                    <span className="text-sm">{focusedCard.column.label}</span>
                                </div>
                            </div>

                            {/* Main Content */}
                            <div className="p-6 bg-white">
                                <p className="text-sm text-slate-500 mb-2">{focusedCard.label}</p>
                                <h2 className="text-3xl font-bold text-slate-800 mb-4">{focusedCard.value}</h2>
                                {focusedCard.detail && (
                                    <p className="text-slate-600 mb-4">{focusedCard.detail}</p>
                                )}

                                {focusedCard.important && (
                                    <div className="flex items-center gap-2 text-red-500 mb-4">
                                        <Sparkles className="w-4 h-4" />
                                        <span className="text-sm font-medium">Important</span>
                                    </div>
                                )}

                                <Button 
                                    className="w-full mt-4" 
                                    onClick={() => navigate(`/child/${focusedCard.child.id}`)}
                                >
                                    View Full Profile <ChevronRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        </div>

                        {/* Focus indicator */}
                        <div className="text-center mt-6 text-white/60 text-sm">
                            Click anywhere to exit focus mode
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
