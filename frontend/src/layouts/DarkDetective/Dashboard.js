import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
    Plus, Users, Settings, LogOut, Trash2, Edit, 
    Shield, Lock, Eye, Clock, Tag, FileText
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../components/ui/alert-dialog';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function DarkDetectiveDashboard() {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [families, setFamilies] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [selectedFamily, setSelectedFamily] = useState(null);
    const [formData, setFormData] = useState({ family_name: '', family_notes: '' });

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const res = await axios.get(`${API}/families`);
            const familiesData = res.data.families || [];
            setFamilies(familiesData);

            // Fetch recent timeline events
            const events = [];
            for (const family of familiesData.slice(0, 3)) {
                const childrenRes = await axios.get(`${API}/families/${family.id}/children`);
                for (const child of (childrenRes.data.children || []).slice(0, 2)) {
                    try {
                        const timelineRes = await axios.get(`${API}/children/${child.id}/timeline`);
                        events.push(...(timelineRes.data.events || []).slice(0, 3).map(e => ({
                            ...e,
                            childName: child.identity?.full_name,
                            familyName: family.family_name
                        })));
                    } catch (e) {}
                }
            }
            setRecentActivity(events.sort((a, b) => new Date(b.event_date) - new Date(a.event_date)).slice(0, 5));
        } catch (err) { toast.error('Failed to load'); }
        finally { setLoading(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.family_name.trim()) { toast.error('Name required'); return; }
        try {
            await axios.post(`${API}/families`, formData);
            toast.success('Dossier created');
            fetchData();
            setShowAddModal(false);
            setFormData({ family_name: '', family_notes: '' });
        } catch (err) { toast.error('Failed'); }
    };

    const handleDelete = async () => {
        if (!selectedFamily) return;
        try {
            await axios.delete(`${API}/families/${selectedFamily.id}`);
            toast.success('Dossier deleted');
            fetchData();
            setShowDeleteDialog(false);
        } catch (err) { toast.error('Failed'); }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100">
            {/* Header */}
            <header className="bg-gray-800/80 backdrop-blur-sm border-b border-gray-700">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center">
                                <Shield className="w-5 h-5 text-gray-900" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-amber-400">OurCircle</h1>
                                <p className="text-xs text-gray-500 font-mono">CLASSIFIED DOSSIERS</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={() => navigate('/settings')} className="hover:bg-gray-700">
                                <Settings className="w-5 h-5 text-gray-400" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => { logout(); toast.success('Session terminated'); }} className="hover:bg-gray-700">
                                <LogOut className="w-5 h-5 text-gray-400" />
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Dossiers List */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-amber-400 flex items-center gap-2">
                                <FileText className="w-5 h-5" />
                                FAMILY DOSSIERS
                            </h2>
                            <Button onClick={() => setShowAddModal(true)} size="sm" className="bg-amber-500 hover:bg-amber-600 text-gray-900 font-semibold" data-testid="add-family-btn">
                                <Plus className="w-4 h-4 mr-1" />
                                NEW DOSSIER
                            </Button>
                        </div>

                        {loading ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-800 rounded-lg animate-pulse" />)}
                            </div>
                        ) : families.length === 0 ? (
                            <Card className="bg-gray-800 border-gray-700">
                                <CardContent className="py-12 text-center">
                                    <Lock className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                                    <p className="text-gray-400">No dossiers on file</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-3">
                                {families.map((family, i) => (
                                    <Card 
                                        key={family.id}
                                        className="bg-gray-800 border-gray-700 hover:border-amber-500/50 transition-colors cursor-pointer"
                                        onClick={() => navigate(`/family/${family.id}`)}
                                        data-testid={`family-card-${family.id}`}
                                    >
                                        <CardContent className="p-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-lg bg-gray-700 flex items-center justify-center overflow-hidden border border-gray-600">
                                                    {family.family_photo ? (
                                                        <img src={family.family_photo} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Users className="w-7 h-7 text-gray-500" />
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-bold text-gray-100">{family.family_name}</h3>
                                                        <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-mono">
                                                            {family.number_of_children || 0} SUBJECTS
                                                        </span>
                                                    </div>
                                                    {family.family_notes && (
                                                        <p className="text-sm text-gray-500 mt-1 line-clamp-1">{family.family_notes}</p>
                                                    )}
                                                </div>
                                                <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-700" onClick={() => { setSelectedFamily(family); setShowDeleteDialog(true); }}>
                                                        <Trash2 className="w-4 h-4 text-red-400" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4">
                        {/* Recent Activity */}
                        <Card className="bg-gray-800 border-gray-700">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-bold text-amber-400 flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    RECENT ACTIVITY
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {recentActivity.length === 0 ? (
                                    <p className="text-sm text-gray-500">No recent activity</p>
                                ) : (
                                    <div className="space-y-3">
                                        {recentActivity.map((event, i) => (
                                            <div key={i} className="border-l-2 border-amber-500/50 pl-3">
                                                <p className="text-sm text-gray-300">{event.title}</p>
                                                <p className="text-xs text-gray-500">{event.childName}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Quick Tags */}
                        <Card className="bg-gray-800 border-gray-700">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-bold text-amber-400 flex items-center gap-2">
                                    <Tag className="w-4 h-4" />
                                    KNOWN FOR...
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {['Creative', 'Athletic', 'Musical', 'Curious', 'Kind'].map(tag => (
                                        <span key={tag} className="text-xs px-2 py-1 rounded bg-gray-700 text-gray-400 border border-gray-600">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Vault Section */}
                        <Card className="bg-gray-800 border-gray-700 border-dashed">
                            <CardContent className="py-6 text-center">
                                <Lock className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                                <p className="text-xs text-gray-500 font-mono">LOCKED NOTES</p>
                                <p className="text-xs text-gray-600">Coming Soon</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>

            {/* Modals */}
            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
                <DialogContent className="bg-gray-800 border-gray-700 text-gray-100">
                    <DialogHeader>
                        <DialogTitle className="text-amber-400">NEW DOSSIER</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label className="text-gray-400">Family Name</Label>
                            <Input value={formData.family_name} onChange={e => setFormData(p => ({ ...p, family_name: e.target.value }))} className="bg-gray-700 border-gray-600" data-testid="family-name-input" />
                        </div>
                        <div>
                            <Label className="text-gray-400">Notes</Label>
                            <Textarea value={formData.family_notes} onChange={e => setFormData(p => ({ ...p, family_notes: e.target.value }))} className="bg-gray-700 border-gray-600" rows={3} />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowAddModal(false)} className="border-gray-600 text-gray-400">Cancel</Button>
                            <Button type="submit" className="bg-amber-500 text-gray-900 hover:bg-amber-600" data-testid="save-family-btn">Create Dossier</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent className="bg-gray-800 border-gray-700">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-gray-100">Delete Dossier?</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-400">This will permanently destroy all records for "{selectedFamily?.family_name}".</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="border-gray-600 text-gray-400">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600">Destroy</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
