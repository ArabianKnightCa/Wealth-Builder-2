import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
    Plus, Users, Settings, LogOut, Trash2, Edit, Baby,
    Pizza, BookOpen, Music, Palette, Trophy, Heart, Sparkles
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../components/ui/alert-dialog';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function PlayfulPopDashboard() {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [families, setFamilies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentFamilyIndex, setCurrentFamilyIndex] = useState(0);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [selectedFamily, setSelectedFamily] = useState(null);
    const [formData, setFormData] = useState({ family_name: '', family_notes: '' });

    useEffect(() => { fetchFamilies(); }, []);

    const fetchFamilies = async () => {
        try {
            const res = await axios.get(`${API}/families`);
            setFamilies(res.data.families || []);
        } catch (err) { toast.error('Failed to load'); }
        finally { setLoading(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.family_name.trim()) { toast.error('Name required'); return; }
        try {
            await axios.post(`${API}/families`, formData);
            toast.success('Family created!');
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

    const nextFamily = () => setCurrentFamilyIndex(i => (i + 1) % families.length);
    const prevFamily = () => setCurrentFamilyIndex(i => (i - 1 + families.length) % families.length);

    const categoryIcons = [
        { icon: Pizza, label: 'Food', color: 'bg-orange-400' },
        { icon: BookOpen, label: 'School', color: 'bg-blue-400' },
        { icon: Music, label: 'Music', color: 'bg-purple-400' },
        { icon: Palette, label: 'Style', color: 'bg-pink-400' },
        { icon: Trophy, label: 'Sports', color: 'bg-yellow-400' },
        { icon: Heart, label: 'Loves', color: 'bg-red-400' },
    ];

    const currentFamily = families[currentFamilyIndex];

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-sky-50">
            {/* Fun Header */}
            <header className="bg-white/80 backdrop-blur-sm border-b-4 border-dashed border-amber-200">
                <div className="max-w-6xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center rotate-3 shadow-lg">
                                <Sparkles className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-gray-800" style={{ fontFamily: 'Nunito, sans-serif' }}>
                                    OurCircle
                                </h1>
                                <p className="text-xs text-amber-600 font-semibold">Fun Family Memories!</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="icon" onClick={() => navigate('/settings')} className="hover:bg-amber-100">
                                <Settings className="w-5 h-5 text-amber-600" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => { logout(); toast.success('Bye!'); }} className="hover:bg-amber-100">
                                <LogOut className="w-5 h-5 text-amber-600" />
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-8">
                {/* Family Carousel */}
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-black text-gray-800 mb-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
                        Your Families
                    </h2>
                    <Button onClick={() => setShowAddModal(true)} className="rounded-full bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 shadow-lg gap-2" data-testid="add-family-btn">
                        <Plus className="w-4 h-4" />
                        Add Family
                    </Button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : families.length === 0 ? (
                    <div className="text-center py-16 bg-white/60 rounded-3xl border-4 border-dashed border-amber-200">
                        <Sparkles className="w-16 h-16 mx-auto mb-4 text-amber-300" />
                        <h3 className="text-2xl font-bold text-gray-700 mb-2">No families yet!</h3>
                        <p className="text-gray-500 mb-6">Let's create your first family album</p>
                    </div>
                ) : (
                    <>
                        {/* Carousel */}
                        <div className="relative mb-10">
                            <div className="flex items-center justify-center gap-4">
                                {families.length > 1 && (
                                    <Button variant="outline" size="icon" onClick={prevFamily} className="rounded-full border-2 border-amber-300 hover:bg-amber-100">
                                        ←
                                    </Button>
                                )}
                                
                                <div 
                                    className="bg-white rounded-3xl p-8 shadow-xl border-4 border-amber-100 cursor-pointer transition-transform hover:scale-105 min-w-[300px] max-w-md"
                                    onClick={() => navigate(`/family/${currentFamily.id}`)}
                                    data-testid={`family-card-${currentFamily?.id}`}
                                >
                                    <div className="w-24 h-24 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-200 to-orange-200 flex items-center justify-center overflow-hidden rotate-2">
                                        {currentFamily?.family_photo ? (
                                            <img src={currentFamily.family_photo} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <Users className="w-12 h-12 text-amber-500" />
                                        )}
                                    </div>
                                    <h3 className="text-2xl font-bold text-center text-gray-800 mb-2">{currentFamily?.family_name}</h3>
                                    <p className="text-center text-amber-600 font-semibold">
                                        {currentFamily?.number_of_children || 0} {(currentFamily?.number_of_children || 0) === 1 ? 'kiddo' : 'kiddos'}
                                    </p>
                                    <div className="flex justify-center gap-2 mt-4">
                                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedFamily(currentFamily); setShowDeleteDialog(true); }}>
                                            <Trash2 className="w-4 h-4 text-red-400" />
                                        </Button>
                                    </div>
                                </div>

                                {families.length > 1 && (
                                    <Button variant="outline" size="icon" onClick={nextFamily} className="rounded-full border-2 border-amber-300 hover:bg-amber-100">
                                        →
                                    </Button>
                                )}
                            </div>
                            
                            {/* Dots indicator */}
                            {families.length > 1 && (
                                <div className="flex justify-center gap-2 mt-6">
                                    {families.map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setCurrentFamilyIndex(i)}
                                            className={`w-3 h-3 rounded-full transition-colors ${i === currentFamilyIndex ? 'bg-amber-500' : 'bg-amber-200'}`}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Category Icons Legend */}
                        <div className="bg-white/60 rounded-3xl p-6 border-2 border-dashed border-amber-200">
                            <h4 className="text-center font-bold text-gray-700 mb-4">Profile Categories</h4>
                            <div className="flex flex-wrap justify-center gap-4">
                                {categoryIcons.map(({ icon: Icon, label, color }) => (
                                    <div key={label} className="flex flex-col items-center gap-1">
                                        <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center shadow-md`}>
                                            <Icon className="w-6 h-6 text-white" />
                                        </div>
                                        <span className="text-xs font-medium text-gray-600">{label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </main>

            {/* Modals */}
            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
                <DialogContent className="rounded-3xl border-4 border-amber-100">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Add New Family</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label>Family Name</Label>
                            <Input value={formData.family_name} onChange={e => setFormData(p => ({ ...p, family_name: e.target.value }))} className="rounded-xl" data-testid="family-name-input" />
                        </div>
                        <div>
                            <Label>Notes</Label>
                            <Textarea value={formData.family_notes} onChange={e => setFormData(p => ({ ...p, family_notes: e.target.value }))} className="rounded-xl" rows={3} />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowAddModal(false)} className="rounded-full">Cancel</Button>
                            <Button type="submit" className="rounded-full bg-gradient-to-r from-amber-400 to-orange-500" data-testid="save-family-btn">Create!</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent className="rounded-3xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Family?</AlertDialogTitle>
                        <AlertDialogDescription>This will delete "{selectedFamily?.family_name}" forever!</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="rounded-full bg-red-500">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
