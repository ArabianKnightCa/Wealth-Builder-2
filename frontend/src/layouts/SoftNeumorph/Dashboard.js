import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Settings, LogOut, Users, User, Heart, ChevronRight, Home } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import BirthdayReminders from '../../components/BirthdayReminders';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function SoftNeumorphDashboard() {
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

    const neumorphShadow = 'shadow-[8px_8px_16px_#d1d1d1,-8px_-8px_16px_#ffffff]';
    const neumorphInset = 'shadow-[inset_4px_4px_8px_#d1d1d1,inset_-4px_-4px_8px_#ffffff]';
    const neumorphBtn = 'shadow-[4px_4px_8px_#d1d1d1,-4px_-4px_8px_#ffffff] hover:shadow-[2px_2px_4px_#d1d1d1,-2px_-2px_4px_#ffffff] active:shadow-[inset_2px_2px_4px_#d1d1d1,inset_-2px_-2px_4px_#ffffff]';

    if (loading) {
        return (
            <div className="min-h-screen bg-[#e8e8e8] flex items-center justify-center">
                <div className={`w-16 h-16 rounded-full ${neumorphShadow} flex items-center justify-center`}>
                    <div className="w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#e8e8e8]">
            {/* Header */}
            <header className="px-6 py-4">
                <div className={`max-w-6xl mx-auto rounded-2xl p-4 ${neumorphShadow} flex justify-between items-center`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl ${neumorphInset} flex items-center justify-center`}>
                            <Home className="w-5 h-5 text-gray-500" />
                        </div>
                        <div>
                            <h1 className="text-xl font-medium text-gray-700">OurCircle</h1>
                            <p className="text-xs text-gray-400">Soft Neumorph</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => navigate('/settings')} className={`w-10 h-10 rounded-xl ${neumorphBtn} flex items-center justify-center text-gray-500 transition-all`}>
                            <Settings className="w-4 h-4" />
                        </button>
                        <button onClick={() => { logout(); toast.success('Logged out'); }} className={`w-10 h-10 rounded-xl ${neumorphBtn} flex items-center justify-center text-gray-500 transition-all`}>
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-6">
                <BirthdayReminders />

                {/* Families */}
                <div className="mb-10">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-medium text-gray-600">Families</h2>
                        <button onClick={() => setShowAddModal(true)} className={`px-4 py-2 rounded-xl ${neumorphBtn} text-gray-600 text-sm flex items-center gap-2 transition-all`}>
                            <Plus className="w-4 h-4" /> Add
                        </button>
                    </div>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {families.map(family => (
                            <button
                                key={family.id}
                                onClick={() => navigate(`/family/${family.id}`)}
                                className={`p-5 rounded-2xl ${neumorphShadow} hover:scale-[1.02] transition-transform text-left group`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-14 h-14 rounded-xl ${neumorphInset} flex items-center justify-center`}>
                                        <Users className="w-6 h-6 text-gray-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-medium text-gray-700">{family.family_name}</h3>
                                        <p className="text-sm text-gray-400">{family.number_of_children || 0} members</p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500 transition-colors" />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Children */}
                {allChildren.length > 0 && (
                    <div>
                        <h2 className="text-lg font-medium text-gray-600 mb-6">Children</h2>
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                            {allChildren.map(child => (
                                <button
                                    key={child.id}
                                    onClick={() => navigate(`/child/${child.id}`)}
                                    className={`p-4 rounded-2xl ${neumorphShadow} hover:scale-[1.02] transition-transform text-left`}
                                >
                                    <div className={`w-16 h-16 rounded-full mx-auto mb-3 ${neumorphInset} flex items-center justify-center overflow-hidden`}>
                                        {child.identity?.profile_photo ? (
                                            <img src={child.identity.profile_photo} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="w-6 h-6 text-gray-400" />
                                        )}
                                    </div>
                                    <h3 className="font-medium text-gray-700 text-center">{child.identity?.full_name}</h3>
                                    <p className="text-xs text-gray-400 text-center">{child.familyName}</p>
                                    {child.personality?.primary_love_language && (
                                        <div className={`mt-3 py-2 px-3 rounded-lg ${neumorphInset} flex items-center justify-center gap-1`}>
                                            <Heart className="w-3 h-3 text-pink-400" />
                                            <span className="text-xs text-gray-500">{child.personality.primary_love_language}</span>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
                <DialogContent className="bg-[#e8e8e8] border-none shadow-2xl">
                    <DialogHeader><DialogTitle className="text-gray-700">Add Family</DialogTitle></DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <div className="py-4">
                            <Label className="text-gray-600">Family Name</Label>
                            <Input value={formData.family_name} onChange={e => setFormData({ family_name: e.target.value })} className={`mt-1 border-none ${neumorphInset} bg-transparent`} placeholder="The Smiths" />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setShowAddModal(false)}>Cancel</Button>
                            <button type="submit" className={`px-4 py-2 rounded-xl ${neumorphBtn} text-gray-700 transition-all`}>Create</button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
