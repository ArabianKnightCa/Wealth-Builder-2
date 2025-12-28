import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Settings, LogOut, ZoomIn, ZoomOut, Maximize2, Users, User, X } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const BUBBLE_COLORS = ['from-pink-400 to-rose-500', 'from-blue-400 to-indigo-500', 'from-green-400 to-emerald-500', 'from-purple-400 to-violet-500', 'from-amber-400 to-orange-500', 'from-cyan-400 to-teal-500'];

export default function BubbleTreeDashboard() {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [families, setFamilies] = useState([]);
    const [allChildren, setAllChildren] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('bubble'); // 'bubble' or 'tree'
    const [zoom, setZoom] = useState(1);
    const [positions, setPositions] = useState({});

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const res = await axios.get(`${API}/families`);
            const fams = res.data.families || [];
            setFamilies(fams);
            let kids = [];
            for (const fam of fams) {
                const childRes = await axios.get(`${API}/families/${fam.id}/children`);
                kids = [...kids, ...(childRes.data.children || []).map(c => ({ ...c, familyName: fam.family_name, familyId: fam.id }))];
            }
            setAllChildren(kids);

            // Generate bubble positions
            const pos = {};
            const total = fams.length + kids.length;
            let idx = 0;
            fams.forEach((fam, i) => {
                const angle = (idx / total) * 2 * Math.PI + Math.random() * 0.3;
                const radius = 20 + Math.random() * 15;
                pos[`family-${fam.id}`] = { x: 50 + Math.cos(angle) * radius, y: 50 + Math.sin(angle) * radius, delay: Math.random() * 2 };
                idx++;
            });
            kids.forEach((child, i) => {
                const familyPos = pos[`family-${child.familyId}`];
                const angle = Math.random() * 2 * Math.PI;
                const radius = 8 + Math.random() * 5;
                pos[`child-${child.id}`] = { 
                    x: (familyPos?.x || 50) + Math.cos(angle) * radius, 
                    y: (familyPos?.y || 50) + Math.sin(angle) * radius,
                    delay: Math.random() * 2 
                };
                idx++;
            });
            setPositions(pos);
        } catch (err) { toast.error('Failed to load'); }
        finally { setLoading(false); }
    };

    const toggleView = () => {
        setViewMode(v => v === 'bubble' ? 'tree' : 'bubble');
    };

    // Tree layout positions
    const getTreePositions = () => {
        const treePos = {};
        const famSpacing = 100 / (families.length + 1);
        families.forEach((fam, fi) => {
            treePos[`family-${fam.id}`] = { x: (fi + 1) * famSpacing, y: 30 };
            const famChildren = allChildren.filter(c => c.familyId === fam.id);
            const childSpacing = famSpacing / (famChildren.length + 1);
            famChildren.forEach((child, ci) => {
                treePos[`child-${child.id}`] = { 
                    x: (fi + 1) * famSpacing - famSpacing/2 + (ci + 1) * childSpacing, 
                    y: 60 + (ci % 2) * 15 
                };
            });
        });
        return treePos;
    };

    const currentPositions = viewMode === 'tree' ? getTreePositions() : positions;

    if (loading) {
        return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 overflow-hidden relative">
            {/* Stars */}
            <div className="absolute inset-0">
                {[...Array(40)].map((_, i) => (
                    <div key={i} className="absolute w-1 h-1 bg-white rounded-full animate-pulse" style={{ left: `${Math.random()*100}%`, top: `${Math.random()*100}%`, opacity: Math.random()*0.5+0.2, animationDelay: `${Math.random()*3}s` }} />
                ))}
            </div>

            {/* Header */}
            <header className="absolute top-4 left-4 right-4 z-50 flex justify-between">
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl px-4 py-2 flex items-center gap-3">
                    <Users className="w-6 h-6 text-purple-400" />
                    <div>
                        <h1 className="font-bold text-white">Living Relationships</h1>
                        <p className="text-xs text-purple-300">{viewMode === 'bubble' ? 'Chaos mode' : 'Tree mode'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="bg-white/10 backdrop-blur-xl rounded-xl flex">
                        <Button variant="ghost" size="icon" className="text-white/70" onClick={() => setZoom(z => Math.min(z + 0.2, 2))}><ZoomIn className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-white/70" onClick={() => setZoom(z => Math.max(z - 0.2, 0.5))}><ZoomOut className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-white/70" onClick={toggleView}><Maximize2 className="w-4 h-4" /></Button>
                    </div>
                    <div className="bg-white/10 backdrop-blur-xl rounded-xl flex">
                        <Button variant="ghost" size="icon" className="text-white/70" onClick={() => navigate('/settings')}><Settings className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-white/70" onClick={() => { logout(); toast.success('Logged out'); }}><LogOut className="w-4 h-4" /></Button>
                    </div>
                </div>
            </header>

            {/* Mode Toggle Button */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50">
                <button
                    onClick={toggleView}
                    className="px-6 py-3 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-white flex items-center gap-3 hover:bg-white/20 transition-colors"
                >
                    <span className="text-sm">{viewMode === 'bubble' ? 'Pinch to see tree' : 'Release for bubbles'}</span>
                    <Maximize2 className="w-4 h-4" />
                </button>
            </div>

            {/* Canvas */}
            <div className="w-full h-screen relative" style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}>
                {/* Connection Lines */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    {allChildren.map(child => {
                        const childPos = currentPositions[`child-${child.id}`];
                        const familyPos = currentPositions[`family-${child.familyId}`];
                        if (!childPos || !familyPos) return null;
                        return (
                            <line
                                key={child.id}
                                x1={`${childPos.x}%`}
                                y1={`${childPos.y}%`}
                                x2={`${familyPos.x}%`}
                                y2={`${familyPos.y}%`}
                                stroke={viewMode === 'tree' ? 'rgba(168, 85, 247, 0.5)' : 'rgba(168, 85, 247, 0.2)'}
                                strokeWidth={viewMode === 'tree' ? '2' : '1'}
                                className="transition-all duration-700"
                            />
                        );
                    })}
                </svg>

                {/* Family Bubbles */}
                {families.map((family, i) => {
                    const pos = currentPositions[`family-${family.id}`] || { x: 50, y: 50 };
                    const colorClass = BUBBLE_COLORS[i % BUBBLE_COLORS.length];
                    return (
                        <button
                            key={family.id}
                            onClick={() => navigate(`/family/${family.id}`)}
                            className="absolute transition-all duration-700 ease-out group"
                            style={{
                                left: `${pos.x}%`,
                                top: `${pos.y}%`,
                                transform: 'translate(-50%, -50%)',
                                animation: viewMode === 'bubble' ? `float ${3 + (pos.delay || 0)}s ease-in-out infinite` : 'none',
                            }}
                        >
                            <div className={`${viewMode === 'tree' ? 'w-20 h-20' : 'w-24 h-24'} rounded-full bg-gradient-to-br ${colorClass} shadow-lg shadow-purple-500/30 flex flex-col items-center justify-center transition-all duration-500`}>
                                <div className="absolute inset-1 rounded-full bg-white/20 backdrop-blur-sm" />
                                <Users className="relative w-6 h-6 text-white mb-1" />
                                <span className="relative text-white font-bold text-xs text-center px-2 truncate max-w-full">{family.family_name}</span>
                            </div>
                        </button>
                    );
                })}

                {/* Children Bubbles */}
                {allChildren.map((child, i) => {
                    const pos = currentPositions[`child-${child.id}`] || { x: 50, y: 50 };
                    const familyIndex = families.findIndex(f => f.id === child.familyId);
                    return (
                        <button
                            key={child.id}
                            onClick={() => navigate(`/child/${child.id}`)}
                            className="absolute transition-all duration-700 ease-out"
                            style={{
                                left: `${pos.x}%`,
                                top: `${pos.y}%`,
                                transform: 'translate(-50%, -50%)',
                                animation: viewMode === 'bubble' ? `float ${4 + (pos.delay || 0)}s ease-in-out infinite` : 'none',
                            }}
                        >
                            <div className={`${viewMode === 'tree' ? 'w-12 h-12' : 'w-14 h-14'} rounded-full bg-white/10 backdrop-blur border-2 border-white/30 overflow-hidden flex items-center justify-center transition-all duration-500 hover:scale-110`}>
                                {child.identity?.profile_photo ? (
                                    <img src={child.identity.profile_photo} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-lg font-bold text-white">{child.identity?.full_name?.charAt(0)}</span>
                                )}
                            </div>
                            {viewMode === 'tree' && (
                                <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs text-white/70 whitespace-nowrap">
                                    {child.identity?.full_name?.split(' ')[0]}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            <style>{`
                @keyframes float {
                    0%, 100% { transform: translate(-50%, -50%) translateY(0); }
                    50% { transform: translate(-50%, -50%) translateY(-10px); }
                }
            `}</style>
        </div>
    );
}
