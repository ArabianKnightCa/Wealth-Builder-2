import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Storage keys
const STORAGE_KEYS = {
    AUTHENTICATED: 'ourcircle_authenticated',
    NEW_USER: 'ourcircle_new_user',
    AUTH_TIMESTAMP: 'ourcircle_auth_timestamp'
};

// Helper to safely read from localStorage
const getStoredAuth = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.AUTHENTICATED);
        const timestamp = localStorage.getItem(STORAGE_KEYS.AUTH_TIMESTAMP);
        
        // Check if auth is valid and not expired (24 hours max session)
        if (stored === 'true' && timestamp) {
            const authTime = parseInt(timestamp, 10);
            const now = Date.now();
            const maxAge = 24 * 60 * 60 * 1000; // 24 hours
            
            if (now - authTime < maxAge) {
                return true;
            }
            // Session expired, clear storage
            localStorage.removeItem(STORAGE_KEYS.AUTHENTICATED);
            localStorage.removeItem(STORAGE_KEYS.AUTH_TIMESTAMP);
        }
        return false;
    } catch (e) {
        console.error('Error reading auth state:', e);
        return false;
    }
};

const getStoredNewUser = () => {
    try {
        return localStorage.getItem(STORAGE_KEYS.NEW_USER) === 'true';
    } catch (e) {
        return false;
    }
};

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    // Initialize state from localStorage with validation
    const [isAuthenticated, setIsAuthenticated] = useState(getStoredAuth);
    const [pinExists, setPinExists] = useState(null);
    const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
    const [isNewUser, setIsNewUser] = useState(getStoredNewUser);
    const [loading, setLoading] = useState(true);
    const [initComplete, setInitComplete] = useState(false);

    // Sync auth state to localStorage whenever it changes
    useEffect(() => {
        try {
            if (isAuthenticated) {
                localStorage.setItem(STORAGE_KEYS.AUTHENTICATED, 'true');
                // Only set timestamp if it doesn't exist (preserve original login time)
                if (!localStorage.getItem(STORAGE_KEYS.AUTH_TIMESTAMP)) {
                    localStorage.setItem(STORAGE_KEYS.AUTH_TIMESTAMP, Date.now().toString());
                }
            } else {
                localStorage.removeItem(STORAGE_KEYS.AUTHENTICATED);
                localStorage.removeItem(STORAGE_KEYS.AUTH_TIMESTAMP);
            }
        } catch (e) {
            console.error('Error persisting auth state:', e);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEYS.NEW_USER, isNewUser.toString());
        } catch (e) {
            console.error('Error persisting new user state:', e);
        }
    }, [isNewUser]);

    const checkPinStatus = useCallback(async () => {
        try {
            const res = await axios.get(`${API}/auth/check`);
            setPinExists(res.data.pin_exists);
            return res.data.pin_exists;
        } catch (err) {
            console.error('Failed to check PIN status:', err);
            setPinExists(false);
            return false;
        }
    }, []);

    const checkOnboardingStatus = useCallback(async () => {
        try {
            const res = await axios.get(`${API}/settings/onboarding`);
            setHasCompletedOnboarding(res.data.completed);
            return res.data.completed;
        } catch (err) {
            setHasCompletedOnboarding(false);
            return false;
        }
    }, []);

    // Initialize on mount - check all statuses
    useEffect(() => {
        const init = async () => {
            setLoading(true);
            try {
                // Run checks in parallel
                await Promise.all([
                    checkPinStatus(),
                    checkOnboardingStatus()
                ]);
            } catch (err) {
                console.error('Init error:', err);
            } finally {
                setLoading(false);
                setInitComplete(true);
            }
        };
        init();
    }, [checkPinStatus, checkOnboardingStatus]);

    const completeOnboarding = async () => {
        try {
            await axios.post(`${API}/settings/onboarding`, { completed: true });
            setHasCompletedOnboarding(true);
            setIsNewUser(false);
        } catch (err) {
            console.error('Failed to save onboarding status:', err);
        }
    };

    const setupPin = async (pin) => {
        try {
            await axios.post(`${API}/auth/setup`, { pin });
            setPinExists(true);
            setIsAuthenticated(true);
            setIsNewUser(true); // Mark as new user to show welcome page
            return { success: true };
        } catch (err) {
            return { success: false, error: err.response?.data?.detail || 'Failed to set up PIN' };
        }
    };

    const verifyPin = async (pin) => {
        try {
            await axios.post(`${API}/auth/verify`, { pin });
            setIsAuthenticated(true);
            return { success: true };
        } catch (err) {
            return { success: false, error: err.response?.data?.detail || 'Invalid PIN' };
        }
    };

    const changePin = async (oldPin, newPin) => {
        try {
            await axios.post(`${API}/auth/change-pin`, { old_pin: oldPin, new_pin: newPin });
            return { success: true };
        } catch (err) {
            return { success: false, error: err.response?.data?.detail || 'Failed to change PIN' };
        }
    };

    const logout = () => {
        setIsAuthenticated(false);
        setIsNewUser(false);
        sessionStorage.removeItem('ourcircle_authenticated');
        sessionStorage.removeItem('ourcircle_new_user');
    };

    return (
        <AuthContext.Provider value={{
            isAuthenticated,
            pinExists,
            loading,
            hasCompletedOnboarding,
            isNewUser,
            setupPin,
            verifyPin,
            changePin,
            logout,
            completeOnboarding
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
