import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const themes = [
    { id: 'theme_1_classic_warmth', name: 'Classic Warmth', color: '#D97757' },
    { id: 'theme_2_ocean_breeze', name: 'Ocean Breeze', color: '#4A90E2' },
    { id: 'theme_3_forest_walk', name: 'Forest Walk', color: '#2F855A' },
    { id: 'theme_4_lavender_dream', name: 'Lavender Dream', color: '#805AD5' },
    { id: 'theme_5_sunny_day', name: 'Sunny Day', color: '#D69E2E' },
    { id: 'theme_6_midnight_story', name: 'Midnight Story', color: '#F6AD55', dark: true },
    { id: 'theme_7_cherry_blossom', name: 'Cherry Blossom', color: '#ED64A6' },
    { id: 'theme_8_slate_stone', name: 'Slate & Stone', color: '#4A5568' },
    { id: 'theme_9_earth_clay', name: 'Earth & Clay', color: '#9C4221' },
    { id: 'theme_10_playful_pop', name: 'Playful Pop', color: '#E53E3E' },
];

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [currentTheme, setCurrentTheme] = useState('theme_1_classic_warmth');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTheme();
    }, []);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', currentTheme);
    }, [currentTheme]);

    const fetchTheme = async () => {
        try {
            const res = await axios.get(`${API}/settings/theme`);
            setCurrentTheme(res.data.theme || 'theme_1_classic_warmth');
        } catch (err) {
            console.log('No theme set, using default');
        } finally {
            setLoading(false);
        }
    };

    const updateTheme = async (themeId) => {
        setCurrentTheme(themeId);
        try {
            await axios.post(`${API}/settings/theme`, { theme: themeId });
        } catch (err) {
            console.error('Failed to save theme:', err);
        }
    };

    const getThemeInfo = () => {
        return themes.find(t => t.id === currentTheme) || themes[0];
    };

    return (
        <ThemeContext.Provider value={{ 
            currentTheme, 
            updateTheme, 
            themes, 
            loading,
            getThemeInfo 
        }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
