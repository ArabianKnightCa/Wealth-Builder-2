import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Settings, LogOut, ChevronUp, ChevronDown, Heart, Star, GraduationCap, Sparkles, User } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function FocusTunnelDashboard() {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const containerRef = useRef(null);
    const [families, setFamilies] = useState([]);
    const [allChildren, setAllChildren] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [expandedSection, setExpandedSection] = useState(null);

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

    const handleScroll = (direction) => {
        if (direction === 'up' && currentIndex > 0) {
            setCurrentIndex(i => i - 1);
            setExpandedSection(null);
        } else if (direction === 'down' && currentIndex < allChildren.length - 1) {
            setCurrentIndex(i => i + 1);
            setExpandedSection(null);
        }
    };

    const handleWheel = (e) => {
        if (e.deltaY > 0) handleScroll('down');
        else if (e.deltaY < 0) handleScroll('up');
    };

    const calculateAge = (birthday) => {
        if (!birthday) return null;
        const birth = new Date(birthday);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
        return age;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (allChildren.length === 0) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
                <Sparkles className="w-16 h-16 text-indigo-400 mb-4" />
                <h2 className="text-2xl font-light mb-2">Focus Tunnel</h2>
                <p className="text-slate-400">Add children to enter focus mode</p>
                <Button onClick={() => navigate('/settings')} variant="outline" className="mt-4 border-slate-700">
                    Get Started
                </Button>
            </div>
        );
    }

    const child = allChildren[currentIndex];
    const age = calculateAge(child?.identity?.birthday);
    const sections = [
        { id: 'heart', icon: Heart, label: 'Love', color: 'text-pink-400', bg: 'bg-pink-500/10', data: child?.personality?.primary_love_language },
        { id: 'school', icon: GraduationCap, label: 'School', color: 'text-blue-400', bg: 'bg-blue-500/10', data: child?.school?.school_name },
        { id: 'favorites', icon: Star, label: 'Favorites', color: 'text-amber-400', bg: 'bg-amber-500/10', data: child?.favorites?.favorite_food },
        { id: 'personality', icon: Sparkles, label: 'Personality', color: 'text-purple-400', bg: 'bg-purple-500/10', data: child?.personality?.strengths?.join(', ') },
    ];

    return (
        <div
            ref={containerRef}
            className="min-h-screen bg-slate-950 overflow-hidden relative"
            onWheel={handleWheel}
        >
            {/* Ambient glow */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
            </div>

            {/* Header */}
            <header className="absolute top-0 left-0 right-0 z-50 p-6 flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-light text-white">Focus Tunnel</h1>
                    <p className="text-xs text-slate-500">One at a time. Full attention.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="text-slate-500" onClick={() => navigate('/settings')}>
                        <Settings className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-slate-500" onClick={() => { logout(); toast.success('Logged out'); }}>
                        <LogOut className="w-5 h-5" />
                    </Button>
                </div>
            </header>

            {/* Navigation Hints */}
            {currentIndex > 0 && (
                <button
                    onClick={() => handleScroll('up')}
                    className="absolute top-24 left-1/2 -translate-x-1/2 z-40 text-slate-600 hover:text-slate-400 transition-colors"
                >
                    <div className="flex flex-col items-center">
                        <ChevronUp className="w-8 h-8 animate-bounce" />
                        <span className="text-xs opacity-50">{allChildren[currentIndex - 1]?.identity?.full_name}</span>
                    </div>
                </button>
            )}

            {currentIndex < allChildren.length - 1 && (
                <button
                    onClick={() => handleScroll('down')}
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 text-slate-600 hover:text-slate-400 transition-colors"
                >
                    <div className="flex flex-col items-center">
                        <span className="text-xs opacity-50">{allChildren[currentIndex + 1]?.identity?.full_name}</span>
                        <ChevronDown className="w-8 h-8 animate-bounce" />
                    </div>
                </button>
            )}

            {/* Main Content */}
            <div className="min-h-screen flex flex-col items-center justify-center px-6 relative z-10">
                {/* Profile Photo */}
                <div className="w-32 h-32 rounded-full overflow-hidden mb-6 ring-4 ring-indigo-500/30 shadow-2xl shadow-indigo-500/20">
                    {child?.identity?.profile_photo ? (
                        <img src={child.identity.profile_photo} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                            <span className="text-4xl font-bold text-white">
                                {child?.identity?.full_name?.charAt(0)}
                            </span>
                        </div>
                    )}
                </div>

                {/* Name */}
                <h2 className="text-4xl font-light text-white mb-2 text-center">
                    {child?.identity?.full_name}
                </h2>
                <p className="text-slate-400 mb-1">{child?.familyName}</p>
                {age !== null && <p className="text-slate-500 text-sm mb-8">{age} years old</p>}

                {/* Sections */}
                <div className="w-full max-w-md space-y-3">
                    {sections.map(section => {
                        const Icon = section.icon;
                        const isExpanded = expandedSection === section.id;
                        if (!section.data) return null;

                        return (
                            <button
                                key={section.id}
                                onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                                className={`w-full p-4 rounded-xl ${section.bg} backdrop-blur border border-white/5 text-left transition-all ${isExpanded ? 'scale-105' : 'hover:scale-102'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <Icon className={`w-5 h-5 ${section.color}`} />
                                    <div className="flex-1">
                                        <p className={`text-xs ${section.color} mb-1`}>{section.label}</p>
                                        <p className="text-white font-medium">{section.data}</p>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* View Full Profile */}
                <Button
                    variant="outline"
                    className="mt-8 border-slate-700 text-slate-300"
                    onClick={() => navigate(`/child/${child?.id}`)}
                >
                    View Full Profile
                </Button>
            </div>

            {/* Progress Indicator */}
            <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-2">
                {allChildren.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => { setCurrentIndex(i); setExpandedSection(null); }}
                        className={`w-2 h-2 rounded-full transition-all ${i === currentIndex ? 'bg-indigo-500 scale-150' : 'bg-slate-700 hover:bg-slate-600'}`}
                    />
                ))}
            </div>

            {/* Counter */}
            <div className="absolute bottom-6 left-6 text-slate-600 text-sm">
                {currentIndex + 1} / {allChildren.length}
            </div>
        </div>
    );
}
