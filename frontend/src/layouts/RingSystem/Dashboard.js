import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Settings, LogOut, Users, User, Heart, AlertTriangle, Star, GraduationCap, Sparkles, ChevronLeft, X } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import BirthdayReminders from '../../components/BirthdayReminders';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const RING_COLORS = ['#EC4899', '#8B5CF6', '#3B82F6', '#10B981'];

export default function RingSystemDashboard() {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [families, setFamilies] = useState([]);
    const [selectedFamily, setSelectedFamily] = useState(null);
    const [children, setChildren] = useState([]);
    const [selectedChild, setSelectedChild] = useState(null);
    const [expandedRing, setExpandedRing] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchFamilies(); }, []);
    useEffect(() => { if (selectedFamily) fetchChildren(); }, [selectedFamily]);

    const fetchFamilies = async () => {
        try {
            const res = await axios.get(`${API}/families`);
            setFamilies(res.data.families || []);
        } catch (err) { toast.error('Failed to load'); }
        finally { setLoading(false); }
    };

    const fetchChildren = async () => {
        try {
            const res = await axios.get(`${API}/families/${selectedFamily.id}/children`);
            setChildren(res.data.children || []);
        } catch (err) { console.error(err); }
    };

    const getRingData = (child) => {
        if (!child) return [];
        const identity = child.identity || {};
        const personality = child.personality || {};
        const favorites = child.favorites || {};
        const school = child.school || {};

        return [
            {
                id: 'core',
                label: 'Core',
                color: RING_COLORS[0],
                items: [
                    { label: 'Love Language', value: personality.primary_love_language, icon: Heart },
                    { label: 'Fears', value: personality.phobias?.join(', '), icon: AlertTriangle },
                    { label: 'Known For', value: personality.known_for, icon: Sparkles },
                ]
            },
            {
                id: 'favorites',
                label: 'Favorites',
                color: RING_COLORS[1],
                items: [
                    { label: 'Food', value: favorites.favorite_food },
                    { label: 'Color', value: favorites.favorite_color },
                    { label: 'Game', value: favorites.favorite_game },
                    { label: 'Show', value: favorites.favorite_show },
                    { label: 'Animal', value: favorites.favorite_animal },
                ]
            },
            {
                id: 'school',
                label: 'School',
                color: RING_COLORS[2],
                items: [
                    { label: 'School', value: school.school_name },
                    { label: 'Grade', value: school.grade },
                    { label: 'Best Subject', value: school.favorite_subject },
                    { label: 'Activities', value: school.school_activities?.join(', ') },
                ]
            },
            {
                id: 'more',
                label: 'More',
                color: RING_COLORS[3],
                items: [
                    { label: 'Likes', value: personality.likes?.slice(0, 3).join(', ') },
                    { label: 'Strengths', value: personality.strengths?.slice(0, 3).join(', ') },
                    { label: 'Style', value: favorites.personal_style },
                    { label: 'Languages', value: identity.languages?.join(', ') },
                ]
            },
        ];
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
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // Family Selection
    if (!selectedFamily) {
        return (
            <div className="min-h-screen bg-slate-900">
                <header className="p-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Ring System</h1>
                        <p className="text-slate-400">Focus on what matters most</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="icon" className="text-slate-400" onClick={() => navigate('/settings')}>
                            <Settings className="w-5 h-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-slate-400" onClick={() => { logout(); toast.success('Logged out'); }}>
                            <LogOut className="w-5 h-5" />
                        </Button>
                    </div>
                </header>

                <div className="px-6">
                    <BirthdayReminders />
                </div>

                <div className="p-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {families.map((family, index) => (
                        <button
                            key={family.id}
                            onClick={() => setSelectedFamily(family)}
                            className="p-6 rounded-2xl bg-slate-800 hover:bg-slate-700 transition-colors text-left group"
                        >
                            <div className="flex items-center gap-4">
                                <div 
                                    className="w-14 h-14 rounded-full flex items-center justify-center"
                                    style={{ backgroundColor: RING_COLORS[index % RING_COLORS.length] + '30' }}
                                >
                                    <Users className="w-7 h-7" style={{ color: RING_COLORS[index % RING_COLORS.length] }} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-white group-hover:text-pink-400 transition-colors">
                                        {family.family_name}
                                    </h3>
                                    <p className="text-slate-400">{family.number_of_children || 0} members</p>
                                </div>
                            </div>
                        </button>
                    ))}

                    {families.length === 0 && (
                        <div className="col-span-full text-center py-16">
                            <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
                                <Users className="w-10 h-10 text-slate-600" />
                            </div>
                            <p className="text-slate-400 text-lg">No families yet</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Child Selection
    if (!selectedChild) {
        return (
            <div className="min-h-screen bg-slate-900">
                <header className="p-6 flex items-center gap-4">
                    <Button variant="ghost" size="icon" className="text-slate-400" onClick={() => setSelectedFamily(null)}>
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-white">{selectedFamily.family_name}</h1>
                        <p className="text-slate-400">Select a profile</p>
                    </div>
                </header>

                <div className="p-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {children.map((child, index) => {
                        const age = calculateAge(child.identity?.birthday);
                        return (
                            <button
                                key={child.id}
                                onClick={() => setSelectedChild(child)}
                                className="p-6 rounded-2xl bg-slate-800 hover:bg-slate-700 transition-colors text-left group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-pink-500 to-purple-500">
                                        {child.identity?.profile_photo ? (
                                            <img src={child.identity.profile_photo} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <span className="text-2xl font-bold text-white">
                                                    {child.identity?.full_name?.charAt(0)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold text-white group-hover:text-pink-400 transition-colors">
                                            {child.identity?.full_name}
                                        </h3>
                                        {age !== null && <p className="text-slate-400">{age} years old</p>}
                                    </div>
                                </div>
                            </button>
                        );
                    })}

                    {children.length === 0 && (
                        <div className="col-span-full text-center py-16">
                            <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
                                <User className="w-10 h-10 text-slate-600" />
                            </div>
                            <p className="text-slate-400 text-lg">No profiles yet</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Ring View
    const rings = getRingData(selectedChild);
    const age = calculateAge(selectedChild.identity?.birthday);

    return (
        <div className="min-h-screen bg-slate-900">
            <header className="p-4 flex items-center justify-between">
                <Button variant="ghost" size="icon" className="text-slate-400" onClick={() => setSelectedChild(null)}>
                    <ChevronLeft className="w-5 h-5" />
                </Button>
                <Button variant="outline" size="sm" className="text-slate-300 border-slate-600" onClick={() => navigate(`/child/${selectedChild.id}`)}>
                    Edit Profile
                </Button>
            </header>

            <div className="flex flex-col items-center justify-center py-8">
                {/* Ring Visualization */}
                <div className="relative w-80 h-80">
                    {/* Rings */}
                    {rings.map((ring, index) => {
                        const size = 320 - (index * 60);
                        const isExpanded = expandedRing === ring.id;
                        return (
                            <button
                                key={ring.id}
                                onClick={() => setExpandedRing(isExpanded ? null : ring.id)}
                                className={`absolute rounded-full border-4 transition-all duration-300 ${isExpanded ? 'opacity-100 scale-105' : 'opacity-70 hover:opacity-100'}`}
                                style={{
                                    width: size,
                                    height: size,
                                    borderColor: ring.color,
                                    top: '50%',
                                    left: '50%',
                                    transform: `translate(-50%, -50%) ${isExpanded ? 'scale(1.05)' : ''}`,
                                    backgroundColor: isExpanded ? ring.color + '20' : 'transparent',
                                }}
                            >
                                <span 
                                    className="absolute text-xs font-bold"
                                    style={{ 
                                        color: ring.color,
                                        top: 8,
                                        left: '50%',
                                        transform: 'translateX(-50%)'
                                    }}
                                >
                                    {ring.label}
                                </span>
                            </button>
                        );
                    })}

                    {/* Center - Profile */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                        <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-2 ring-4 ring-pink-500/50 bg-gradient-to-br from-pink-500 to-purple-500">
                            {selectedChild.identity?.profile_photo ? (
                                <img src={selectedChild.identity.profile_photo} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <span className="text-2xl font-bold text-white">
                                        {selectedChild.identity?.full_name?.charAt(0)}
                                    </span>
                                </div>
                            )}
                        </div>
                        <h2 className="text-lg font-bold text-white">{selectedChild.identity?.full_name?.split(' ')[0]}</h2>
                        {age !== null && <p className="text-slate-400 text-sm">{age}y</p>}
                    </div>
                </div>

                {/* Legend */}
                <div className="flex gap-4 mt-6">
                    {rings.map(ring => (
                        <button
                            key={ring.id}
                            onClick={() => setExpandedRing(expandedRing === ring.id ? null : ring.id)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${expandedRing === ring.id ? 'bg-opacity-100' : 'bg-opacity-20'}`}
                            style={{ 
                                backgroundColor: expandedRing === ring.id ? ring.color : ring.color + '30',
                                color: expandedRing === ring.id ? 'white' : ring.color
                            }}
                        >
                            {ring.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Expanded Ring Content */}
            {expandedRing && (
                <div className="px-6 pb-8 animate-fade-in">
                    {rings.filter(r => r.id === expandedRing).map(ring => (
                        <div key={ring.id} className="bg-slate-800 rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold" style={{ color: ring.color }}>{ring.label}</h3>
                                <Button variant="ghost" size="icon" onClick={() => setExpandedRing(null)}>
                                    <X className="w-4 h-4 text-slate-400" />
                                </Button>
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                                {ring.items.filter(item => item.value).map((item, i) => {
                                    const Icon = item.icon;
                                    return (
                                        <div 
                                            key={i} 
                                            className="p-3 rounded-xl"
                                            style={{ backgroundColor: ring.color + '15' }}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                {Icon && <Icon className="w-4 h-4" style={{ color: ring.color }} />}
                                                <span className="text-xs text-slate-400">{item.label}</span>
                                            </div>
                                            <p className="text-white font-medium">{item.value}</p>
                                        </div>
                                    );
                                })}
                                {ring.items.filter(item => item.value).length === 0 && (
                                    <p className="text-slate-500 col-span-2 text-center py-4">No data in this ring yet</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Quick Actions */}
            {!expandedRing && (
                <div className="px-6 pb-8">
                    <p className="text-center text-slate-500 text-sm mb-4">Tap a ring to explore</p>
                    <div className="grid grid-cols-2 gap-3">
                        {rings.map(ring => {
                            const hasData = ring.items.some(item => item.value);
                            const firstItem = ring.items.find(item => item.value);
                            return (
                                <button
                                    key={ring.id}
                                    onClick={() => setExpandedRing(ring.id)}
                                    className="p-4 rounded-xl text-left transition-colors"
                                    style={{ backgroundColor: ring.color + '15' }}
                                >
                                    <p className="text-xs mb-1" style={{ color: ring.color }}>{ring.label}</p>
                                    <p className="text-white font-medium text-sm truncate">
                                        {hasData ? firstItem?.value : 'No data'}
                                    </p>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
