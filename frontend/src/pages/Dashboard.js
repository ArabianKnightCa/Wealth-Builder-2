import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
    Plus, Users, Settings, LogOut, Archive, ArchiveRestore, 
    Trash2, Edit, ChevronRight, Baby, Image
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import ThemeSelector from '../components/ThemeSelector';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Dashboard() {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [families, setFamilies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showArchived, setShowArchived] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [selectedFamily, setSelectedFamily] = useState(null);
    const [formData, setFormData] = useState({
        family_name: '',
        family_photo: '',
        family_notes: ''
    });

    useEffect(() => {
        fetchFamilies();
    }, [showArchived]);

    const fetchFamilies = async () => {
        try {
            const res = await axios.get(`${API}/families?include_archived=${showArchived}`);
            setFamilies(res.data.families || []);
        } catch (err) {
            toast.error('Failed to load families');
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Image must be less than 5MB');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, family_photo: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.family_name.trim()) {
            toast.error('Family name is required');
            return;
        }

        try {
            if (showEditModal && selectedFamily) {
                await axios.put(`${API}/families/${selectedFamily.id}`, formData);
                toast.success('Family updated successfully');
            } else {
                await axios.post(`${API}/families`, formData);
                toast.success('Family created successfully');
            }
            fetchFamilies();
            closeModals();
        } catch (err) {
            toast.error('Failed to save family');
        }
    };

    const handleArchive = async (family, archive = true) => {
        try {
            await axios.put(`${API}/families/${family.id}`, { archived: archive });
            toast.success(archive ? 'Family archived' : 'Family restored');
            fetchFamilies();
        } catch (err) {
            toast.error('Failed to update family');
        }
    };

    const handleDelete = async () => {
        if (!selectedFamily) return;
        try {
            await axios.delete(`${API}/families/${selectedFamily.id}`);
            toast.success('Family deleted permanently');
            fetchFamilies();
            setShowDeleteDialog(false);
            setSelectedFamily(null);
        } catch (err) {
            toast.error('Failed to delete family');
        }
    };

    const openEditModal = (family) => {
        setSelectedFamily(family);
        setFormData({
            family_name: family.family_name,
            family_photo: family.family_photo || '',
            family_notes: family.family_notes || ''
        });
        setShowEditModal(true);
    };

    const closeModals = () => {
        setShowAddModal(false);
        setShowEditModal(false);
        setSelectedFamily(null);
        setFormData({ family_name: '', family_photo: '', family_notes: '' });
    };

    const handleLogout = () => {
        logout();
        toast.success('Logged out successfully');
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-50 glass border-b border-border">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Users className="w-5 h-5 text-primary" />
                            </div>
                            <h1 className="text-xl font-bold text-foreground">OurCircle</h1>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => setShowSettingsModal(true)}
                                data-testid="settings-btn"
                            >
                                <Settings className="w-5 h-5" />
                            </Button>
                            <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={handleLogout}
                                data-testid="logout-btn"
                            >
                                <LogOut className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
                {/* Actions Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Your Families</h2>
                        <p className="text-muted-foreground mt-1">
                            {families.length} {families.length === 1 ? 'family' : 'families'}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setShowArchived(!showArchived)}
                            className="gap-2"
                            data-testid="toggle-archived-btn"
                        >
                            {showArchived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                            {showArchived ? 'Hide Archived' : 'Show Archived'}
                        </Button>
                        <Button 
                            onClick={() => setShowAddModal(true)}
                            className="gap-2 rounded-full"
                            data-testid="add-family-btn"
                        >
                            <Plus className="w-4 h-4" />
                            Add Family
                        </Button>
                    </div>
                </div>

                {/* Families Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <Card key={i} className="h-64 animate-pulse">
                                <CardContent className="p-6">
                                    <div className="w-16 h-16 rounded-full bg-muted mb-4" />
                                    <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                                    <div className="h-4 bg-muted rounded w-1/2" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : families.length === 0 ? (
                    <Card className="p-12 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="text-xl font-semibold text-foreground mb-2">No families yet</h3>
                        <p className="text-muted-foreground mb-6">Create your first family to start documenting precious memories</p>
                        <Button onClick={() => setShowAddModal(true)} className="gap-2 rounded-full">
                            <Plus className="w-4 h-4" />
                            Create First Family
                        </Button>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {families.map((family, index) => (
                            <Card 
                                key={family.id} 
                                className={`card-interactive cursor-pointer overflow-hidden animate-slide-up opacity-0 ${family.archived ? 'opacity-60' : ''}`}
                                style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'forwards' }}
                                data-testid={`family-card-${family.id}`}
                            >
                                <CardContent className="p-0">
                                    <div 
                                        className="p-6 pb-4"
                                        onClick={() => navigate(`/family/${family.id}`)}
                                    >
                                        {/* Family Photo */}
                                        <div className="w-20 h-20 rounded-2xl bg-primary/10 mb-4 overflow-hidden flex items-center justify-center">
                                            {family.family_photo ? (
                                                <img 
                                                    src={family.family_photo} 
                                                    alt={family.family_name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <Users className="w-10 h-10 text-primary" />
                                            )}
                                        </div>

                                        {/* Family Info */}
                                        <h3 className="text-lg font-semibold text-foreground mb-1 flex items-center gap-2">
                                            {family.family_name}
                                            {family.archived && (
                                                <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                                                    Archived
                                                </span>
                                            )}
                                        </h3>
                                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                                            <Baby className="w-4 h-4" />
                                            {family.number_of_children || 0} {(family.number_of_children || 0) === 1 ? 'child' : 'children'}
                                        </p>
                                        {family.family_notes && (
                                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                                {family.family_notes}
                                            </p>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="border-t border-border px-4 py-3 flex items-center justify-between bg-muted/30">
                                        <div className="flex gap-1">
                                            <Button 
                                                variant="ghost" 
                                                size="sm"
                                                onClick={(e) => { e.stopPropagation(); openEditModal(family); }}
                                                data-testid={`edit-family-${family.id}`}
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            {family.archived ? (
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm"
                                                    onClick={(e) => { e.stopPropagation(); handleArchive(family, false); }}
                                                >
                                                    <ArchiveRestore className="w-4 h-4" />
                                                </Button>
                                            ) : (
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm"
                                                    onClick={(e) => { e.stopPropagation(); handleArchive(family, true); }}
                                                >
                                                    <Archive className="w-4 h-4" />
                                                </Button>
                                            )}
                                            <Button 
                                                variant="ghost" 
                                                size="sm"
                                                className="text-destructive hover:text-destructive"
                                                onClick={(e) => { e.stopPropagation(); setSelectedFamily(family); setShowDeleteDialog(true); }}
                                                data-testid={`delete-family-${family.id}`}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                        <Button 
                                            variant="ghost" 
                                            size="sm"
                                            onClick={() => navigate(`/family/${family.id}`)}
                                            className="gap-1"
                                        >
                                            View <ChevronRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </main>

            {/* Add/Edit Family Modal */}
            <Dialog open={showAddModal || showEditModal} onOpenChange={closeModals}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{showEditModal ? 'Edit Family' : 'Create New Family'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Photo Upload */}
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-24 h-24 rounded-2xl bg-muted overflow-hidden flex items-center justify-center relative group">
                                {formData.family_photo ? (
                                    <img src={formData.family_photo} alt="Family" className="w-full h-full object-cover" />
                                ) : (
                                    <Image className="w-10 h-10 text-muted-foreground" />
                                )}
                                <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                                    <Plus className="w-6 h-6 text-white" />
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        className="hidden" 
                                        onChange={handleImageUpload}
                                    />
                                </label>
                            </div>
                            <p className="text-xs text-muted-foreground">Click to upload photo</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="family_name">Family Name *</Label>
                                <Input
                                    id="family_name"
                                    value={formData.family_name}
                                    onChange={e => setFormData(prev => ({ ...prev, family_name: e.target.value }))}
                                    placeholder="e.g., The Johnson Family"
                                    className="mt-1.5"
                                    data-testid="family-name-input"
                                />
                            </div>
                            <div>
                                <Label htmlFor="family_notes">Notes</Label>
                                <Textarea
                                    id="family_notes"
                                    value={formData.family_notes}
                                    onChange={e => setFormData(prev => ({ ...prev, family_notes: e.target.value }))}
                                    placeholder="Add any notes about this family..."
                                    className="mt-1.5"
                                    rows={3}
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={closeModals}>
                                Cancel
                            </Button>
                            <Button type="submit" data-testid="save-family-btn">
                                {showEditModal ? 'Save Changes' : 'Create Family'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Family?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete "{selectedFamily?.family_name}" and all associated children and timeline events. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            data-testid="confirm-delete-btn"
                        >
                            Delete Permanently
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Settings Modal */}
            <Dialog open={showSettingsModal} onOpenChange={setShowSettingsModal}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Settings</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <h3 className="text-sm font-medium text-foreground mb-4">Choose Your Theme</h3>
                        <ThemeSelector />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
