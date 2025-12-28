import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Users, Settings, LogOut, Trash2, ChevronRight, Search, Pin, FileText } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../components/ui/alert-dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../components/ui/collapsible';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function MinimalTextDashboard() {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [families, setFamilies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedFamilies, setExpandedFamilies] = useState({});
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

    const filteredFamilies = families.filter(f => 
        f.family_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.family_name.trim()) { toast.error('Name required'); return; }
        try {
            await axios.post(`${API}/families`, formData);
            toast.success('Created');
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
        <div className="min-h-screen bg-white">
            {/* Minimal Header */}
            <header className="border-b border-gray-100">
                <div className="max-w-2xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-xl font-semibold text-gray-900" style={{ fontFamily: 'Georgia, serif' }}>OurCircle</h1>
                        <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
                                <Settings className="w-4 h-4 text-gray-500" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => { logout(); toast.success('Logged out'); }}>
                                <LogOut className="w-4 h-4 text-gray-500" />
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-6 py-8">
                {/* Search */}
                <div className="relative mb-8">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        placeholder="Search families..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="pl-10 border-0 border-b border-gray-200 rounded-none focus:ring-0 focus:border-gray-900 bg-transparent"
                    />
                </div>

                {/* Quick Add */}
                <button
                    onClick={() => setShowAddModal(true)}
                    className="w-full text-left py-3 px-4 mb-6 border border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors flex items-center gap-2"
                    data-testid="add-family-btn"
                >
                    <Plus className="w-4 h-4" />
                    Add new family
                </button>

                {/* Families List */}
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-50 rounded animate-pulse" />)}
                    </div>
                ) : filteredFamilies.length === 0 ? (
                    <div className="text-center py-16">
                        <FileText className="w-12 h-12 mx-auto mb-4 text-gray-200" />
                        <p className="text-gray-500">No families found</p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {filteredFamilies.map(family => (
                            <Collapsible
                                key={family.id}
                                open={expandedFamilies[family.id]}
                                onOpenChange={() => setExpandedFamilies(p => ({ ...p, [family.id]: !p[family.id] }))}
                            >
                                <div 
                                    className="group py-3 border-b border-gray-100"
                                    data-testid={`family-card-${family.id}`}
                                >
                                    <CollapsibleTrigger className="w-full">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${expandedFamilies[family.id] ? 'rotate-90' : ''}`} />
                                                <span className="font-medium text-gray-900">{family.family_name}</span>
                                                <span className="text-sm text-gray-400">({family.number_of_children || 0})</span>
                                            </div>
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); navigate(`/family/${family.id}`); }}>
                                                    Open
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setSelectedFamily(family); setShowDeleteDialog(true); }}>
                                                    <Trash2 className="w-3 h-3 text-gray-400" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CollapsibleTrigger>
                                    
                                    <CollapsibleContent>
                                        <div className="pl-7 pt-2 pb-1 space-y-2">
                                            {family.family_notes && (
                                                <p className="text-sm text-gray-600">{family.family_notes}</p>
                                            )}
                                            <button
                                                onClick={() => navigate(`/family/${family.id}`)}
                                                className="text-sm text-gray-500 hover:text-gray-900 underline underline-offset-2"
                                            >
                                                View full profile →
                                            </button>
                                        </div>
                                    </CollapsibleContent>
                                </div>
                            </Collapsible>
                        ))}
                    </div>
                )}
            </main>

            {/* Modals */}
            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle style={{ fontFamily: 'Georgia, serif' }}>Add Family</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label className="text-gray-600">Name</Label>
                            <Input value={formData.family_name} onChange={e => setFormData(p => ({ ...p, family_name: e.target.value }))} className="mt-1 border-gray-200 focus:border-gray-900 focus:ring-0" data-testid="family-name-input" />
                        </div>
                        <div>
                            <Label className="text-gray-600">Notes</Label>
                            <Textarea value={formData.family_notes} onChange={e => setFormData(p => ({ ...p, family_notes: e.target.value }))} className="mt-1 border-gray-200 focus:border-gray-900 focus:ring-0" rows={4} placeholder="Write anything..." />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setShowAddModal(false)}>Cancel</Button>
                            <Button type="submit" className="bg-gray-900 hover:bg-gray-800" data-testid="save-family-btn">Create</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle style={{ fontFamily: 'Georgia, serif' }}>Delete "{selectedFamily?.family_name}"?</AlertDialogTitle>
                        <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-gray-900 hover:bg-gray-800">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
