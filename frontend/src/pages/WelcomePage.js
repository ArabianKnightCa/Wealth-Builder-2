import React, { useState } from 'react';
import { useTheme, themes } from '../context/ThemeContext';
import { Check, ArrowRight, Palette } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function WelcomePage({ onComplete }) {
    const { currentTheme, updateTheme } = useTheme();
    const [selectedTheme, setSelectedTheme] = useState(currentTheme);

    const handleSelect = (themeId) => {
        setSelectedTheme(themeId);
        updateTheme(themeId);
    };

    const handleContinue = () => {
        onComplete();
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 noise-overlay relative">
            <div className="w-full max-w-4xl animate-slide-up">
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <Palette className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
                        Welcome to OurCircle
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-md mx-auto">
                        Choose a theme that feels right for your family's memories
                    </p>
                </div>

                {/* Theme Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-10">
                    {themes.map((theme, index) => {
                        const isActive = selectedTheme === theme.id;
                        return (
                            <button
                                key={theme.id}
                                onClick={() => handleSelect(theme.id)}
                                className={`
                                    relative p-4 rounded-2xl border-2 transition-all duration-300
                                    animate-slide-up opacity-0
                                    ${isActive 
                                        ? 'border-primary shadow-lg scale-105 ring-2 ring-primary/20' 
                                        : 'border-border hover:border-primary/50 hover:scale-102'
                                    }
                                    ${theme.dark ? 'bg-gray-800' : 'bg-card'}
                                `}
                                style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'forwards' }}
                                data-testid={`welcome-theme-${theme.id}`}
                            >
                                {/* Color Preview */}
                                <div className="space-y-2 mb-3">
                                    {/* Main color swatch */}
                                    <div 
                                        className="w-full aspect-square rounded-xl shadow-inner"
                                        style={{ backgroundColor: theme.color }}
                                    />
                                    {/* Color bar preview */}
                                    <div className="flex gap-1">
                                        <div 
                                            className="flex-1 h-2 rounded-full"
                                            style={{ backgroundColor: theme.color }}
                                        />
                                        <div 
                                            className="flex-1 h-2 rounded-full opacity-60"
                                            style={{ backgroundColor: theme.color }}
                                        />
                                        <div 
                                            className="flex-1 h-2 rounded-full opacity-30"
                                            style={{ backgroundColor: theme.color }}
                                        />
                                    </div>
                                </div>
                                
                                {/* Name */}
                                <p className={`text-sm font-semibold text-center ${theme.dark ? 'text-white' : 'text-foreground'}`}>
                                    {theme.name}
                                </p>

                                {/* Check Mark */}
                                {isActive && (
                                    <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-md animate-scale-in">
                                        <Check className="w-4 h-4 text-primary-foreground" />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Continue Button */}
                <div className="flex justify-center">
                    <Button 
                        onClick={handleContinue}
                        size="lg"
                        className="gap-2 rounded-full px-8 text-lg"
                        data-testid="welcome-continue-btn"
                    >
                        Continue to OurCircle
                        <ArrowRight className="w-5 h-5" />
                    </Button>
                </div>

                {/* Footer Note */}
                <p className="text-center text-sm text-muted-foreground mt-6">
                    You can change your theme anytime in Settings
                </p>
            </div>
        </div>
    );
}
