import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Settings, LogOut, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, RotateCcw, Users, Heart, AlertTriangle, Sparkles, Star } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CARD_COLORS = [
    'from-rose-400 to-pink-500',
    'from-blue-400 to-indigo-500',
    'from-green-400 to-emerald-500',
    'from-amber-400 to-orange-500',
    'from-purple-400 to-violet-500',
    'from-cyan-400 to-teal-500',
];

export default function FlashcardModeDashboard() {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [families, setFamilies] = useState([]);
    const [allChildren, setAllChildren] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [loading, setLoading] = useState(true);
    const [mode, setMode] = useState('select'); // 'select' or 'flashcard'
    const [selectedFamily, setSelectedFamily] = useState(null);
    const cardRef = useRef(null);
    const [startX, setStartX] = useState(0);
    const [startY, setStartY] = useState(0);

    useEffect(() => { fetchFamilies(); }, []);

    const fetchFamilies = async () => {
        try {
            const res = await axios.get(`${API}/families`);
            const fams = res.data.families || [];
            setFamilies(fams);

            // Fetch all children
            let allKids = [];
            for (const fam of fams) {
                const childRes = await axios.get(`${API}/families/${fam.id}/children`);
                const children = (childRes.data.children || []).map(c => ({ ...c, familyName: fam.family_name, familyId: fam.id }));
                allKids = [...allKids, ...children];
            }
            setAllChildren(allKids);
        } catch (err) { toast.error('Failed to load'); }
        finally { setLoading(false); }
    };

    const startFlashcards = (family = null) => {
        setSelectedFamily(family);
        setCurrentIndex(0);
        setIsFlipped(false);
        setMode('flashcard');
    };

    const filteredChildren = selectedFamily 
        ? allChildren.filter(c => c.familyId === selectedFamily.id)
        : allChildren;

    const currentChild = filteredChildren[currentIndex];

    const nextCard = () => {
        if (currentIndex < filteredChildren.length - 1) {
            setIsFlipped(false);
            setTimeout(() => setCurrentIndex(i => i + 1), 150);
        }
    };

    const prevCard = () => {
        if (currentIndex > 0) {
            setIsFlipped(false);
            setTimeout(() => setCurrentIndex(i => i - 1), 150);
        }
    };

    const goToProfile = () => {
        if (currentChild) navigate(`/child/${currentChild.id}`);
    };

    const handleTouchStart = (e) => {
        setStartX(e.touches[0].clientX);
        setStartY(e.touches[0].clientY);
    };

    const handleTouchEnd = (e) => {
        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        const diffX = endX - startX;
        const diffY = endY - startY;

        if (Math.abs(diffX) > Math.abs(diffY)) {
            if (diffX > 50) prevCard();
            else if (diffX < -50) nextCard();
        } else {
            if (diffY < -50) goToProfile();
            else if (diffY > 50) setIsFlipped(f => !f);
        }
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
            <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // Family Selection Mode
    if (mode === 'select') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 p-6">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Flashcard Mode</h1>
                        <p className="text-purple-200">Quick refresh before visits</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="icon" className="text-white" onClick={() => navigate('/settings')}>
                            <Settings className="w-5 h-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-white" onClick={() => { logout(); toast.success('Logged out'); }}>
                            <LogOut className="w-5 h-5" />
                        </Button>
                    </div>
                </header>

                <div className="max-w-2xl mx-auto space-y-4">
                    {/* All Kids Option */}
                    <button
                        onClick={() => startFlashcards(null)}
                        className="w-full p-6 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 text-white text-left hover:scale-[1.02] transition-transform shadow-xl"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                                <Sparkles className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">All Kids</h3>
                                <p className="text-white/80">{allChildren.length} flashcards</p>
                            </div>
                        </div>
                    </button>

                    {/* Family Options */}
                    {families.map((family, index) => {
                        const childCount = allChildren.filter(c => c.familyId === family.id).length;
                        return (
                            <button
                                key={family.id}
                                onClick={() => startFlashcards(family)}
                                className={`w-full p-6 rounded-2xl bg-gradient-to-r ${CARD_COLORS[index % CARD_COLORS.length]} text-white text-left hover:scale-[1.02] transition-transform shadow-xl`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                                        <Users className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold">{family.family_name}</h3>
                                        <p className="text-white/80">{childCount} flashcards</p>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    }

    // Flashcard Mode
    if (!currentChild) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 flex flex-col items-center justify-center p-6">
                <div className="text-center text-white">
                    <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <h2 className="text-2xl font-bold mb-2">No flashcards</h2>
                    <p className="text-purple-200 mb-6">Add children to get started</p>
                    <Button onClick={() => setMode('select')} variant="outline" className="text-white border-white">
                        Go Back
                    </Button>
                </div>
            </div>
        );
    }

    const age = calculateAge(currentChild.identity?.birthday);
    const colorClass = CARD_COLORS[currentIndex % CARD_COLORS.length];
    const personality = currentChild.personality || {};
    const favorites = currentChild.favorites || {};

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 flex flex-col">
            {/* Header */}
            <header className="p-4 flex justify-between items-center">
                <Button variant="ghost" className="text-white gap-2" onClick={() => setMode('select')}>
                    <ChevronLeft className="w-4 h-4" />
                    Back
                </Button>
                <div className="text-white text-center">
                    <p className="text-sm text-purple-200">{currentIndex + 1} / {filteredChildren.length}</p>
                </div>
                <Button variant="ghost" size="icon" className="text-white" onClick={() => { setCurrentIndex(0); setIsFlipped(false); }}>
                    <RotateCcw className="w-5 h-5" />
                </Button>
            </header>

            {/* Card Area */}
            <div className="flex-1 flex items-center justify-center p-6">
                <div
                    ref={cardRef}
                    className="relative w-full max-w-sm aspect-[3/4] cursor-pointer perspective-1000"
                    onClick={() => setIsFlipped(f => !f)}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                >
                    <div className={`relative w-full h-full transition-transform duration-500 transform-style-preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`} style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0)' }}>
                        {/* Front */}
                        <div 
                            className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${colorClass} shadow-2xl flex flex-col items-center justify-center p-6 backface-hidden`}
                            style={{ backfaceVisibility: 'hidden' }}
                        >
                            <div className="w-32 h-32 rounded-full bg-white/20 mb-6 overflow-hidden border-4 border-white/30">
                                {currentChild.identity?.profile_photo ? (
                                    <img src={currentChild.identity.profile_photo} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <span className="text-5xl font-bold text-white/70">
                                            {currentChild.identity?.full_name?.charAt(0)}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <h2 className="text-3xl font-bold text-white text-center mb-2">
                                {currentChild.identity?.full_name}
                            </h2>
                            {age !== null && (
                                <p className="text-xl text-white/80">{age} years old</p>
                            )}
                            <p className="text-sm text-white/60 mt-2">{currentChild.familyName}</p>
                            <p className="text-white/50 text-sm mt-6">Tap to flip</p>
                        </div>

                        {/* Back */}
                        <div 
                            className="absolute inset-0 rounded-3xl bg-white shadow-2xl p-6 overflow-y-auto backface-hidden"
                            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                        >
                            <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">Quick Facts</h3>
                            
                            <div className="space-y-3">
                                {personality.primary_love_language && (
                                    <div className="flex items-center gap-2 p-3 rounded-xl bg-pink-50">
                                        <Heart className="w-5 h-5 text-pink-500" />
                                        <div>
                                            <p className="text-xs text-gray-500">Love Language</p>
                                            <p className="font-medium text-gray-800">{personality.primary_love_language}</p>
                                        </div>
                                    </div>
                                )}

                                {personality.phobias?.length > 0 && (
                                    <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50">
                                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                                        <div>
                                            <p className="text-xs text-gray-500">Be Careful Of</p>
                                            <p className="font-medium text-gray-800">{personality.phobias.join(', ')}</p>
                                        </div>
                                    </div>
                                )}

                                {favorites.favorite_food && (
                                    <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50">
                                        <Star className="w-5 h-5 text-green-500" />
                                        <div>
                                            <p className="text-xs text-gray-500">Favorite Food</p>
                                            <p className="font-medium text-gray-800">{favorites.favorite_food}</p>
                                        </div>
                                    </div>
                                )}

                                {favorites.favorite_game && (
                                    <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-50">
                                        <Sparkles className="w-5 h-5 text-blue-500" />
                                        <div>
                                            <p className="text-xs text-gray-500">Current Obsession</p>
                                            <p className="font-medium text-gray-800">{favorites.favorite_game}</p>
                                        </div>
                                    </div>
                                )}

                                {personality.likes?.length > 0 && (
                                    <div className="p-3 rounded-xl bg-purple-50">
                                        <p className="text-xs text-gray-500 mb-1">Likes</p>
                                        <p className="font-medium text-gray-800">{personality.likes.slice(0, 3).join(', ')}</p>
                                    </div>
                                )}
                            </div>

                            <Button 
                                className="w-full mt-4" 
                                variant="outline"
                                onClick={(e) => { e.stopPropagation(); goToProfile(); }}
                            >
                                View Full Dossier
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="p-6 flex justify-center gap-4">
                <Button
                    variant="outline"
                    size="lg"
                    className="rounded-full w-14 h-14 text-white border-white/30 bg-white/10"
                    onClick={prevCard}
                    disabled={currentIndex === 0}
                >
                    <ChevronLeft className="w-6 h-6" />
                </Button>
                <Button
                    variant="outline"
                    size="lg"
                    className="rounded-full w-14 h-14 text-white border-white/30 bg-white/10"
                    onClick={goToProfile}
                >
                    <ChevronUp className="w-6 h-6" />
                </Button>
                <Button
                    variant="outline"
                    size="lg"
                    className="rounded-full w-14 h-14 text-white border-white/30 bg-white/10"
                    onClick={nextCard}
                    disabled={currentIndex === filteredChildren.length - 1}
                >
                    <ChevronRight className="w-6 h-6" />
                </Button>
            </div>

            {/* Gesture Hints */}
            <div className="pb-6 text-center text-purple-300 text-sm">
                Swipe ←→ for cards • Tap to flip • ↑ for profile
            </div>
        </div>
    );
}
