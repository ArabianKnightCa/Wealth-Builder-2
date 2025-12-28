import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, Copy, Check, Share2, Clock, Eye, Trash2, X, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export function QRShareButton({ entityType, entityId, entityName, variant = "outline", className = "" }) {
    const [showModal, setShowModal] = useState(false);
    const [shareData, setShareData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [expiryDays, setExpiryDays] = useState("7");

    const createShareLink = async () => {
        setLoading(true);
        try {
            const res = await axios.post(`${API}/share/create`, {
                entity_type: entityType,
                entity_id: entityId,
                expires_days: parseInt(expiryDays)
            });
            setShareData(res.data);
            toast.success('Share link created!');
        } catch (err) {
            toast.error('Failed to create share link');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCopyLink = () => {
        const shareUrl = `${window.location.origin}/shared/${shareData.share_token}`;
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        toast.success('Link copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
    };

    const handleNativeShare = async () => {
        const shareUrl = `${window.location.origin}/shared/${shareData.share_token}`;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `OurCircle - ${entityName}`,
                    text: `Check out ${entityName}'s profile on OurCircle`,
                    url: shareUrl
                });
            } catch (err) {
                if (err.name !== 'AbortError') {
                    toast.error('Share failed');
                }
            }
        } else {
            handleCopyLink();
        }
    };

    const handleOpenModal = () => {
        setShowModal(true);
        setShareData(null);
    };

    return (
        <>
            <Button 
                variant={variant} 
                className={`gap-2 ${className}`}
                onClick={handleOpenModal}
            >
                <QrCode className="w-4 h-4" />
                Share QR Code
            </Button>

            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <QrCode className="w-5 h-5 text-primary" />
                            Share Profile
                        </DialogTitle>
                        <DialogDescription>
                            Create a QR code to share {entityName}'s profile with other OurCircle users
                        </DialogDescription>
                    </DialogHeader>

                    {!shareData ? (
                        <div className="space-y-4 py-4">
                            <div>
                                <Label>Link Expiration</Label>
                                <Select value={expiryDays} onValueChange={setExpiryDays}>
                                    <SelectTrigger className="mt-1.5">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">1 day</SelectItem>
                                        <SelectItem value="7">7 days</SelectItem>
                                        <SelectItem value="30">30 days</SelectItem>
                                        <SelectItem value="90">90 days</SelectItem>
                                        <SelectItem value="0">Never (not recommended)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="bg-muted/50 rounded-lg p-3">
                                <p className="text-sm text-muted-foreground">
                                    <strong>Note:</strong> Anyone with this QR code or link can view {entityName}'s profile information. The link will expire after {expiryDays === "0" ? "never" : `${expiryDays} days`}.
                                </p>
                            </div>

                            <Button 
                                onClick={createShareLink} 
                                disabled={loading}
                                className="w-full"
                            >
                                {loading ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <QrCode className="w-4 h-4 mr-2" />
                                        Generate QR Code
                                    </>
                                )}
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4 py-4">
                            {/* QR Code Display */}
                            <div className="flex justify-center">
                                <div className="bg-white p-4 rounded-xl shadow-inner">
                                    <QRCodeSVG 
                                        value={`${window.location.origin}/shared/${shareData.share_token}`}
                                        size={200}
                                        level="L"
                                        includeMargin={false}
                                    />
                                </div>
                            </div>

                            {/* Share URL */}
                            <div className="bg-muted rounded-lg p-3">
                                <p className="text-xs text-muted-foreground mb-1">Share Link</p>
                                <code className="text-sm break-all text-foreground">
                                    {`${window.location.origin}/shared/${shareData.share_token}`}
                                </code>
                            </div>

                            {/* Expiry info */}
                            {shareData.expires_at && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Clock className="w-4 h-4" />
                                    Expires: {new Date(shareData.expires_at).toLocaleDateString()}
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="grid grid-cols-2 gap-2">
                                <Button variant="outline" onClick={handleCopyLink}>
                                    {copied ? (
                                        <Check className="w-4 h-4 mr-2 text-green-500" />
                                    ) : (
                                        <Copy className="w-4 h-4 mr-2" />
                                    )}
                                    {copied ? 'Copied!' : 'Copy Link'}
                                </Button>
                                <Button onClick={handleNativeShare}>
                                    <Share2 className="w-4 h-4 mr-2" />
                                    Share
                                </Button>
                            </div>

                            <Button 
                                variant="ghost" 
                                className="w-full text-muted-foreground"
                                onClick={() => setShareData(null)}
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Create New Link
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

export function QRShareManager() {
    const [shares, setShares] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchShares();
    }, []);

    const fetchShares = async () => {
        try {
            const res = await axios.get(`${API}/my-shares`);
            setShares(res.data.shares || []);
        } catch (err) {
            console.error('Failed to fetch shares:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRevokeShare = async (shareId) => {
        try {
            await axios.delete(`${API}/share/${shareId}`);
            setShares(shares.filter(s => s.id !== shareId));
            toast.success('Share link revoked');
        } catch (err) {
            toast.error('Failed to revoke share');
        }
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                    Loading shares...
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <QrCode className="w-5 h-5" />
                    Active Share Links
                </CardTitle>
                <CardDescription>
                    Manage your shared profile QR codes
                </CardDescription>
            </CardHeader>
            <CardContent>
                {shares.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                        <QrCode className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>No active share links</p>
                        <p className="text-sm">Create a QR code from any family or child profile</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {shares.map((share) => (
                            <div 
                                key={share.id}
                                className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-primary/10">
                                        <QrCode className="w-4 h-4 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-foreground">
                                            {share.entity_name}
                                        </p>
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                            <span className="capitalize">{share.entity_type}</span>
                                            <span className="flex items-center gap-1">
                                                <Eye className="w-3 h-3" />
                                                {share.views} views
                                            </span>
                                            {share.expires_at && (
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    Expires {new Date(share.expires_at).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRevokeShare(share.id)}
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export default QRShareButton;
