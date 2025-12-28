import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
    Plus, Users, Settings, LogOut, Archive, ArchiveRestore, 
    Trash2, Edit, Baby, ChevronRight, Search, LayoutList
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../components/ui/alert-dialog';
import { ScrollArea } from '../../components/ui/scroll-area';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function CleanClinicalDashboard() {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [families, setFamilies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showArchived, setShowArchived] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [selectedFamily, setSelectedFamily] = useState(null);
    const [editingFamily, setEditingFamily] = useState(null);
    const [formData, setFormData] = useState({ family_name: '', family_notes: '' });

    useEffect(() => { fetchFamilies(); }, [showArchived]);

    const fetchFamilies = async () => {
        try {
            const res = await axios.get(`${API}/families?include_archived=${showArchived}`);
            setFamilies(res.data.families || []);
        } catch (err) { toast.error('Failed to load families'); }
        finally { setLoading(false); }
    };

    const filteredFamilies = families.filter(f => 
        f.family_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.family_name.trim()) { toast.error('Family name is required'); return; }
        try {
            if (editingFamily) {
                await axios.put(`${API}/families/${editingFamily.id}`, formData);
                toast.success('Family updated');
            } else {
                await axios.post(`${API}/families`, formData);
                toast.success('Family created');
            }
            fetchFamilies();
            closeModal();
        } catch (err) { toast.error('Failed to save'); }
    };

    const handleArchive = async (family) => {
        try {
            await axios.put(`${API}/families/${family.id}`, { archived: !family.archived });
            toast.success(family.archived ? 'Restored' : 'Archived');
            fetchFamilies();
        } catch (err) { toast.error('Failed'); }
    };

    const handleDelete = async () => {
        if (!selectedFamily) return;
        try {
            await axios.delete(`${API}/families/${selectedFamily.id}`);
            toast.success('Deleted');
            fetchFamilies();
            setShowDeleteDialog(false);
            setSelectedFamily(null);
        } catch (err) { toast.error('Failed'); }
    };

    const openEdit = (family) => {
        setEditingFamily(family);
        setFormData({ family_name: family.family_name, family_notes: family.family_notes || '' });
        setShowAddModal(true);
    };

    const closeModal = () => {
        setShowAddModal(false);
        setEditingFamily(null);
        setFormData({ family_name: '', family_notes: '' });
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Left Sidebar - Family List */}
            <aside className="w-72 bg-white border-r border-gray-200 flex flex-col">
                {/* Logo */}
                <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                            <LayoutList className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-bold text-gray-900">OurCircle</span>
                    </div>
                </div>

                {/* Search */}
                <div className="p-3 border-b border-gray-200">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder="Search families..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="pl-9 h-9 bg-gray-50 border-gray-200"
                        />
                    </div>
                </div>

                {/* Family List */}
                <ScrollArea className="flex-1">
                    <div className="p-2">
                        {loading ? (
                            <div className="space-y-2">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-14 rounded-lg bg-gray-100 animate-pulse" />
                                ))}
                            </div>
                        ) : filteredFamilies.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-8">No families found</p>
                        ) : (
                            <div className="space-y-1">
                                {filteredFamilies.map(family => (
                                    <button
                                        key={family.id}
                                        onClick={() => navigate(`/family/${family.id}`)}
                                        className={`
                                            w-full p-3 rounded-lg text-left transition-colors group
                                            hover:bg-gray-100 
                                            ${family.archived ? 'opacity-50' : ''}
                                        `}
                                        data-testid={`family-item-${family.id}`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                                    <Users className="w-4 h-4 text-blue-600" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-medium text-gray-900 truncate text-sm">{family.family_name}</p>
                                                    <p className="text-xs text-gray-500">{family.number_of_children || 0} children</p>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </ScrollArea>

                {/* Bottom Actions */}
                <div className="p-3 border-t border-gray-200 space-y-2">
                    <Button
                        onClick={() => setShowAddModal(true)}
                        className="w-full justify-center gap-2 bg-blue-600 hover:bg-blue-700"
                        data-testid="add-family-btn"
                    >
                        <Plus className="w-4 h-4" />
                        Add Family
                    </Button>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowArchived(!showArchived)}
                            className="flex-1 text-xs"
                        >
                            {showArchived ? 'Hide Archived' : 'Show Archived'}
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col">
                {/* Top Bar */}
                <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6">
                    <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
                            <Settings className="w-5 h-5 text-gray-600" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => { logout(); toast.success('Logged out'); }}>
                            <LogOut className="w-5 h-5 text-gray-600" />
                        </Button>
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 p-6 overflow-auto">
                    <div className="max-w-4xl">
                        <h2 className="text-2xl font-bold text-gray-900 mb-1">All Families</h2>
                        <p className="text-gray-500 mb-6">{families.length} families total</p>

                        {/* Table View */}
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200 bg-gray-50">
                                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Family</th>
                                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Children</th>
                                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                                        <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredFamilies.map((family, i) => (
                                        <tr 
                                            key={family.id} 
                                            className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${family.archived ? 'opacity-50' : ''}`}
                                            onClick={() => navigate(`/family/${family.id}`)}
                                        >
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                                        {family.family_photo ? (
                                                            <img src={family.family_photo} alt="" className="w-8 h-8 rounded-full object-cover" />
                                                        ) : (
                                                            <Users className="w-4 h-4 text-blue-600" />
                                                        )}
                                                    </div>
                                                    <span className="font-medium text-gray-900">{family.family_name}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className="text-gray-600">{family.number_of_children || 0}</span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                    family.archived 
                                                        ? 'bg-gray-100 text-gray-600' 
                                                        : 'bg-green-100 text-green-700'
                                                }`}>
                                                    {family.archived ? 'Archived' : 'Active'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(family)}>
                                                        <Edit className="w-4 h-4 text-gray-500" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleArchive(family)}>
                                                        {family.archived ? <ArchiveRestore className="w-4 h-4 text-gray-500" /> : <Archive className="w-4 h-4 text-gray-500" />}
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSelectedFamily(family); setShowDeleteDialog(true); }}>
                                                        <Trash2 className="w-4 h-4 text-red-500" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filteredFamilies.length === 0 && (
                                <div className="py-12 text-center">
                                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                    <p className="text-gray-500">No families yet</p>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>

            {/* Modals */}
            <Dialog open={showAddModal} onOpenChange={closeModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingFamily ? 'Edit Family' : 'Add New Family'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label>Family Name *</Label>
                            <Input
                                value={formData.family_name}
                                onChange={e => setFormData(prev => ({ ...prev, family_name: e.target.value }))}
                                className="mt-1.5"
                                data-testid="family-name-input"
                            />
                        </div>
                        <div>
                            <Label>Notes</Label>
                            <Textarea
                                value={formData.family_notes}
                                onChange={e => setFormData(prev => ({ ...prev, family_notes: e.target.value }))}
                                className="mt-1.5"
                                rows={3}
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={closeModal}>Cancel</Button>
                            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" data-testid="save-family-btn">
                                {editingFamily ? 'Save' : 'Create'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Family?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete "{selectedFamily?.family_name}" and all data.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
