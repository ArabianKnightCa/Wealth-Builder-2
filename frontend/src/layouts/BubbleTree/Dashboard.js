import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Settings, LogOut, Users, User, GitBranch, Sparkles, ChevronRight } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Slider } from '../../components/ui/slider';
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
    const [chaos, setChaos] = useState(100); // 0 = perfect tree, 100 = full chaos bubbles
    const [hoveredItem, setHoveredItem] = useState(null);

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
        } catch (err) { toast.error('Failed to load'); }
        finally { setLoading(false); }
    };

    // Calculate positions based on chaos level
    const getPositions = () => {
        const positions = {};
        const chaosPercent = chaos / 100;
        
        families.forEach((fam, fi) => {
            // Tree position (organized)
            const treeX = ((fi + 1) / (families.length + 1)) * 80 + 10;
            const treeY = 25;
            
            // Chaos position (random)
            const chaosX = 15 + Math.sin(fi * 2.5) * 30 + 20;
            const chaosY = 30 + Math.cos(fi * 1.8) * 20;
            
            // Interpolate based on chaos slider
            positions[`family-${fam.id}`] = {
                x: treeX * (1 - chaosPercent) + chaosX * chaosPercent,
                y: treeY * (1 - chaosPercent) + chaosY * chaosPercent,
                size: chaos > 50 ? 90 : 80,
            };
        });
        
        allChildren.forEach((child, ci) => {
            const familyIndex = families.findIndex(f => f.id === child.familyId);
            const familyPos = positions[`family-${child.familyId}`];
            const siblingsCount = allChildren.filter(c => c.familyId === child.familyId).length;
            const siblingIndex = allChildren.filter(c => c.familyId === child.familyId).findIndex(c => c.id === child.id);
            
            // Tree position (organized below parent)
            const treeX = (familyPos?.x || 50) + (siblingIndex - (siblingsCount - 1) / 2) * 8;
            const treeY = 55 + (siblingIndex % 2) * 10;
            
            // Chaos position (orbiting around family)
            const angle = (siblingIndex / siblingsCount) * Math.PI * 2 + ci * 0.5;
            const radius = 12 + Math.random() * 5;
            const chaosX = (familyPos?.x || 50) + Math.cos(angle) * radius;
            const chaosY = (familyPos?.y || 50) + Math.sin(angle) * radius;
            
            positions[`child-${child.id}`] = {
                x: treeX * (1 - chaosPercent) + chaosX * chaosPercent,
                y: treeY * (1 - chaosPercent) + chaosY * chaosPercent,
                size: chaos > 50 ? 55 : 50,
            };
        });
        
        return positions;
    };

    const positions = getPositions();

    if (loading) {
        return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 overflow-hidden relative">
            {/* Stars background */}
            <div className="absolute inset-0">
                {[...Array(50)].map((_, i) => (
                    <div key={i} className="absolute w-1 h-1 bg-white rounded-full" style={{ left: `${Math.random()*100}%`, top: `${Math.random()*100}%`, opacity: Math.random()*0.5+0.1, animation: `pulse ${2+Math.random()*2}s infinite` }} />
                ))}
            </div>

            {/* Header */}
            <header className="relative z-50 p-4 flex justify-between items-center">
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl px-4 py-2 flex items-center gap-3">
                    <Sparkles className="w-6 h-6 text-purple-400" />
                    <div>
                        <h1 className="font-bold text-white">Living Relationships</h1>
                        <p className="text-xs text-purple-300">Slide to transform</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="text-white/70" onClick={() => navigate('/settings')}><Settings className="w-5 h-5" /></Button>
                    <Button variant="ghost" size="icon" className="text-white/70" onClick={() => { logout(); toast.success('Logged out'); }}><LogOut className="w-5 h-5" /></Button>
                </div>
            </header>

            {/* THE HYBRID: Single canvas that morphs between bubble chaos and tree order */}
            <div className="absolute inset-0 overflow-hidden">
                {/* Connection Lines - style changes based on chaos */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    {allChildren.map(child => {
                        const childPos = positions[`child-${child.id}`];
                        const familyPos = positions[`family-${child.familyId}`];
                        if (!childPos || !familyPos) return null;
                        
                        const isChaos = chaos > 50;
                        return (
                            <line
                                key={child.id}
                                x1={`${childPos.x}%`}
                                y1={`${childPos.y}%`}
                                x2={`${familyPos.x}%`}
                                y2={`${familyPos.y}%`}
                                stroke={isChaos ? 'rgba(168, 85, 247, 0.15)' : 'rgba(168, 85, 247, 0.4)'}
                                strokeWidth={isChaos ? '1' : '2'}
                                strokeDasharray={isChaos ? '4' : '0'}
                                className="transition-all duration-700"
                            />
                        );
                    })}
                </svg>

                {/* Family Nodes */}
                {families.map((family, i) => {
                    const pos = positions[`family-${family.id}`];
                    const colorClass = BUBBLE_COLORS[i % BUBBLE_COLORS.length];
                    const isHovered = hoveredItem === `family-${family.id}`;
                    const isChaos = chaos > 50;
                    
                    return (
                        <button
                            key={family.id}
                            onClick={() => navigate(`/family/${family.id}`)}
                            onMouseEnter={() => setHoveredItem(`family-${family.id}`)}
                            onMouseLeave={() => setHoveredItem(null)}
                            className="absolute transition-all duration-700 ease-out group"
                            style={{
                                left: `${pos.x}%`,
                                top: `${pos.y}%`,
                                transform: `translate(-50%, -50%) scale(${isHovered ? 1.15 : 1})`,
                                animation: isChaos ? `float ${3 + i * 0.5}s ease-in-out infinite` : 'none',
                            }}
                        >
                            <div 
                                className={`rounded-full bg-gradient-to-br ${colorClass} shadow-lg flex flex-col items-center justify-center transition-all duration-500 ${isChaos ? 'shadow-purple-500/30' : 'shadow-lg'}`}
                                style={{ width: pos.size, height: pos.size }}
                            >
                                <div className="absolute inset-1 rounded-full bg-white/20 backdrop-blur-sm" />
                                <Users className="relative w-6 h-6 text-white mb-1" />
                                <span className="relative text-white font-bold text-xs text-center px-2 truncate max-w-full">{family.family_name}</span>
                            </div>
                            {/* Tree-mode label */}
                            {!isChaos && (
                                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-purple-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                                    {family.number_of_children || 0} children
                                </span>
                            )}
                        </button>
                    );
                })}

                {/* Children Nodes */}
                {allChildren.map((child, i) => {
                    const pos = positions[`child-${child.id}`];
                    const familyIndex = families.findIndex(f => f.id === child.familyId);
                    const isHovered = hoveredItem === `child-${child.id}`;
                    const isChaos = chaos > 50;
                    
                    return (
                        <button
                            key={child.id}
                            onClick={() => navigate(`/child/${child.id}`)}
                            onMouseEnter={() => setHoveredItem(`child-${child.id}`)}
                            onMouseLeave={() => setHoveredItem(null)}
                            className="absolute transition-all duration-700 ease-out"
                            style={{
                                left: `${pos.x}%`,
                                top: `${pos.y}%`,
                                transform: `translate(-50%, -50%) scale(${isHovered ? 1.2 : 1})`,
                                animation: isChaos ? `float ${4 + i * 0.3}s ease-in-out infinite` : 'none',
                                animationDelay: `${i * 0.2}s`,
                            }}
                        >
                            <div 
                                className={`rounded-full bg-white/10 backdrop-blur border-2 border-white/30 overflow-hidden flex items-center justify-center transition-all duration-500 ${isHovered ? 'ring-2 ring-purple-400' : ''}`}
                                style={{ width: pos.size, height: pos.size }}
                            >
                                {child.identity?.profile_photo ? (
                                    <img src={child.identity.profile_photo} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-lg font-bold text-white">{child.identity?.full_name?.charAt(0)}</span>
                                )}
                            </div>
                            {/* Name label - always show in tree mode, hover in chaos */}
                            <span className={`absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs text-white/70 whitespace-nowrap transition-opacity ${!isChaos || isHovered ? 'opacity-100' : 'opacity-0'}`}>
                                {child.identity?.full_name?.split(' ')[0]}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* CHAOS SLIDER - The hybrid control */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-80 z-50">
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20">
                    <div className="flex justify-between text-sm text-white/70 mb-3">
                        <span className="flex items-center gap-1"><GitBranch className="w-4 h-4" /> Tree</span>
                        <span className="flex items-center gap-1">Chaos <Sparkles className="w-4 h-4" /></span>
                    </div>
                    <Slider
                        value={[chaos]}
                        onValueChange={(v) => setChaos(v[0])}
                        min={0}
                        max={100}
                        step={1}
                        className="w-full"
                    />
                    <p className="text-center text-xs text-white/50 mt-2">
                        {chaos < 30 ? 'Family tree view' : chaos < 70 ? 'Transitioning...' : 'Bubble universe'}
                    </p>
                </div>
            </div>

            <style>{`
                @keyframes float {
                    0%, 100% { transform: translate(-50%, -50%) translateY(0); }
                    50% { transform: translate(-50%, -50%) translateY(-8px); }
                }
            `}</style>
        </div>
    );
}
