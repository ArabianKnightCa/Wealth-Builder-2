import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Settings, LogOut, MapPin, Calendar, ChevronLeft, ChevronRight, Heart, Stamp, PenLine } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const STAMP_COLORS = ['text-red-400', 'text-blue-400', 'text-green-400', 'text-purple-400', 'text-amber-400'];

export default function MemoryPostcardsDashboard() {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [families, setFamilies] = useState([]);
    const [allChildren, setAllChildren] = useState([]);
    const [postcards, setPostcards] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
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

            // Generate postcards from children data
            const cards = kids.flatMap(child => {
                const identity = child.identity || {};
                const school = child.school || {};
                const favorites = child.favorites || {};
                const personality = child.personality || {};

                return [
                    identity.full_name && {
                        type: 'intro',
                        childId: child.id,
                        title: `Greetings from ${identity.full_name}!`,
                        location: identity.place_of_birth || 'Home',
                        date: identity.birthday,
                        message: `Part of the ${child.familyName}`,
                        photo: identity.profile_photo,
                    },
                    school.school_name && {
                        type: 'school',
                        childId: child.id,
                        title: 'School Days',
                        location: school.school_name,
                        date: school.grade ? `Grade ${school.grade}` : 'Student',
                        message: school.best_school_memory || `Studying at ${school.school_name}`,
                        photo: null,
                    },
                    favorites.favorite_food && {
                        type: 'favorites',
                        childId: child.id,
                        title: 'Favorite Things',
                        location: favorites.favorite_restaurant || 'Kitchen',
                        date: 'Always',
                        message: `Loves ${favorites.favorite_food}, ${favorites.favorite_color || 'colors'}, and ${favorites.favorite_show || 'fun'}!`,
                        photo: null,
                    },
                    personality.primary_love_language && {
                        type: 'love',
                        childId: child.id,
                        title: 'With Love',
                        location: 'The Heart',
                        date: 'Forever',
                        message: `Speaks the language of ${personality.primary_love_language}`,
                        photo: null,
                    },
                ].filter(Boolean);
            });
            setPostcards(cards);
        } catch (err) { toast.error('Failed to load'); }
        finally { setLoading(false); }
    };

    const nextCard = () => {
        setIsFlipped(false);
        setTimeout(() => setCurrentIndex(i => Math.min(i + 1, postcards.length - 1)), 150);
    };

    const prevCard = () => {
        setIsFlipped(false);
        setTimeout(() => setCurrentIndex(i => Math.max(i - 1, 0)), 150);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-amber-50 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (postcards.length === 0) {
        return (
            <div className="min-h-screen bg-amber-50 flex flex-col items-center justify-center p-6">
                <Stamp className="w-16 h-16 text-amber-300 mb-4" />
                <h2 className="text-xl font-serif text-amber-800 mb-2">No Postcards Yet</h2>
                <p className="text-amber-600">Add children to create memory postcards</p>
                <Button onClick={() => navigate('/settings')} className="mt-4 bg-amber-600 hover:bg-amber-700">Get Started</Button>
            </div>
        );
    }

    const postcard = postcards[currentIndex];
    const stampColor = STAMP_COLORS[currentIndex % STAMP_COLORS.length];

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-100 via-orange-50 to-rose-50">
            {/* Header */}
            <header className="p-6 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-serif text-amber-900">Memory Postcards</h1>
                    <p className="text-amber-600 text-sm">Swipe through memories</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="text-amber-700" onClick={() => navigate('/settings')}>
                        <Settings className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-amber-700" onClick={() => { logout(); toast.success('Logged out'); }}>
                        <LogOut className="w-5 h-5" />
                    </Button>
                </div>
            </header>

            {/* Postcard Display */}
            <div className="flex items-center justify-center px-6 py-8">
                <div
                    className="relative w-full max-w-lg cursor-pointer perspective-1000"
                    onClick={() => setIsFlipped(!isFlipped)}
                    style={{ aspectRatio: '3/2' }}
                >
                    <div
                        className="relative w-full h-full transition-transform duration-500"
                        style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0)' }}
                    >
                        {/* Front */}
                        <div
                            className="absolute inset-0 rounded-xl shadow-2xl overflow-hidden"
                            style={{ backfaceVisibility: 'hidden' }}
                        >
                            {postcard.photo ? (
                                <img src={postcard.photo} alt="" className="absolute inset-0 w-full h-full object-cover" />
                            ) : (
                                <div className="absolute inset-0 bg-gradient-to-br from-amber-200 to-orange-200" />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                            
                            {/* Postcard styling */}
                            <div className="absolute inset-0 p-6 flex flex-col justify-end">
                                <h2 className="text-3xl font-serif text-white mb-2 drop-shadow-lg">{postcard.title}</h2>
                                <div className="flex items-center gap-4 text-white/80">
                                    <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{postcard.location}</span>
                                    <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{postcard.date}</span>
                                </div>
                            </div>

                            {/* Stamp */}
                            <div className="absolute top-4 right-4">
                                <div className={`w-16 h-20 border-4 border-dashed rounded flex items-center justify-center transform rotate-6 ${stampColor} border-current`}>
                                    <Stamp className="w-8 h-8" />
                                </div>
                            </div>
                        </div>

                        {/* Back */}
                        <div
                            className="absolute inset-0 rounded-xl shadow-2xl bg-amber-50 p-6"
                            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                        >
                            {/* Postcard lines */}
                            <div className="h-full flex">
                                <div className="flex-1 pr-4 border-r-2 border-amber-200">
                                    <PenLine className="w-5 h-5 text-amber-400 mb-4" />
                                    <p className="font-serif text-amber-900 text-lg leading-relaxed">{postcard.message}</p>
                                    <div className="mt-4 flex items-center gap-2">
                                        <Heart className="w-4 h-4 text-rose-400" />
                                        <span className="text-sm text-amber-600 font-serif italic">With love</span>
                                    </div>
                                </div>
                                <div className="w-1/3 pl-4">
                                    <div className={`w-12 h-14 border-2 border-dashed rounded mb-4 ${stampColor} border-current flex items-center justify-center`}>
                                        <Stamp className="w-6 h-6" />
                                    </div>
                                    <div className="space-y-2">
                                        {[1,2,3,4].map(i => (
                                            <div key={i} className="h-px bg-amber-200" />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-center gap-4 pb-8">
                <Button
                    variant="outline"
                    size="lg"
                    onClick={prevCard}
                    disabled={currentIndex === 0}
                    className="rounded-full border-amber-300 text-amber-700"
                >
                    <ChevronLeft className="w-6 h-6" />
                </Button>
                <div className="text-amber-700 font-serif">
                    {currentIndex + 1} of {postcards.length}
                </div>
                <Button
                    variant="outline"
                    size="lg"
                    onClick={nextCard}
                    disabled={currentIndex === postcards.length - 1}
                    className="rounded-full border-amber-300 text-amber-700"
                >
                    <ChevronRight className="w-6 h-6" />
                </Button>
            </div>

            {/* View Profile Button */}
            <div className="text-center pb-8">
                <Button
                    variant="outline"
                    onClick={() => navigate(`/child/${postcard.childId}`)}
                    className="border-amber-300 text-amber-700 font-serif"
                >
                    View Full Profile
                </Button>
            </div>

            <p className="text-center text-amber-500 text-sm pb-6">Tap card to flip</p>
        </div>
    );
}
