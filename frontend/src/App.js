import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import PinEntry from "./pages/PinEntry";
import Dashboard from "./pages/Dashboard";
import FamilyDetail from "./pages/FamilyDetail";
import ChildDossier from "./pages/ChildDossier";

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();
    
    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }
    
    if (!isAuthenticated) {
        return <Navigate to="/pin" replace />;
    }
    
    return children;
};

const PinRoute = () => {
    const { isAuthenticated, loading } = useAuth();
    
    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }
    
    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }
    
    return <PinEntry />;
};

function AppContent() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/pin" element={<PinRoute />} />
                <Route 
                    path="/" 
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/family/:familyId" 
                    element={
                        <ProtectedRoute>
                            <FamilyDetail />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/child/:childId" 
                    element={
                        <ProtectedRoute>
                            <ChildDossier />
                        </ProtectedRoute>
                    } 
                />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <Toaster position="top-center" richColors />
        </BrowserRouter>
    );
}

function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;
