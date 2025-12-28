import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Settings, LogOut, Lock, Unlock, Shield, FileText, Heart, Key, Eye, EyeOff, ChevronRight, User, Users, AlertTriangle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const VAULT_SECTIONS = [
    { id: 'identity', label: 'Identity Records', icon: FileText, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
    { id: 'medical', label: 'Medical & Health', icon: Heart, color: 'text-red-500', bgColor: 'bg-red-500/10' },
    { id: 'sensitive', label: 'Sensitive Info', icon: AlertTriangle, color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
    { id: 'memories', label: 'Protected Memories', icon: Lock, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
];

export default function VaultModeDashboard() {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [families, setFamilies] = useState([]);
    const [allChildren, setAllChildren] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedChild, setSelectedChild] = useState(null);
    const [unlockedSections, setUnlockedSections] = useState([]);
    const [showUnlockModal, setShowUnlockModal] = useState(false);
    const [sectionToUnlock, setSectionToUnlock] = useState(null);

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

    const getSectionData = (sectionId, child) => {
        if (!child) return [];
        const identity = child.identity || {};
        const school = child.school || {};
        const personality = child.personality || {};

        switch(sectionId) {
            case 'identity':
                return [
                    { label: 'Full Name', value: identity.full_name },
                    { label: 'Birthday', value: identity.birthday },
                    { label: 'Place of Birth', value: identity.place_of_birth },
                    { label: 'Languages', value: identity.languages?.join(', ') },
                ].filter(i => i.value);
            case 'medical':
                return [
                    { label: 'Allergies', value: personality.phobias?.join(', '), critical: true },
                    { label: 'Blood Type', value: identity.blood_type },
                ].filter(i => i.value);
            case 'sensitive':
                return [
                    { label: 'School', value: school.school_name },
                    { label: 'Grade', value: school.grade },
                    { label: 'Love Language', value: personality.primary_love_language },
                ].filter(i => i.value);
            case 'memories':
                return [
                    { label: 'Known For', value: personality.known_for },
                    { label: 'Best Memory', value: school.best_school_memory },
                ].filter(i => i.value);
            default:
                return [];
        }
    };

    const handleUnlock = (sectionId) => {
        setUnlockedSections([...unlockedSections, sectionId]);
        setShowUnlockModal(false);
        setSectionToUnlock(null);
        toast.success('Section unlocked');
    };

    const isUnlocked = (sectionId) => unlockedSections.includes(sectionId);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950">
            {/* Secure Header */}
            <header className="bg-slate-900 border-b border-slate-800 px-6 py-4">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                            <Shield className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white">Vault Mode</h1>
                            <p className="text-xs text-slate-500">Secure Family Archive</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-emerald-500 text-sm">
                            <Lock className="w-4 h-4" />
                            <span>{VAULT_SECTIONS.length - unlockedSections.length} locked</span>
                        </div>
                        <Button variant="ghost" size="icon" className="text-slate-400" onClick={() => navigate('/settings')}>
                            <Settings className="w-5 h-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-slate-400" onClick={() => { logout(); toast.success('Logged out'); }}>
                            <LogOut className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
            </header>

            <div className="flex">
                {/* Sidebar - Profile List */}
                <aside className="w-64 bg-slate-900/50 border-r border-slate-800 min-h-[calc(100vh-73px)]">
                    <div className="p-4">
                        <h2 className="text-xs uppercase tracking-wider text-slate-500 mb-3">Protected Profiles</h2>
                        <div className="space-y-2">
                            {allChildren.map(child => (
                                <button
                                    key={child.id}
                                    onClick={() => { setSelectedChild(child); setUnlockedSections([]); }}
                                    className={`w-full p-3 rounded-lg flex items-center gap-3 transition-colors ${selectedChild?.id === child.id ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:bg-slate-800'}`}
                                >
                                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
                                        {child.identity?.profile_photo ? (
                                            <img src={child.identity.profile_photo} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="w-4 h-4" />
                                        )}
                                    </div>
                                    <div className="text-left flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{child.identity?.full_name}</p>
                                        <p className="text-xs text-slate-500 truncate">{child.familyName}</p>
                                    </div>
                                    <Lock className="w-3 h-3 text-slate-600" />
                                </button>
                            ))}
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-6">
                    {selectedChild ? (
                        <div>
                            {/* Profile Header */}
                            <div className="bg-slate-900 rounded-xl p-6 mb-6 border border-slate-800">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-xl bg-slate-800 flex items-center justify-center overflow-hidden">
                                        {selectedChild.identity?.profile_photo ? (
                                            <img src={selectedChild.identity.profile_photo} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="w-8 h-8 text-slate-600" />
                                        )}
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-white">{selectedChild.identity?.full_name}</h2>
                                        <p className="text-slate-500">{selectedChild.familyName}</p>
                                    </div>
                                    <Button variant="outline" className="ml-auto border-slate-700 text-slate-300" onClick={() => navigate(`/child/${selectedChild.id}`)}>
                                        <Key className="w-4 h-4 mr-2" /> Full Access
                                    </Button>
                                </div>
                            </div>

                            {/* Vault Sections */}
                            <div className="grid gap-4 md:grid-cols-2">
                                {VAULT_SECTIONS.map(section => {
                                    const Icon = section.icon;
                                    const data = getSectionData(section.id, selectedChild);
                                    const unlocked = isUnlocked(section.id);

                                    return (
                                        <div key={section.id} className={`bg-slate-900 rounded-xl border ${unlocked ? 'border-slate-700' : 'border-slate-800'} overflow-hidden`}>
                                            {/* Section Header */}
                                            <div className={`p-4 flex items-center justify-between ${section.bgColor}`}>
                                                <div className="flex items-center gap-3">
                                                    <Icon className={`w-5 h-5 ${section.color}`} />
                                                    <span className="font-medium text-white">{section.label}</span>
                                                </div>
                                                {unlocked ? (
                                                    <Unlock className="w-4 h-4 text-emerald-500" />
                                                ) : (
                                                    <button onClick={() => { setSectionToUnlock(section); setShowUnlockModal(true); }}>
                                                        <Lock className="w-4 h-4 text-slate-500 hover:text-white transition-colors" />
                                                    </button>
                                                )}
                                            </div>

                                            {/* Section Content */}
                                            <div className="p-4">
                                                {unlocked ? (
                                                    data.length > 0 ? (
                                                        <div className="space-y-3">
                                                            {data.map((item, i) => (
                                                                <div key={i} className={`p-3 rounded-lg ${item.critical ? 'bg-red-500/10 border border-red-500/20' : 'bg-slate-800/50'}`}>
                                                                    <p className="text-xs text-slate-500 mb-1">{item.label}</p>
                                                                    <p className={`font-medium ${item.critical ? 'text-red-400' : 'text-white'}`}>{item.value}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-slate-500 text-center py-4">No data in this section</p>
                                                    )
                                                ) : (
                                                    <div className="text-center py-6">
                                                        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3">
                                                            <EyeOff className="w-5 h-5 text-slate-600" />
                                                        </div>
                                                        <p className="text-slate-500 text-sm">Tap lock to reveal</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full py-20">
                            <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                                <Shield className="w-10 h-10 text-slate-600" />
                            </div>
                            <h2 className="text-xl font-medium text-slate-400 mb-2">Select a Profile</h2>
                            <p className="text-slate-600">Choose from the sidebar to access vault</p>
                        </div>
                    )}
                </main>
            </div>

            {/* Unlock Modal */}
            <Dialog open={showUnlockModal} onOpenChange={setShowUnlockModal}>
                <DialogContent className="bg-slate-900 border-slate-700">
                    <DialogHeader>
                        <DialogTitle className="text-white flex items-center gap-2">
                            <Lock className="w-5 h-5 text-emerald-500" />
                            Unlock {sectionToUnlock?.label}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-slate-400 mb-4">This section contains protected information. Confirm to unlock.</p>
                        <div className="bg-slate-800 rounded-lg p-3 flex items-center gap-3">
                            <Shield className="w-5 h-5 text-emerald-500" />
                            <span className="text-sm text-slate-300">Vault security active</span>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setShowUnlockModal(false)} className="text-slate-400">Cancel</Button>
                        <Button onClick={() => handleUnlock(sectionToUnlock?.id)} className="bg-emerald-600 hover:bg-emerald-700">
                            <Unlock className="w-4 h-4 mr-2" /> Unlock Section
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
