import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
    Plus, Users, Settings, LogOut, Trash2, ChevronDown, ChevronRight,
    User, GitBranch
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

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function FamilyTreeDashboard() {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [families, setFamilies] = useState([]);
    const [expandedFamilies, setExpandedFamilies] = useState({});
    const [childrenByFamily, setChildrenByFamily] = useState({});
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [selectedFamily, setSelectedFamily] = useState(null);
    const [formData, setFormData] = useState({ family_name: '', family_notes: '' });

    useEffect(() => { fetchFamilies(); }, []);

    const fetchFamilies = async () => {
        try {
            const res = await axios.get(`${API}/families`);
            const familiesData = res.data.families || [];
            setFamilies(familiesData);
            
            // Fetch children for each family
            const childrenMap = {};
            for (const family of familiesData) {
                const childrenRes = await axios.get(`${API}/families/${family.id}/children`);
                childrenMap[family.id] = childrenRes.data.children || [];
            }
            setChildrenByFamily(childrenMap);
        } catch (err) { toast.error('Failed to load'); }
        finally { setLoading(false); }
    };

    const toggleFamily = (familyId) => {
        setExpandedFamilies(prev => ({ ...prev, [familyId]: !prev[familyId] }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.family_name.trim()) { toast.error('Name required'); return; }
        try {
            await axios.post(`${API}/families`, formData);
            toast.success('Family created');
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
        <div className="min-h-screen bg-stone-100">
            {/* Header */}
            <header className="bg-white border-b border-stone-200 shadow-sm">
                <div className="max-w-5xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center">
                                <GitBranch className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-stone-800">OurCircle</h1>
                                <p className="text-xs text-stone-500">Family Tree View</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
                                <Settings className="w-5 h-5 text-stone-600" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => { logout(); toast.success('Logged out'); }}>
                                <LogOut className="w-5 h-5 text-stone-600" />
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-stone-800">Family Trees</h2>
                    <Button onClick={() => setShowAddModal(true)} className="bg-teal-600 hover:bg-teal-700" data-testid="add-family-btn">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Family
                    </Button>
                </div>

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2].map(i => <div key={i} className="h-32 bg-white rounded-xl animate-pulse" />)}
                    </div>
                ) : families.length === 0 ? (
                    <Card className="p-12 text-center bg-white">
                        <GitBranch className="w-16 h-16 mx-auto mb-4 text-stone-300" />
                        <h3 className="text-xl font-semibold text-stone-700 mb-2">No family trees yet</h3>
                        <p className="text-stone-500">Start building your family tree</p>
                    </Card>
                ) : (
                    <div className="space-y-6">
                        {families.map(family => {
                            const isExpanded = expandedFamilies[family.id];
                            const children = childrenByFamily[family.id] || [];
                            
                            return (
                                <Card key={family.id} className="bg-white overflow-hidden" data-testid={`family-card-${family.id}`}>
                                    {/* Family Header (Root Node) */}
                                    <div 
                                        className="p-4 flex items-center gap-4 cursor-pointer hover:bg-stone-50 transition-colors"
                                        onClick={() => toggleFamily(family.id)}
                                    >
                                        <button className="p-1">
                                            {isExpanded ? <ChevronDown className="w-5 h-5 text-stone-400" /> : <ChevronRight className="w-5 h-5 text-stone-400" />}
                                        </button>
                                        
                                        <div className="w-14 h-14 rounded-full bg-teal-100 flex items-center justify-center overflow-hidden border-4 border-teal-200">
                                            {family.family_photo ? (
                                                <img src={family.family_photo} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <Users className="w-7 h-7 text-teal-600" />
                                            )}
                                        </div>
                                        
                                        <div className="flex-1">
                                            <h3 className="font-bold text-stone-800">{family.family_name}</h3>
                                            <p className="text-sm text-stone-500">{children.length} {children.length === 1 ? 'child' : 'children'}</p>
                                        </div>

                                        <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                                            <Button variant="outline" size="sm" onClick={() => navigate(`/family/${family.id}`)}>
                                                View Details
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSelectedFamily(family); setShowDeleteDialog(true); }}>
                                                <Trash2 className="w-4 h-4 text-red-400" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Tree Branches (Children) */}
                                    {isExpanded && children.length > 0 && (
                                        <div className="border-t border-stone-100 bg-stone-50/50">
                                            <div className="relative pl-12 py-4">
                                                {/* Vertical connector line */}
                                                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-teal-200" />
                                                
                                                <div className="space-y-3">
                                                    {children.map((child, i) => (
                                                        <div 
                                                            key={child.id} 
                                                            className="relative flex items-center gap-3 cursor-pointer group"
                                                            onClick={() => navigate(`/child/${child.id}`)}
                                                        >
                                                            {/* Horizontal connector */}
                                                            <div className="absolute -left-4 w-4 h-0.5 bg-teal-200" style={{ top: '50%' }} />
                                                            
                                                            <div className="w-10 h-10 rounded-full bg-white border-2 border-teal-300 flex items-center justify-center overflow-hidden group-hover:border-teal-500 transition-colors">
                                                                {child.identity?.profile_photo ? (
                                                                    <img src={child.identity.profile_photo} alt="" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <User className="w-5 h-5 text-teal-500" />
                                                                )}
                                                            </div>
                                                            
                                                            <div>
                                                                <p className="font-medium text-stone-700 group-hover:text-teal-600 transition-colors">
                                                                    {child.identity?.full_name}
                                                                </p>
                                                                {child.identity?.birthday && (
                                                                    <p className="text-xs text-stone-400">
                                                                        {new Date().getFullYear() - new Date(child.identity.birthday).getFullYear()} years old
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {isExpanded && children.length === 0 && (
                                        <div className="border-t border-stone-100 p-4 text-center">
                                            <p className="text-sm text-stone-400">No children added yet</p>
                                            <Button variant="link" onClick={() => navigate(`/family/${family.id}`)} className="text-teal-600">
                                                Add children →
                                            </Button>
                                        </div>
                                    )}
                                </Card>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* Modals */}
            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Family Tree</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label>Family Name</Label>
                            <Input value={formData.family_name} onChange={e => setFormData(p => ({ ...p, family_name: e.target.value }))} className="mt-1" data-testid="family-name-input" />
                        </div>
                        <div>
                            <Label>Notes</Label>
                            <Textarea value={formData.family_notes} onChange={e => setFormData(p => ({ ...p, family_notes: e.target.value }))} className="mt-1" rows={3} />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
                            <Button type="submit" className="bg-teal-600 hover:bg-teal-700" data-testid="save-family-btn">Create</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Family Tree?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete "{selectedFamily?.family_name}" and all children.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
