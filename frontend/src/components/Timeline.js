import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format, parseISO } from 'date-fns';
import { 
    Plus, Calendar, Star, Camera, Award, Heart,
    Edit, Trash2, Image, X
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const EVENT_TYPES = [
    { id: 'milestone', label: 'Milestone', icon: Star, color: 'text-yellow-500' },
    { id: 'memory', label: 'Memory', icon: Heart, color: 'text-pink-500' },
    { id: 'achievement', label: 'Achievement', icon: Award, color: 'text-green-500' },
    { id: 'photo', label: 'Photo Moment', icon: Camera, color: 'text-blue-500' }
];

export const Timeline = ({ childId, childName }) => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        event_date: '',
        event_type: 'memory',
        photo: '',
        tags: ''
    });

    useEffect(() => {
        fetchEvents();
    }, [childId]);

    const fetchEvents = async () => {
        try {
            const res = await axios.get(`${API}/children/${childId}/timeline`);
            setEvents(res.data.events || []);
        } catch (err) {
            toast.error('Failed to load timeline');
        } finally {
            setLoading(false);
        }
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
                setFormData(prev => ({ ...prev, photo: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title.trim() || !formData.event_date) {
            toast.error('Title and date are required');
            return;
        }

        try {
            const payload = {
                child_id: childId,
                title: formData.title,
                description: formData.description || null,
                event_date: formData.event_date,
                event_type: formData.event_type,
                photo: formData.photo || null,
                tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : []
            };

            if (showEditModal && selectedEvent) {
                await axios.put(`${API}/timeline/${selectedEvent.id}`, payload);
                toast.success('Event updated');
            } else {
                await axios.post(`${API}/timeline`, payload);
                toast.success('Event added to timeline');
            }
            fetchEvents();
            closeModal();
        } catch (err) {
            toast.error('Failed to save event');
        }
    };

    const handleDelete = async () => {
        if (!selectedEvent) return;
        try {
            await axios.delete(`${API}/timeline/${selectedEvent.id}`);
            toast.success('Event deleted');
            fetchEvents();
            setShowDeleteDialog(false);
            setSelectedEvent(null);
        } catch (err) {
            toast.error('Failed to delete event');
        }
    };

    const openEditModal = (event) => {
        setSelectedEvent(event);
        setFormData({
            title: event.title,
            description: event.description || '',
            event_date: event.event_date,
            event_type: event.event_type,
            photo: event.photo || '',
            tags: (event.tags || []).join(', ')
        });
        setShowEditModal(true);
    };

    const closeModal = () => {
        setShowAddModal(false);
        setShowEditModal(false);
        setSelectedEvent(null);
        setFormData({
            title: '',
            description: '',
            event_date: '',
            event_type: 'memory',
            photo: '',
            tags: ''
        });
    };

    const getEventIcon = (type) => {
        const eventType = EVENT_TYPES.find(t => t.id === type);
        if (!eventType) return Star;
        return eventType.icon;
    };

    const getEventColor = (type) => {
        const eventType = EVENT_TYPES.find(t => t.id === type);
        return eventType?.color || 'text-primary';
    };

    // Group events by year
    const groupedEvents = events.reduce((acc, event) => {
        const year = event.event_date ? new Date(event.event_date).getFullYear() : 'Unknown';
        if (!acc[year]) acc[year] = [];
        acc[year].push(event);
        return acc;
    }, {});

    const sortedYears = Object.keys(groupedEvents).sort((a, b) => b - a);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-xl font-semibold text-foreground">Relationship Timeline</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        {events.length} {events.length === 1 ? 'moment' : 'moments'} with {childName}
                    </p>
                </div>
                <Button 
                    onClick={() => setShowAddModal(true)}
                    className="gap-2 rounded-full"
                    data-testid="add-timeline-event-btn"
                >
                    <Plus className="w-4 h-4" />
                    Add Moment
                </Button>
            </div>

            {/* Timeline */}
            {events.length === 0 ? (
                <Card className="p-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                        <Calendar className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">No moments yet</h3>
                    <p className="text-muted-foreground mb-6">Start documenting your special moments together</p>
                    <Button onClick={() => setShowAddModal(true)} className="gap-2 rounded-full">
                        <Plus className="w-4 h-4" />
                        Add First Moment
                    </Button>
                </Card>
            ) : (
                <div className="relative">
                    {/* Timeline Line */}
                    <div className="timeline-line" />

                    {/* Events by Year */}
                    {sortedYears.map(year => (
                        <div key={year} className="mb-8">
                            {/* Year Label */}
                            <div className="relative z-10 mb-6 pl-12 md:pl-0 md:text-center">
                                <span className="inline-block px-4 py-1 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                                    {year}
                                </span>
                            </div>

                            {/* Events */}
                            <div className="space-y-6">
                                {groupedEvents[year]
                                    .sort((a, b) => new Date(b.event_date) - new Date(a.event_date))
                                    .map((event, index) => {
                                        const EventIcon = getEventIcon(event.event_type);
                                        const isLeft = index % 2 === 0;
                                        
                                        return (
                                            <div 
                                                key={event.id}
                                                className={`relative pl-12 md:pl-0 md:w-1/2 ${isLeft ? 'md:pr-8 md:ml-0' : 'md:pl-8 md:ml-auto'} animate-slide-up opacity-0`}
                                                style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'forwards' }}
                                                data-testid={`timeline-event-${event.id}`}
                                            >
                                                {/* Node */}
                                                <div className="timeline-node">
                                                    <EventIcon className={`w-3 h-3 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${getEventColor(event.event_type)}`} />
                                                </div>

                                                {/* Card */}
                                                <Card className="hover-lift overflow-hidden">
                                                    {event.photo && (
                                                        <div className="aspect-video bg-muted overflow-hidden">
                                                            <img 
                                                                src={event.photo} 
                                                                alt={event.title}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>
                                                    )}
                                                    <CardContent className="p-4">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="flex-1">
                                                                <p className="text-xs text-muted-foreground mb-1">
                                                                    {event.event_date && format(parseISO(event.event_date), 'MMM d, yyyy')}
                                                                </p>
                                                                <h4 className="font-semibold text-foreground">{event.title}</h4>
                                                                {event.description && (
                                                                    <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                                                                )}
                                                                {event.tags?.length > 0 && (
                                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                                        {event.tags.map((tag, i) => (
                                                                            <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                                                                {tag}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex gap-1">
                                                                <Button 
                                                                    variant="ghost" 
                                                                    size="icon"
                                                                    className="h-8 w-8"
                                                                    onClick={() => openEditModal(event)}
                                                                >
                                                                    <Edit className="w-3.5 h-3.5" />
                                                                </Button>
                                                                <Button 
                                                                    variant="ghost" 
                                                                    size="icon"
                                                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                                                    onClick={() => { setSelectedEvent(event); setShowDeleteDialog(true); }}
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add/Edit Modal */}
            <Dialog open={showAddModal || showEditModal} onOpenChange={closeModal}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{showEditModal ? 'Edit Moment' : 'Add New Moment'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Photo Upload */}
                        <div>
                            {formData.photo ? (
                                <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                                    <img src={formData.photo} alt="Event" className="w-full h-full object-cover" />
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        className="absolute top-2 right-2 h-8 w-8"
                                        onClick={() => setFormData(prev => ({ ...prev, photo: '' }))}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            ) : (
                                <label className="flex flex-col items-center justify-center h-32 rounded-lg border-2 border-dashed border-border bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors">
                                    <Image className="w-8 h-8 text-muted-foreground mb-2" />
                                    <span className="text-sm text-muted-foreground">Add a photo (optional)</span>
                                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                </label>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Date *</Label>
                                    <Input
                                        type="date"
                                        value={formData.event_date}
                                        onChange={e => setFormData(prev => ({ ...prev, event_date: e.target.value }))}
                                        className="mt-1.5"
                                        data-testid="event-date-input"
                                    />
                                </div>
                                <div>
                                    <Label>Type</Label>
                                    <Select
                                        value={formData.event_type}
                                        onValueChange={v => setFormData(prev => ({ ...prev, event_type: v }))}
                                    >
                                        <SelectTrigger className="mt-1.5">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {EVENT_TYPES.map(type => (
                                                <SelectItem key={type.id} value={type.id}>
                                                    <span className="flex items-center gap-2">
                                                        <type.icon className={`w-4 h-4 ${type.color}`} />
                                                        {type.label}
                                                    </span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div>
                                <Label>Title *</Label>
                                <Input
                                    value={formData.title}
                                    onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                    placeholder="e.g., First day of school"
                                    className="mt-1.5"
                                    data-testid="event-title-input"
                                />
                            </div>
                            <div>
                                <Label>Description</Label>
                                <Textarea
                                    value={formData.description}
                                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Tell the story..."
                                    className="mt-1.5"
                                    rows={3}
                                />
                            </div>
                            <div>
                                <Label>Tags (comma-separated)</Label>
                                <Input
                                    value={formData.tags}
                                    onChange={e => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                                    placeholder="e.g., school, proud moment"
                                    className="mt-1.5"
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={closeModal}>
                                Cancel
                            </Button>
                            <Button type="submit" data-testid="save-event-btn">
                                {showEditModal ? 'Save Changes' : 'Add Moment'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Moment?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete "{selectedEvent?.title}" from the timeline. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default Timeline;
