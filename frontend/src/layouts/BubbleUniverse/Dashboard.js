import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Settings, LogOut, ZoomIn, ZoomOut, Home, Sparkles } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const BUBBLE_COLORS = [
    'from-pink-400 to-rose-500',
    'from-blue-400 to-indigo-500',
    'from-green-400 to-emerald-500',
    'from-purple-400 to-violet-500',
    'from-amber-400 to-orange-500',
    'from-cyan-400 to-teal-500',
];

export default function BubbleUniverseDashboard() {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const canvasRef = useRef(null);
    const [families, setFamilies] = useState([]);
    const [allChildren, setAllChildren] = useState([]);
    const [loading, setLoading] = useState(true);
    const [zoom, setZoom] = useState(1);
    const [hoveredBubble, setHoveredBubble] = useState(null);
    const [bubblePositions, setBubblePositions] = useState({});

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

            // Generate floating positions
            const positions = {};
            const allItems = [...fams.map(f => ({ type: 'family', id: f.id })), ...kids.map(c => ({ type: 'child', id: c.id }))];
            allItems.forEach((item, i) => {
                const angle = (i / allItems.length) * 2 * Math.PI + Math.random() * 0.5;
                const radius = 150 + Math.random() * 150;
                positions[`${item.type}-${item.id}`] = {
                    x: 50 + Math.cos(angle) * (radius / 5),
                    y: 50 + Math.sin(angle) * (radius / 5),
                    scale: 0.8 + Math.random() * 0.4,
                    delay: Math.random() * 2,
                };
            });
            setBubblePositions(positions);
        } catch (err) { toast.error('Failed to load'); }
        finally { setLoading(false); }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 overflow-hidden relative">
            {/* Starfield Background */}
            <div className="absolute inset-0 overflow-hidden">
                {[...Array(50)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            opacity: Math.random() * 0.5 + 0.2,
                            animationDelay: `${Math.random() * 3}s`,
                        }}
                    />
                ))}
            </div>

            {/* Header */}
            <header className="absolute top-4 left-4 right-4 z-50 flex justify-between">
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl px-4 py-2 flex items-center gap-3">
                    <Sparkles className="w-6 h-6 text-purple-400" />
                    <div>
                        <h1 className="font-bold text-white">Bubble Universe</h1>
                        <p className="text-xs text-purple-300">Tap to explore</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="bg-white/10 backdrop-blur-xl rounded-xl flex">
                        <Button variant="ghost" size="icon" className="text-white/70" onClick={() => setZoom(z => Math.min(z + 0.2, 2))}>
                            <ZoomIn className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-white/70" onClick={() => setZoom(z => Math.max(z - 0.2, 0.5))}>
                            <ZoomOut className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-white/70" onClick={() => setZoom(1)}>
                            <Home className="w-4 h-4" />
                        </Button>
                    </div>
                    <div className="bg-white/10 backdrop-blur-xl rounded-xl flex">
                        <Button variant="ghost" size="icon" className="text-white/70" onClick={() => navigate('/settings')}>
                            <Settings className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-white/70" onClick={() => { logout(); toast.success('Logged out'); }}>
                            <LogOut className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </header>

            {/* Bubble Universe */}
            <div 
                ref={canvasRef}
                className="w-full h-screen relative"
                style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
            >
                {/* Connection Lines */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    {allChildren.map((child, i) => {
                        const childPos = bubblePositions[`child-${child.id}`];
                        const familyPos = bubblePositions[`family-${child.familyId}`];
                        if (!childPos || !familyPos) return null;
                        return (
                            <line
                                key={child.id}
                                x1={`${childPos.x}%`}
                                y1={`${childPos.y}%`}
                                x2={`${familyPos.x}%`}
                                y2={`${familyPos.y}%`}
                                stroke="rgba(168, 85, 247, 0.2)"
                                strokeWidth="1"
                                strokeDasharray="4"
                            />
                        );
                    })}
                </svg>

                {/* Family Bubbles */}
                {families.map((family, i) => {
                    const pos = bubblePositions[`family-${family.id}`] || { x: 50, y: 50, scale: 1, delay: 0 };
                    const colorClass = BUBBLE_COLORS[i % BUBBLE_COLORS.length];
                    const isHovered = hoveredBubble === `family-${family.id}`;

                    return (
                        <button
                            key={family.id}
                            onClick={() => navigate(`/family/${family.id}`)}
                            onMouseEnter={() => setHoveredBubble(`family-${family.id}`)}
                            onMouseLeave={() => setHoveredBubble(null)}
                            className="absolute transition-all duration-500 ease-out"
                            style={{
                                left: `${pos.x}%`,
                                top: `${pos.y}%`,
                                transform: `translate(-50%, -50%) scale(${isHovered ? pos.scale * 1.2 : pos.scale})`,
                                animation: `float ${3 + pos.delay}s ease-in-out infinite`,
                                animationDelay: `${pos.delay}s`,
                            }}
                        >
                            <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${colorClass} shadow-lg shadow-purple-500/30 flex flex-col items-center justify-center relative group`}>
                                <div className="absolute inset-1 rounded-full bg-white/20 backdrop-blur-sm" />
                                <span className="relative text-white font-bold text-sm text-center px-2">
                                    {family.family_name}
                                </span>
                                <span className="relative text-white/70 text-xs">
                                    {family.number_of_children || 0} kids
                                </span>
                                {/* Glow effect */}
                                <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${colorClass} blur-xl opacity-0 group-hover:opacity-50 transition-opacity`} />
                            </div>
                        </button>
                    );
                })}

                {/* Children Bubbles */}
                {allChildren.map((child, i) => {
                    const pos = bubblePositions[`child-${child.id}`] || { x: 50, y: 50, scale: 1, delay: 0 };
                    const familyIndex = families.findIndex(f => f.id === child.familyId);
                    const colorClass = BUBBLE_COLORS[familyIndex % BUBBLE_COLORS.length];
                    const isHovered = hoveredBubble === `child-${child.id}`;

                    return (
                        <button
                            key={child.id}
                            onClick={() => navigate(`/child/${child.id}`)}
                            onMouseEnter={() => setHoveredBubble(`child-${child.id}`)}
                            onMouseLeave={() => setHoveredBubble(null)}
                            className="absolute transition-all duration-500 ease-out"
                            style={{
                                left: `${pos.x}%`,
                                top: `${pos.y}%`,
                                transform: `translate(-50%, -50%) scale(${isHovered ? pos.scale * 1.3 : pos.scale})`,
                                animation: `float ${4 + pos.delay}s ease-in-out infinite`,
                                animationDelay: `${pos.delay}s`,
                            }}
                        >
                            <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur border-2 border-white/30 overflow-hidden flex items-center justify-center relative group">
                                {child.identity?.profile_photo ? (
                                    <img src={child.identity.profile_photo} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-lg font-bold text-white">
                                        {child.identity?.full_name?.charAt(0)}
                                    </span>
                                )}
                                {/* Hover tooltip */}
                                {isHovered && (
                                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/80 text-white text-xs px-2 py-1 rounded">
                                        {child.identity?.full_name}
                                    </div>
                                )}
                            </div>
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
