import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format, parseISO, isAfter, addDays } from 'date-fns';
import { 
    Plus, Users, Settings, LogOut, Clock, Calendar,
    ChevronRight, Gift, Star, Heart, Award
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { ScrollArea } from '../../components/ui/scroll-area';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function TimelineFirstDashboard() {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [families, setFamilies] = useState([]);
    const [recentUpdates, setRecentUpdates] = useState([]);
    const [upcomingBirthdays, setUpcomingBirthdays] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [formData, setFormData] = useState({ family_name: '', family_notes: '' });

    useEffect(() => { 
        fetchData(); 
    }, []);

    const fetchData = async () => {
        try {
            const familiesRes = await axios.get(`${API}/families`);
            const familiesData = familiesRes.data.families || [];
            setFamilies(familiesData);

            // Fetch all children for birthdays and recent updates
            const allChildren = [];
            const allEvents = [];
            
            for (const family of familiesData) {
                const childrenRes = await axios.get(`${API}/families/${family.id}/children`);
                const children = childrenRes.data.children || [];
                for (const child of children) {
                    allChildren.push({ ...child, familyName: family.family_name });
                    // Fetch timeline events
                    try {
                        const eventsRes = await axios.get(`${API}/children/${child.id}/timeline`);
                        const events = (eventsRes.data.events || []).map(e => ({
                            ...e,
                            childName: child.identity?.full_name,
                            familyName: family.family_name
                        }));
                        allEvents.push(...events);
                    } catch (e) {}
                }
            }

            // Calculate upcoming birthdays (next 30 days)
            const today = new Date();
            const thirtyDaysLater = addDays(today, 30);
            const birthdays = allChildren
                .filter(child => child.identity?.birthday)
                .map(child => {
                    const bday = new Date(child.identity.birthday);
                    const thisYearBday = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
                    if (thisYearBday < today) {
                        thisYearBday.setFullYear(today.getFullYear() + 1);
                    }
                    return {
                        ...child,
                        upcomingBirthday: thisYearBday,
                        daysUntil: Math.ceil((thisYearBday - today) / (1000 * 60 * 60 * 24))
                    };
                })
                .filter(child => child.daysUntil <= 30)
                .sort((a, b) => a.daysUntil - b.daysUntil);
            
            setUpcomingBirthdays(birthdays);

            // Sort recent events
            const sortedEvents = allEvents
                .sort((a, b) => new Date(b.created_at || b.event_date) - new Date(a.created_at || a.event_date))
                .slice(0, 10);
            setRecentUpdates(sortedEvents);

        } catch (err) { 
            toast.error('Failed to load data'); 
        } finally { 
            setLoading(false); 
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.family_name.trim()) { toast.error('Family name is required'); return; }
        try {
            await axios.post(`${API}/families`, formData);
            toast.success('Family created');
            fetchData();
            setShowAddModal(false);
            setFormData({ family_name: '', family_notes: '' });
        } catch (err) { toast.error('Failed to create family'); }
    };

    const getEventIcon = (type) => {
        switch (type) {
            case 'milestone': return Star;
            case 'achievement': return Award;
            case 'memory': return Heart;
            default: return Clock;
        }
    };

    const getEventColor = (type) => {
        switch (type) {
            case 'milestone': return 'text-amber-500 bg-amber-100';
            case 'achievement': return 'text-emerald-500 bg-emerald-100';
            case 'memory': return 'text-pink-500 bg-pink-100';
            default: return 'text-blue-500 bg-blue-100';
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                <Clock className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-slate-900">OurCircle</h1>
                                <p className="text-xs text-slate-500">Timeline View</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={() => navigate('/settings')} data-testid="settings-btn">
                                <Settings className="w-5 h-5 text-slate-600" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => { logout(); toast.success('Logged out'); }}>
                                <LogOut className="w-5 h-5 text-slate-600" />
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Families & Birthdays */}
                    <div className="space-y-6">
                        {/* Upcoming Birthdays Widget */}
                        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2 text-amber-800">
                                    <Gift className="w-4 h-4" />
                                    Upcoming Birthdays
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {upcomingBirthdays.length === 0 ? (
                                    <p className="text-sm text-amber-700/70">No birthdays in the next 30 days</p>
                                ) : (
                                    <div className="space-y-3">
                                        {upcomingBirthdays.slice(0, 5).map((child, i) => (
                                            <div key={i} className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-medium text-amber-900 text-sm">{child.identity?.full_name}</p>
                                                    <p className="text-xs text-amber-700/70">{child.familyName}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-semibold text-amber-800">
                                                        {child.daysUntil === 0 ? 'Today!' : `${child.daysUntil} days`}
                                                    </p>
                                                    <p className="text-xs text-amber-700/70">
                                                        {format(child.upcomingBirthday, 'MMM d')}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Families List */}
                        <Card>
                            <CardHeader className="pb-3 flex flex-row items-center justify-between">
                                <CardTitle className="text-base">Families</CardTitle>
                                <Button size="sm" onClick={() => setShowAddModal(true)} className="h-8" data-testid="add-family-btn">
                                    <Plus className="w-4 h-4 mr-1" />
                                    Add
                                </Button>
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <div className="space-y-2">
                                        {[1, 2, 3].map(i => <div key={i} className="h-12 rounded-lg bg-slate-100 animate-pulse" />)}
                                    </div>
                                ) : families.length === 0 ? (
                                    <div className="text-center py-6">
                                        <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                                        <p className="text-sm text-slate-500">No families yet</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {families.map(family => (
                                            <button
                                                key={family.id}
                                                onClick={() => navigate(`/family/${family.id}`)}
                                                className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors group"
                                                data-testid={`family-item-${family.id}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden">
                                                        {family.family_photo ? (
                                                            <img src={family.family_photo} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Users className="w-4 h-4 text-indigo-600" />
                                                        )}
                                                    </div>
                                                    <div className="text-left">
                                                        <p className="font-medium text-slate-900 text-sm">{family.family_name}</p>
                                                        <p className="text-xs text-slate-500">{family.number_of_children || 0} children</p>
                                                    </div>
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Timeline Feed */}
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-indigo-600" />
                                    Recent Updates
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {recentUpdates.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Clock className="w-12 h-12 mx-auto mb-3 text-slate-200" />
                                        <h3 className="font-medium text-slate-700 mb-1">No timeline events yet</h3>
                                        <p className="text-sm text-slate-500">Add memories and milestones to see them here</p>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        {/* Timeline Line */}
                                        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-slate-200" />

                                        {/* Events */}
                                        <div className="space-y-4">
                                            {recentUpdates.map((event, i) => {
                                                const EventIcon = getEventIcon(event.event_type);
                                                const colorClass = getEventColor(event.event_type);
                                                
                                                return (
                                                    <div key={event.id || i} className="relative pl-12">
                                                        {/* Node */}
                                                        <div className={`absolute left-2.5 w-5 h-5 rounded-full flex items-center justify-center ${colorClass}`}>
                                                            <EventIcon className="w-3 h-3" />
                                                        </div>

                                                        {/* Content */}
                                                        <div className="bg-slate-50 rounded-lg p-4 hover:bg-slate-100 transition-colors">
                                                            <div className="flex items-start justify-between gap-3">
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="font-medium text-slate-900">{event.title}</p>
                                                                    <p className="text-sm text-slate-600 mt-0.5">
                                                                        {event.childName} • {event.familyName}
                                                                    </p>
                                                                    {event.description && (
                                                                        <p className="text-sm text-slate-500 mt-2 line-clamp-2">{event.description}</p>
                                                                    )}
                                                                </div>
                                                                {event.photo && (
                                                                    <img 
                                                                        src={event.photo} 
                                                                        alt="" 
                                                                        className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                                                                    />
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-slate-400 mt-2">
                                                                {event.event_date && format(parseISO(event.event_date), 'MMM d, yyyy')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>

            {/* Add Family Modal */}
            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add New Family</DialogTitle>
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
                            <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
                            <Button type="submit" data-testid="save-family-btn">Create Family</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
