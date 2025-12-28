import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Settings, LogOut, Trash2, Key, Bell, Download, Globe, 
    Palette, ChevronRight, Shield, User, HelpCircle, X,
    Check, AlertTriangle, FileText, QrCode
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { Separator } from '../components/ui/separator';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { useUILayout, uiLayouts, colorThemes } from '../context/UILayoutContext';
import { BIRTHDAY_REMINDER_OPTIONS, APP_LANGUAGES, DATE_FORMATS, EXPORT_FORMATS } from '../constants/appData';
import { QRShareManager } from '../components/QRShareButton';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function SettingsPage() {
    const navigate = useNavigate();
    const { logout, changePin } = useAuth();
    const { currentLayout, currentColorTheme, updateLayout, updateColorTheme } = useUILayout();
    
    const [activeTab, setActiveTab] = useState('appearance');
    const [showChangePinModal, setShowChangePinModal] = useState(false);
    const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    
    // Settings state
    const [settings, setSettings] = useState({
        language: 'en',
        dateFormat: 'MM/DD/YYYY',
        birthdayReminders: [7],
        pushNotifications: true,
        emailNotifications: false,
        autoSave: true,
        reduceMotion: false
    });
    
    // PIN change state
    const [pinData, setPinData] = useState({ oldPin: '', newPin: '', confirmPin: '' });
    const [pinError, setPinError] = useState('');
    
    // Delete confirmation
    const [deleteConfirmText, setDeleteConfirmText] = useState('');

    const handleChangePIN = async () => {
        setPinError('');
        
        if (pinData.newPin.length < 4 || pinData.newPin.length > 6) {
            setPinError('PIN must be 4-6 digits');
            return;
        }
        if (pinData.newPin !== pinData.confirmPin) {
            setPinError('New PINs do not match');
            return;
        }
        
        const result = await changePin(pinData.oldPin, pinData.newPin);
        if (result.success) {
            toast.success('PIN changed successfully');
            setShowChangePinModal(false);
            setPinData({ oldPin: '', newPin: '', confirmPin: '' });
        } else {
            setPinError(result.error);
        }
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirmText !== 'DELETE') {
            toast.error('Please type DELETE to confirm');
            return;
        }
        
        try {
            await axios.delete(`${API}/account`);
            toast.success('Account deleted');
            logout();
            navigate('/pin');
        } catch (err) {
            toast.error('Failed to delete account');
        }
    };

    const handleExportData = async (format) => {
        try {
            const res = await axios.get(`${API}/export/${format}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `ourcircle-export.${format}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success(`Data exported as ${format.toUpperCase()}`);
            setShowExportModal(false);
        } catch (err) {
            toast.error('Export failed');
        }
    };

    const handleLogout = () => {
        logout();
        toast.success('Logged out');
        navigate('/pin');
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-50 glass border-b border-border">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
                            <X className="w-5 h-5" />
                        </Button>
                        <h1 className="text-xl font-bold text-foreground">Settings</h1>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="w-full justify-start mb-6 bg-muted/50 p-1 rounded-xl overflow-x-auto">
                        <TabsTrigger value="appearance" className="rounded-lg gap-2">
                            <Palette className="w-4 h-4" />
                            Appearance
                        </TabsTrigger>
                        <TabsTrigger value="notifications" className="rounded-lg gap-2">
                            <Bell className="w-4 h-4" />
                            Notifications
                        </TabsTrigger>
                        <TabsTrigger value="account" className="rounded-lg gap-2">
                            <User className="w-4 h-4" />
                            Account
                        </TabsTrigger>
                        <TabsTrigger value="data" className="rounded-lg gap-2">
                            <Download className="w-4 h-4" />
                            Data
                        </TabsTrigger>
                    </TabsList>

                    {/* APPEARANCE TAB */}
                    <TabsContent value="appearance" className="space-y-6 animate-fade-in">
                        {/* UI Layout Selection */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">UI Layout</CardTitle>
                                <CardDescription>Choose how your app looks and feels</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {uiLayouts.map(layout => (
                                        <button
                                            key={layout.id}
                                            onClick={() => updateLayout(layout.id)}
                                            className={`
                                                relative p-4 rounded-xl border-2 text-left transition-all
                                                ${currentLayout === layout.id 
                                                    ? 'border-primary bg-primary/5 shadow-md' 
                                                    : 'border-border hover:border-primary/50'
                                                }
                                            `}
                                            data-testid={`layout-${layout.id}`}
                                        >
                                            <h4 className="font-semibold text-foreground mb-1">{layout.name}</h4>
                                            <p className="text-xs text-muted-foreground mb-2">{layout.vibe}</p>
                                            <p className="text-xs text-muted-foreground line-clamp-2">{layout.description}</p>
                                            {currentLayout === layout.id && (
                                                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                                                    <Check className="w-3.5 h-3.5 text-primary-foreground" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Color Theme */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Color Theme</CardTitle>
                                <CardDescription>Set your preferred color palette</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                                    {colorThemes.map(theme => (
                                        <button
                                            key={theme.id}
                                            onClick={() => updateColorTheme(theme.id)}
                                            className={`
                                                relative p-3 rounded-xl border-2 transition-all
                                                ${currentColorTheme === theme.id 
                                                    ? 'border-primary shadow-md scale-105' 
                                                    : 'border-border hover:border-primary/50'
                                                }
                                                ${theme.colors.dark ? 'bg-gray-800' : 'bg-card'}
                                            `}
                                        >
                                            <div 
                                                className="w-full aspect-square rounded-lg mb-2"
                                                style={{ backgroundColor: theme.colors.primary }}
                                            />
                                            <p className={`text-xs font-medium truncate ${theme.colors.dark ? 'text-white' : 'text-foreground'}`}>
                                                {theme.name}
                                            </p>
                                            {currentColorTheme === theme.id && (
                                                <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                                    <Check className="w-3 h-3 text-primary-foreground" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Accessibility */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Accessibility</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-foreground">Reduce Motion</p>
                                        <p className="text-sm text-muted-foreground">Minimize animations</p>
                                    </div>
                                    <Switch 
                                        checked={settings.reduceMotion}
                                        onCheckedChange={v => setSettings(s => ({ ...s, reduceMotion: v }))}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Language & Region */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Language & Region</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <Label>App Language</Label>
                                        <Select value={settings.language} onValueChange={v => setSettings(s => ({ ...s, language: v }))}>
                                            <SelectTrigger className="mt-1.5">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {APP_LANGUAGES.map(lang => (
                                                    <SelectItem key={lang.code} value={lang.code}>{lang.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label>Date Format</Label>
                                        <Select value={settings.dateFormat} onValueChange={v => setSettings(s => ({ ...s, dateFormat: v }))}>
                                            <SelectTrigger className="mt-1.5">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {DATE_FORMATS.map(fmt => (
                                                    <SelectItem key={fmt.value} value={fmt.value}>{fmt.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* NOTIFICATIONS TAB */}
                    <TabsContent value="notifications" className="space-y-6 animate-fade-in">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Birthday Reminders</CardTitle>
                                <CardDescription>Get notified before upcoming birthdays</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {BIRTHDAY_REMINDER_OPTIONS.map(opt => (
                                        <button
                                            key={opt.value}
                                            onClick={() => {
                                                setSettings(s => ({
                                                    ...s,
                                                    birthdayReminders: s.birthdayReminders.includes(opt.value)
                                                        ? s.birthdayReminders.filter(v => v !== opt.value)
                                                        : [...s.birthdayReminders, opt.value]
                                                }));
                                            }}
                                            className={`
                                                px-3 py-2 rounded-lg border text-sm transition-all
                                                ${settings.birthdayReminders.includes(opt.value)
                                                    ? 'border-primary bg-primary/10 text-primary'
                                                    : 'border-border text-muted-foreground hover:border-primary/50'
                                                }
                                            `}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Example: "Sophia turns 8 in 7 days — last noted favorite: art supplies"
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Notification Channels</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-foreground">Push Notifications</p>
                                        <p className="text-sm text-muted-foreground">Receive alerts on your device</p>
                                    </div>
                                    <Switch 
                                        checked={settings.pushNotifications}
                                        onCheckedChange={v => setSettings(s => ({ ...s, pushNotifications: v }))}
                                    />
                                </div>
                                <Separator />
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-foreground">Email Notifications</p>
                                        <p className="text-sm text-muted-foreground">Get reminders via email</p>
                                    </div>
                                    <Switch 
                                        checked={settings.emailNotifications}
                                        onCheckedChange={v => setSettings(s => ({ ...s, emailNotifications: v }))}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ACCOUNT TAB */}
                    <TabsContent value="account" className="space-y-6 animate-fade-in">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Security</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <Button 
                                    variant="outline" 
                                    className="w-full justify-between"
                                    onClick={() => setShowChangePinModal(true)}
                                >
                                    <span className="flex items-center gap-2">
                                        <Key className="w-4 h-4" />
                                        Change PIN
                                    </span>
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Share & Connect</CardTitle>
                                <CardDescription>Share profiles with other OurCircle users via QR codes</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <QRShareManager />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Session</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Button 
                                    variant="outline" 
                                    className="w-full justify-start gap-2"
                                    onClick={handleLogout}
                                    data-testid="logout-settings-btn"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Log Out
                                </Button>
                            </CardContent>
                        </Card>

                        <Card className="border-destructive/50">
                            <CardHeader>
                                <CardTitle className="text-lg text-destructive">Danger Zone</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Button 
                                    variant="destructive" 
                                    className="w-full justify-start gap-2"
                                    onClick={() => setShowDeleteAccountDialog(true)}
                                    data-testid="delete-account-btn"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete Account & All Data
                                </Button>
                                <p className="text-xs text-muted-foreground mt-2">
                                    This will permanently delete all families, children, and memories. This cannot be undone.
                                </p>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* DATA TAB */}
                    <TabsContent value="data" className="space-y-6 animate-fade-in">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Export Data</CardTitle>
                                <CardDescription>Download a copy of all your data</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button 
                                    variant="outline" 
                                    className="w-full justify-start gap-2"
                                    onClick={() => setShowExportModal(true)}
                                >
                                    <Download className="w-4 h-4" />
                                    Export All Data
                                </Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Editing</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-foreground">Auto-save</p>
                                        <p className="text-sm text-muted-foreground">Automatically save changes as you type</p>
                                    </div>
                                    <Switch 
                                        checked={settings.autoSave}
                                        onCheckedChange={v => setSettings(s => ({ ...s, autoSave: v }))}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </main>

            {/* Change PIN Modal */}
            <Dialog open={showChangePinModal} onOpenChange={setShowChangePinModal}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Change PIN</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Current PIN</Label>
                            <Input
                                type="password"
                                inputMode="numeric"
                                maxLength={6}
                                value={pinData.oldPin}
                                onChange={e => setPinData(p => ({ ...p, oldPin: e.target.value }))}
                                className="mt-1.5 font-mono"
                            />
                        </div>
                        <div>
                            <Label>New PIN (4-6 digits)</Label>
                            <Input
                                type="password"
                                inputMode="numeric"
                                maxLength={6}
                                value={pinData.newPin}
                                onChange={e => setPinData(p => ({ ...p, newPin: e.target.value }))}
                                className="mt-1.5 font-mono"
                            />
                        </div>
                        <div>
                            <Label>Confirm New PIN</Label>
                            <Input
                                type="password"
                                inputMode="numeric"
                                maxLength={6}
                                value={pinData.confirmPin}
                                onChange={e => setPinData(p => ({ ...p, confirmPin: e.target.value }))}
                                className="mt-1.5 font-mono"
                            />
                        </div>
                        {pinError && <p className="text-sm text-destructive">{pinError}</p>}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowChangePinModal(false)}>Cancel</Button>
                        <Button onClick={handleChangePIN}>Change PIN</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Account Dialog */}
            <AlertDialog open={showDeleteAccountDialog} onOpenChange={setShowDeleteAccountDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-destructive" />
                            Delete Account?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-3">
                            <p>This will permanently delete:</p>
                            <ul className="list-disc list-inside text-sm space-y-1">
                                <li>All families and children</li>
                                <li>All dossier information</li>
                                <li>All timeline memories</li>
                                <li>All photos and notes</li>
                            </ul>
                            <p className="font-medium">This action cannot be undone.</p>
                            <div className="pt-2">
                                <Label>Type DELETE to confirm</Label>
                                <Input
                                    value={deleteConfirmText}
                                    onChange={e => setDeleteConfirmText(e.target.value)}
                                    placeholder="DELETE"
                                    className="mt-1.5"
                                />
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeleteConfirmText('')}>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleDeleteAccount}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={deleteConfirmText !== 'DELETE'}
                        >
                            Delete Everything
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Export Modal */}
            <Dialog open={showExportModal} onOpenChange={setShowExportModal}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Export Your Data</DialogTitle>
                        <DialogDescription>Choose a format to download</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        {EXPORT_FORMATS.map(fmt => (
                            <Button
                                key={fmt.value}
                                variant="outline"
                                className="w-full justify-start gap-3"
                                onClick={() => handleExportData(fmt.value)}
                            >
                                <FileText className="w-4 h-4" />
                                {fmt.label}
                            </Button>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
