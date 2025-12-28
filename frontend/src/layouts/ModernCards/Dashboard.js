import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Users, Settings, LogOut, Trash2, ChevronRight, Smartphone } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../components/ui/alert-dialog';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ModernCardsDashboard() {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [families, setFamilies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [selectedFamily, setSelectedFamily] = useState(null);
    const [formData, setFormData] = useState({ family_name: '', family_notes: '' });

    useEffect(() => { fetchFamilies(); }, []);

    const fetchFamilies = async () => {
        try {
            const res = await axios.get(`${API}/families`);
            setFamilies(res.data.families || []);
        } catch (err) { toast.error('Failed'); }
        finally { setLoading(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.family_name.trim()) { toast.error('Name required'); return; }
        try {
            await axios.post(`${API}/families`, formData);
            toast.success('Family added');
            fetchFamilies();
            setShowAddModal(false);
            setFormData({ family_name: '', family_notes: '' });
        } catch (err) { toast.error('Failed'); }
    };

    const handleDelete = async () => {
        if (!selectedFamily) return;
        try {
            await axios.delete(`${API}/families/${selectedFamily.id}`);
            toast.success('Deleted');
            fetchFamilies();
            setShowDeleteDialog(false);
        } catch (err) { toast.error('Failed'); }
    };

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <header className="bg-white shadow-sm">
                <div className="max-w-lg mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-200">
                                <Smartphone className="w-5 h-5 text-white" />
                            </div>
                            <h1 className="text-xl font-bold text-gray-900">OurCircle</h1>
                        </div>
                        <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
                                <Settings className="w-5 h-5 text-gray-600" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => { logout(); toast.success('Logged out'); }}>
                                <LogOut className="w-5 h-5 text-gray-600" />
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-lg mx-auto px-4 py-6">
                {/* Quick add button */}
                <Button 
                    onClick={() => setShowAddModal(true)} 
                    className="w-full mb-6 h-14 rounded-2xl bg-violet-600 hover:bg-violet-700 shadow-lg shadow-violet-200 text-lg font-semibold gap-2"
                    data-testid="add-family-btn"
                >
                    <Plus className="w-5 h-5" />
                    Add Family
                </Button>

                {/* Family Cards Stack */}
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => <div key={i} className="h-24 bg-white rounded-2xl animate-pulse shadow" />)}
                    </div>
                ) : families.length === 0 ? (
                    <Card className="p-8 text-center rounded-2xl shadow-lg">
                        <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <h3 className="text-lg font-semibold text-gray-700 mb-1">No families yet</h3>
                        <p className="text-gray-500 text-sm">Tap the button above to add your first family</p>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {families.map((family, i) => (
                            <Card 
                                key={family.id}
                                className="rounded-2xl shadow-md hover:shadow-lg transition-shadow overflow-hidden"
                                data-testid={`family-card-${family.id}`}
                            >
                                <CardContent className="p-0">
                                    <div 
                                        className="p-4 flex items-center gap-4 cursor-pointer active:bg-gray-50"
                                        onClick={() => navigate(`/family/${family.id}`)}
                                    >
                                        <div className="w-14 h-14 rounded-xl bg-violet-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                                            {family.family_photo ? (
                                                <img src={family.family_photo} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <Users className="w-7 h-7 text-violet-500" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-gray-900 truncate">{family.family_name}</h3>
                                            <p className="text-sm text-gray-500">
                                                {family.number_of_children || 0} children
                                            </p>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-gray-400" />
                                    </div>

                                    {/* Swipe actions hint */}
                                    <div className="flex border-t border-gray-100">
                                        <button 
                                            className="flex-1 py-3 text-sm font-medium text-violet-600 hover:bg-violet-50 transition-colors"
                                            onClick={() => navigate(`/family/${family.id}`)}
                                        >
                                            View
                                        </button>
                                        <div className="w-px bg-gray-100" />
                                        <button 
                                            className="flex-1 py-3 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
                                            onClick={() => { setSelectedFamily(family); setShowDeleteDialog(true); }}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </main>

            {/* Modals */}
            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
                <DialogContent className="rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>Add Family</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label>Family Name</Label>
                            <Input value={formData.family_name} onChange={e => setFormData(p => ({ ...p, family_name: e.target.value }))} className="mt-1 rounded-xl h-12" data-testid="family-name-input" />
                        </div>
                        <div>
                            <Label>Notes</Label>
                            <Textarea value={formData.family_notes} onChange={e => setFormData(p => ({ ...p, family_notes: e.target.value }))} className="mt-1 rounded-xl" rows={3} />
                        </div>
                        <DialogFooter className="gap-2">
                            <Button type="button" variant="outline" onClick={() => setShowAddModal(false)} className="rounded-xl flex-1">Cancel</Button>
                            <Button type="submit" className="rounded-xl flex-1 bg-violet-600 hover:bg-violet-700" data-testid="save-family-btn">Add</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Family?</AlertDialogTitle>
                        <AlertDialogDescription>"{selectedFamily?.family_name}" will be permanently deleted.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="rounded-xl bg-red-500">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
