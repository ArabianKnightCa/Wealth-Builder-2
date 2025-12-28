import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Settings, LogOut, Cake, Heart, GraduationCap, Star, X, Calendar, Bell, Users, ChevronRight, Camera, TrendingUp, Clock, User } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ControlHeartDashboard() {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [families, setFamilies] = useState([]);
    const [allChildren, setAllChildren] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedWidget, setExpandedWidget] = useState(null);
    const [upcomingBirthdays, setUpcomingBirthdays] = useState([]);
    const [scrapbookMode, setScrapbookMode] = useState(false);

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
            try {
                const bdayRes = await axios.get(`${API}/birthdays/upcoming?days=60`);
                setUpcomingBirthdays(bdayRes.data.upcoming_birthdays || []);
            } catch (e) {}
        } catch (err) { toast.error('Failed to load'); }
        finally { setLoading(false); }
    };

    const widgets = [
        { id: 'birthdays', title: 'Birthdays', subtitle: 'Coming up', icon: Cake, color: 'from-pink-500 to-rose-500', count: upcomingBirthdays.length, data: upcomingBirthdays },
        { id: 'families', title: 'Families', subtitle: 'Total', icon: Users, color: 'from-blue-500 to-indigo-500', count: families.length, data: families },
        { id: 'children', title: 'Children', subtitle: 'Profiles', icon: Heart, color: 'from-purple-500 to-violet-500', count: allChildren.length, data: allChildren },
        { id: 'favorites', title: 'Favorites', subtitle: 'Recorded', icon: Star, color: 'from-amber-500 to-orange-500', count: allChildren.filter(c => c.favorites?.favorite_food).length, data: allChildren.filter(c => c.favorites) },
    ];

    if (loading) {
        return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;
    }

    return (
        <div className="min-h-screen bg-slate-900 relative overflow-hidden">
            {/* LAYER 1: Dashboard Control Room (Dark, data-focused) */}
            <div className={`transition-all duration-500 ${scrapbookMode ? 'opacity-20 blur-sm' : ''}`}>
                {/* Header */}
                <header className="bg-slate-800/50 backdrop-blur border-b border-slate-700 px-6 py-4">
                    <div className="max-w-6xl mx-auto flex justify-between items-center">
                        <div>
                            <h1 className="text-xl font-bold text-white">Control Room</h1>
                            <p className="text-sm text-slate-400">with a Heart ❤️</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button 
                                variant={scrapbookMode ? "default" : "outline"} 
                                size="sm" 
                                onClick={() => setScrapbookMode(!scrapbookMode)}
                                className={scrapbookMode ? "bg-pink-500 hover:bg-pink-600" : "border-slate-600 text-slate-300"}
                            >
                                <Heart className="w-4 h-4 mr-2" />
                                {scrapbookMode ? 'Exit Memories' : 'Open Heart'}
                            </Button>
                            <Button variant="ghost" size="icon" className="text-slate-400" onClick={() => navigate('/settings')}><Settings className="w-5 h-5" /></Button>
                            <Button variant="ghost" size="icon" className="text-slate-400" onClick={() => { logout(); toast.success('Logged out'); }}><LogOut className="w-5 h-5" /></Button>
                        </div>
                    </div>
                </header>

                {/* Dashboard Widgets */}
                <main className="max-w-6xl mx-auto p-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        {widgets.map(widget => {
                            const Icon = widget.icon;
                            return (
                                <button
                                    key={widget.id}
                                    onClick={() => { setExpandedWidget(widget); setScrapbookMode(true); }}
                                    className="bg-slate-800 rounded-xl p-4 border border-slate-700 hover:border-slate-500 transition-all text-left group relative overflow-hidden"
                                >
                                    <div className={`absolute inset-0 bg-gradient-to-br ${widget.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
                                    <div className="relative">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${widget.color} flex items-center justify-center`}>
                                                <Icon className="w-5 h-5 text-white" />
                                            </div>
                                            <TrendingUp className="w-4 h-4 text-slate-600" />
                                        </div>
                                        <p className="text-3xl font-bold text-white">{widget.count}</p>
                                        <p className="text-sm text-slate-400">{widget.title}</p>
                                        <p className="text-xs text-slate-500">{widget.subtitle}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Activity Timeline */}
                    <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
                        <h3 className="text-sm font-medium text-slate-400 mb-4 flex items-center gap-2">
                            <Clock className="w-4 h-4" /> Recent Profiles
                        </h3>
                        <div className="space-y-3">
                            {allChildren.slice(0, 4).map((child, i) => (
                                <button
                                    key={child.id}
                                    onClick={() => navigate(`/child/${child.id}`)}
                                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-700/50 transition-colors text-left"
                                >
                                    <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden">
                                        {child.identity?.profile_photo ? (
                                            <img src={child.identity.profile_photo} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-500">
                                                <User className="w-4 h-4" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm text-white">{child.identity?.full_name}</p>
                                        <p className="text-xs text-slate-500">{child.familyName}</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-slate-600" />
                                </button>
                            ))}
                        </div>
                    </div>
                </main>
            </div>

            {/* LAYER 2: Scrapbook Overlay (Warm, emotional) */}
            {scrapbookMode && (
                <div className="absolute inset-0 z-50 overflow-auto" style={{ background: 'linear-gradient(135deg, #fef3e2 0%, #fce7d6 50%, #f8d7da 100%)' }}>
                    {/* Paper texture */}
                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width="100" height="100" xmlns="http://www.w3.org/2000/svg"%3E%3Cpath d="M0 0h100v100H0z" fill="%23d4a574" fill-opacity="0.1"/%3E%3C/svg%3E")' }} />
                    
                    {/* Close Button */}
                    <button 
                        onClick={() => { setScrapbookMode(false); setExpandedWidget(null); }}
                        className="fixed top-4 right-4 z-50 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-slate-100 transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-600" />
                    </button>

                    {/* Scrapbook Content */}
                    <div className="relative min-h-screen p-8">
                        {/* Title with tape effect */}
                        <div className="text-center mb-12">
                            <div className="inline-block relative">
                                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-16 h-6 bg-amber-200/80 -rotate-2" />
                                <h1 className="relative text-4xl font-serif text-amber-900 px-8 py-4">
                                    {expandedWidget?.title || 'Our Memories'}
                                </h1>
                            </div>
                        </div>

                        {/* Scattered Photos/Cards */}
                        <div className="max-w-4xl mx-auto">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                {(expandedWidget?.data || allChildren).slice(0, 9).map((item, i) => {
                                    const rotation = (i % 3 - 1) * 3;
                                    const isChild = item.identity;
                                    const isBirthday = item.days_until !== undefined;
                                    
                                    return (
                                        <button
                                            key={item.id || i}
                                            onClick={() => isChild ? navigate(`/child/${item.id}`) : isBirthday ? navigate(`/child/${item.child_id}`) : navigate(`/family/${item.id}`)}
                                            className="bg-white rounded-sm p-3 shadow-lg hover:shadow-xl transition-all hover:scale-105"
                                            style={{ transform: `rotate(${rotation}deg)` }}
                                        >
                                            {/* Polaroid-style photo */}
                                            <div className="aspect-square bg-slate-100 mb-3 overflow-hidden">
                                                {isChild && item.identity?.profile_photo ? (
                                                    <img src={item.identity.profile_photo} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-100 to-purple-100">
                                                        {isBirthday ? <Cake className="w-12 h-12 text-pink-300" /> :
                                                         isChild ? <Heart className="w-12 h-12 text-purple-300" /> :
                                                         <Users className="w-12 h-12 text-blue-300" />}
                                                    </div>
                                                )}
                                            </div>
                                            {/* Handwritten-style label */}
                                            <p className="font-serif text-amber-900 text-center">
                                                {isChild ? item.identity?.full_name : isBirthday ? item.name : item.family_name}
                                            </p>
                                            {isBirthday && (
                                                <p className="text-xs text-amber-600 text-center mt-1">
                                                    {item.days_until === 0 ? 'Today! 🎉' : `in ${item.days_until} days`}
                                                </p>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Decorative elements */}
                        <div className="absolute top-20 left-10 w-8 h-8 text-rose-300 opacity-50 transform rotate-12">♥</div>
                        <div className="absolute bottom-20 right-10 w-8 h-8 text-amber-300 opacity-50 transform -rotate-12">★</div>
                    </div>
                </div>
            )}
        </div>
    );
}
