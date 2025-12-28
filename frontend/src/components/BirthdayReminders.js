import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cake, Gift, ChevronRight, X, Sparkles } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function BirthdayReminders({ onDismiss }) {
    const navigate = useNavigate();
    const [birthdays, setBirthdays] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dismissed, setDismissed] = useState([]);

    useEffect(() => {
        fetchUpcomingBirthdays();
        // Load dismissed reminders from localStorage
        const dismissedItems = JSON.parse(localStorage.getItem('ourcircle_dismissed_birthdays') || '[]');
        setDismissed(dismissedItems);
    }, []);

    const fetchUpcomingBirthdays = async () => {
        try {
            const res = await axios.get(`${API}/birthdays/upcoming?days=30`);
            setBirthdays(res.data.upcoming_birthdays || []);
        } catch (err) {
            console.error('Failed to fetch birthdays:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDismiss = (childId) => {
        const key = `${childId}-${new Date().getFullYear()}`;
        const newDismissed = [...dismissed, key];
        setDismissed(newDismissed);
        localStorage.setItem('ourcircle_dismissed_birthdays', JSON.stringify(newDismissed));
    };

    const handleDismissAll = () => {
        if (onDismiss) onDismiss();
    };

    // Filter out dismissed birthdays
    const visibleBirthdays = birthdays.filter(b => {
        const key = `${b.child_id}-${new Date().getFullYear()}`;
        return !dismissed.includes(key);
    });

    if (loading || visibleBirthdays.length === 0) {
        return null;
    }

    const getDaysLabel = (days) => {
        if (days === 0) return 'Today! 🎉';
        if (days === 1) return 'Tomorrow';
        return `in ${days} days`;
    };

    const getUrgencyColor = (days) => {
        if (days === 0) return 'bg-gradient-to-r from-pink-500 to-purple-500';
        if (days <= 3) return 'bg-gradient-to-r from-orange-400 to-pink-500';
        if (days <= 7) return 'bg-gradient-to-r from-yellow-400 to-orange-400';
        return 'bg-gradient-to-r from-blue-400 to-purple-400';
    };

    return (
        <div className="mb-6 animate-fade-in">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-pink-100 dark:bg-pink-900/30">
                        <Cake className="w-4 h-4 text-pink-500" />
                    </div>
                    <h3 className="font-semibold text-foreground">Upcoming Birthdays</h3>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {visibleBirthdays.length}
                    </span>
                </div>
                {onDismiss && (
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleDismissAll}
                        className="text-muted-foreground hover:text-foreground"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                )}
            </div>

            <div className="space-y-3">
                {visibleBirthdays.slice(0, 3).map((birthday) => (
                    <Card 
                        key={birthday.child_id}
                        className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
                        onClick={() => navigate(`/child/${birthday.child_id}`)}
                    >
                        <CardContent className="p-0">
                            <div className="flex items-center gap-4">
                                {/* Colored sidebar indicator */}
                                <div className={`w-1.5 self-stretch ${getUrgencyColor(birthday.days_until)}`} />
                                
                                <div className="flex items-center gap-3 flex-1 py-3 pr-3">
                                    {/* Profile photo or placeholder */}
                                    <div className="relative">
                                        {birthday.profile_photo ? (
                                            <img 
                                                src={birthday.profile_photo} 
                                                alt={birthday.name}
                                                className="w-12 h-12 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-200 to-purple-200 flex items-center justify-center">
                                                <span className="text-lg font-bold text-purple-600">
                                                    {birthday.name?.charAt(0)}
                                                </span>
                                            </div>
                                        )}
                                        {birthday.days_until === 0 && (
                                            <div className="absolute -top-1 -right-1">
                                                <Sparkles className="w-4 h-4 text-yellow-500 animate-pulse" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold text-foreground truncate">
                                                {birthday.nickname || birthday.name}
                                            </p>
                                            <span className={`
                                                text-xs font-medium px-2 py-0.5 rounded-full
                                                ${birthday.days_until === 0 
                                                    ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300' 
                                                    : birthday.days_until <= 7
                                                        ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300'
                                                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                                                }
                                            `}>
                                                {getDaysLabel(birthday.days_until)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            Turning {birthday.turning_age} years old
                                        </p>
                                        {birthday.gift_hints.length > 0 && (
                                            <div className="flex items-center gap-1 mt-1">
                                                <Gift className="w-3 h-3 text-muted-foreground" />
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {birthday.gift_hints.join(', ')}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDismiss(birthday.child_id);
                                            }}
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {visibleBirthdays.length > 3 && (
                    <Button
                        variant="ghost"
                        className="w-full text-muted-foreground hover:text-foreground"
                        onClick={() => {/* Could navigate to full birthdays view */}}
                    >
                        View all {visibleBirthdays.length} upcoming birthdays
                    </Button>
                )}
            </div>
        </div>
    );
}
