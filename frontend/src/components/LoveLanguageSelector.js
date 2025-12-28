import React, { useState } from 'react';
import { MessageCircleHeart, Clock, Gift, HandHelping, Heart, ChevronDown, Info } from 'lucide-react';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { LOVE_LANGUAGES } from '../constants/appData';

const iconMap = {
    'words_of_affirmation': MessageCircleHeart,
    'quality_time': Clock,
    'receiving_gifts': Gift,
    'acts_of_service': HandHelping,
    'physical_touch': Heart
};

export const LoveLanguageSelector = ({ 
    primaryValue, 
    secondaryValue, 
    onPrimaryChange, 
    onSecondaryChange 
}) => {
    const [showExplanation, setShowExplanation] = useState(false);

    const getLoveLanguage = (id) => LOVE_LANGUAGES.find(l => l.id === id);

    return (
        <div className="space-y-4">
            {/* Explanation Toggle */}
            <Collapsible open={showExplanation} onOpenChange={setShowExplanation}>
                <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <Info className="w-4 h-4" />
                    <span>What are love languages?</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showExplanation ? 'rotate-180' : ''}`} />
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3">
                    <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                        <p className="text-sm text-muted-foreground">
                            Love languages describe how people prefer to give and receive love. 
                            Understanding a child's love language helps you connect with them in ways that feel most meaningful.
                        </p>
                        <div className="space-y-3">
                            {LOVE_LANGUAGES.map(lang => {
                                const Icon = iconMap[lang.id] || Heart;
                                return (
                                    <div key={lang.id} className="flex gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                            <Icon className="w-4 h-4 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-foreground">{lang.name}</p>
                                            <p className="text-xs text-muted-foreground">{lang.fullDescription}</p>
                                            <p className="text-xs text-muted-foreground/70 mt-1">
                                                <span className="font-medium">Examples:</span> {lang.examples.join(', ')}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </CollapsibleContent>
            </Collapsible>

            {/* Primary Love Language */}
            <div>
                <Label className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-pink-500" />
                    Primary Love Language
                </Label>
                <Select value={primaryValue || ''} onValueChange={onPrimaryChange}>
                    <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Select primary love language" />
                    </SelectTrigger>
                    <SelectContent>
                        {LOVE_LANGUAGES.map(lang => {
                            const Icon = iconMap[lang.id] || Heart;
                            return (
                                <SelectItem key={lang.id} value={lang.id}>
                                    <div className="flex items-center gap-2">
                                        <Icon className="w-4 h-4 text-primary" />
                                        <span>{lang.name}</span>
                                    </div>
                                </SelectItem>
                            );
                        })}
                    </SelectContent>
                </Select>
                {primaryValue && (
                    <p className="text-xs text-muted-foreground mt-1.5 pl-1">
                        {getLoveLanguage(primaryValue)?.shortDescription}
                    </p>
                )}
            </div>

            {/* Secondary Love Language */}
            <div>
                <Label className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-pink-300" />
                    Secondary Love Language
                    <span className="text-xs text-muted-foreground">(optional)</span>
                </Label>
                <Select value={secondaryValue || ''} onValueChange={onSecondaryChange}>
                    <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Select secondary love language" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {LOVE_LANGUAGES.filter(l => l.id !== primaryValue).map(lang => {
                            const Icon = iconMap[lang.id] || Heart;
                            return (
                                <SelectItem key={lang.id} value={lang.id}>
                                    <div className="flex items-center gap-2">
                                        <Icon className="w-4 h-4 text-primary" />
                                        <span>{lang.name}</span>
                                    </div>
                                </SelectItem>
                            );
                        })}
                    </SelectContent>
                </Select>
                {secondaryValue && (
                    <p className="text-xs text-muted-foreground mt-1.5 pl-1">
                        {getLoveLanguage(secondaryValue)?.shortDescription}
                    </p>
                )}
            </div>
        </div>
    );
};

export default LoveLanguageSelector;
