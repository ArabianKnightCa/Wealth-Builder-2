import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Settings, LogOut, Plus, Move, Type, Image, Link2, Trash2, ZoomIn, ZoomOut, Hand, MousePointer } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const NOTE_COLORS = ['bg-yellow-200', 'bg-pink-200', 'bg-blue-200', 'bg-green-200', 'bg-purple-200', 'bg-orange-200'];

export default function WhiteboardCanvasDashboard() {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const canvasRef = useRef(null);
    const [families, setFamilies] = useState([]);
    const [allChildren, setAllChildren] = useState([]);
    const [loading, setLoading] = useState(true);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [tool, setTool] = useState('select'); // 'select', 'pan'
    const [notes, setNotes] = useState([]);
    const [dragging, setDragging] = useState(null);
    const [isPanning, setIsPanning] = useState(false);
    const [lastPanPos, setLastPanPos] = useState({ x: 0, y: 0 });

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const res = await axios.get(`${API}/families`);
            const fams = res.data.families || [];
            setFamilies(fams);
            let kids = [];
            for (const fam of fams) {
                const childRes = await axios.get(`${API}/families/${fam.id}/children`);
                kids = [...kids, ...(childRes.data.children || []).map(c => ({ ...c, familyName: fam.family_name }))];
            }
            setAllChildren(kids);

            // Generate initial notes from data
            const initialNotes = [];
            let x = 100, y = 100;
            
            fams.forEach((fam, i) => {
                initialNotes.push({
                    id: `family-${fam.id}`,
                    type: 'family',
                    data: fam,
                    x: x + (i % 3) * 300,
                    y: y + Math.floor(i / 3) * 250,
                    color: NOTE_COLORS[i % NOTE_COLORS.length],
                });
            });

            kids.forEach((child, i) => {
                const familyNote = initialNotes.find(n => n.type === 'family' && n.data.id === child.family_id);
                initialNotes.push({
                    id: `child-${child.id}`,
                    type: 'child',
                    data: child,
                    x: (familyNote?.x || 100) + 50 + (i % 2) * 150,
                    y: (familyNote?.y || 100) + 180 + Math.floor(i / 2) * 120,
                    color: familyNote?.color || NOTE_COLORS[i % NOTE_COLORS.length],
                });
            });

            setNotes(initialNotes);
        } catch (err) { toast.error('Failed to load'); }
        finally { setLoading(false); }
    };

    const handleMouseDown = (e, noteId = null) => {
        if (noteId && tool === 'select') {
            setDragging(noteId);
        } else if (tool === 'pan' || e.button === 1) {
            setIsPanning(true);
            setLastPanPos({ x: e.clientX, y: e.clientY });
        }
    };

    const handleMouseMove = (e) => {
        if (dragging) {
            const rect = canvasRef.current.getBoundingClientRect();
            setNotes(notes.map(n => 
                n.id === dragging 
                    ? { ...n, x: (e.clientX - rect.left - pan.x) / zoom, y: (e.clientY - rect.top - pan.y) / zoom }
                    : n
            ));
        } else if (isPanning) {
            const dx = e.clientX - lastPanPos.x;
            const dy = e.clientY - lastPanPos.y;
            setPan({ x: pan.x + dx, y: pan.y + dy });
            setLastPanPos({ x: e.clientX, y: e.clientY });
        }
    };

    const handleMouseUp = () => {
        setDragging(null);
        setIsPanning(false);
    };

    const addStickyNote = () => {
        const newNote = {
            id: `note-${Date.now()}`,
            type: 'sticky',
            text: 'New note...',
            x: 200 + Math.random() * 200,
            y: 200 + Math.random() * 200,
            color: NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)],
        };
        setNotes([...notes, newNote]);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 overflow-hidden">
            {/* Toolbar */}
            <header className="absolute top-4 left-4 right-4 z-50 flex justify-between pointer-events-none">
                <div className="bg-white rounded-xl shadow-lg px-4 py-2 flex items-center gap-4 pointer-events-auto">
                    <div className="flex items-center gap-1 border-r border-slate-200 pr-4">
                        <Button
                            variant={tool === 'select' ? 'secondary' : 'ghost'}
                            size="icon"
                            onClick={() => setTool('select')}
                        >
                            <MousePointer className="w-4 h-4" />
                        </Button>
                        <Button
                            variant={tool === 'pan' ? 'secondary' : 'ghost'}
                            size="icon"
                            onClick={() => setTool('pan')}
                        >
                            <Hand className="w-4 h-4" />
                        </Button>
                    </div>
                    <div className="flex items-center gap-1 border-r border-slate-200 pr-4">
                        <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.min(z + 0.2, 2))}>
                            <ZoomIn className="w-4 h-4" />
                        </Button>
                        <span className="text-sm text-slate-500 w-12 text-center">{Math.round(zoom * 100)}%</span>
                        <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.max(z - 0.2, 0.5))}>
                            <ZoomOut className="w-4 h-4" />
                        </Button>
                    </div>
                    <Button variant="ghost" size="sm" onClick={addStickyNote} className="gap-1">
                        <Plus className="w-4 h-4" /> Note
                    </Button>
                </div>

                <div className="bg-white rounded-xl shadow-lg px-2 py-2 flex items-center gap-1 pointer-events-auto">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
                        <Settings className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => { logout(); toast.success('Logged out'); }}>
                        <LogOut className="w-4 h-4" />
                    </Button>
                </div>
            </header>

            {/* Canvas */}
            <div
                ref={canvasRef}
                className={`w-full h-screen ${tool === 'pan' ? 'cursor-grab' : 'cursor-default'} ${isPanning ? 'cursor-grabbing' : ''}`}
                onMouseDown={(e) => handleMouseDown(e)}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{
                    backgroundImage: 'radial-gradient(circle, #ddd 1px, transparent 1px)',
                    backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
                    backgroundPosition: `${pan.x}px ${pan.y}px`,
                }}
            >
                <div style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0' }}>
                    {/* Connection Lines */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
                        {notes.filter(n => n.type === 'child').map(childNote => {
                            const familyNote = notes.find(n => n.type === 'family' && n.data.id === childNote.data.family_id);
                            if (!familyNote) return null;
                            return (
                                <line
                                    key={childNote.id}
                                    x1={childNote.x + 60}
                                    y1={childNote.y}
                                    x2={familyNote.x + 80}
                                    y2={familyNote.y + 80}
                                    stroke="#94a3b8"
                                    strokeWidth="2"
                                    strokeDasharray="4"
                                />
                            );
                        })}
                    </svg>

                    {/* Notes */}
                    {notes.map(note => (
                        <div
                            key={note.id}
                            className={`absolute ${note.color} rounded-lg shadow-lg cursor-move transition-shadow hover:shadow-xl ${
                                dragging === note.id ? 'shadow-2xl scale-105' : ''
                            }`}
                            style={{ left: note.x, top: note.y }}
                            onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, note.id); }}
                        >
                            {note.type === 'family' && (
                                <div className="p-4 w-40" onClick={() => !dragging && navigate(`/family/${note.data.id}`)}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Move className="w-3 h-3 text-slate-400" />
                                        <span className="text-xs text-slate-500">Family</span>
                                    </div>
                                    <h3 className="font-bold text-slate-800">{note.data.family_name}</h3>
                                    <p className="text-sm text-slate-600">{note.data.number_of_children || 0} members</p>
                                </div>
                            )}

                            {note.type === 'child' && (
                                <div className="p-3 w-32" onClick={() => !dragging && navigate(`/child/${note.data.id}`)}>
                                    <div className="w-12 h-12 rounded-full mx-auto mb-2 bg-white overflow-hidden">
                                        {note.data.identity?.profile_photo ? (
                                            <img src={note.data.identity.profile_photo} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold">
                                                {note.data.identity?.full_name?.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                    <h4 className="font-medium text-slate-800 text-center text-sm truncate">
                                        {note.data.identity?.full_name}
                                    </h4>
                                </div>
                            )}

                            {note.type === 'sticky' && (
                                <div className="p-3 w-36">
                                    <textarea
                                        className="w-full bg-transparent border-none resize-none text-sm text-slate-700 focus:outline-none"
                                        defaultValue={note.text}
                                        rows={3}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Help */}
            <div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur rounded-lg px-3 py-2 text-xs text-slate-500">
                Drag to move • Middle-click or use hand tool to pan • Scroll to zoom
            </div>
        </div>
    );
}
