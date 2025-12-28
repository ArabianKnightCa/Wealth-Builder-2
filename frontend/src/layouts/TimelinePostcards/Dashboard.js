import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Settings, LogOut, MapPin, Calendar, X, ChevronLeft, ChevronRight, Stamp, PenLine, Heart } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TIMELINE_COLORS = ['bg-rose-400', 'bg-blue-400', 'bg-emerald-400', 'bg-amber-400', 'bg-violet-400'];

export default function TimelinePostcardsDashboard() {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [families, setFamilies] = useState([]);
    const [allChildren, setAllChildren] = useState([]);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [isFlipped, setIsFlipped] = useState(false);

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

            // Generate timeline events
            const eventList = kids.flatMap((child, i) => {
                const identity = child.identity || {};
                const school = child.school || {};
                const favorites = child.favorites || {};
                const personality = child.personality || {};

                return [
                    identity.birthday && { type: 'birth', child, date: identity.birthday, title: `${identity.full_name} was born`, location: identity.place_of_birth || 'Home', message: `Welcomed into the ${child.familyName}`, color: TIMELINE_COLORS[i % TIMELINE_COLORS.length] },
                    school.school_name && { type: 'school', child, date: 'School Years', title: 'Started School', location: school.school_name, message: school.best_school_memory || `Learning in ${school.grade || 'their grade'}`, color: TIMELINE_COLORS[(i+1) % TIMELINE_COLORS.length] },
                    favorites.favorite_food && { type: 'memory', child, date: 'A Favorite Moment', title: 'Discovered a Love', location: favorites.favorite_restaurant || 'Kitchen', message: `Found their love for ${favorites.favorite_food}`, color: TIMELINE_COLORS[(i+2) % TIMELINE_COLORS.length] },
                    personality.primary_love_language && { type: 'heart', child, date: 'Always', title: 'Love Language Found', location: 'The Heart', message: `Speaks ${personality.primary_love_language}`, color: TIMELINE_COLORS[(i+3) % TIMELINE_COLORS.length] },
                ].filter(Boolean);
            });

            setEvents(eventList);
        } catch (err) { toast.error('Failed to load'); }
        finally { setLoading(false); }
    };

    if (loading) {
        return <div className="min-h-screen bg-amber-50 flex items-center justify-center"><div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" /></div>;
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur border-b border-amber-200 px-6 py-4 sticky top-0 z-40">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-serif text-amber-900">History You Can Hold</h1>
                        <p className="text-sm text-amber-600">Tap any moment to see its postcard</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="icon" className="text-amber-700" onClick={() => navigate('/settings')}><Settings className="w-5 h-5" /></Button>
                        <Button variant="ghost" size="icon" className="text-amber-700" onClick={() => { logout(); toast.success('Logged out'); }}><LogOut className="w-5 h-5" /></Button>
                    </div>
                </div>
            </header>

            {/* Timeline */}
            <main className="max-w-4xl mx-auto px-6 py-8">
                <div className="relative">
                    {/* Timeline Line */}
                    <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-amber-300" />

                    {/* Events */}
                    <div className="space-y-8">
                        {events.map((event, i) => (
                            <div key={i} className="relative pl-16">
                                {/* Dot */}
                                <button
                                    onClick={() => { setSelectedEvent(event); setIsFlipped(false); }}
                                    className={`absolute left-4 w-5 h-5 rounded-full ${event.color} border-4 border-amber-50 shadow-md hover:scale-125 transition-transform z-10`}
                                />

                                {/* Event Card */}
                                <button
                                    onClick={() => { setSelectedEvent(event); setIsFlipped(false); }}
                                    className="w-full bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all text-left group border border-amber-100"
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-xs text-amber-500 mb-1">{event.date}</p>
                                            <h3 className="font-serif text-lg text-amber-900">{event.title}</h3>
                                            <p className="text-sm text-amber-600 mt-1">{event.location}</p>
                                        </div>
                                        {event.child?.identity?.profile_photo && (
                                            <div className="w-10 h-10 rounded-full overflow-hidden ml-4 flex-shrink-0">
                                                <img src={event.child.identity.profile_photo} alt="" className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                    </div>
                                </button>
                            </div>
                        ))}

                        {events.length === 0 && (
                            <div className="text-center py-16">
                                <Calendar className="w-16 h-16 text-amber-300 mx-auto mb-4" />
                                <p className="text-amber-600 font-serif">No moments yet. Add children to build your timeline.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Postcard Modal */}
            {selectedEvent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelectedEvent(null)}>
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                    
                    {/* Postcard */}
                    <div 
                        className="relative w-full max-w-lg cursor-pointer"
                        style={{ aspectRatio: '3/2' }}
                        onClick={e => { e.stopPropagation(); setIsFlipped(!isFlipped); }}
                    >
                        <button onClick={() => setSelectedEvent(null)} className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center z-20">
                            <X className="w-4 h-4 text-slate-600" />
                        </button>

                        <div className="relative w-full h-full transition-transform duration-500" style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0)' }}>
                            {/* Front */}
                            <div className="absolute inset-0 rounded-xl shadow-2xl overflow-hidden" style={{ backfaceVisibility: 'hidden' }}>
                                {selectedEvent.child?.identity?.profile_photo ? (
                                    <img src={selectedEvent.child.identity.profile_photo} alt="" className="absolute inset-0 w-full h-full object-cover" />
                                ) : (
                                    <div className={`absolute inset-0 ${selectedEvent.color} opacity-30`} />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                
                                <div className="absolute inset-0 p-6 flex flex-col justify-end">
                                    <h2 className="text-3xl font-serif text-white mb-2 drop-shadow-lg">{selectedEvent.title}</h2>
                                    <div className="flex items-center gap-4 text-white/80">
                                        <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{selectedEvent.location}</span>
                                        <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{selectedEvent.date}</span>
                                    </div>
                                </div>

                                {/* Stamp */}
                                <div className="absolute top-4 right-4">
                                    <div className={`w-14 h-18 border-4 border-dashed rounded flex items-center justify-center transform rotate-6 ${selectedEvent.color.replace('bg-', 'text-')} border-current`}>
                                        <Stamp className="w-7 h-7" />
                                    </div>
                                </div>

                                <p className="absolute bottom-2 left-1/2 -translate-x-1/2 text-white/60 text-xs">Tap to flip</p>
                            </div>

                            {/* Back */}
                            <div className="absolute inset-0 rounded-xl shadow-2xl bg-amber-50 p-6" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                                <div className="h-full flex">
                                    <div className="flex-1 pr-4 border-r-2 border-amber-200">
                                        <PenLine className="w-5 h-5 text-amber-400 mb-4" />
                                        <p className="font-serif text-amber-900 text-lg leading-relaxed">{selectedEvent.message}</p>
                                        <div className="mt-4 flex items-center gap-2">
                                            <Heart className="w-4 h-4 text-rose-400" />
                                            <span className="text-sm text-amber-600 font-serif italic">With love from {selectedEvent.child?.familyName}</span>
                                        </div>
                                        <Button variant="outline" className="mt-6 border-amber-300 text-amber-700" onClick={(e) => { e.stopPropagation(); navigate(`/child/${selectedEvent.child?.id}`); }}>
                                            View Profile
                                        </Button>
                                    </div>
                                    <div className="w-1/3 pl-4">
                                        <div className={`w-10 h-12 border-2 border-dashed rounded mb-4 ${selectedEvent.color.replace('bg-', 'text-')} border-current flex items-center justify-center`}>
                                            <Stamp className="w-5 h-5" />
                                        </div>
                                        <div className="space-y-2">
                                            {[1,2,3,4].map(j => <div key={j} className="h-px bg-amber-200" />)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
