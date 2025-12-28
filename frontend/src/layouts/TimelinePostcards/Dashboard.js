import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Settings, LogOut, MapPin, Calendar, X, Stamp, PenLine, Heart, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TIMELINE_COLORS = ['bg-rose-400', 'bg-blue-400', 'bg-emerald-400', 'bg-amber-400', 'bg-violet-400'];

export default function TimelinePostcardsDashboard() {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [allChildren, setAllChildren] = useState([]);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [isFlipped, setIsFlipped] = useState(false);
    const [viewMode, setViewMode] = useState('horizontal'); // 'horizontal' or 'vertical'
    const [zoom, setZoom] = useState(1);

    useEffect(() => { fetchData(); }, []);

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

            const eventList = kids.flatMap((child, i) => {
                const identity = child.identity || {};
                const school = child.school || {};
                const favorites = child.favorites || {};
                const personality = child.personality || {};
                return [
                    identity.birthday && { type: 'birth', child, date: identity.birthday, year: identity.birthday?.split('-')[0], title: `${identity.full_name} born`, location: identity.place_of_birth || 'Home', message: `Welcomed into the ${child.familyName}`, color: TIMELINE_COLORS[i % TIMELINE_COLORS.length], photo: identity.profile_photo },
                    school.school_name && { type: 'school', child, date: 'School', year: 'Now', title: 'School Life', location: school.school_name, message: school.best_school_memory || `Grade ${school.grade || 'Student'}`, color: TIMELINE_COLORS[(i+1) % TIMELINE_COLORS.length] },
                    favorites.favorite_food && { type: 'memory', child, date: 'Favorites', year: '♥', title: 'Discovered Favorites', location: favorites.favorite_restaurant || 'Kitchen', message: `Loves ${favorites.favorite_food}, ${favorites.favorite_color || 'colors'}`, color: TIMELINE_COLORS[(i+2) % TIMELINE_COLORS.length] },
                    personality.primary_love_language && { type: 'heart', child, date: 'Love', year: '∞', title: personality.primary_love_language, location: 'The Heart', message: `How ${identity.full_name} feels loved`, color: TIMELINE_COLORS[(i+3) % TIMELINE_COLORS.length] },
                ].filter(Boolean);
            }).sort((a, b) => (a.year || '').localeCompare(b.year || ''));
            setEvents(eventList);
        } catch (err) { toast.error('Failed to load'); }
        finally { setLoading(false); }
    };

    if (loading) {
        return <div className="min-h-screen bg-amber-50 flex items-center justify-center"><div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" /></div>;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 relative">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-amber-200 px-6 py-4">
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-serif text-amber-900">History You Can Hold</h1>
                        <p className="text-sm text-amber-600">Timeline + Postcards</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="bg-amber-100 rounded-lg flex mr-2">
                            <Button variant="ghost" size="sm" className={viewMode === 'horizontal' ? 'bg-amber-200' : ''} onClick={() => setViewMode('horizontal')}>Horizontal</Button>
                            <Button variant="ghost" size="sm" className={viewMode === 'vertical' ? 'bg-amber-200' : ''} onClick={() => setViewMode('vertical')}>Vertical</Button>
                        </div>
                        <Button variant="ghost" size="icon" className="text-amber-700" onClick={() => setZoom(z => Math.min(z + 0.2, 1.5))}><ZoomIn className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-amber-700" onClick={() => setZoom(z => Math.max(z - 0.2, 0.6))}><ZoomOut className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-amber-700" onClick={() => navigate('/settings')}><Settings className="w-5 h-5" /></Button>
                        <Button variant="ghost" size="icon" className="text-amber-700" onClick={() => { logout(); toast.success('Logged out'); }}><LogOut className="w-5 h-5" /></Button>
                    </div>
                </div>
            </header>

            {/* HYBRID VIEW: Timeline with embedded mini-postcards */}
            <main className="p-6" style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}>
                {viewMode === 'horizontal' ? (
                    /* HORIZONTAL TIMELINE with postcards below */
                    <div className="overflow-x-auto pb-8">
                        <div className="relative min-w-max px-8">
                            {/* Timeline Line */}
                            <div className="absolute top-8 left-0 right-0 h-1 bg-amber-300 rounded-full" />
                            
                            {/* Events */}
                            <div className="flex gap-8">
                                {events.map((event, i) => (
                                    <div key={i} className="relative flex flex-col items-center" style={{ width: 180 }}>
                                        {/* Year marker */}
                                        <div className="text-xs font-bold text-amber-600 mb-2">{event.year}</div>
                                        
                                        {/* Dot on timeline */}
                                        <button
                                            onClick={() => { setSelectedEvent(event); setIsFlipped(false); }}
                                            className={`relative z-10 w-6 h-6 rounded-full ${event.color} border-4 border-amber-50 shadow-md hover:scale-150 transition-transform cursor-pointer`}
                                        />
                                        
                                        {/* Mini Postcard Preview */}
                                        <button
                                            onClick={() => { setSelectedEvent(event); setIsFlipped(false); }}
                                            className="mt-4 w-full bg-white rounded-lg shadow-md hover:shadow-xl transition-all overflow-hidden group"
                                        >
                                            {/* Mini photo */}
                                            <div className="h-24 bg-gradient-to-br from-amber-100 to-orange-100 overflow-hidden">
                                                {event.photo ? (
                                                    <img src={event.photo} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                                ) : (
                                                    <div className={`w-full h-full ${event.color} opacity-30`} />
                                                )}
                                            </div>
                                            {/* Mini content */}
                                            <div className="p-2">
                                                <p className="font-serif text-sm text-amber-900 truncate">{event.title}</p>
                                                <p className="text-xs text-amber-500 truncate">{event.location}</p>
                                            </div>
                                            {/* Stamp corner */}
                                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Stamp className={`w-4 h-4 ${event.color.replace('bg-', 'text-')}`} />
                                            </div>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* VERTICAL TIMELINE with postcards to the side */
                    <div className="max-w-4xl mx-auto">
                        <div className="relative">
                            {/* Timeline Line */}
                            <div className="absolute left-8 top-0 bottom-0 w-1 bg-amber-300 rounded-full" />
                            
                            {/* Events */}
                            <div className="space-y-6">
                                {events.map((event, i) => (
                                    <div key={i} className="relative flex gap-6">
                                        {/* Year + Dot */}
                                        <div className="flex flex-col items-center" style={{ width: 60 }}>
                                            <span className="text-xs font-bold text-amber-600 mb-1">{event.year}</span>
                                            <button
                                                onClick={() => { setSelectedEvent(event); setIsFlipped(false); }}
                                                className={`relative z-10 w-5 h-5 rounded-full ${event.color} border-4 border-amber-50 shadow-md hover:scale-150 transition-transform`}
                                            />
                                        </div>
                                        
                                        {/* Postcard Card */}
                                        <button
                                            onClick={() => { setSelectedEvent(event); setIsFlipped(false); }}
                                            className={`flex-1 bg-white rounded-xl shadow-md hover:shadow-xl transition-all overflow-hidden flex group ${i % 2 ? 'flex-row-reverse' : ''}`}
                                        >
                                            {/* Photo side */}
                                            <div className="w-32 bg-gradient-to-br from-amber-100 to-orange-100 overflow-hidden flex-shrink-0">
                                                {event.photo ? (
                                                    <img src={event.photo} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                                ) : (
                                                    <div className={`w-full h-full ${event.color} opacity-30 flex items-center justify-center`}>
                                                        <Stamp className="w-8 h-8 text-white/50" />
                                                    </div>
                                                )}
                                            </div>
                                            {/* Content side */}
                                            <div className="flex-1 p-4 text-left">
                                                <h3 className="font-serif text-lg text-amber-900">{event.title}</h3>
                                                <div className="flex items-center gap-2 text-amber-500 text-sm mt-1">
                                                    <MapPin className="w-3 h-3" />
                                                    <span>{event.location}</span>
                                                </div>
                                                <p className="text-sm text-amber-600 mt-2 line-clamp-2">{event.message}</p>
                                            </div>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {events.length === 0 && (
                    <div className="text-center py-16">
                        <Calendar className="w-16 h-16 text-amber-300 mx-auto mb-4" />
                        <p className="text-amber-600 font-serif">No moments yet. Add children to build your timeline.</p>
                    </div>
                )}
            </main>

            {/* EXPANDED POSTCARD MODAL */}
            {selectedEvent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedEvent(null)}>
                    <div className="relative w-full max-w-lg" style={{ aspectRatio: '3/2' }} onClick={e => { e.stopPropagation(); setIsFlipped(!isFlipped); }}>
                        <button onClick={(e) => { e.stopPropagation(); setSelectedEvent(null); }} className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center z-20">
                            <X className="w-4 h-4 text-slate-600" />
                        </button>

                        <div className="relative w-full h-full transition-transform duration-500 cursor-pointer" style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0)' }}>
                            {/* Front */}
                            <div className="absolute inset-0 rounded-xl shadow-2xl overflow-hidden" style={{ backfaceVisibility: 'hidden' }}>
                                {selectedEvent.photo ? (
                                    <img src={selectedEvent.photo} alt="" className="absolute inset-0 w-full h-full object-cover" />
                                ) : (
                                    <div className={`absolute inset-0 ${selectedEvent.color} opacity-40`} />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                                <div className="absolute inset-0 p-6 flex flex-col justify-end">
                                    <h2 className="text-3xl font-serif text-white mb-2 drop-shadow-lg">{selectedEvent.title}</h2>
                                    <div className="flex items-center gap-4 text-white/80">
                                        <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{selectedEvent.location}</span>
                                        <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{selectedEvent.date}</span>
                                    </div>
                                </div>
                                <div className="absolute top-4 right-4">
                                    <div className={`w-14 h-18 border-4 border-dashed rounded flex items-center justify-center transform rotate-6 ${selectedEvent.color.replace('bg-', 'text-')} border-current`}>
                                        <Stamp className="w-7 h-7" />
                                    </div>
                                </div>
                                <p className="absolute bottom-2 left-1/2 -translate-x-1/2 text-white/50 text-xs">Tap to flip</p>
                            </div>

                            {/* Back */}
                            <div className="absolute inset-0 rounded-xl shadow-2xl bg-amber-50 p-6" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                                <div className="h-full flex">
                                    <div className="flex-1 pr-4 border-r-2 border-amber-200">
                                        <PenLine className="w-5 h-5 text-amber-400 mb-4" />
                                        <p className="font-serif text-amber-900 text-lg leading-relaxed">{selectedEvent.message}</p>
                                        <div className="mt-4 flex items-center gap-2">
                                            <Heart className="w-4 h-4 text-rose-400" />
                                            <span className="text-sm text-amber-600 font-serif italic">From {selectedEvent.child?.familyName}</span>
                                        </div>
                                        <Button variant="outline" className="mt-4 border-amber-300 text-amber-700" onClick={(e) => { e.stopPropagation(); navigate(`/child/${selectedEvent.child?.id}`); }}>
                                            View Profile
                                        </Button>
                                    </div>
                                    <div className="w-1/3 pl-4">
                                        <Stamp className={`w-10 h-12 ${selectedEvent.color.replace('bg-', 'text-')} mb-4`} />
                                        <div className="space-y-2">{[1,2,3,4].map(j => <div key={j} className="h-px bg-amber-200" />)}</div>
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
