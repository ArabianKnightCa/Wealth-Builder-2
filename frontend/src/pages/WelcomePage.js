import React, { useState } from 'react';
import { useUILayout, uiLayouts, colorThemes } from '../context/UILayoutContext';
import { Check, ArrowRight, Palette, Layout } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function WelcomePage({ onComplete }) {
    const { currentLayout, currentColorTheme, updateLayout, updateColorTheme } = useUILayout();
    const [selectedLayout, setSelectedLayout] = useState(currentLayout);
    const [selectedColor, setSelectedColor] = useState(currentColorTheme);
    const [step, setStep] = useState(1); // 1 = layout, 2 = color

    const handleLayoutSelect = (layoutId) => {
        setSelectedLayout(layoutId);
        updateLayout(layoutId);
    };

    const handleColorSelect = (colorId) => {
        setSelectedColor(colorId);
        updateColorTheme(colorId);
    };

    const handleContinue = () => {
        if (step === 1) {
            setStep(2);
        } else {
            onComplete();
        }
    };

    const availableLayouts = uiLayouts;

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 noise-overlay relative">
            <div className="w-full max-w-5xl animate-slide-up">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                        {step === 1 ? <Layout className="w-8 h-8 text-primary" /> : <Palette className="w-8 h-8 text-primary" />}
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
                        Welcome to OurCircle
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-md mx-auto">
                        {step === 1 
                            ? 'Choose a layout style for your family memories'
                            : 'Now pick a color theme you love'
                        }
                    </p>
                    {/* Step indicator */}
                    <div className="flex justify-center gap-2 mt-4">
                        <div className={`w-2 h-2 rounded-full ${step === 1 ? 'bg-primary' : 'bg-muted'}`} />
                        <div className={`w-2 h-2 rounded-full ${step === 2 ? 'bg-primary' : 'bg-muted'}`} />
                    </div>
                </div>

                {step === 1 ? (
                    /* Layout Selection - Grid of 10 */
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8 max-h-[50vh] overflow-y-auto p-1">
                        {availableLayouts.map((layout, index) => {
                            const isActive = selectedLayout === layout.id;
                            return (
                                <button
                                    key={layout.id}
                                    onClick={() => handleLayoutSelect(layout.id)}
                                    className={`
                                        relative p-4 rounded-xl border-2 text-left transition-all duration-300
                                        animate-slide-up opacity-0
                                        ${isActive 
                                            ? 'border-primary shadow-lg scale-105 ring-2 ring-primary/20 bg-primary/5' 
                                            : 'border-border hover:border-primary/50 bg-card'
                                        }
                                    `}
                                    style={{ animationDelay: `${index * 0.03}s`, animationFillMode: 'forwards' }}
                                    data-testid={`welcome-layout-${layout.id}`}
                                >
                                    <h3 className="text-sm font-bold text-foreground mb-1 truncate">{layout.name}</h3>
                                    <p className="text-xs text-primary font-medium mb-1 truncate">{layout.vibe}</p>
                                    <p className="text-xs text-muted-foreground line-clamp-2">{layout.description}</p>

                                    {isActive && (
                                        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-md animate-scale-in">
                                            <Check className="w-3.5 h-3.5 text-primary-foreground" />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    /* Color Theme Selection */
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 mb-10">
                        {colorThemes.map((theme, index) => {
                            const isActive = selectedColor === theme.id;
                            return (
                                <button
                                    key={theme.id}
                                    onClick={() => handleColorSelect(theme.id)}
                                    className={`
                                        relative p-4 rounded-2xl border-2 transition-all duration-300
                                        animate-slide-up opacity-0
                                        ${isActive 
                                            ? 'border-primary shadow-lg scale-105 ring-2 ring-primary/20' 
                                            : 'border-border hover:border-primary/50'
                                        }
                                        ${theme.colors?.dark ? 'bg-gray-800' : 'bg-card'}
                                    `}
                                    style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'forwards' }}
                                    data-testid={`welcome-color-${theme.id}`}
                                >
                                    <div 
                                        className="w-full aspect-square rounded-xl shadow-inner mb-3"
                                        style={{ backgroundColor: theme.colors.primary }}
                                    />
                                    <p className={`text-sm font-semibold text-center ${theme.colors?.dark ? 'text-white' : 'text-foreground'}`}>
                                        {theme.name}
                                    </p>

                                    {isActive && (
                                        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-md animate-scale-in">
                                            <Check className="w-3.5 h-3.5 text-primary-foreground" />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Continue Button */}
                <div className="flex justify-center gap-4">
                    {step === 2 && (
                        <Button 
                            onClick={() => setStep(1)}
                            variant="outline"
                            size="lg"
                            className="rounded-full px-6"
                        >
                            Back
                        </Button>
                    )}
                    <Button 
                        onClick={handleContinue}
                        size="lg"
                        className="gap-2 rounded-full px-8 text-lg"
                        data-testid="welcome-continue-btn"
                    >
                        {step === 1 ? 'Next: Choose Colors' : 'Start Using OurCircle'}
                        <ArrowRight className="w-5 h-5" />
                    </Button>
                </div>

                {/* Footer Note */}
                <p className="text-center text-sm text-muted-foreground mt-6">
                    You can change these anytime in Settings
                </p>
            </div>
        </div>
    );
}
