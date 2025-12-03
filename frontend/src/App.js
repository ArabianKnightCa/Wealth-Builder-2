import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding';
import PPI from './pages/PPI';
import Dashboard from './pages/Dashboard';
import LPIChapter from './pages/LPIChapter';
import Settings from './pages/Settings';
import Completed from './pages/Completed';
import AdminPanel from './pages/AdminPanel';
import GlobalHUD from './components/GlobalHUD';
import telemetryService from './utils/telemetry';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);
  
  // Track session start/end
  useEffect(() => {
    if (user?.id) {
      // Log session start
      telemetryService.logSessionStart(
        user.id,
        user.user_type || 'free',
        'web',
        '1.0.0'
      );
      
      // Log session end on page unload
      const handleUnload = () => {
        telemetryService.logSessionEnd(
          user.id,
          user.user_type || 'free',
          'web',
          '1.0.0'
        );
      };
      
      window.addEventListener('beforeunload', handleUnload);
      
      return () => {
        window.removeEventListener('beforeunload', handleUnload);
        // Also log session end when user changes
        handleUnload();
      };
    }
  }, [user]);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      localStorage.removeItem('token');
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('token', authToken);
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-navy-900 to-navy-700">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      {user && <GlobalHUD user={user} token={token} onLogout={handleLogout} />}
      <Routes>
        <Route path="/" element={!user ? <Welcome /> : <Navigate to="/dashboard" />} />
        <Route path="/admin" element={<AdminPanel onLogin={handleLogin} />} />
        <Route path="/login" element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/dashboard" />} />
        <Route path="/register" element={!user ? <Register onLogin={handleLogin} /> : <Navigate to="/dashboard" />} />
        <Route path="/onboarding" element={user ? <Onboarding user={user} token={token} /> : <Navigate to="/login" />} />
        <Route path="/ppi" element={user ? <PPI token={token} user={user} /> : <Navigate to="/login" />} />
        <Route path="/dashboard" element={user ? <Dashboard user={user} token={token} onLogout={handleLogout} /> : <Navigate to="/login" />} />
        <Route path="/chapter/:chapterId" element={user ? <LPIChapter token={token} user={user} /> : <Navigate to="/login" />} />
        <Route path="/settings" element={user ? <Settings user={user} token={token} /> : <Navigate to="/login" />} />
        <Route path="/completed" element={user ? <Completed token={token} onLogout={handleLogout} /> : <Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;