"""
TAP v2.3 Language Shaping Engine
=================================
Structural transformations based on Language Complexity (LC).
NO synonym replacement, NO word-by-word substitution.

Version: 2.3
"""

import re
from typing import List
from tap_v2_3_formulas import TAPScalars


class LanguageShaper:
    """
    Language shaping based on LC (Language Complexity).
    
    Operates at structural level:
    - Sentence length adjustment
    - Clause density adjustment
    - Definition expansion/compression
    - Example count adjustment
    """
    
    def __init__(self):
        pass
    
    def shape_text(self, text: str, scalars: TAPScalars) -> str:
        """
        Apply language shaping based on LC scalar.
        
        Args:
            text: Input text to shape
            scalars: User's TAP scalars
        
        Returns:
            str: Shaped text
        """
        lc = scalars.lc
        
        # Apply structural transformations
        text = self._adjust_sentence_length(text, lc)
        text = self._adjust_definitions(text, lc, scalars)
        
        return text
    
    def _adjust_sentence_length(self, text: str, lc: float) -> str:
        """
        Adjust sentence length based on LC.
        
        Rules:
        - LC < 0.3: Break into 6-10 word sentences
        - LC < 0.6: Allow 10-15 word sentences
        - LC >= 0.6: Allow 15-25 word sentences
        
        Args:
            text: Input text
            lc: Language Complexity scalar
        
        Returns:
            str: Text with adjusted sentence length
        """
        # Split into sentences
        sentences = re.split(r'(?<=[.!?])\s+', text.strip())
        
        if lc >= 0.6:
            # High LC: Allow complex sentences as-is
            return text
        
        elif lc >= 0.3:
            # Medium LC: Keep moderate sentences
            return text
        
        else:
            # Low LC: Break long sentences
            result = []
            for sentence in sentences:
                words = sentence.split()
                if len(words) > 12:
                    # Break at conjunctions
                    mid = len(words) // 2
                    # Try to find a good break point
                    for i in range(mid - 2, mid + 3):
                        if i < len(words) and words[i].lower() in ['and', 'but', 'or', 'so']:
                            first = ' '.join(words[:i])
                            second = ' '.join(words[i+1:])
                            if first and not first.endswith('.'):
                                first += '.'
                            result.append(first)
                            if second:
                                result.append(second)
                            break
                    else:
                        # No good break point, just split in half
                        first = ' '.join(words[:mid])
                        second = ' '.join(words[mid:])
                        if first and not first.endswith('.'):
                            first += '.'
                        result.append(first)
                        if second:
                            result.append(second)
                else:
                    result.append(sentence)
            
            return ' '.join(result)
    
    def _adjust_definitions(self, text: str, lc: float, scalars: TAPScalars) -> str:
        """
        Add or remove definitions based on LC.
        
        Rules:
        - LC < 0.3: Add inline clarifiers and analogies
        - LC < 0.6: Add brief contextual definitions
        - LC >= 0.6: Assume familiarity
        
        Args:
            text: Input text
            lc: Language Complexity scalar
            scalars: User scalars
        
        Returns:
            str: Text with adjusted definitions
        """
        if lc >= 0.6:
            # High LC: No additional definitions
            return text
        
        elif lc >= 0.3:
            # Medium LC: Brief contextual definitions
            # Add definitions for key financial terms if not present
            replacements = {
                'credit card': 'credit card (a card that lets you borrow money)',
                'interest': 'interest (extra money charged for borrowing)',
                'credit score': 'credit score (your financial reputation number)',
            }
            
            for term, replacement in replacements.items():
                # Only replace if term exists and definition not already present
                if term in text.lower() and '(' not in text:
                    text = re.sub(
                        rf'\b{term}\b',
                        replacement,
                        text,
                        count=1,
                        flags=re.IGNORECASE
                    )
            
            return text
        
        else:
            # Low LC: Add inline clarifiers and analogies
            replacements = {
                'borrowing money': 'borrowing money (getting money to use now)',
                'credit card': 'credit card (a special card for buying things)',
                'interest': 'extra money',
                'balance': 'what you owe',
            }
            
            for term, replacement in replacements.items():
                text = re.sub(
                    rf'\b{term}\b',
                    replacement,
                    text,
                    flags=re.IGNORECASE
                )
            
            return text
    
    def add_examples(self, text: str, lc: float, count: int = 1) -> str:
        """
        Add examples based on LC.
        
        Rules:
        - LC < 0.3: Add 2-3 examples
        - LC < 0.6: Add 1-2 examples
        - LC >= 0.6: Minimal examples
        
        Args:
            text: Input text
            lc: Language Complexity scalar
            count: Number of examples to add
        
        Returns:
            str: Text with examples
        """
        if lc >= 0.6:
            # High LC: No additional examples
            return text
        
        elif lc >= 0.3:
            # Medium LC: One example
            example = " For example, if you use a credit card for groceries, you need to pay that back later."
            return text + example
        
        else:
            # Low LC: Multiple examples
            example = " It's like when you borrow a toy from a friend - you need to give it back."
            return text + example


# Singleton instance
_language_shaper = None


def get_language_shaper() -> LanguageShaper:
    """Get singleton LanguageShaper instance."""
    global _language_shaper
    if _language_shaper is None:
        _language_shaper = LanguageShaper()
    return _language_shaper
