import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Onboarding from './pages/Onboarding';
import PPI from './pages/PPI';
import Dashboard from './pages/Dashboard';
import LPIChapter from './pages/LPIChapter';
import Settings from './pages/Settings';
import Completed from './pages/Completed';
import AdminPanel from './pages/AdminPanel';
import FormsManager from './pages/FormsManager';
import ProfileSelector from './pages/ProfileSelector';
import AddProfile from './pages/AddProfile';
import FeedbackViewer from './pages/FeedbackViewer';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import AETestHarness from './pages/AETestHarness';
import LocationSelectorDemo from './pages/LocationSelectorDemo';
import GlobalHUD from './components/GlobalHUD';
import telemetryService from './utils/telemetry';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [showProfileSelector, setShowProfileSelector] = useState(false);

  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);
  
  // Handle session end telemetry
  const handleUnload = () => {
    if (user?.id) {
      telemetryService.logSessionEnd(
        user.id,
        user.user_type || 'free',
        'web',
        '1.0.0'
      );
    }
  };

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
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
    
    // End session telemetry
    handleUnload();
  };

  const handlePPIComplete = (updatedUserData) => {
    // Update user state with new data after PPI completion
    if (updatedUserData) {
      const mergedUser = { ...user, ...updatedUserData };
      setUser(mergedUser);
      localStorage.setItem('user', JSON.stringify(mergedUser));
    }
  };

  const handleProfileSelected = (profile) => {
    setCurrentProfile(profile);
    localStorage.setItem('currentProfile', JSON.stringify(profile));
    setShowProfileSelector(false);
  };

  const handleProfileSwitch = () => {
    setShowProfileSelector(true);
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
        <Route path="/forms" element={user ? <FormsManager /> : <Navigate to="/login" />} />
        <Route path="/profiles" element={user ? <ProfileSelector token={token} onProfileSelected={handleProfileSelected} onLogout={handleLogout} /> : <Navigate to="/login" />} />
        <Route path="/profiles/add" element={user ? <AddProfile token={token} /> : <Navigate to="/login" />} />
        <Route path="/feedback" element={user ? <FeedbackViewer token={token} /> : <Navigate to="/login" />} />
        <Route path="/analytics" element={user ? <AnalyticsDashboard token={token} /> : <Navigate to="/login" />} />
        <Route path="/ae-test-harness" element={user ? <AETestHarness token={token} /> : <Navigate to="/login" />} />
        <Route path="/login" element={!user ? <Login onLogin={handleLogin} /> : (user.ppi_completed ? <Navigate to="/dashboard" /> : <Navigate to="/ppi" />)} />
        <Route path="/register" element={!user ? <Register onLogin={handleLogin} /> : (user.ppi_completed ? <Navigate to="/dashboard" /> : <Navigate to="/ppi" />)} />
        <Route path="/forgot-password" element={!user ? <ForgotPassword /> : (user.ppi_completed ? <Navigate to="/dashboard" /> : <Navigate to="/ppi" />)} />
        <Route path="/reset-password" element={!user ? <ResetPassword /> : (user.ppi_completed ? <Navigate to="/dashboard" /> : <Navigate to="/ppi" />)} />
        <Route path="/onboarding" element={user ? <Onboarding user={user} token={token} /> : <Navigate to="/login" />} />
        <Route path="/ppi" element={user ? <PPI token={token} user={user} onPPIComplete={handlePPIComplete} /> : <Navigate to="/login" />} />
        <Route path="/dashboard" element={user ? <Dashboard user={user} token={token} onLogout={handleLogout} /> : <Navigate to="/login" />} />
        <Route path="/chapter/:chapterId" element={user ? <LPIChapter token={token} user={user} /> : <Navigate to="/login" />} />
        <Route path="/settings" element={user ? <Settings user={user} token={token} /> : <Navigate to="/login" />} />
        <Route path="/completed" element={user ? <Completed token={token} onLogout={handleLogout} /> : <Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;