import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format, addDays } from 'date-fns';
import { 
    Plus, Users, Settings, LogOut, Search, Gift, Clock, 
    Star, TrendingUp, LayoutGrid, ChevronRight, User
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function DashboardProDashboard() {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [families, setFamilies] = useState([]);
    const [recentChildren, setRecentChildren] = useState([]);
    const [upcomingBirthdays, setUpcomingBirthdays] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [formData, setFormData] = useState({ family_name: '', family_notes: '' });

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const res = await axios.get(`${API}/families`);
            const familiesData = res.data.families || [];
            setFamilies(familiesData);

            const allChildren = [];
            for (const family of familiesData) {
                const childrenRes = await axios.get(`${API}/families/${family.id}/children`);
                const children = (childrenRes.data.children || []).map(c => ({ ...c, familyName: family.family_name }));
                allChildren.push(...children);
            }

            // Recent children (by created_at or just first few)
            setRecentChildren(allChildren.slice(0, 5));

            // Upcoming birthdays
            const today = new Date();
            const birthdays = allChildren
                .filter(c => c.identity?.birthday)
                .map(c => {
                    const bday = new Date(c.identity.birthday);
                    const thisYear = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
                    if (thisYear < today) thisYear.setFullYear(today.getFullYear() + 1);
                    return { ...c, nextBirthday: thisYear, daysUntil: Math.ceil((thisYear - today) / (1000 * 60 * 60 * 24)) };
                })
                .filter(c => c.daysUntil <= 30)
                .sort((a, b) => a.daysUntil - b.daysUntil);
            setUpcomingBirthdays(birthdays);
        } catch (err) { toast.error('Failed to load'); }
        finally { setLoading(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.family_name.trim()) { toast.error('Name required'); return; }
        try {
            await axios.post(`${API}/families`, formData);
            toast.success('Created');
            fetchData();
            setShowAddModal(false);
            setFormData({ family_name: '', family_notes: '' });
        } catch (err) { toast.error('Failed'); }
    };

    const filteredFamilies = families.filter(f => f.family_name.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100">
            {/* Header */}
            <header className="bg-slate-800 border-b border-slate-700">
                <div className="max-w-7xl mx-auto px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-emerald-500 flex items-center justify-center">
                                <LayoutGrid className="w-5 h-5 text-white" />
                            </div>
                            <h1 className="text-lg font-bold">OurCircle Pro</h1>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={() => navigate('/settings')} className="hover:bg-slate-700">
                                <Settings className="w-5 h-5 text-slate-400" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => { logout(); toast.success('Logged out'); }} className="hover:bg-slate-700">
                                <LogOut className="w-5 h-5 text-slate-400" />
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-6">
                {/* Widget Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {/* Search Widget */}
                    <Card className="bg-slate-800 border-slate-700 col-span-full lg:col-span-2">
                        <CardContent className="p-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    placeholder="Search families, children..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="pl-10 bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-400"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Add */}
                    <Card className="bg-slate-800 border-slate-700 col-span-1">
                        <CardContent className="p-4">
                            <Button onClick={() => setShowAddModal(true)} className="w-full bg-emerald-600 hover:bg-emerald-700" data-testid="add-family-btn">
                                <Plus className="w-4 h-4 mr-2" />
                                Quick Add
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Stats */}
                    <Card className="bg-slate-800 border-slate-700 col-span-1">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{families.length}</p>
                                <p className="text-xs text-slate-400">Total Families</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content - Families */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <Users className="w-5 h-5 text-emerald-400" />
                                Families
                            </h2>
                            <span className="text-sm text-slate-400">{filteredFamilies.length} total</span>
                        </div>

                        {loading ? (
                            <div className="space-y-2">
                                {[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-800 rounded-lg animate-pulse" />)}
                            </div>
                        ) : filteredFamilies.length === 0 ? (
                            <Card className="bg-slate-800 border-slate-700 p-8 text-center">
                                <Users className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                                <p className="text-slate-400">No families found</p>
                            </Card>
                        ) : (
                            <div className="space-y-2">
                                {filteredFamilies.map(family => (
                                    <Card 
                                        key={family.id}
                                        className="bg-slate-800 border-slate-700 hover:border-emerald-500/50 transition-colors cursor-pointer"
                                        onClick={() => navigate(`/family/${family.id}`)}
                                        data-testid={`family-card-${family.id}`}
                                    >
                                        <CardContent className="p-4 flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center overflow-hidden">
                                                {family.family_photo ? (
                                                    <img src={family.family_photo} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <Users className="w-5 h-5 text-slate-400" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium">{family.family_name}</p>
                                                <p className="text-sm text-slate-400">{family.number_of_children || 0} children</p>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-slate-500" />
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Sidebar Widgets */}
                    <div className="space-y-4">
                        {/* Upcoming Birthdays */}
                        <Card className="bg-slate-800 border-slate-700">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-amber-400">
                                    <Gift className="w-4 h-4" />
                                    Upcoming Birthdays
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {upcomingBirthdays.length === 0 ? (
                                    <p className="text-sm text-slate-500">No birthdays in the next 30 days</p>
                                ) : (
                                    <div className="space-y-3">
                                        {upcomingBirthdays.slice(0, 4).map((child, i) => (
                                            <div key={i} className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden">
                                                        {child.identity?.profile_photo ? (
                                                            <img src={child.identity.profile_photo} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <User className="w-4 h-4 text-slate-400" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium">{child.identity?.full_name}</p>
                                                        <p className="text-xs text-slate-500">{child.familyName}</p>
                                                    </div>
                                                </div>
                                                <span className={`text-xs font-medium px-2 py-1 rounded ${child.daysUntil <= 7 ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-400'}`}>
                                                    {child.daysUntil === 0 ? 'Today!' : `${child.daysUntil}d`}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Recently Viewed */}
                        <Card className="bg-slate-800 border-slate-700">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-400">
                                    <Clock className="w-4 h-4" />
                                    Recent Children
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {recentChildren.length === 0 ? (
                                    <p className="text-sm text-slate-500">No children yet</p>
                                ) : (
                                    <div className="space-y-2">
                                        {recentChildren.map((child, i) => (
                                            <button
                                                key={i}
                                                onClick={() => navigate(`/child/${child.id}`)}
                                                className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-slate-700 transition-colors text-left"
                                            >
                                                <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden">
                                                    {child.identity?.profile_photo ? (
                                                        <img src={child.identity.profile_photo} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <User className="w-3 h-3 text-slate-400" />
                                                    )}
                                                </div>
                                                <span className="text-sm">{child.identity?.full_name}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Pinned */}
                        <Card className="bg-slate-800 border-slate-700 border-dashed">
                            <CardContent className="p-4 text-center">
                                <Star className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                                <p className="text-xs text-slate-500">Pinned Items</p>
                                <p className="text-xs text-slate-600">Coming Soon</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>

            {/* Add Modal */}
            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
                <DialogContent className="bg-slate-800 border-slate-700 text-slate-100">
                    <DialogHeader>
                        <DialogTitle>Quick Add Family</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label className="text-slate-300">Family Name</Label>
                            <Input value={formData.family_name} onChange={e => setFormData(p => ({ ...p, family_name: e.target.value }))} className="mt-1 bg-slate-700 border-slate-600" data-testid="family-name-input" />
                        </div>
                        <div>
                            <Label className="text-slate-300">Notes</Label>
                            <Textarea value={formData.family_notes} onChange={e => setFormData(p => ({ ...p, family_notes: e.target.value }))} className="mt-1 bg-slate-700 border-slate-600" rows={3} />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowAddModal(false)} className="border-slate-600 text-slate-300">Cancel</Button>
                            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" data-testid="save-family-btn">Create</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
