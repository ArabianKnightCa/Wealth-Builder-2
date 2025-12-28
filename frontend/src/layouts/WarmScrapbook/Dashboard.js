import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
    Plus, Users, Settings, LogOut, Archive, ArchiveRestore, 
    Trash2, Edit, Baby, Camera, Heart, Calendar
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../components/ui/alert-dialog';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import BirthdayReminders from '../../components/BirthdayReminders';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function WarmScrapbookDashboard() {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [families, setFamilies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showArchived, setShowArchived] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [selectedFamily, setSelectedFamily] = useState(null);
    const [formData, setFormData] = useState({ family_name: '', family_photo: '', family_notes: '' });

    useEffect(() => { fetchFamilies(); }, [showArchived]);

    const fetchFamilies = async () => {
        try {
            const res = await axios.get(`${API}/families?include_archived=${showArchived}`);
            setFamilies(res.data.families || []);
        } catch (err) { toast.error('Failed to load families'); }
        finally { setLoading(false); }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { toast.error('Image must be less than 5MB'); return; }
            const reader = new FileReader();
            reader.onloadend = () => setFormData(prev => ({ ...prev, family_photo: reader.result }));
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.family_name.trim()) { toast.error('Family name is required'); return; }
        try {
            if (showEditModal && selectedFamily) {
                await axios.put(`${API}/families/${selectedFamily.id}`, formData);
                toast.success('Family updated');
            } else {
                await axios.post(`${API}/families`, formData);
                toast.success('Family created');
            }
            fetchFamilies();
            closeModals();
        } catch (err) { toast.error('Failed to save family'); }
    };

    const handleArchive = async (family, archive = true) => {
        try {
            await axios.put(`${API}/families/${family.id}`, { archived: archive });
            toast.success(archive ? 'Family archived' : 'Family restored');
            fetchFamilies();
        } catch (err) { toast.error('Failed to update family'); }
    };

    const handleDelete = async () => {
        if (!selectedFamily) return;
        try {
            await axios.delete(`${API}/families/${selectedFamily.id}`);
            toast.success('Family deleted');
            fetchFamilies();
            setShowDeleteDialog(false);
            setSelectedFamily(null);
        } catch (err) { toast.error('Failed to delete'); }
    };

    const openEditModal = (family) => {
        setSelectedFamily(family);
        setFormData({ family_name: family.family_name, family_photo: family.family_photo || '', family_notes: family.family_notes || '' });
        setShowEditModal(true);
    };

    const closeModals = () => {
        setShowAddModal(false);
        setShowEditModal(false);
        setSelectedFamily(null);
        setFormData({ family_name: '', family_photo: '', family_notes: '' });
    };

    return (
        <div className="min-h-screen" style={{ backgroundColor: '#FDF8F3' }}>
            {/* Scrapbook Header */}
            <header className="border-b" style={{ borderColor: '#E8DDD4', backgroundColor: 'rgba(253, 248, 243, 0.95)' }}>
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#F5EDE6' }}>
                                <Heart className="w-6 h-6" style={{ color: '#8B7355' }} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold" style={{ color: '#5C4A3A', fontFamily: 'Georgia, serif' }}>OurCircle</h1>
                                <p className="text-xs" style={{ color: '#9C8B7A' }}>Family Memory Book</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={() => navigate('/settings')} data-testid="settings-btn">
                                <Settings className="w-5 h-5" style={{ color: '#8B7355' }} />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => { logout(); toast.success('Logged out'); }}>
                                <LogOut className="w-5 h-5" style={{ color: '#8B7355' }} />
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
                {/* Birthday Reminders */}
                <BirthdayReminders />

                {/* Title Section */}
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-bold mb-2" style={{ color: '#5C4A3A', fontFamily: 'Georgia, serif' }}>
                        Your Family Albums
                    </h2>
                    <p style={{ color: '#9C8B7A' }}>Precious memories, beautifully preserved</p>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3 justify-center mb-8">
                    <Button
                        onClick={() => setShowAddModal(true)}
                        className="gap-2 rounded-full px-6 shadow-md"
                        style={{ backgroundColor: '#8B7355', color: 'white' }}
                        data-testid="add-family-btn"
                    >
                        <Plus className="w-4 h-4" />
                        Add Family Album
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => setShowArchived(!showArchived)}
                        className="gap-2 rounded-full"
                        style={{ borderColor: '#D4C5B5', color: '#8B7355' }}
                    >
                        {showArchived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                        {showArchived ? 'Hide Archived' : 'Show Archived'}
                    </Button>
                </div>

                {/* Family Photo Tiles */}
                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="aspect-square rounded-3xl animate-pulse" style={{ backgroundColor: '#F5EDE6' }} />
                        ))}
                    </div>
                ) : families.length === 0 ? (
                    <div className="text-center py-16 rounded-3xl" style={{ backgroundColor: '#F5EDE6' }}>
                        <Camera className="w-16 h-16 mx-auto mb-4" style={{ color: '#C4B5A5' }} />
                        <h3 className="text-xl font-semibold mb-2" style={{ color: '#5C4A3A' }}>No albums yet</h3>
                        <p className="mb-6" style={{ color: '#9C8B7A' }}>Start your first family album</p>
                        <Button onClick={() => setShowAddModal(true)} className="rounded-full" style={{ backgroundColor: '#8B7355' }}>
                            <Plus className="w-4 h-4 mr-2" />
                            Create First Album
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {families.map((family, index) => (
                            <div
                                key={family.id}
                                className={`group relative rounded-3xl overflow-hidden shadow-lg cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 animate-fade-in ${family.archived ? 'opacity-60' : ''}`}
                                style={{ animationDelay: `${index * 0.05}s`, backgroundColor: '#fff' }}
                                data-testid={`family-card-${family.id}`}
                            >
                                {/* Photo Area */}
                                <div 
                                    className="aspect-square relative overflow-hidden"
                                    onClick={() => navigate(`/family/${family.id}`)}
                                >
                                    {family.family_photo ? (
                                        <img src={family.family_photo} alt={family.family_name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#F5EDE6' }}>
                                            <Users className="w-16 h-16" style={{ color: '#C4B5A5' }} />
                                        </div>
                                    )}
                                    {/* Overlay on hover */}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                                </div>

                                {/* Info Strip */}
                                <div className="p-4" style={{ backgroundColor: '#FFFBF7' }}>
                                    <h3 className="font-semibold truncate mb-1" style={{ color: '#5C4A3A', fontFamily: 'Georgia, serif' }}>
                                        {family.family_name}
                                    </h3>
                                    <div className="flex items-center gap-2 text-sm" style={{ color: '#9C8B7A' }}>
                                        <Baby className="w-3.5 h-3.5" />
                                        <span>{family.number_of_children || 0} {(family.number_of_children || 0) === 1 ? 'child' : 'children'}</span>
                                    </div>
                                    
                                    {/* Actions */}
                                    <div className="flex gap-1 mt-3 pt-3" style={{ borderTop: '1px solid #E8DDD4' }}>
                                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openEditModal(family); }}>
                                            <Edit className="w-3.5 h-3.5" style={{ color: '#8B7355' }} />
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleArchive(family, !family.archived); }}>
                                            {family.archived ? <ArchiveRestore className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedFamily(family); setShowDeleteDialog(true); }}>
                                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                        </Button>
                                    </div>
                                </div>

                                {family.archived && (
                                    <div className="absolute top-3 right-3 px-2 py-1 rounded-full text-xs" style={{ backgroundColor: '#E8DDD4', color: '#8B7355' }}>
                                        Archived
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Add/Edit Modal */}
            <Dialog open={showAddModal || showEditModal} onOpenChange={closeModals}>
                <DialogContent className="sm:max-w-md rounded-3xl" style={{ backgroundColor: '#FFFBF7' }}>
                    <DialogHeader>
                        <DialogTitle style={{ color: '#5C4A3A', fontFamily: 'Georgia, serif' }}>
                            {showEditModal ? 'Edit Family Album' : 'Create New Album'}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-28 h-28 rounded-2xl overflow-hidden flex items-center justify-center relative group" style={{ backgroundColor: '#F5EDE6' }}>
                                {formData.family_photo ? (
                                    <img src={formData.family_photo} alt="Family" className="w-full h-full object-cover" />
                                ) : (
                                    <Camera className="w-10 h-10" style={{ color: '#C4B5A5' }} />
                                )}
                                <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity rounded-2xl">
                                    <Plus className="w-8 h-8 text-white" />
                                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                </label>
                            </div>
                            <p className="text-xs" style={{ color: '#9C8B7A' }}>Add a cover photo</p>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <Label style={{ color: '#5C4A3A' }}>Family Name *</Label>
                                <Input
                                    value={formData.family_name}
                                    onChange={e => setFormData(prev => ({ ...prev, family_name: e.target.value }))}
                                    placeholder="e.g., The Johnson Family"
                                    className="mt-1.5 rounded-xl"
                                    style={{ borderColor: '#E8DDD4' }}
                                    data-testid="family-name-input"
                                />
                            </div>
                            <div>
                                <Label style={{ color: '#5C4A3A' }}>Notes</Label>
                                <Textarea
                                    value={formData.family_notes}
                                    onChange={e => setFormData(prev => ({ ...prev, family_notes: e.target.value }))}
                                    placeholder="Special memories or notes..."
                                    className="mt-1.5 rounded-xl"
                                    style={{ borderColor: '#E8DDD4' }}
                                    rows={3}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={closeModals} className="rounded-full">Cancel</Button>
                            <Button type="submit" className="rounded-full" style={{ backgroundColor: '#8B7355' }} data-testid="save-family-btn">
                                {showEditModal ? 'Save Changes' : 'Create Album'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent className="rounded-3xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Family Album?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete "{selectedFamily?.family_name}" and all memories. This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="rounded-full bg-destructive text-destructive-foreground">
                            Delete Album
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
