import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
    ArrowLeft, User, Save, GraduationCap, Heart, Sparkles,
    Plus, Trash2, Image, Clock, Calendar, MapPin, Languages, Star
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import Timeline from '../components/Timeline';
import LoveLanguageSelector from '../components/LoveLanguageSelector';
import { MUSIC_CATEGORIES, DANCE_STYLES } from '../constants/appData';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ChildDossier() {
    const { childId } = useParams();
    const navigate = useNavigate();
    const [child, setChild] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('identity');
    const [formData, setFormData] = useState({
        identity: {},
        school: {},
        favorites: {},
        personality: {}
    });

    useEffect(() => {
        fetchChild();
    }, [childId]);

    const fetchChild = async () => {
        try {
            const res = await axios.get(`${API}/children/${childId}`);
            setChild(res.data);
            setFormData({
                identity: res.data.identity || {},
                school: res.data.school || {},
                favorites: res.data.favorites || {},
                personality: res.data.personality || {}
            });
        } catch (err) {
            toast.error('Failed to load child data');
            navigate('/');
        } finally {
            setLoading(false);
        }
    };

    const calculateAge = (birthday) => {
        if (!birthday) return null;
        const birth = new Date(birthday);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
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
                updateField('identity', 'profile_photo', reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const updateField = (section, field, value) => {
        setFormData(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));
    };

    const updateArrayField = (section, field, value) => {
        const arr = value.split(',').map(v => v.trim()).filter(v => v);
        updateField(section, field, arr);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await axios.put(`${API}/children/${childId}`, formData);
            toast.success('Changes saved successfully');
            fetchChild();
        } catch (err) {
            toast.error('Failed to save changes');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const age = calculateAge(formData.identity?.birthday);

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-50 glass border-b border-border">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => navigate(`/family/${child?.family_id}`)}
                                data-testid="back-btn"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-primary/10 overflow-hidden flex items-center justify-center">
                                    {formData.identity?.profile_photo ? (
                                        <img 
                                            src={formData.identity.profile_photo} 
                                            alt={formData.identity.full_name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <User className="w-6 h-6 text-primary" />
                                    )}
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-foreground">
                                        {formData.identity?.full_name || 'Child Dossier'}
                                    </h1>
                                    {age !== null && (
                                        <p className="text-sm text-muted-foreground">{age} years old</p>
                                    )}
                                </div>
                            </div>
                        </div>
                        <Button 
                            onClick={handleSave}
                            disabled={saving}
                            className="gap-2 rounded-full"
                            data-testid="save-btn"
                        >
                            {saving ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            Save
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="w-full justify-start mb-8 bg-muted/50 p-1 rounded-full overflow-x-auto flex-nowrap">
                        <TabsTrigger 
                            value="identity" 
                            className="rounded-full gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                            data-testid="tab-identity"
                        >
                            <User className="w-4 h-4" />
                            Identity
                        </TabsTrigger>
                        <TabsTrigger 
                            value="school" 
                            className="rounded-full gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                            data-testid="tab-school"
                        >
                            <GraduationCap className="w-4 h-4" />
                            School
                        </TabsTrigger>
                        <TabsTrigger 
                            value="favorites" 
                            className="rounded-full gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                            data-testid="tab-favorites"
                        >
                            <Heart className="w-4 h-4" />
                            Favorites
                        </TabsTrigger>
                        <TabsTrigger 
                            value="personality" 
                            className="rounded-full gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                            data-testid="tab-personality"
                        >
                            <Sparkles className="w-4 h-4" />
                            Personality
                        </TabsTrigger>
                        <TabsTrigger 
                            value="timeline" 
                            className="rounded-full gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                            data-testid="tab-timeline"
                        >
                            <Clock className="w-4 h-4" />
                            Timeline
                        </TabsTrigger>
                    </TabsList>

                    {/* Identity Tab */}
                    <TabsContent value="identity" className="animate-fade-in">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Profile Photo Card */}
                            <Card className="lg:col-span-1">
                                <CardContent className="p-6 flex flex-col items-center">
                                    <div className="w-32 h-32 rounded-2xl bg-muted overflow-hidden flex items-center justify-center relative group mb-4">
                                        {formData.identity?.profile_photo ? (
                                            <img 
                                                src={formData.identity.profile_photo} 
                                                alt="Profile" 
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <User className="w-16 h-16 text-muted-foreground" />
                                        )}
                                        <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity rounded-2xl">
                                            <Plus className="w-8 h-8 text-white" />
                                            <input 
                                                type="file" 
                                                accept="image/*" 
                                                className="hidden" 
                                                onChange={handleImageUpload}
                                            />
                                        </label>
                                    </div>
                                    <p className="text-sm text-muted-foreground">Click to change photo</p>
                                </CardContent>
                            </Card>

                            {/* Basic Info Card */}
                            <Card className="lg:col-span-2">
                                <CardHeader>
                                    <CardTitle className="text-lg">Basic Information</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label>Full Name</Label>
                                            <Input
                                                value={formData.identity?.full_name || ''}
                                                onChange={e => updateField('identity', 'full_name', e.target.value)}
                                                className="mt-1.5"
                                            />
                                        </div>
                                        <div>
                                            <Label>Nicknames (comma-separated)</Label>
                                            <Input
                                                value={(formData.identity?.nicknames || []).join(', ')}
                                                onChange={e => updateArrayField('identity', 'nicknames', e.target.value)}
                                                className="mt-1.5"
                                            />
                                        </div>
                                        <div>
                                            <Label>Birthday</Label>
                                            <Input
                                                type="date"
                                                value={formData.identity?.birthday || ''}
                                                onChange={e => updateField('identity', 'birthday', e.target.value)}
                                                className="mt-1.5"
                                            />
                                        </div>
                                        <div>
                                            <Label>Pronouns</Label>
                                            <Input
                                                value={formData.identity?.pronouns || ''}
                                                onChange={e => updateField('identity', 'pronouns', e.target.value)}
                                                placeholder="e.g., she/her"
                                                className="mt-1.5"
                                            />
                                        </div>
                                        <div>
                                            <Label>Place of Birth</Label>
                                            <Input
                                                value={formData.identity?.place_of_birth || ''}
                                                onChange={e => updateField('identity', 'place_of_birth', e.target.value)}
                                                className="mt-1.5"
                                            />
                                        </div>
                                        <div>
                                            <Label>Languages (comma-separated)</Label>
                                            <Input
                                                value={(formData.identity?.languages || []).join(', ')}
                                                onChange={e => updateArrayField('identity', 'languages', e.target.value)}
                                                className="mt-1.5"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Label>Relationship Notes</Label>
                                        <Textarea
                                            value={formData.identity?.relationship_notes || ''}
                                            onChange={e => updateField('identity', 'relationship_notes', e.target.value)}
                                            placeholder="Notes about your relationship with this child..."
                                            className="mt-1.5"
                                            rows={3}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* School Tab */}
                    <TabsContent value="school" className="animate-fade-in">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">School Details</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label>Grade</Label>
                                            <Input
                                                value={formData.school?.grade || ''}
                                                onChange={e => updateField('school', 'grade', e.target.value)}
                                                placeholder="e.g., 5th Grade"
                                                className="mt-1.5"
                                            />
                                        </div>
                                        <div>
                                            <Label>School Name</Label>
                                            <Input
                                                value={formData.school?.school_name || ''}
                                                onChange={e => updateField('school', 'school_name', e.target.value)}
                                                className="mt-1.5"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Label>Favorite Teachers (comma-separated)</Label>
                                        <Input
                                            value={(formData.school?.favorite_teachers || []).join(', ')}
                                            onChange={e => updateArrayField('school', 'favorite_teachers', e.target.value)}
                                            className="mt-1.5"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label>Favorite Subject</Label>
                                            <Input
                                                value={formData.school?.favorite_subject || ''}
                                                onChange={e => updateField('school', 'favorite_subject', e.target.value)}
                                                className="mt-1.5"
                                            />
                                        </div>
                                        <div>
                                            <Label>Least Favorite Subject</Label>
                                            <Input
                                                value={formData.school?.least_favorite_subject || ''}
                                                onChange={e => updateField('school', 'least_favorite_subject', e.target.value)}
                                                className="mt-1.5"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Label>Best School Memory</Label>
                                        <Textarea
                                            value={formData.school?.best_school_memory || ''}
                                            onChange={e => updateField('school', 'best_school_memory', e.target.value)}
                                            className="mt-1.5"
                                            rows={3}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Learning Profile</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label>School Activities (comma-separated)</Label>
                                        <Input
                                            value={(formData.school?.school_activities || []).join(', ')}
                                            onChange={e => updateArrayField('school', 'school_activities', e.target.value)}
                                            placeholder="e.g., Soccer, Drama Club"
                                            className="mt-1.5"
                                        />
                                    </div>
                                    <div>
                                        <Label>Learning Style</Label>
                                        <Input
                                            value={formData.school?.learning_style || ''}
                                            onChange={e => updateField('school', 'learning_style', e.target.value)}
                                            placeholder="e.g., Visual learner"
                                            className="mt-1.5"
                                        />
                                    </div>
                                    <div>
                                        <Label>Learning Supports</Label>
                                        <Textarea
                                            value={formData.school?.learning_supports || ''}
                                            onChange={e => updateField('school', 'learning_supports', e.target.value)}
                                            placeholder="What helps them learn best..."
                                            className="mt-1.5"
                                            rows={2}
                                        />
                                    </div>
                                    <div>
                                        <Label>Learning Challenges</Label>
                                        <Textarea
                                            value={formData.school?.learning_challenges || ''}
                                            onChange={e => updateField('school', 'learning_challenges', e.target.value)}
                                            placeholder="Areas that need extra attention..."
                                            className="mt-1.5"
                                            rows={2}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Favorites Tab */}
                    <TabsContent value="favorites" className="animate-fade-in">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Food */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Food & Drinks</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label>Favorite Food</Label>
                                            <Input
                                                value={formData.favorites?.favorite_food || ''}
                                                onChange={e => updateField('favorites', 'favorite_food', e.target.value)}
                                                className="mt-1.5"
                                            />
                                        </div>
                                        <div>
                                            <Label>Least Favorite Food</Label>
                                            <Input
                                                value={formData.favorites?.least_favorite_food || ''}
                                                onChange={e => updateField('favorites', 'least_favorite_food', e.target.value)}
                                                className="mt-1.5"
                                            />
                                        </div>
                                        <div>
                                            <Label>Favorite Snack</Label>
                                            <Input
                                                value={formData.favorites?.favorite_snack || ''}
                                                onChange={e => updateField('favorites', 'favorite_snack', e.target.value)}
                                                className="mt-1.5"
                                            />
                                        </div>
                                        <div>
                                            <Label>Favorite Drink</Label>
                                            <Input
                                                value={formData.favorites?.favorite_drink || ''}
                                                onChange={e => updateField('favorites', 'favorite_drink', e.target.value)}
                                                className="mt-1.5"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Label>Favorite Food to Cook</Label>
                                        <Input
                                            value={formData.favorites?.favorite_food_to_cook || ''}
                                            onChange={e => updateField('favorites', 'favorite_food_to_cook', e.target.value)}
                                            className="mt-1.5"
                                        />
                                    </div>
                                    <div>
                                        <Label>Favorite Restaurant</Label>
                                        <Input
                                            value={formData.favorites?.favorite_restaurant || ''}
                                            onChange={e => updateField('favorites', 'favorite_restaurant', e.target.value)}
                                            className="mt-1.5"
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Media */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Media & Entertainment</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label>Favorite Show</Label>
                                            <Input
                                                value={formData.favorites?.favorite_show || ''}
                                                onChange={e => updateField('favorites', 'favorite_show', e.target.value)}
                                                className="mt-1.5"
                                            />
                                        </div>
                                        <div>
                                            <Label>Favorite Movie</Label>
                                            <Input
                                                value={formData.favorites?.favorite_movie || ''}
                                                onChange={e => updateField('favorites', 'favorite_movie', e.target.value)}
                                                className="mt-1.5"
                                            />
                                        </div>
                                        <div>
                                            <Label>Favorite Character</Label>
                                            <Input
                                                value={formData.favorites?.favorite_character || ''}
                                                onChange={e => updateField('favorites', 'favorite_character', e.target.value)}
                                                className="mt-1.5"
                                            />
                                        </div>
                                        <div>
                                            <Label>Favorite Book</Label>
                                            <Input
                                                value={formData.favorites?.favorite_book || ''}
                                                onChange={e => updateField('favorites', 'favorite_book', e.target.value)}
                                                className="mt-1.5"
                                            />
                                        </div>
                                        <div>
                                            <Label>Favorite Game</Label>
                                            <Input
                                                value={formData.favorites?.favorite_game || ''}
                                                onChange={e => updateField('favorites', 'favorite_game', e.target.value)}
                                                className="mt-1.5"
                                            />
                                        </div>
                                        <div>
                                            <Label>Best Song</Label>
                                            <Input
                                                value={formData.favorites?.best_song || ''}
                                                onChange={e => updateField('favorites', 'best_song', e.target.value)}
                                                className="mt-1.5"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label>Favorite Artist</Label>
                                            <Input
                                                value={formData.favorites?.favorite_artist || ''}
                                                onChange={e => updateField('favorites', 'favorite_artist', e.target.value)}
                                                className="mt-1.5"
                                            />
                                        </div>
                                        <div>
                                            <Label>Music Category</Label>
                                            <Select
                                                value={formData.favorites?.music_category || ''}
                                                onValueChange={v => updateField('favorites', 'music_category', v)}
                                            >
                                                <SelectTrigger className="mt-1.5">
                                                    <SelectValue placeholder="Select genre" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {MUSIC_CATEGORIES.map(cat => (
                                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Style */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Style & Dance</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label>Favorite Color</Label>
                                            <Input
                                                value={formData.favorites?.favorite_color || ''}
                                                onChange={e => updateField('favorites', 'favorite_color', e.target.value)}
                                                className="mt-1.5"
                                            />
                                        </div>
                                        <div>
                                            <Label>Dance Style</Label>
                                            <Select
                                                value={formData.favorites?.dance_style || ''}
                                                onValueChange={v => updateField('favorites', 'dance_style', v)}
                                            >
                                                <SelectTrigger className="mt-1.5">
                                                    <SelectValue placeholder="Select style" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {DANCE_STYLES.map(style => (
                                                        <SelectItem key={style} value={style}>{style}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div>
                                        <Label>Colors to Wear (comma-separated)</Label>
                                        <Input
                                            value={(formData.favorites?.favorite_colors_to_wear || []).join(', ')}
                                            onChange={e => updateArrayField('favorites', 'favorite_colors_to_wear', e.target.value)}
                                            className="mt-1.5"
                                        />
                                    </div>
                                    <div>
                                        <Label>Favorite Brands (comma-separated)</Label>
                                        <Input
                                            value={(formData.favorites?.favorite_brands || []).join(', ')}
                                            onChange={e => updateArrayField('favorites', 'favorite_brands', e.target.value)}
                                            className="mt-1.5"
                                        />
                                    </div>
                                    <div>
                                        <Label>Personal Style</Label>
                                        <Input
                                            value={formData.favorites?.personal_style || ''}
                                            onChange={e => updateField('favorites', 'personal_style', e.target.value)}
                                            placeholder="e.g., Casual, Sporty"
                                            className="mt-1.5"
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Animals & Sports */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Animals & Sports</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label>Favorite Animal</Label>
                                        <Input
                                            value={formData.favorites?.favorite_animal || ''}
                                            onChange={e => updateField('favorites', 'favorite_animal', e.target.value)}
                                            className="mt-1.5"
                                        />
                                    </div>
                                    <div>
                                        <Label>Favorite Sport</Label>
                                        <Input
                                            value={formData.favorites?.favorite_sport || ''}
                                            onChange={e => updateField('favorites', 'favorite_sport', e.target.value)}
                                            className="mt-1.5"
                                        />
                                    </div>
                                    <div>
                                        <Label>Favorite Team</Label>
                                        <Input
                                            value={formData.favorites?.favorite_team || ''}
                                            onChange={e => updateField('favorites', 'favorite_team', e.target.value)}
                                            className="mt-1.5"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Personality Tab */}
                    <TabsContent value="personality" className="animate-fade-in">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Character Traits</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label>Likes (comma-separated)</Label>
                                        <Input
                                            value={(formData.personality?.likes || []).join(', ')}
                                            onChange={e => updateArrayField('personality', 'likes', e.target.value)}
                                            placeholder="Things they enjoy..."
                                            className="mt-1.5"
                                        />
                                    </div>
                                    <div>
                                        <Label>Dislikes (comma-separated)</Label>
                                        <Input
                                            value={(formData.personality?.dislikes || []).join(', ')}
                                            onChange={e => updateArrayField('personality', 'dislikes', e.target.value)}
                                            placeholder="Things they avoid..."
                                            className="mt-1.5"
                                        />
                                    </div>
                                    <div>
                                        <Label>Strengths (comma-separated)</Label>
                                        <Input
                                            value={(formData.personality?.strengths || []).join(', ')}
                                            onChange={e => updateArrayField('personality', 'strengths', e.target.value)}
                                            className="mt-1.5"
                                        />
                                    </div>
                                    <div>
                                        <Label>Special Skills (comma-separated)</Label>
                                        <Input
                                            value={(formData.personality?.special_skills || []).join(', ')}
                                            onChange={e => updateArrayField('personality', 'special_skills', e.target.value)}
                                            className="mt-1.5"
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Social Profile</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label>Known For</Label>
                                        <Input
                                            value={formData.personality?.known_for || ''}
                                            onChange={e => updateField('personality', 'known_for', e.target.value)}
                                            placeholder="What makes them unique..."
                                            className="mt-1.5"
                                        />
                                    </div>
                                    <div>
                                        <Label>Social Style</Label>
                                        <Input
                                            value={formData.personality?.social_style || ''}
                                            onChange={e => updateField('personality', 'social_style', e.target.value)}
                                            placeholder="e.g., Outgoing, Reserved"
                                            className="mt-1.5"
                                        />
                                    </div>
                                    <div>
                                        <Label>Phobias (comma-separated)</Label>
                                        <Input
                                            value={(formData.personality?.phobias || []).join(', ')}
                                            onChange={e => updateArrayField('personality', 'phobias', e.target.value)}
                                            className="mt-1.5"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label>Primary Love Language</Label>
                                            <Select
                                                value={formData.personality?.primary_love_language || ''}
                                                onValueChange={v => updateField('personality', 'primary_love_language', v)}
                                            >
                                                <SelectTrigger className="mt-1.5">
                                                    <SelectValue placeholder="Select" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {LOVE_LANGUAGES.map(lang => (
                                                        <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label>Secondary Love Language</Label>
                                            <Select
                                                value={formData.personality?.secondary_love_language || ''}
                                                onValueChange={v => updateField('personality', 'secondary_love_language', v)}
                                            >
                                                <SelectTrigger className="mt-1.5">
                                                    <SelectValue placeholder="Select" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {LOVE_LANGUAGES.map(lang => (
                                                        <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Timeline Tab */}
                    <TabsContent value="timeline" className="animate-fade-in">
                        <Timeline childId={childId} childName={formData.identity?.full_name} />
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}
