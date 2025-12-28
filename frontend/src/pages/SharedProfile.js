import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    User, Users, Calendar, MapPin, Heart, Book, Star, 
    AlertCircle, Clock, ChevronLeft, Cake, Music, Gamepad2,
    Utensils, Palette, Sparkles
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function SharedProfile() {
    const { shareToken } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchSharedProfile();
    }, [shareToken]);

    const fetchSharedProfile = async () => {
        try {
            const res = await axios.get(`${API}/share/${shareToken}`);
            setData(res.data);
        } catch (err) {
            if (err.response?.status === 404) {
                setError('This share link was not found or has been revoked.');
            } else if (err.response?.status === 410) {
                setError('This share link has expired.');
            } else {
                setError('Failed to load shared profile.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading shared profile...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <Card className="max-w-md w-full">
                    <CardContent className="pt-6 text-center">
                        <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-foreground mb-2">Unable to Load</h2>
                        <p className="text-muted-foreground mb-6">{error}</p>
                        <Button onClick={() => navigate('/')}>
                            Go to OurCircle
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const { entity_type, entity, shared_at, expires_at } = data;

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-50 glass border-b border-border">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-primary/10">
                                {entity_type === 'family' ? (
                                    <Users className="w-5 h-5 text-primary" />
                                ) : (
                                    <User className="w-5 h-5 text-primary" />
                                )}
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-foreground">Shared Profile</h1>
                                <p className="text-xs text-muted-foreground">via OurCircle</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {expires_at ? (
                                <span>Expires {new Date(expires_at).toLocaleDateString()}</span>
                            ) : (
                                <span>No expiration</span>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
                {entity_type === 'family' ? (
                    <FamilyProfile family={entity} />
                ) : (
                    <ChildProfile child={entity} />
                )}

                {/* Footer CTA */}
                <div className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-primary/10 to-purple-500/10 text-center">
                    <h3 className="text-lg font-bold text-foreground mb-2">
                        Want to create your own family dossier?
                    </h3>
                    <p className="text-muted-foreground mb-4">
                        OurCircle helps you keep track of everything about the kids in your life.
                    </p>
                    <Button onClick={() => navigate('/')}>
                        Get Started with OurCircle
                    </Button>
                </div>
            </main>
        </div>
    );
}

function FamilyProfile({ family }) {
    return (
        <div className="space-y-6">
            {/* Family Header */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                        {family.family_photo ? (
                            <img 
                                src={family.family_photo} 
                                alt={family.family_name}
                                className="w-20 h-20 rounded-xl object-cover"
                            />
                        ) : (
                            <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                                <Users className="w-10 h-10 text-primary" />
                            </div>
                        )}
                        <div>
                            <h2 className="text-2xl font-bold text-foreground">{family.family_name}</h2>
                            <p className="text-muted-foreground">
                                {family.children?.length || 0} {family.children?.length === 1 ? 'child' : 'children'}
                            </p>
                        </div>
                    </div>
                    {family.family_notes && (
                        <p className="mt-4 text-muted-foreground">{family.family_notes}</p>
                    )}
                </CardContent>
            </Card>

            {/* Children */}
            {family.children && family.children.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Children</h3>
                    {family.children.map((child) => (
                        <ChildCard key={child.id} child={child} />
                    ))}
                </div>
            )}
        </div>
    );
}

function ChildCard({ child }) {
    const identity = child.identity || {};
    
    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                    {identity.profile_photo ? (
                        <img 
                            src={identity.profile_photo} 
                            alt={identity.full_name}
                            className="w-16 h-16 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-200 to-purple-200 flex items-center justify-center">
                            <span className="text-2xl font-bold text-purple-600">
                                {identity.full_name?.charAt(0)}
                            </span>
                        </div>
                    )}
                    <div>
                        <h4 className="text-lg font-semibold text-foreground">{identity.full_name}</h4>
                        {identity.nicknames?.length > 0 && (
                            <p className="text-sm text-muted-foreground">"{identity.nicknames[0]}"</p>
                        )}
                        {identity.birthday && (
                            <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                                <Cake className="w-3 h-3" />
                                {identity.birthday}
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function ChildProfile({ child }) {
    const identity = child.identity || {};
    const school = child.school || {};
    const favorites = child.favorites || {};
    const personality = child.personality || {};

    return (
        <div className="space-y-6">
            {/* Profile Header */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                        {identity.profile_photo ? (
                            <img 
                                src={identity.profile_photo} 
                                alt={identity.full_name}
                                className="w-24 h-24 rounded-full object-cover ring-4 ring-primary/20"
                            />
                        ) : (
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-200 to-purple-200 flex items-center justify-center ring-4 ring-primary/20">
                                <span className="text-3xl font-bold text-purple-600">
                                    {identity.full_name?.charAt(0)}
                                </span>
                            </div>
                        )}
                        <div>
                            <h2 className="text-2xl font-bold text-foreground">{identity.full_name}</h2>
                            {identity.nicknames?.length > 0 && (
                                <p className="text-muted-foreground">"{identity.nicknames.join('", "')}"</p>
                            )}
                            <div className="flex flex-wrap gap-3 mt-3 justify-center sm:justify-start">
                                {identity.birthday && (
                                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                        <Cake className="w-4 h-4" />
                                        {identity.birthday}
                                    </span>
                                )}
                                {identity.place_of_birth && (
                                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                        <MapPin className="w-4 h-4" />
                                        {identity.place_of_birth}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tabbed Content */}
            <Tabs defaultValue="favorites" className="w-full">
                <TabsList className="w-full justify-start">
                    <TabsTrigger value="favorites" className="gap-1">
                        <Star className="w-4 h-4" />
                        Favorites
                    </TabsTrigger>
                    <TabsTrigger value="personality" className="gap-1">
                        <Heart className="w-4 h-4" />
                        Personality
                    </TabsTrigger>
                    <TabsTrigger value="school" className="gap-1">
                        <Book className="w-4 h-4" />
                        School
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="favorites" className="mt-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <InfoCard title="Food" icon={Utensils} items={[
                            { label: 'Favorite Food', value: favorites.favorite_food },
                            { label: 'Favorite Snack', value: favorites.favorite_snack },
                            { label: 'Favorite Restaurant', value: favorites.favorite_restaurant },
                        ]} />
                        <InfoCard title="Entertainment" icon={Gamepad2} items={[
                            { label: 'Favorite Show', value: favorites.favorite_show },
                            { label: 'Favorite Movie', value: favorites.favorite_movie },
                            { label: 'Favorite Game', value: favorites.favorite_game },
                        ]} />
                        <InfoCard title="Music" icon={Music} items={[
                            { label: 'Best Song', value: favorites.best_song },
                            { label: 'Favorite Artist', value: favorites.favorite_artist },
                        ]} />
                        <InfoCard title="Style" icon={Palette} items={[
                            { label: 'Favorite Color', value: favorites.favorite_color },
                            { label: 'Personal Style', value: favorites.personal_style },
                        ]} />
                    </div>
                </TabsContent>

                <TabsContent value="personality" className="mt-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <InfoCard title="Likes" icon={Heart} items={
                            personality.likes?.map(item => ({ value: item })) || []
                        } />
                        <InfoCard title="Strengths" icon={Sparkles} items={
                            personality.strengths?.map(item => ({ value: item })) || []
                        } />
                        {personality.primary_love_language && (
                            <Card className="sm:col-span-2">
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Heart className="w-4 h-4 text-pink-500" />
                                        Love Language
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-foreground font-medium">{personality.primary_love_language}</p>
                                    {personality.secondary_love_language && (
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Secondary: {personality.secondary_love_language}
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="school" className="mt-4">
                    <Card>
                        <CardContent className="pt-6 space-y-4">
                            {school.school_name && (
                                <div>
                                    <p className="text-sm text-muted-foreground">School</p>
                                    <p className="text-foreground font-medium">{school.school_name}</p>
                                </div>
                            )}
                            {school.grade && (
                                <div>
                                    <p className="text-sm text-muted-foreground">Grade</p>
                                    <p className="text-foreground font-medium">{school.grade}</p>
                                </div>
                            )}
                            {school.favorite_subject && (
                                <div>
                                    <p className="text-sm text-muted-foreground">Favorite Subject</p>
                                    <p className="text-foreground font-medium">{school.favorite_subject}</p>
                                </div>
                            )}
                            {school.best_school_memory && (
                                <div>
                                    <p className="text-sm text-muted-foreground">Best School Memory</p>
                                    <p className="text-foreground">{school.best_school_memory}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function InfoCard({ title, icon: Icon, items }) {
    const validItems = items.filter(item => item.value);
    
    if (validItems.length === 0) {
        return null;
    }

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                    <Icon className="w-4 h-4 text-primary" />
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                {validItems.map((item, idx) => (
                    <div key={idx}>
                        {item.label && (
                            <p className="text-xs text-muted-foreground">{item.label}</p>
                        )}
                        <p className="text-foreground">{item.value}</p>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
