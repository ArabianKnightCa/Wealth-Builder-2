import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Settings, LogOut, Cake, Heart, GraduationCap, Star, X, Calendar, Bell, Users, ChevronRight, Camera } from 'lucide-react';
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

            // Fetch birthdays
            try {
                const bdayRes = await axios.get(`${API}/birthdays/upcoming?days=60`);
                setUpcomingBirthdays(bdayRes.data.upcoming_birthdays || []);
            } catch (e) {}
        } catch (err) { toast.error('Failed to load'); }
        finally { setLoading(false); }
    };

    const widgets = [
        { id: 'birthdays', title: 'Birthdays', icon: Cake, color: 'bg-pink-500', count: upcomingBirthdays.length, data: upcomingBirthdays },
        { id: 'families', title: 'Families', icon: Users, color: 'bg-blue-500', count: families.length, data: families },
        { id: 'children', title: 'Children', icon: Heart, color: 'bg-purple-500', count: allChildren.length, data: allChildren },
        { id: 'favorites', title: 'Favorites', icon: Star, color: 'bg-amber-500', count: allChildren.filter(c => c.favorites?.favorite_food).length, data: allChildren.filter(c => c.favorites?.favorite_food) },
    ];

    if (loading) {
        return <div className="min-h-screen bg-slate-100 flex items-center justify-center"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;
    }

    return (
        <div className="min-h-screen bg-slate-100">
            {/* Clean Header */}
            <header className="bg-white border-b border-slate-200 px-6 py-4">
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">Control Room</h1>
                        <p className="text-sm text-slate-500">with a Heart</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}><Settings className="w-5 h-5" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => { logout(); toast.success('Logged out'); }}><LogOut className="w-5 h-5" /></Button>
                    </div>
                </div>
            </header>

            {/* Dashboard Widgets */}
            <main className="max-w-6xl mx-auto p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {widgets.map(widget => {
                        const Icon = widget.icon;
                        return (
                            <button
                                key={widget.id}
                                onClick={() => setExpandedWidget(widget)}
                                className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all text-left group"
                            >
                                <div className={`w-10 h-10 rounded-lg ${widget.color} flex items-center justify-center mb-3`}>
                                    <Icon className="w-5 h-5 text-white" />
                                </div>
                                <p className="text-2xl font-bold text-slate-800">{widget.count}</p>
                                <p className="text-sm text-slate-500">{widget.title}</p>
                                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 mt-2 transition-colors" />
                            </button>
                        );
                    })}
                </div>

                {/* Quick Access Grid */}
                <h2 className="text-lg font-semibold text-slate-700 mb-4">Quick Access</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {allChildren.slice(0, 8).map(child => (
                        <button
                            key={child.id}
                            onClick={() => navigate(`/child/${child.id}`)}
                            className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all text-left"
                        >
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 mb-3 overflow-hidden">
                                {child.identity?.profile_photo ? (
                                    <img src={child.identity.profile_photo} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-purple-400 font-bold">
                                        {child.identity?.full_name?.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <p className="font-medium text-slate-800 truncate">{child.identity?.full_name}</p>
                            <p className="text-xs text-slate-400">{child.familyName}</p>
                        </button>
                    ))}
                </div>
            </main>

            {/* Scrapbook Overlay */}
            {expandedWidget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setExpandedWidget(null)}>
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
                    <div 
                        className="relative w-full max-w-2xl max-h-[80vh] overflow-auto rounded-3xl shadow-2xl"
                        onClick={e => e.stopPropagation()}
                        style={{ background: 'linear-gradient(135deg, #fef3e2 0%, #fce7d6 50%, #f8d7da 100%)' }}
                    >
                        {/* Scrapbook Texture */}
                        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%239C92AC" fill-opacity="0.1"%3E%3Cpath d="M0 0h40v40H0V0zm1 1h38v38H1V1z"/%3E%3C/g%3E%3C/svg%3E")' }} />
                        
                        {/* Close Button */}
                        <button onClick={() => setExpandedWidget(null)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center shadow-md z-10">
                            <X className="w-4 h-4 text-slate-600" />
                        </button>

                        {/* Scrapbook Content */}
                        <div className="relative p-8">
                            {/* Title Tape */}
                            <div className="inline-block px-4 py-2 bg-amber-200/80 -rotate-2 mb-6 shadow-sm">
                                <h2 className="text-2xl font-bold text-amber-900 font-serif">{expandedWidget.title}</h2>
                            </div>

                            {/* Content Cards */}
                            <div className="space-y-4">
                                {expandedWidget.id === 'birthdays' && expandedWidget.data.map((bday, i) => (
                                    <div key={i} className={`bg-white/70 rounded-xl p-4 shadow-md transform ${i % 2 ? 'rotate-1' : '-rotate-1'}`}>
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center">
                                                <Cake className="w-6 h-6 text-pink-500" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800">{bday.name}</p>
                                                <p className="text-sm text-slate-500">Turning {bday.turning_age} in {bday.days_until} days</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {expandedWidget.id === 'families' && expandedWidget.data.map((fam, i) => (
                                    <button key={fam.id} onClick={() => navigate(`/family/${fam.id}`)} className={`w-full bg-white/70 rounded-xl p-4 shadow-md transform ${i % 2 ? 'rotate-1' : '-rotate-1'} hover:scale-102 transition-transform text-left`}>
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                                                <Users className="w-6 h-6 text-blue-500" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800 font-serif">{fam.family_name}</p>
                                                <p className="text-sm text-slate-500">{fam.number_of_children || 0} members</p>
                                            </div>
                                            <Camera className="w-5 h-5 text-slate-300 ml-auto" />
                                        </div>
                                    </button>
                                ))}

                                {(expandedWidget.id === 'children' || expandedWidget.id === 'favorites') && expandedWidget.data.map((child, i) => (
                                    <button key={child.id} onClick={() => navigate(`/child/${child.id}`)} className={`w-full bg-white/70 rounded-xl p-4 shadow-md transform ${i % 2 ? 'rotate-1' : '-rotate-1'} hover:scale-102 transition-transform text-left`}>
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-purple-100 overflow-hidden flex items-center justify-center">
                                                {child.identity?.profile_photo ? (
                                                    <img src={child.identity.profile_photo} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <Heart className="w-6 h-6 text-purple-500" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800 font-serif">{child.identity?.full_name}</p>
                                                <p className="text-sm text-slate-500">
                                                    {expandedWidget.id === 'favorites' ? `Loves ${child.favorites?.favorite_food}` : child.familyName}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                ))}

                                {expandedWidget.data.length === 0 && (
                                    <div className="text-center py-8 text-slate-500 font-serif italic">
                                        No {expandedWidget.title.toLowerCase()} yet
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
