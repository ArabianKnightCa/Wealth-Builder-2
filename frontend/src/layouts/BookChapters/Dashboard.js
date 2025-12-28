import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Settings, LogOut, Book, BookOpen, Bookmark, ChevronRight, User, Heart, Star, GraduationCap, Sparkles } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import BirthdayReminders from '../../components/BirthdayReminders';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const BOOK_COLORS = [
    { spine: '#8B4513', cover: '#DEB887' },
    { spine: '#2F4F4F', cover: '#87CEEB' },
    { spine: '#4B0082', cover: '#E6E6FA' },
    { spine: '#8B0000', cover: '#F08080' },
    { spine: '#006400', cover: '#90EE90' },
];

export default function BookChaptersDashboard() {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [families, setFamilies] = useState([]);
    const [selectedFamily, setSelectedFamily] = useState(null);
    const [children, setChildren] = useState([]);
    const [selectedChild, setSelectedChild] = useState(null);
    const [currentChapter, setCurrentChapter] = useState(0);
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

    const chapters = selectedChild ? [
        { title: 'Who I Am', icon: User, content: selectedChild.identity },
        { title: 'School Life', icon: GraduationCap, content: selectedChild.school },
        { title: 'Favorites', icon: Star, content: selectedChild.favorites },
        { title: 'Personality', icon: Heart, content: selectedChild.personality },
        { title: 'Dreams & More', icon: Sparkles, content: {} },
    ] : [];

    const renderChapterContent = (chapter) => {
        const content = chapter.content || {};
        const entries = Object.entries(content).filter(([k, v]) => v && v !== '' && (!Array.isArray(v) || v.length > 0));
        
        if (entries.length === 0) {
            return <p className="text-amber-700/50 italic">No entries yet. Add some memories!</p>;
        }

        return entries.map(([key, value]) => (
            <div key={key} className="mb-4 pb-4 border-b border-amber-200/50 last:border-0">
                <p className="text-xs uppercase tracking-wider text-amber-600 mb-1">
                    {key.replace(/_/g, ' ')}
                </p>
                <p className="text-amber-900 font-serif">
                    {Array.isArray(value) ? value.join(', ') : value}
                </p>
            </div>
        ));
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-amber-50 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // Bookshelf View
    if (!selectedFamily) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-amber-100 to-amber-50">
                <header className="p-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-amber-900">OurCircle Library</h1>
                        <p className="text-amber-600 font-serif italic">Every family has a story</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
                            <Settings className="w-5 h-5 text-amber-700" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => { logout(); toast.success('Logged out'); }}>
                            <LogOut className="w-5 h-5 text-amber-700" />
                        </Button>
                    </div>
                </header>

                <div className="px-6">
                    <BirthdayReminders />
                </div>

                {/* Bookshelf */}
                <div className="px-6 py-8">
                    <div className="bg-amber-800 rounded-t-lg p-4 shadow-inner">
                        <div className="flex gap-4 overflow-x-auto pb-4">
                            {families.map((family, index) => {
                                const colors = BOOK_COLORS[index % BOOK_COLORS.length];
                                return (
                                    <button
                                        key={family.id}
                                        onClick={() => setSelectedFamily(family)}
                                        className="flex-shrink-0 group"
                                    >
                                        <div className="relative h-48 w-12 hover:w-36 transition-all duration-300 ease-out">
                                            {/* Book Spine */}
                                            <div 
                                                className="absolute inset-0 rounded-sm shadow-lg flex items-center justify-center group-hover:rounded-l-sm group-hover:rounded-r-none transition-all"
                                                style={{ backgroundColor: colors.spine }}
                                            >
                                                <span className="text-white font-serif text-sm writing-vertical transform rotate-180" style={{ writingMode: 'vertical-rl' }}>
                                                    {family.family_name}
                                                </span>
                                            </div>
                                            {/* Book Cover (on hover) */}
                                            <div 
                                                className="absolute inset-y-0 left-12 w-24 rounded-r-sm opacity-0 group-hover:opacity-100 transition-opacity shadow-lg flex flex-col items-center justify-center p-2"
                                                style={{ backgroundColor: colors.cover }}
                                            >
                                                <Book className="w-8 h-8 mb-2" style={{ color: colors.spine }} />
                                                <span className="text-xs font-serif text-center" style={{ color: colors.spine }}>
                                                    {family.family_name}
                                                </span>
                                                <span className="text-xs mt-1" style={{ color: colors.spine }}>
                                                    {family.number_of_children || 0} chapters
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}

                            {families.length === 0 && (
                                <div className="flex-1 flex items-center justify-center text-amber-200 py-8">
                                    <div className="text-center">
                                        <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                        <p>Your library is empty</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    {/* Shelf */}
                    <div className="h-4 bg-gradient-to-b from-amber-700 to-amber-900 rounded-b-lg shadow-lg" />
                    <div className="h-2 bg-amber-950 mx-2 rounded-b-lg" />
                </div>
            </div>
        );
    }

    // Table of Contents (Children List)
    if (!selectedChild) {
        const colors = BOOK_COLORS[families.findIndex(f => f.id === selectedFamily.id) % BOOK_COLORS.length];
        return (
            <div className="min-h-screen" style={{ backgroundColor: colors.cover }}>
                <header className="p-6 flex items-center gap-4" style={{ backgroundColor: colors.spine }}>
                    <Button variant="ghost" size="icon" className="text-white" onClick={() => setSelectedFamily(null)}>
                        <ChevronRight className="w-5 h-5 rotate-180" />
                    </Button>
                    <div className="flex-1">
                        <h1 className="text-2xl font-serif font-bold text-white">{selectedFamily.family_name}</h1>
                        <p className="text-white/70 font-serif">Table of Contents</p>
                    </div>
                </header>

                <div className="p-6 space-y-3">
                    {children.map((child, index) => (
                        <button
                            key={child.id}
                            onClick={() => { setSelectedChild(child); setCurrentChapter(0); }}
                            className="w-full p-4 bg-white/80 backdrop-blur rounded-lg flex items-center gap-4 hover:bg-white transition-colors shadow-sm"
                        >
                            <div className="w-12 h-12 rounded-full overflow-hidden" style={{ backgroundColor: colors.spine + '30' }}>
                                {child.identity?.profile_photo ? (
                                    <img src={child.identity.profile_photo} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <span className="text-lg font-serif" style={{ color: colors.spine }}>
                                            {child.identity?.full_name?.charAt(0)}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 text-left">
                                <p className="font-serif text-lg" style={{ color: colors.spine }}>
                                    Chapter {index + 1}: {child.identity?.full_name}
                                </p>
                                <p className="text-sm text-gray-500 font-serif italic">
                                    {child.identity?.birthday || 'A story waiting to be told'}
                                </p>
                            </div>
                            <Bookmark className="w-5 h-5" style={{ color: colors.spine }} />
                        </button>
                    ))}

                    {children.length === 0 && (
                        <div className="text-center py-12" style={{ color: colors.spine }}>
                            <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
                            <p className="font-serif text-lg">No chapters yet</p>
                            <p className="font-serif text-sm opacity-70">Add children to write their stories</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Chapter View
    const colors = BOOK_COLORS[families.findIndex(f => f.id === selectedFamily.id) % BOOK_COLORS.length];
    const chapter = chapters[currentChapter];
    const ChapterIcon = chapter?.icon || Book;

    return (
        <div className="min-h-screen bg-amber-50">
            <header className="p-4 flex items-center gap-4 bg-white border-b border-amber-200">
                <Button variant="ghost" size="icon" onClick={() => setSelectedChild(null)}>
                    <ChevronRight className="w-5 h-5 rotate-180 text-amber-700" />
                </Button>
                <div className="flex-1">
                    <h1 className="font-serif text-lg text-amber-900">{selectedChild.identity?.full_name}</h1>
                    <p className="text-xs text-amber-600">{selectedFamily.family_name}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate(`/child/${selectedChild.id}`)}>
                    Edit
                </Button>
            </header>

            {/* Chapter Navigation */}
            <div className="flex overflow-x-auto border-b border-amber-200 bg-white">
                {chapters.map((ch, i) => (
                    <button
                        key={i}
                        onClick={() => setCurrentChapter(i)}
                        className={`flex-shrink-0 px-4 py-3 font-serif text-sm border-b-2 transition-colors ${
                            currentChapter === i 
                                ? 'border-amber-600 text-amber-900' 
                                : 'border-transparent text-amber-600 hover:text-amber-800'
                        }`}
                    >
                        Ch. {i + 1}
                    </button>
                ))}
            </div>

            {/* Chapter Content */}
            <div className="p-6 max-w-2xl mx-auto">
                <div className="bg-white rounded-lg shadow-md p-6 border border-amber-200">
                    {/* Chapter Header */}
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-amber-200">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.spine + '20' }}>
                            <ChapterIcon className="w-6 h-6" style={{ color: colors.spine }} />
                        </div>
                        <div>
                            <p className="text-xs text-amber-600 uppercase tracking-wider">Chapter {currentChapter + 1}</p>
                            <h2 className="text-2xl font-serif text-amber-900">{chapter?.title}</h2>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="font-serif text-amber-800 leading-relaxed">
                        {renderChapterContent(chapter)}
                    </div>
                </div>

                {/* Page Navigation */}
                <div className="flex justify-between mt-6">
                    <Button
                        variant="ghost"
                        disabled={currentChapter === 0}
                        onClick={() => setCurrentChapter(c => c - 1)}
                        className="font-serif text-amber-700"
                    >
                        ← Previous Chapter
                    </Button>
                    <Button
                        variant="ghost"
                        disabled={currentChapter === chapters.length - 1}
                        onClick={() => setCurrentChapter(c => c + 1)}
                        className="font-serif text-amber-700"
                    >
                        Next Chapter →
                    </Button>
                </div>
            </div>
        </div>
    );
}
