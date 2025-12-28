import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Users, Settings, LogOut, Trash2, Image, Camera } from 'lucide-react';
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

export default function AlbumGridDashboard() {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [families, setFamilies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [selectedFamily, setSelectedFamily] = useState(null);
    const [formData, setFormData] = useState({ family_name: '', family_photo: '', family_notes: '' });

    useEffect(() => { fetchFamilies(); }, []);

    const fetchFamilies = async () => {
        try {
            const res = await axios.get(`${API}/families`);
            setFamilies(res.data.families || []);
        } catch (err) { toast.error('Failed'); }
        finally { setLoading(false); }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { toast.error('Max 5MB'); return; }
            const reader = new FileReader();
            reader.onloadend = () => setFormData(p => ({ ...p, family_photo: reader.result }));
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.family_name.trim()) { toast.error('Name required'); return; }
        try {
            await axios.post(`${API}/families`, formData);
            toast.success('Album created');
            fetchFamilies();
            setShowAddModal(false);
            setFormData({ family_name: '', family_photo: '', family_notes: '' });
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
        <div className="min-h-screen" style={{ backgroundColor: '#FEFCF9' }}>
            {/* Header */}
            <header className="bg-white/90 backdrop-blur-sm border-b" style={{ borderColor: '#E8E4DE' }}>
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#E8DFD5' }}>
                                <Image className="w-5 h-5" style={{ color: '#8B7355' }} />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold" style={{ color: '#5C4A3A' }}>OurCircle</h1>
                                <p className="text-xs" style={{ color: '#9C8B7A' }}>Album View</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
                                <Settings className="w-5 h-5" style={{ color: '#8B7355' }} />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => { logout(); toast.success('Logged out'); }}>
                                <LogOut className="w-5 h-5" style={{ color: '#8B7355' }} />
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-bold" style={{ color: '#5C4A3A' }}>Photo Albums</h2>
                        <p style={{ color: '#9C8B7A' }}>{families.length} families</p>
                    </div>
                    <Button onClick={() => setShowAddModal(true)} className="rounded-full gap-2" style={{ backgroundColor: '#8B7355' }} data-testid="add-family-btn">
                        <Plus className="w-4 h-4" />
                        New Album
                    </Button>
                </div>

                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="aspect-square rounded-2xl animate-pulse" style={{ backgroundColor: '#E8DFD5' }} />
                        ))}
                    </div>
                ) : families.length === 0 ? (
                    <div className="text-center py-20">
                        <Camera className="w-20 h-20 mx-auto mb-4" style={{ color: '#D4C5B5' }} />
                        <h3 className="text-xl font-semibold mb-2" style={{ color: '#5C4A3A' }}>No albums yet</h3>
                        <p className="mb-6" style={{ color: '#9C8B7A' }}>Create your first family album</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {families.map((family, i) => (
                            <div
                                key={family.id}
                                className="group relative aspect-square rounded-2xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                                onClick={() => navigate(`/family/${family.id}`)}
                                style={{ animationDelay: `${i * 0.05}s` }}
                                data-testid={`family-card-${family.id}`}
                            >
                                {/* Photo */}
                                {family.family_photo ? (
                                    <img src={family.family_photo} alt={family.family_name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#E8DFD5' }}>
                                        <Users className="w-16 h-16" style={{ color: '#C4B5A5' }} />
                                    </div>
                                )}

                                {/* Gradient overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                                {/* Info */}
                                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                                    <h3 className="font-bold text-lg truncate">{family.family_name}</h3>
                                    <p className="text-sm opacity-80">{family.number_of_children || 0} children</p>
                                </div>

                                {/* Delete button (on hover) */}
                                <button
                                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => { e.stopPropagation(); setSelectedFamily(family); setShowDeleteDialog(true); }}
                                >
                                    <Trash2 className="w-4 h-4 text-white" />
                                </button>
                            </div>
                        ))}

                        {/* Add new album tile */}
                        <div
                            className="aspect-square rounded-2xl border-4 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors hover:border-opacity-70"
                            style={{ borderColor: '#D4C5B5' }}
                            onClick={() => setShowAddModal(true)}
                        >
                            <Plus className="w-10 h-10 mb-2" style={{ color: '#C4B5A5' }} />
                            <p className="text-sm font-medium" style={{ color: '#9C8B7A' }}>Add Album</p>
                        </div>
                    </div>
                )}
            </main>

            {/* Modals */}
            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
                <DialogContent className="rounded-2xl" style={{ backgroundColor: '#FEFCF9' }}>
                    <DialogHeader>
                        <DialogTitle style={{ color: '#5C4A3A' }}>Create New Album</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Cover photo */}
                        <div className="flex flex-col items-center">
                            <div className="w-32 h-32 rounded-xl overflow-hidden relative group" style={{ backgroundColor: '#E8DFD5' }}>
                                {formData.family_photo ? (
                                    <img src={formData.family_photo} alt="Cover" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Camera className="w-10 h-10" style={{ color: '#C4B5A5' }} />
                                    </div>
                                )}
                                <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                                    <Plus className="w-8 h-8 text-white" />
                                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                </label>
                            </div>
                            <p className="text-xs mt-2" style={{ color: '#9C8B7A' }}>Add cover photo</p>
                        </div>
                        <div>
                            <Label style={{ color: '#5C4A3A' }}>Album Name</Label>
                            <Input value={formData.family_name} onChange={e => setFormData(p => ({ ...p, family_name: e.target.value }))} className="mt-1 rounded-xl" style={{ borderColor: '#E8DFD5' }} data-testid="family-name-input" />
                        </div>
                        <div>
                            <Label style={{ color: '#5C4A3A' }}>Notes</Label>
                            <Textarea value={formData.family_notes} onChange={e => setFormData(p => ({ ...p, family_notes: e.target.value }))} className="mt-1 rounded-xl" style={{ borderColor: '#E8DFD5' }} rows={2} />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowAddModal(false)} className="rounded-full">Cancel</Button>
                            <Button type="submit" className="rounded-full" style={{ backgroundColor: '#8B7355' }} data-testid="save-family-btn">Create Album</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Album?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete "{selectedFamily?.family_name}".</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="rounded-full bg-destructive">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
