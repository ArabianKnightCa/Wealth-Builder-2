import React from 'react';
import { useTheme, themes } from '../context/ThemeContext';
import { Check } from 'lucide-react';

export const ThemeSelector = () => {
    const { currentTheme, updateTheme } = useTheme();

    return (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {themes.map(theme => {
                const isActive = currentTheme === theme.id;
                return (
                    <button
                        key={theme.id}
                        onClick={() => updateTheme(theme.id)}
                        className={`
                            relative p-3 rounded-xl border-2 transition-all duration-200
                            ${isActive 
                                ? 'border-primary shadow-md scale-105' 
                                : 'border-border hover:border-primary/50 hover:scale-102'
                            }
                            ${theme.dark ? 'bg-gray-800' : 'bg-white'}
                        `}
                        data-testid={`theme-${theme.id}`}
                    >
                        {/* Color Swatch */}
                        <div 
                            className="w-full aspect-square rounded-lg mb-2 shadow-sm"
                            style={{ backgroundColor: theme.color }}
                        />
                        
                        {/* Name */}
                        <p className={`text-xs font-medium truncate ${theme.dark ? 'text-white' : 'text-gray-800'}`}>
                            {theme.name}
                        </p>

                        {/* Check Mark */}
                        {isActive && (
                            <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                <Check className="w-3 h-3 text-primary-foreground" />
                            </div>
                        )}
                    </button>
                );
            })}
        </div>
    );
};

export default ThemeSelector;
