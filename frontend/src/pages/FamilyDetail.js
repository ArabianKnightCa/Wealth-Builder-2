import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { 
    ArrowLeft, Plus, Users, Baby, Edit, Trash2, 
    ChevronRight, Image, Calendar, User
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function FamilyDetail() {
    const { familyId } = useParams();
    const navigate = useNavigate();
    const [family, setFamily] = useState(null);
    const [children, setChildren] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [selectedChild, setSelectedChild] = useState(null);
    const [formData, setFormData] = useState({
        full_name: '',
        nicknames: '',
        profile_photo: '',
        birthday: '',
        place_of_birth: '',
        pronouns: ''
    });

    useEffect(() => {
        fetchData();
    }, [familyId]);

    const fetchData = async () => {
        try {
            const [familyRes, childrenRes] = await Promise.all([
                axios.get(`${API}/families/${familyId}`),
                axios.get(`${API}/families/${familyId}/children`)
            ]);
            setFamily(familyRes.data);
            setChildren(childrenRes.data.children || []);
        } catch (err) {
            toast.error('Failed to load family data');
            navigate('/');
        } finally {
            setLoading(false);
        }
    };

    const calculateAge = (birthday) => {
        if (!birthday) return null;
        const birth = new Date(birthday);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
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
                setFormData(prev => ({ ...prev, profile_photo: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.full_name.trim()) {
            toast.error('Child name is required');
            return;
        }

        try {
            const payload = {
                family_id: familyId,
                identity: {
                    full_name: formData.full_name,
                    nicknames: formData.nicknames ? formData.nicknames.split(',').map(n => n.trim()) : [],
                    profile_photo: formData.profile_photo || null,
                    birthday: formData.birthday || null,
                    place_of_birth: formData.place_of_birth || null,
                    pronouns: formData.pronouns || null
                }
            };

            await axios.post(`${API}/children`, payload);
            toast.success('Child added successfully');
            fetchData();
            closeModal();
        } catch (err) {
            toast.error('Failed to add child');
        }
    };

    const handleDelete = async () => {
        if (!selectedChild) return;
        try {
            await axios.delete(`${API}/children/${selectedChild.id}`);
            toast.success('Child deleted');
            fetchData();
            setShowDeleteDialog(false);
            setSelectedChild(null);
        } catch (err) {
            toast.error('Failed to delete child');
        }
    };

    const closeModal = () => {
        setShowAddModal(false);
        setFormData({
            full_name: '',
            nicknames: '',
            profile_photo: '',
            birthday: '',
            place_of_birth: '',
            pronouns: ''
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-50 glass border-b border-border">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
                    <div className="flex items-center gap-4">
                        <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => navigate('/')}
                            data-testid="back-btn"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 overflow-hidden flex items-center justify-center">
                                {family?.family_photo ? (
                                    <img src={family.family_photo} alt={family.family_name} className="w-full h-full object-cover" />
                                ) : (
                                    <Users className="w-6 h-6 text-primary" />
                                )}
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-foreground">{family?.family_name}</h1>
                                <p className="text-sm text-muted-foreground">
                                    {children.length} {children.length === 1 ? 'child' : 'children'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
                {/* Family Notes */}
                {family?.family_notes && (
                    <Card className="mb-8 bg-primary/5 border-primary/20">
                        <CardContent className="p-4">
                            <p className="text-sm text-foreground">{family.family_notes}</p>
                        </CardContent>
                    </Card>
                )}

                {/* Actions Bar */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-foreground">Children</h2>
                    <Button 
                        onClick={() => setShowAddModal(true)}
                        className="gap-2 rounded-full"
                        data-testid="add-child-btn"
                    >
                        <Plus className="w-4 h-4" />
                        Add Child
                    </Button>
                </div>

                {/* Children List */}
                {children.length === 0 ? (
                    <Card className="p-12 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                            <Baby className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="text-xl font-semibold text-foreground mb-2">No children yet</h3>
                        <p className="text-muted-foreground mb-6">Add your first child to start creating their dossier</p>
                        <Button onClick={() => setShowAddModal(true)} className="gap-2 rounded-full">
                            <Plus className="w-4 h-4" />
                            Add First Child
                        </Button>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {children.map((child, index) => {
                            const age = calculateAge(child.identity?.birthday);
                            return (
                                <Card 
                                    key={child.id}
                                    className="card-interactive overflow-hidden animate-slide-up opacity-0"
                                    style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'forwards' }}
                                    data-testid={`child-card-${child.id}`}
                                >
                                    <CardContent className="p-0">
                                        <div 
                                            className="p-6 cursor-pointer"
                                            onClick={() => navigate(`/child/${child.id}`)}
                                        >
                                            <div className="flex items-start gap-4">
                                                {/* Profile Photo */}
                                                <div className="w-16 h-16 rounded-xl bg-primary/10 overflow-hidden flex-shrink-0 flex items-center justify-center">
                                                    {child.identity?.profile_photo ? (
                                                        <img 
                                                            src={child.identity.profile_photo} 
                                                            alt={child.identity.full_name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <User className="w-8 h-8 text-primary" />
                                                    )}
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-lg font-semibold text-foreground truncate">
                                                        {child.identity?.full_name}
                                                    </h3>
                                                    {child.identity?.nicknames?.length > 0 && (
                                                        <p className="text-sm text-muted-foreground">
                                                            "{child.identity.nicknames.join('", "')}"
                                                        </p>
                                                    )}
                                                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                                        {age !== null && (
                                                            <span className="flex items-center gap-1">
                                                                <Calendar className="w-3.5 h-3.5" />
                                                                {age} years old
                                                            </span>
                                                        )}
                                                        {child.identity?.pronouns && (
                                                            <span>{child.identity.pronouns}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="border-t border-border px-4 py-3 flex items-center justify-between bg-muted/30">
                                            <Button 
                                                variant="ghost" 
                                                size="sm"
                                                className="text-destructive hover:text-destructive"
                                                onClick={(e) => { e.stopPropagation(); setSelectedChild(child); setShowDeleteDialog(true); }}
                                                data-testid={`delete-child-${child.id}`}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="sm"
                                                onClick={() => navigate(`/child/${child.id}`)}
                                                className="gap-1"
                                            >
                                                View Dossier <ChevronRight className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* Add Child Modal */}
            <Dialog open={showAddModal} onOpenChange={closeModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add New Child</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Photo Upload */}
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-24 h-24 rounded-full bg-muted overflow-hidden flex items-center justify-center relative group">
                                {formData.profile_photo ? (
                                    <img src={formData.profile_photo} alt="Child" className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-10 h-10 text-muted-foreground" />
                                )}
                                <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity rounded-full">
                                    <Plus className="w-6 h-6 text-white" />
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        className="hidden" 
                                        onChange={handleImageUpload}
                                    />
                                </label>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="full_name">Full Name *</Label>
                                <Input
                                    id="full_name"
                                    value={formData.full_name}
                                    onChange={e => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                                    placeholder="e.g., Emma Johnson"
                                    className="mt-1.5"
                                    data-testid="child-name-input"
                                />
                            </div>
                            <div>
                                <Label htmlFor="nicknames">Nicknames (comma-separated)</Label>
                                <Input
                                    id="nicknames"
                                    value={formData.nicknames}
                                    onChange={e => setFormData(prev => ({ ...prev, nicknames: e.target.value }))}
                                    placeholder="e.g., Em, Emmy"
                                    className="mt-1.5"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="birthday">Birthday</Label>
                                    <Input
                                        id="birthday"
                                        type="date"
                                        value={formData.birthday}
                                        onChange={e => setFormData(prev => ({ ...prev, birthday: e.target.value }))}
                                        className="mt-1.5"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="pronouns">Pronouns</Label>
                                    <Input
                                        id="pronouns"
                                        value={formData.pronouns}
                                        onChange={e => setFormData(prev => ({ ...prev, pronouns: e.target.value }))}
                                        placeholder="e.g., she/her"
                                        className="mt-1.5"
                                    />
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="place_of_birth">Place of Birth</Label>
                                <Input
                                    id="place_of_birth"
                                    value={formData.place_of_birth}
                                    onChange={e => setFormData(prev => ({ ...prev, place_of_birth: e.target.value }))}
                                    placeholder="e.g., New York, NY"
                                    className="mt-1.5"
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={closeModal}>
                                Cancel
                            </Button>
                            <Button type="submit" data-testid="save-child-btn">
                                Add Child
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Child?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete "{selectedChild?.identity?.full_name}" and all their dossier data and timeline events. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete Permanently
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
