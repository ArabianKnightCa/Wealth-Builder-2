import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, Lock, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export default function PinEntry() {
    const { pinExists, setupPin, verifyPin } = useAuth();
    const [pin, setPin] = useState(['', '', '', '', '', '']);
    const [confirmPin, setConfirmPin] = useState(['', '', '', '', '', '']);
    const [isConfirming, setIsConfirming] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const inputRefs = useRef([]);
    const confirmRefs = useRef([]);

    const isSetupMode = !pinExists;

    useEffect(() => {
        inputRefs.current[0]?.focus();
    }, []);

    const handleChange = (index, value, isConfirm = false) => {
        if (!/^\d*$/.test(value)) return;
        
        const newPin = isConfirm ? [...confirmPin] : [...pin];
        newPin[index] = value.slice(-1);
        
        if (isConfirm) {
            setConfirmPin(newPin);
        } else {
            setPin(newPin);
        }
        setError('');

        // Auto-focus next input
        if (value && index < 5) {
            const refs = isConfirm ? confirmRefs : inputRefs;
            refs.current[index + 1]?.focus();
        }

        // Auto-submit when all digits entered
        const fullPin = newPin.join('');
        if (fullPin.length === 6) {
            if (isSetupMode && !isConfirm) {
                setIsConfirming(true);
                setTimeout(() => confirmRefs.current[0]?.focus(), 100);
            } else if (isSetupMode && isConfirm) {
                handleSetup(pin.join(''), fullPin);
            } else {
                handleVerify(fullPin);
            }
        }
    };

    const handleKeyDown = (index, e, isConfirm = false) => {
        if (e.key === 'Backspace') {
            const currentPin = isConfirm ? confirmPin : pin;
            if (!currentPin[index] && index > 0) {
                const refs = isConfirm ? confirmRefs : inputRefs;
                refs.current[index - 1]?.focus();
            }
        }
    };

    const handleSetup = async (firstPin, secondPin) => {
        if (firstPin !== secondPin) {
            setError('PINs do not match. Please try again.');
            setPin(['', '', '', '', '', '']);
            setConfirmPin(['', '', '', '', '', '']);
            setIsConfirming(false);
            setTimeout(() => inputRefs.current[0]?.focus(), 100);
            return;
        }

        setIsLoading(true);
        const result = await setupPin(firstPin);
        setIsLoading(false);

        if (!result.success) {
            setError(result.error);
            setPin(['', '', '', '', '', '']);
            setConfirmPin(['', '', '', '', '', '']);
            setIsConfirming(false);
        } else {
            toast.success('PIN created successfully!');
        }
    };

    const handleVerify = async (pinValue) => {
        setIsLoading(true);
        const result = await verifyPin(pinValue);
        setIsLoading(false);

        if (!result.success) {
            setError('Invalid PIN. Please try again.');
            setPin(['', '', '', '', '', '']);
            setTimeout(() => inputRefs.current[0]?.focus(), 100);
        }
    };

    const renderPinInputs = (values, refs, isConfirm = false) => (
        <div className="flex gap-3 justify-center">
            {values.map((digit, index) => (
                <input
                    key={index}
                    ref={el => refs.current[index] = el}
                    type="password"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleChange(index, e.target.value, isConfirm)}
                    onKeyDown={e => handleKeyDown(index, e, isConfirm)}
                    className="pin-input"
                    disabled={isLoading}
                    data-testid={`pin-input-${isConfirm ? 'confirm-' : ''}${index}`}
                />
            ))}
        </div>
    );

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 noise-overlay relative">
            <div className="w-full max-w-md animate-slide-up">
                {/* Logo & Brand */}
                <div className="text-center mb-12">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <Users className="w-10 h-10 text-primary" />
                    </div>
                    <h1 className="text-4xl font-bold text-foreground mb-2">OurCircle</h1>
                    <p className="text-muted-foreground">Keep your family memories safe</p>
                </div>

                {/* PIN Card */}
                <div className="bg-card rounded-2xl p-8 shadow-lg border border-border">
                    <div className="flex items-center justify-center gap-2 mb-6">
                        {isSetupMode ? (
                            <ShieldCheck className="w-5 h-5 text-primary" />
                        ) : (
                            <Lock className="w-5 h-5 text-primary" />
                        )}
                        <h2 className="text-xl font-semibold text-foreground">
                            {isSetupMode 
                                ? (isConfirming ? 'Confirm Your PIN' : 'Create Your PIN')
                                : 'Enter Your PIN'
                            }
                        </h2>
                    </div>

                    <p className="text-sm text-muted-foreground text-center mb-8">
                        {isSetupMode
                            ? (isConfirming 
                                ? 'Enter your PIN again to confirm'
                                : 'Create a 6-digit PIN to protect your family data')
                            : 'Enter your 6-digit PIN to access your families'
                        }
                    </p>

                    {isConfirming ? (
                        renderPinInputs(confirmPin, confirmRefs, true)
                    ) : (
                        renderPinInputs(pin, inputRefs)
                    )}

                    {error && (
                        <p className="mt-4 text-sm text-destructive text-center animate-fade-in" data-testid="pin-error">
                            {error}
                        </p>
                    )}

                    {isLoading && (
                        <div className="mt-6 flex justify-center">
                            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}
                </div>

                {/* Footer */}
                <p className="text-xs text-muted-foreground text-center mt-8">
                    Your data is stored locally and protected by your PIN
                </p>
            </div>
        </div>
    );
}
