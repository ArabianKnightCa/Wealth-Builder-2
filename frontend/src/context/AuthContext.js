import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [pinExists, setPinExists] = useState(null);
    const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
    const [isNewUser, setIsNewUser] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkPinStatus();
        checkOnboardingStatus();
    }, []);

    const checkPinStatus = async () => {
        try {
            const res = await axios.get(`${API}/auth/check`);
            setPinExists(res.data.pin_exists);
        } catch (err) {
            console.error('Failed to check PIN status:', err);
            setPinExists(false);
        } finally {
            setLoading(false);
        }
    };

    const checkOnboardingStatus = async () => {
        try {
            const res = await axios.get(`${API}/settings/onboarding`);
            setHasCompletedOnboarding(res.data.completed);
        } catch (err) {
            setHasCompletedOnboarding(false);
        }
    };

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
