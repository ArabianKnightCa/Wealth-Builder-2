import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const uiLayouts = [
    { 
        id: 'warm_scrapbook', 
        name: 'Warm Scrapbook', 
        description: 'Cozy, memory-book feel with photo tiles and rounded corners',
        vibe: 'Photo-first, cozy, nostalgic'
    },
    { 
        id: 'clean_clinical', 
        name: 'Clean Clinical', 
        description: 'Ultra organized with left-side navigation and tabbed dossiers',
        vibe: 'Organized, zero fluff, efficient'
    },
    { 
        id: 'timeline_first', 
        name: 'Timeline First', 
        description: 'Life-story tracker where everything flows through a timeline',
        vibe: 'Story-focused, chronological, growth-tracking'
    },
    { 
        id: 'playful_pop', 
        name: 'Playful Pop', 
        description: 'Fun, kid-energy with icon categories and bright accents',
        vibe: 'Energetic, fun, family-friendly',
        comingSoon: true
    },
    { 
        id: 'dark_detective', 
        name: 'Dark Mode Detective', 
        description: 'Top secret dossier vibe with dark theme and timeline feed',
        vibe: 'Mysterious, high-contrast, secure',
        comingSoon: true
    },
    { 
        id: 'family_tree', 
        name: 'Family Tree Hybrid', 
        description: 'Modern genealogy meets real-life notes with tree view',
        vibe: 'Connected, visual hierarchy, elegant',
        comingSoon: true
    },
    { 
        id: 'album_grid', 
        name: 'Album Grid', 
        description: 'Photo-first, memory-heavy, scrapbook-but-modern',
        vibe: 'Visual, nostalgic, warm',
        comingSoon: true
    },
    { 
        id: 'modern_cards', 
        name: 'Modern Cards', 
        description: 'App-store slick, fast, clean, highly touch-friendly',
        vibe: 'Speedy, modern, intuitive',
        comingSoon: true
    },
    { 
        id: 'minimal_text', 
        name: 'Minimal Text', 
        description: 'Notes-first, ultra-readable, low visual noise',
        vibe: 'Calm, readable, focused',
        comingSoon: true
    },
    { 
        id: 'dashboard_pro', 
        name: 'Dashboard Pro', 
        description: 'Command center for big families and power users',
        vibe: 'Powerful, data-rich, efficient',
        comingSoon: true
    }
];

export const colorThemes = [
    { id: 'warm_cream', name: 'Warm Cream', colors: { primary: '#8B7355', background: '#FDF8F3', accent: '#6B8E6B' } },
    { id: 'ocean_calm', name: 'Ocean Calm', colors: { primary: '#4A90A4', background: '#F5F9FA', accent: '#2F855A' } },
    { id: 'lavender_mist', name: 'Lavender Mist', colors: { primary: '#7C6FA0', background: '#FAF8FF', accent: '#9F7AEA' } },
    { id: 'forest_earth', name: 'Forest Earth', colors: { primary: '#5D7A5D', background: '#F5F7F5', accent: '#8B7355' } },
    { id: 'sunset_glow', name: 'Sunset Glow', colors: { primary: '#D97757', background: '#FFFAF5', accent: '#E2B659' } },
    { id: 'midnight_ink', name: 'Midnight Ink', colors: { primary: '#F6AD55', background: '#1A202C', accent: '#4299E1', dark: true } },
];

const UILayoutContext = createContext();

export const UILayoutProvider = ({ children }) => {
    const [currentLayout, setCurrentLayout] = useState('warm_scrapbook');
    const [currentColorTheme, setCurrentColorTheme] = useState('warm_cream');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSettings();
    }, []);

    useEffect(() => {
        document.documentElement.setAttribute('data-layout', currentLayout);
        document.documentElement.setAttribute('data-color-theme', currentColorTheme);
    }, [currentLayout, currentColorTheme]);

    const fetchSettings = async () => {
        try {
            const res = await axios.get(`${API}/settings/ui`);
            if (res.data.layout) setCurrentLayout(res.data.layout);
            if (res.data.colorTheme) setCurrentColorTheme(res.data.colorTheme);
        } catch (err) {
            console.log('Using default UI settings');
        } finally {
            setLoading(false);
        }
    };

    const updateLayout = async (layoutId) => {
        setCurrentLayout(layoutId);
        try {
            await axios.post(`${API}/settings/ui`, { layout: layoutId, colorTheme: currentColorTheme });
        } catch (err) {
            console.error('Failed to save layout:', err);
        }
    };

    const updateColorTheme = async (themeId) => {
        setCurrentColorTheme(themeId);
        try {
            await axios.post(`${API}/settings/ui`, { layout: currentLayout, colorTheme: themeId });
        } catch (err) {
            console.error('Failed to save color theme:', err);
        }
    };

    const getLayoutInfo = () => uiLayouts.find(l => l.id === currentLayout) || uiLayouts[0];
    const getColorThemeInfo = () => colorThemes.find(t => t.id === currentColorTheme) || colorThemes[0];

    return (
        <UILayoutContext.Provider value={{ 
            currentLayout, 
            currentColorTheme,
            updateLayout, 
            updateColorTheme,
            uiLayouts, 
            colorThemes,
            loading,
            getLayoutInfo,
            getColorThemeInfo
        }}>
            {children}
        </UILayoutContext.Provider>
    );
};

export const useUILayout = () => {
    const context = useContext(UILayoutContext);
    if (!context) {
        throw new Error('useUILayout must be used within a UILayoutProvider');
    }
    return context;
};
