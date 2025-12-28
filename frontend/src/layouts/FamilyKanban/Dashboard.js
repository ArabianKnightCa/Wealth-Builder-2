import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Settings, LogOut, GripVertical, GraduationCap, Heart, Camera, Target, User } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const COLUMNS = [
    { id: 'school', label: 'School', icon: GraduationCap, color: 'bg-blue-500', lightBg: 'bg-blue-50' },
    { id: 'health', label: 'Health', icon: Heart, color: 'bg-red-500', lightBg: 'bg-red-50' },
    { id: 'moments', label: 'Moments', icon: Camera, color: 'bg-purple-500', lightBg: 'bg-purple-50' },
    { id: 'goals', label: 'Goals', icon: Target, color: 'bg-green-500', lightBg: 'bg-green-50' },
];

export default function FamilyKanbanDashboard() {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [families, setFamilies] = useState([]);
    const [allChildren, setAllChildren] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [formData, setFormData] = useState({ family_name: '' });

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.family_name.trim()) return;
        try {
            await axios.post(`${API}/families`, formData);
            toast.success('Family created');
            fetchData();
            setShowAddModal(false);
            setFormData({ family_name: '' });
        } catch (err) { toast.error('Failed'); }
    };

    const getColumnCards = (columnId, child) => {
        const school = child.school || {};
        const favorites = child.favorites || {};
        const personality = child.personality || {};
        
        switch(columnId) {
            case 'school':
                return [
                    school.school_name && { label: 'School', value: school.school_name },
                    school.grade && { label: 'Grade', value: school.grade },
                    school.favorite_subject && { label: 'Best Subject', value: school.favorite_subject },
                ].filter(Boolean);
            case 'health':
                return [
                    personality.phobias?.length && { label: 'Careful With', value: personality.phobias.join(', ') },
                    favorites.favorite_food && { label: 'Loves to Eat', value: favorites.favorite_food },
                ].filter(Boolean);
            case 'moments':
                return [
                    school.best_school_memory && { label: 'School Memory', value: school.best_school_memory },
                    favorites.favorite_show && { label: 'Watching', value: favorites.favorite_show },
                ].filter(Boolean);
            case 'goals':
                return [
                    personality.strengths?.length && { label: 'Strengths', value: personality.strengths.slice(0,2).join(', ') },
                    personality.primary_love_language && { label: 'Love Language', value: personality.primary_love_language },
                ].filter(Boolean);
            default:
                return [];
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-6 py-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">Family Kanban</h1>
                        <p className="text-sm text-slate-500">Organize family life visually</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button onClick={() => setShowAddModal(true)} variant="outline" className="gap-2">
                            <Plus className="w-4 h-4" /> Add Family
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
                            <Settings className="w-5 h-5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => { logout(); toast.success('Logged out'); }}>
                            <LogOut className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
            </header>

            {/* Kanban Board */}
            <div className="p-6 overflow-x-auto">
                <div className="flex gap-6 min-w-max">
                    {COLUMNS.map(column => {
                        const Icon = column.icon;
                        return (
                            <div key={column.id} className="w-80 flex-shrink-0">
                                {/* Column Header */}
                                <div className={`${column.color} text-white p-3 rounded-t-xl flex items-center gap-2`}>
                                    <Icon className="w-5 h-5" />
                                    <span className="font-semibold">{column.label}</span>
                                    <span className="ml-auto text-sm opacity-80">
                                        {allChildren.reduce((acc, c) => acc + getColumnCards(column.id, c).length, 0)}
                                    </span>
                                </div>

                                {/* Column Content */}
                                <div className={`${column.lightBg} p-3 rounded-b-xl min-h-[500px] space-y-3`}>
                                    {allChildren.map(child => {
                                        const cards = getColumnCards(column.id, child);
                                        if (cards.length === 0) return null;
                                        return (
                                            <div key={`${child.id}-${column.id}`}>
                                                {/* Child Header */}
                                                <div 
                                                    className="flex items-center gap-2 mb-2 cursor-pointer hover:opacity-80"
                                                    onClick={() => navigate(`/child/${child.id}`)}
                                                >
                                                    <div className="w-6 h-6 rounded-full bg-white overflow-hidden flex items-center justify-center">
                                                        {child.identity?.profile_photo ? (
                                                            <img src={child.identity.profile_photo} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <User className="w-3 h-3 text-slate-400" />
                                                        )}
                                                    </div>
                                                    <span className="text-xs font-medium text-slate-600">{child.identity?.full_name?.split(' ')[0]}</span>
                                                </div>
                                                {/* Cards */}
                                                {cards.map((card, i) => (
                                                    <div
                                                        key={i}
                                                        className="bg-white rounded-lg p-3 shadow-sm border border-slate-100 cursor-grab hover:shadow-md transition-shadow group"
                                                    >
                                                        <div className="flex items-start gap-2">
                                                            <GripVertical className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-xs text-slate-400 mb-1">{card.label}</p>
                                                                <p className="text-sm text-slate-700 font-medium truncate">{card.value}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })}

                                    {allChildren.every(c => getColumnCards(column.id, c).length === 0) && (
                                        <div className="text-center py-8 text-slate-400">
                                            <Icon className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                            <p className="text-sm">No {column.label.toLowerCase()} items</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Add Family</DialogTitle></DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <div className="py-4">
                            <Label>Family Name</Label>
                            <Input value={formData.family_name} onChange={e => setFormData({ family_name: e.target.value })} className="mt-1" placeholder="The Smiths" />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setShowAddModal(false)}>Cancel</Button>
                            <Button type="submit">Create</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
