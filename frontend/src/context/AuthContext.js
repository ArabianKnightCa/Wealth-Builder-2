import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [pinExists, setPinExists] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkPinStatus();
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

    const setupPin = async (pin) => {
        try {
            await axios.post(`${API}/auth/setup`, { pin });
            setPinExists(true);
            setIsAuthenticated(true);
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
    };

    return (
        <AuthContext.Provider value={{
            isAuthenticated,
            pinExists,
            loading,
            setupPin,
            verifyPin,
            changePin,
            logout
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
