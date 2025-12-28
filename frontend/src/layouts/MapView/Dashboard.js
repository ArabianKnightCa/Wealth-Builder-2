import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Settings, LogOut, Users, User, Move, ZoomIn, ZoomOut, Home } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import BirthdayReminders from '../../components/BirthdayReminders';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const FAMILY_COLORS = [
    '#E8B4BC', '#B4D4E8', '#D4E8B4', '#E8D4B4', '#D4B4E8',
    '#B4E8D4', '#E8E4B4', '#B4B8E8', '#E8B4D8', '#B4E8B8'
];

export default function MapViewDashboard() {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const canvasRef = useRef(null);
    const [families, setFamilies] = useState([]);
    const [familyChildren, setFamilyChildren] = useState({});
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [formData, setFormData] = useState({ family_name: '' });
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [dragging, setDragging] = useState(null);
    const [selectedFamily, setSelectedFamily] = useState(null);
    const [positions, setPositions] = useState({});

    useEffect(() => { fetchFamilies(); }, []);

    const fetchFamilies = async () => {
        try {
            const res = await axios.get(`${API}/families`);
            const fams = res.data.families || [];
            setFamilies(fams);
            
            // Initialize positions in a circle
            const newPositions = {};
            fams.forEach((f, i) => {
                const angle = (i / fams.length) * 2 * Math.PI;
                const radius = 200;
                newPositions[f.id] = {
                    x: 400 + Math.cos(angle) * radius,
                    y: 300 + Math.sin(angle) * radius
                };
            });
            setPositions(newPositions);

            // Fetch children for each family
            const childrenMap = {};
            for (const fam of fams) {
                const childRes = await axios.get(`${API}/families/${fam.id}/children`);
                childrenMap[fam.id] = childRes.data.children || [];
            }
            setFamilyChildren(childrenMap);
        } catch (err) { toast.error('Failed to load families'); }
        finally { setLoading(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.family_name.trim()) { toast.error('Family name is required'); return; }
        try {
            await axios.post(`${API}/families`, formData);
            toast.success('Family created');
            fetchFamilies();
            setShowAddModal(false);
            setFormData({ family_name: '' });
        } catch (err) { toast.error('Failed to create family'); }
    };

    const handleMouseDown = (e, familyId) => {
        e.stopPropagation();
        setDragging(familyId);
    };

    const handleMouseMove = (e) => {
        if (!dragging || !canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        setPositions(prev => ({
            ...prev,
            [dragging]: {
                x: (e.clientX - rect.left - pan.x) / zoom,
                y: (e.clientY - rect.top - pan.y) / zoom
            }
        }));
    };

    const handleMouseUp = () => setDragging(null);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
            {/* Floating Header */}
            <header className="absolute top-4 left-4 right-4 z-50 flex justify-between">
                <div className="bg-white/90 backdrop-blur rounded-2xl px-4 py-2 shadow-lg flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                        <Move className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="font-bold text-slate-800">OurCircle</h1>
                        <p className="text-xs text-slate-500">Map View</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="bg-white/90 backdrop-blur rounded-xl shadow-lg flex">
                        <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.min(z + 0.2, 2))}>
                            <ZoomIn className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.max(z - 0.2, 0.5))}>
                            <ZoomOut className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}>
                            <Home className="w-4 h-4" />
                        </Button>
                    </div>
                    <div className="bg-white/90 backdrop-blur rounded-xl shadow-lg flex">
                        <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
                            <Settings className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => { logout(); toast.success('Logged out'); }}>
                            <LogOut className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </header>

            {/* Birthday Reminders Floating */}
            <div className="absolute top-20 left-4 z-40 max-w-sm">
                <BirthdayReminders />
            </div>

            {/* Map Canvas */}
            <div 
                ref={canvasRef}
                className="w-full h-screen cursor-grab active:cursor-grabbing"
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                <svg 
                    width="100%" 
                    height="100%" 
                    style={{ transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)` }}
                >
                    {/* Connection lines between siblings */}
                    {families.map((family, fi) => {
                        const pos = positions[family.id] || { x: 400, y: 300 };
                        const children = familyChildren[family.id] || [];
                        return children.map((child, ci) => {
                            const angle = (ci / Math.max(children.length, 1)) * 2 * Math.PI - Math.PI/2;
                            const childX = pos.x + Math.cos(angle) * 80;
                            const childY = pos.y + Math.sin(angle) * 80;
                            return (
                                <line
                                    key={`line-${child.id}`}
                                    x1={pos.x}
                                    y1={pos.y}
                                    x2={childX}
                                    y2={childY}
                                    stroke={FAMILY_COLORS[fi % FAMILY_COLORS.length]}
                                    strokeWidth="2"
                                    strokeDasharray="4"
                                    opacity="0.5"
                                />
                            );
                        });
                    })}
                </svg>

                {/* Family Islands */}
                {families.map((family, index) => {
                    const pos = positions[family.id] || { x: 400, y: 300 };
                    const color = FAMILY_COLORS[index % FAMILY_COLORS.length];
                    const children = familyChildren[family.id] || [];

                    return (
                        <div key={family.id} style={{ position: 'absolute', left: 0, top: 0, transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
                            {/* Family Center Node */}
                            <div
                                className="absolute cursor-move transition-shadow hover:shadow-2xl"
                                style={{
                                    left: pos.x - 50,
                                    top: pos.y - 50,
                                    width: 100,
                                    height: 100,
                                }}
                                onMouseDown={(e) => handleMouseDown(e, family.id)}
                                onClick={() => !dragging && navigate(`/family/${family.id}`)}
                            >
                                <div 
                                    className="w-full h-full rounded-full flex flex-col items-center justify-center shadow-lg border-4 border-white"
                                    style={{ backgroundColor: color }}
                                >
                                    <Users className="w-6 h-6 text-white mb-1" />
                                    <span className="text-xs font-bold text-white text-center px-2 truncate max-w-full">
                                        {family.family_name}
                                    </span>
                                </div>
                            </div>

                            {/* Child Nodes */}
                            {children.map((child, ci) => {
                                const angle = (ci / Math.max(children.length, 1)) * 2 * Math.PI - Math.PI/2;
                                const childX = pos.x + Math.cos(angle) * 80;
                                const childY = pos.y + Math.sin(angle) * 80;
                                return (
                                    <div
                                        key={child.id}
                                        className="absolute cursor-pointer transition-transform hover:scale-110"
                                        style={{
                                            left: childX - 25,
                                            top: childY - 25,
                                            width: 50,
                                            height: 50,
                                        }}
                                        onClick={() => navigate(`/child/${child.id}`)}
                                    >
                                        <div className="w-full h-full rounded-full bg-white shadow-md border-2 flex items-center justify-center overflow-hidden" style={{ borderColor: color }}>
                                            {child.identity?.profile_photo ? (
                                                <img src={child.identity.profile_photo} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-sm font-bold" style={{ color }}>
                                                    {child.identity?.full_name?.charAt(0)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                                            <span className="text-xs font-medium text-slate-600 bg-white/80 px-1 rounded">
                                                {child.identity?.full_name?.split(' ')[0]}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    );
                })}
            </div>

            {/* Add Family FAB */}
            <Button
                onClick={() => setShowAddModal(true)}
                className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
                <Plus className="w-6 h-6" />
            </Button>

            {/* Add Modal */}
            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Family Island</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <div className="space-y-4 py-4">
                            <div>
                                <Label>Family Name</Label>
                                <Input
                                    value={formData.family_name}
                                    onChange={e => setFormData({ family_name: e.target.value })}
                                    placeholder="The Smiths"
                                    className="mt-1"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
                            <Button type="submit">Create Island</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
