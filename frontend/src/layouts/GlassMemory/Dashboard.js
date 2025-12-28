import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Settings, LogOut, Users, User, Heart, Star, ChevronRight } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import BirthdayReminders from '../../components/BirthdayReminders';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const GLASS_GRADIENTS = [
    'from-rose-500/20 to-pink-500/20',
    'from-blue-500/20 to-cyan-500/20',
    'from-violet-500/20 to-purple-500/20',
    'from-amber-500/20 to-orange-500/20',
    'from-emerald-500/20 to-teal-500/20',
];

export default function GlassMemoryDashboard() {
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

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-white/50 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
            {/* Ambient Light Effects */}
            <div className="absolute top-20 left-20 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-20 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-500/20 rounded-full blur-3xl" />

            {/* Glass Header */}
            <header className="relative z-10 backdrop-blur-xl bg-white/5 border-b border-white/10">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-light text-white tracking-wide">Glass Memory</h1>
                        <p className="text-white/50 text-sm">Preserved moments</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="icon" className="text-white/70 hover:text-white hover:bg-white/10" onClick={() => navigate('/settings')}>
                            <Settings className="w-5 h-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-white/70 hover:text-white hover:bg-white/10" onClick={() => { logout(); toast.success('Logged out'); }}>
                            <LogOut className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
            </header>

            <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">
                <BirthdayReminders />

                {/* Families Section */}
                <div className="mb-12">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-light text-white/80">Families</h2>
                        <Button onClick={() => setShowAddModal(true)} className="backdrop-blur-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 gap-2">
                            <Plus className="w-4 h-4" /> Add Family
                        </Button>
                    </div>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {families.map((family, i) => (
                            <button
                                key={family.id}
                                onClick={() => navigate(`/family/${family.id}`)}
                                className={`group relative p-6 rounded-3xl backdrop-blur-xl bg-gradient-to-br ${GLASS_GRADIENTS[i % GLASS_GRADIENTS.length]} border border-white/20 hover:border-white/40 transition-all hover:scale-[1.02] hover:shadow-2xl`}
                            >
                                <div className="absolute inset-0 rounded-3xl bg-white/5" />
                                <div className="relative flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl backdrop-blur bg-white/10 flex items-center justify-center">
                                        <Users className="w-7 h-7 text-white/80" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="text-lg font-medium text-white">{family.family_name}</h3>
                                        <p className="text-white/50 text-sm">{family.number_of_children || 0} memories</p>
                                    </div>
                                    <ChevronRight className="ml-auto w-5 h-5 text-white/30 group-hover:text-white/60 transition-colors" />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Children Gallery */}
                {allChildren.length > 0 && (
                    <div>
                        <h2 className="text-xl font-light text-white/80 mb-6">Preserved</h2>
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                            {allChildren.map((child, i) => (
                                <button
                                    key={child.id}
                                    onClick={() => navigate(`/child/${child.id}`)}
                                    className="group relative aspect-square rounded-3xl overflow-hidden backdrop-blur-xl bg-white/5 border border-white/10 hover:border-white/30 transition-all hover:scale-[1.02]"
                                >
                                    {child.identity?.profile_photo ? (
                                        <img src={child.identity.profile_photo} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                                    ) : (
                                        <div className={`absolute inset-0 bg-gradient-to-br ${GLASS_GRADIENTS[i % GLASS_GRADIENTS.length]}`} />
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                    <div className="absolute inset-0 backdrop-blur-sm bg-white/5" />
                                    <div className="relative h-full flex flex-col justify-end p-4">
                                        <h3 className="text-lg font-medium text-white">{child.identity?.full_name}</h3>
                                        <p className="text-white/50 text-sm">{child.familyName}</p>
                                        {child.personality?.primary_love_language && (
                                            <div className="flex items-center gap-1 mt-2 text-pink-300/80 text-xs">
                                                <Heart className="w-3 h-3" />
                                                {child.personality.primary_love_language}
                                            </div>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
                <DialogContent className="backdrop-blur-xl bg-slate-900/90 border-white/20 text-white">
                    <DialogHeader><DialogTitle>Add Family</DialogTitle></DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <div className="py-4">
                            <Label className="text-white/70">Family Name</Label>
                            <Input value={formData.family_name} onChange={e => setFormData({ family_name: e.target.value })} className="mt-1 bg-white/10 border-white/20 text-white" placeholder="The Smiths" />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setShowAddModal(false)} className="text-white/70">Cancel</Button>
                            <Button type="submit" className="bg-white/20 hover:bg-white/30">Create</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
