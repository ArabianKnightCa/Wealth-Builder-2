import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Settings, LogOut, Send, MessageCircle, Users, User, Search, ChevronRight } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ChatbookDashboard() {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [families, setFamilies] = useState([]);
    const [selectedFamily, setSelectedFamily] = useState(null);
    const [children, setChildren] = useState([]);
    const [selectedChild, setSelectedChild] = useState(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const messagesEndRef = useRef(null);

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

    const generateMessages = (child) => {
        if (!child) return [];
        const msgs = [];
        const identity = child.identity || {};
        const favorites = child.favorites || {};
        const personality = child.personality || {};
        const school = child.school || {};

        if (identity.full_name) msgs.push({ type: 'system', text: `Profile created for ${identity.full_name}`, category: 'identity' });
        if (identity.birthday) msgs.push({ type: 'info', text: `🎂 Birthday: ${identity.birthday}`, category: 'identity' });
        if (identity.place_of_birth) msgs.push({ type: 'info', text: `📍 Born in ${identity.place_of_birth}`, category: 'identity' });
        if (favorites.favorite_food) msgs.push({ type: 'update', text: `🍕 Favorite food: ${favorites.favorite_food}`, category: 'favorites' });
        if (favorites.favorite_color) msgs.push({ type: 'update', text: `🎨 Favorite color: ${favorites.favorite_color}`, category: 'favorites' });
        if (favorites.favorite_show) msgs.push({ type: 'update', text: `📺 Watching: ${favorites.favorite_show}`, category: 'favorites' });
        if (favorites.favorite_game) msgs.push({ type: 'update', text: `🎮 Playing: ${favorites.favorite_game}`, category: 'favorites' });
        if (school.school_name) msgs.push({ type: 'info', text: `🏫 Goes to ${school.school_name}`, category: 'school' });
        if (school.grade) msgs.push({ type: 'info', text: `📚 Grade: ${school.grade}`, category: 'school' });
        if (school.favorite_subject) msgs.push({ type: 'update', text: `⭐ Loves ${school.favorite_subject}`, category: 'school' });
        if (personality.primary_love_language) msgs.push({ type: 'heart', text: `💕 Love language: ${personality.primary_love_language}`, category: 'personality' });
        if (personality.likes?.length) msgs.push({ type: 'update', text: `👍 Likes: ${personality.likes.join(', ')}`, category: 'personality' });
        
        return msgs;
    };

    const handleSendMessage = async () => {
        if (!message.trim() || !selectedChild) return;
        toast.info('Quick notes coming soon!');
        setMessage('');
    };

    const filteredFamilies = families.filter(f => 
        f.family_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar - Conversation List */}
            <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <MessageCircle className="w-6 h-6 text-blue-500" />
                            <h1 className="text-xl font-bold text-gray-800">Chatbook</h1>
                        </div>
                        <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
                                <Settings className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => { logout(); toast.success('Logged out'); }}>
                                <LogOut className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search families..."
                            className="pl-9 bg-gray-50"
                        />
                    </div>
                </div>

                {/* Conversations */}
                <div className="flex-1 overflow-y-auto">
                    {filteredFamilies.map(family => (
                        <div key={family.id}>
                            <button
                                onClick={() => { setSelectedFamily(family); setSelectedChild(null); }}
                                className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-gray-50 ${selectedFamily?.id === family.id ? 'bg-blue-50' : ''}`}
                            >
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                                    <Users className="w-5 h-5 text-blue-600" />
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="font-semibold text-gray-800">{family.family_name}</p>
                                    <p className="text-sm text-gray-500">{family.number_of_children || 0} members</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                            </button>
                            
                            {/* Children sub-list */}
                            {selectedFamily?.id === family.id && children.map(child => (
                                <button
                                    key={child.id}
                                    onClick={() => setSelectedChild(child)}
                                    className={`w-full p-3 pl-8 flex items-center gap-3 hover:bg-gray-50 transition-colors ${selectedChild?.id === child.id ? 'bg-blue-50' : ''}`}
                                >
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center overflow-hidden">
                                        {child.identity?.profile_photo ? (
                                            <img src={child.identity.profile_photo} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="w-4 h-4 text-purple-600" />
                                        )}
                                    </div>
                                    <div className="flex-1 text-left">
                                        <p className="font-medium text-gray-700">{child.identity?.full_name}</p>
                                        <p className="text-xs text-gray-400">Tap to view conversation</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ))}

                    {filteredFamilies.length === 0 && (
                        <div className="p-8 text-center text-gray-400">
                            <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No conversations yet</p>
                        </div>
                    )}
                </div>

                {/* Add Family Button */}
                <div className="p-4 border-t border-gray-100">
                    <Button onClick={() => navigate('/settings')} variant="outline" className="w-full gap-2">
                        <Plus className="w-4 h-4" />
                        Start New Chat
                    </Button>
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col">
                {selectedChild ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 bg-white border-b border-gray-200 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center overflow-hidden">
                                    {selectedChild.identity?.profile_photo ? (
                                        <img src={selectedChild.identity.profile_photo} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-5 h-5 text-purple-600" />
                                    )}
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-800">{selectedChild.identity?.full_name}</p>
                                    <p className="text-xs text-gray-500">Memory assistant</p>
                                </div>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => navigate(`/child/${selectedChild.id}`)}>
                                View Full Profile
                            </Button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                            {generateMessages(selectedChild).map((msg, i) => (
                                <div
                                    key={i}
                                    className={`flex ${msg.type === 'system' ? 'justify-center' : 'justify-start'}`}
                                >
                                    {msg.type === 'system' ? (
                                        <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                                            {msg.text}
                                        </div>
                                    ) : (
                                        <div className={`max-w-md px-4 py-2 rounded-2xl ${msg.type === 'heart' ? 'bg-pink-100 text-pink-700' : 'bg-white shadow-sm text-gray-700'}`}>
                                            <p>{msg.text}</p>
                                            <p className="text-xs text-gray-400 mt-1 capitalize">{msg.category}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-4 bg-white border-t border-gray-200">
                            <div className="flex gap-2">
                                <Input
                                    value={message}
                                    onChange={e => setMessage(e.target.value)}
                                    placeholder="Add a memory or note..."
                                    onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
                                    className="flex-1"
                                />
                                <Button onClick={handleSendMessage}>
                                    <Send className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center bg-gray-50">
                        <div className="text-center">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center mx-auto mb-4">
                                <MessageCircle className="w-10 h-10 text-blue-500" />
                            </div>
                            <h2 className="text-xl font-semibold text-gray-800 mb-2">Welcome to Chatbook</h2>
                            <p className="text-gray-500">Select a family member to view their memory conversation</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
