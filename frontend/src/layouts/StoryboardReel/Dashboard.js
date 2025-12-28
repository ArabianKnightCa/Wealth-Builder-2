import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Settings, LogOut, Play, ChevronLeft, ChevronRight, Film, User, Heart, Star } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function StoryboardReelDashboard() {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [families, setFamilies] = useState([]);
    const [allChildren, setAllChildren] = useState([]);
    const [selectedChild, setSelectedChild] = useState(null);
    const [currentScene, setCurrentScene] = useState(0);
    const [loading, setLoading] = useState(true);
    const reelRef = useRef(null);

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

    const getScenes = (child) => {
        if (!child) return [];
        const identity = child.identity || {};
        const school = child.school || {};
        const favorites = child.favorites || {};
        const personality = child.personality || {};

        return [
            { type: 'intro', title: 'Meet', subtitle: identity.full_name, detail: identity.birthday ? `Born ${identity.birthday}` : '', bg: 'from-pink-600 to-rose-700' },
            identity.place_of_birth && { type: 'scene', title: 'Origins', subtitle: identity.place_of_birth, detail: 'Where the story began', bg: 'from-amber-600 to-orange-700' },
            school.school_name && { type: 'scene', title: 'Act I: School', subtitle: school.school_name, detail: school.grade ? `Grade ${school.grade}` : '', bg: 'from-blue-600 to-indigo-700' },
            favorites.favorite_food && { type: 'scene', title: 'The Favorites', subtitle: favorites.favorite_food, detail: 'A culinary love story', bg: 'from-green-600 to-emerald-700' },
            personality.primary_love_language && { type: 'scene', title: 'Heart & Soul', subtitle: personality.primary_love_language, detail: 'How they feel loved', bg: 'from-purple-600 to-violet-700' },
            personality.strengths?.length && { type: 'scene', title: 'Superpowers', subtitle: personality.strengths.slice(0,2).join(' & '), detail: 'What makes them shine', bg: 'from-cyan-600 to-teal-700' },
            { type: 'outro', title: 'To Be Continued...', subtitle: `${identity.full_name}'s story`, detail: 'Tap to see full profile', bg: 'from-slate-700 to-slate-900' },
        ].filter(Boolean);
    };

    const scenes = selectedChild ? getScenes(selectedChild) : [];

    const nextScene = () => {
        if (currentScene < scenes.length - 1) setCurrentScene(c => c + 1);
    };

    const prevScene = () => {
        if (currentScene > 0) setCurrentScene(c => c - 1);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // Character Select
    if (!selectedChild) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-slate-900 to-black">
                <header className="p-6 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Film className="w-8 h-8 text-red-500" />
                        <div>
                            <h1 className="text-2xl font-bold text-white">Storyboard Reel</h1>
                            <p className="text-slate-400 text-sm">Every child's life is a movie</p>
                        </div>
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

                <main className="px-6 py-8">
                    <h2 className="text-lg text-slate-400 mb-6">Select a story to watch</h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {allChildren.map(child => (
                            <button
                                key={child.id}
                                onClick={() => { setSelectedChild(child); setCurrentScene(0); }}
                                className="group relative aspect-video rounded-xl overflow-hidden bg-slate-800 hover:ring-2 ring-red-500 transition-all"
                            >
                                {child.identity?.profile_photo ? (
                                    <img src={child.identity.profile_photo} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                                ) : (
                                    <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-900" />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                                <div className="absolute inset-0 flex flex-col justify-end p-4">
                                    <h3 className="text-lg font-bold text-white">{child.identity?.full_name}</h3>
                                    <p className="text-slate-300 text-sm">{child.familyName}</p>
                                </div>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-red-500/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Play className="w-6 h-6 text-white ml-1" />
                                </div>
                                <div className="absolute top-3 right-3 px-2 py-1 rounded bg-black/50 text-xs text-white">
                                    {getScenes(child).length} scenes
                                </div>
                            </button>
                        ))}
                    </div>

                    {allChildren.length === 0 && (
                        <div className="text-center py-16">
                            <Film className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                            <p className="text-slate-500">No stories yet. Add children to begin.</p>
                        </div>
                    )}
                </main>
            </div>
        );
    }

    // Storyboard View
    const scene = scenes[currentScene];

    return (
        <div className="min-h-screen bg-black flex flex-col">
            {/* Film Strip Header */}
            <header className="bg-slate-900 px-4 py-2 flex items-center justify-between">
                <Button variant="ghost" className="text-white gap-2" onClick={() => setSelectedChild(null)}>
                    <ChevronLeft className="w-4 h-4" /> Back
                </Button>
                <div className="flex items-center gap-2 text-slate-400">
                    <Film className="w-4 h-4" />
                    <span className="text-sm">{selectedChild.identity?.full_name}'s Story</span>
                </div>
                <Button variant="ghost" className="text-white" onClick={() => navigate(`/child/${selectedChild.id}`)}>
                    Full Profile
                </Button>
            </header>

            {/* Scene Progress */}
            <div className="flex gap-1 px-4 py-2 bg-slate-900">
                {scenes.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setCurrentScene(i)}
                        className={`flex-1 h-1 rounded-full transition-colors ${i === currentScene ? 'bg-red-500' : i < currentScene ? 'bg-slate-600' : 'bg-slate-800'}`}
                    />
                ))}
            </div>

            {/* Main Scene */}
            <div ref={reelRef} className="flex-1 flex items-center justify-center p-8">
                <div className={`w-full max-w-2xl aspect-video rounded-2xl bg-gradient-to-br ${scene.bg} relative overflow-hidden shadow-2xl`}>
                    {/* Film perforations */}
                    <div className="absolute left-0 top-0 bottom-0 w-8 bg-black/30 flex flex-col justify-around py-4">
                        {[...Array(8)].map((_, i) => <div key={i} className="w-4 h-3 bg-black/50 rounded-sm mx-auto" />)}
                    </div>
                    <div className="absolute right-0 top-0 bottom-0 w-8 bg-black/30 flex flex-col justify-around py-4">
                        {[...Array(8)].map((_, i) => <div key={i} className="w-4 h-3 bg-black/50 rounded-sm mx-auto" />)}
                    </div>

                    {/* Scene Content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-16">
                        <p className="text-white/60 text-sm uppercase tracking-widest mb-2">Scene {currentScene + 1}</p>
                        <h2 className="text-4xl font-bold text-white mb-2">{scene.title}</h2>
                        <p className="text-2xl text-white/90 mb-4">{scene.subtitle}</p>
                        <p className="text-white/60">{scene.detail}</p>

                        {scene.type === 'outro' && (
                            <Button className="mt-6 bg-white/20 hover:bg-white/30" onClick={() => navigate(`/child/${selectedChild.id}`)}>
                                View Full Profile
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="p-6 flex items-center justify-center gap-4">
                <Button
                    variant="outline"
                    size="lg"
                    onClick={prevScene}
                    disabled={currentScene === 0}
                    className="rounded-full border-slate-700 text-slate-300"
                >
                    <ChevronLeft className="w-6 h-6" />
                </Button>
                <div className="text-slate-500">
                    {currentScene + 1} / {scenes.length}
                </div>
                <Button
                    variant="outline"
                    size="lg"
                    onClick={nextScene}
                    disabled={currentScene === scenes.length - 1}
                    className="rounded-full border-slate-700 text-slate-300"
                >
                    <ChevronRight className="w-6 h-6" />
                </Button>
            </div>
        </div>
    );
}
