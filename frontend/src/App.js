import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { UILayoutProvider, useUILayout } from "./context/UILayoutContext";
import PinEntry from "./pages/PinEntry";
import WelcomePage from "./pages/WelcomePage";
import SettingsPage from "./pages/SettingsPage";
import FamilyDetail from "./pages/FamilyDetail";
import ChildDossier from "./pages/ChildDossier";
import SharedProfile from "./pages/SharedProfile";

// Layout-specific Dashboards
import WarmScrapbookDashboard from "./layouts/WarmScrapbook/Dashboard";
import CleanClinicalDashboard from "./layouts/CleanClinical/Dashboard";
import TimelineFirstDashboard from "./layouts/TimelineFirst/Dashboard";
import PlayfulPopDashboard from "./layouts/PlayfulPop/Dashboard";
import DarkDetectiveDashboard from "./layouts/DarkDetective/Dashboard";
import FamilyTreeDashboard from "./layouts/FamilyTree/Dashboard";
import AlbumGridDashboard from "./layouts/AlbumGrid/Dashboard";
import ModernCardsDashboard from "./layouts/ModernCards/Dashboard";
import MinimalTextDashboard from "./layouts/MinimalText/Dashboard";
import DashboardProDashboard from "./layouts/DashboardPro/Dashboard";
import MapViewDashboard from "./layouts/MapView/Dashboard";
import ChatbookDashboard from "./layouts/Chatbook/Dashboard";
import FlashcardModeDashboard from "./layouts/FlashcardMode/Dashboard";
import BookChaptersDashboard from "./layouts/BookChapters/Dashboard";
import RingSystemDashboard from "./layouts/RingSystem/Dashboard";
import GlassMemoryDashboard from "./layouts/GlassMemory/Dashboard";
import SoftNeumorphDashboard from "./layouts/SoftNeumorph/Dashboard";
import FamilyKanbanDashboard from "./layouts/FamilyKanban/Dashboard";
import StoryboardReelDashboard from "./layouts/StoryboardReel/Dashboard";
import VaultModeDashboard from "./layouts/VaultMode/Dashboard";
import BubbleUniverseDashboard from "./layouts/BubbleUniverse/Dashboard";
import CommandPaletteDashboard from "./layouts/CommandPalette/Dashboard";
import MemoryPostcardsDashboard from "./layouts/MemoryPostcards/Dashboard";
import WhiteboardCanvasDashboard from "./layouts/WhiteboardCanvas/Dashboard";
import FocusTunnelDashboard from "./layouts/FocusTunnel/Dashboard";

const LayoutRouter = () => {
    const { currentLayout } = useUILayout();
    
    switch (currentLayout) {
        case 'clean_clinical':
            return <CleanClinicalDashboard />;
        case 'timeline_first':
            return <TimelineFirstDashboard />;
        case 'playful_pop':
            return <PlayfulPopDashboard />;
        case 'dark_detective':
            return <DarkDetectiveDashboard />;
        case 'family_tree':
            return <FamilyTreeDashboard />;
        case 'album_grid':
            return <AlbumGridDashboard />;
        case 'modern_cards':
            return <ModernCardsDashboard />;
        case 'minimal_text':
            return <MinimalTextDashboard />;
        case 'dashboard_pro':
            return <DashboardProDashboard />;
        case 'map_view':
            return <MapViewDashboard />;
        case 'chatbook':
            return <ChatbookDashboard />;
        case 'flashcard_mode':
            return <FlashcardModeDashboard />;
        case 'book_chapters':
            return <BookChaptersDashboard />;
        case 'ring_system':
            return <RingSystemDashboard />;
        case 'glass_memory':
            return <GlassMemoryDashboard />;
        case 'soft_neumorph':
            return <SoftNeumorphDashboard />;
        case 'family_kanban':
            return <FamilyKanbanDashboard />;
        case 'storyboard_reel':
            return <StoryboardReelDashboard />;
        case 'vault_mode':
            return <VaultModeDashboard />;
        case 'bubble_universe':
            return <BubbleUniverseDashboard />;
        case 'command_palette':
            return <CommandPaletteDashboard />;
        case 'memory_postcards':
            return <MemoryPostcardsDashboard />;
        case 'whiteboard_canvas':
            return <WhiteboardCanvasDashboard />;
        case 'focus_tunnel':
            return <FocusTunnelDashboard />;
        case 'warm_scrapbook':
        default:
            return <WarmScrapbookDashboard />;
    }
};

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading, hasCompletedOnboarding, isNewUser, completeOnboarding } = useAuth();
    
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

    if (isNewUser && !hasCompletedOnboarding) {
        return <WelcomePage onComplete={completeOnboarding} />;
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
                            <LayoutRouter />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/settings" 
                    element={
                        <ProtectedRoute>
                            <SettingsPage />
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
                {/* Public route for shared profiles - no auth required */}
                <Route path="/shared/:shareToken" element={<SharedProfile />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <Toaster position="top-center" richColors />
        </BrowserRouter>
    );
}

function App() {
    return (
        <ThemeProvider>
            <UILayoutProvider>
                <AuthProvider>
                    <AppContent />
                </AuthProvider>
            </UILayoutProvider>
        </ThemeProvider>
    );
}

export default App;
