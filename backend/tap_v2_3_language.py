"""
TAP v2.3 Language Shaping Engine
=================================
Structural transformations based on Language Complexity (LC).
NO synonym replacement, NO word-by-word substitution.

Version: 2.3
"""

import re
from typing import List, Dict
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
        # Life-stage appropriate reframings (NOT synonyms - contextual adaptations)
        self.age_based_contexts = {
            # Financial decision contexts
            "making financial decisions": {
                "child": "choosing about my money",
                "teen": "making money choices", 
                "adult": "making financial decisions"
            },
            "financial decision": {
                "child": "money choice",
                "teen": "money decision",
                "adult": "financial decision"
            },
            # Research/planning contexts
            "research extensively": {
                "child": "ask my mom or dad",
                "teen": "look things up and think about it",
                "adult": "research thoroughly"
            },
            "research": {
                "child": "ask questions about",
                "teen": "look up information about",
                "adult": "research"
            },
            # Preference contexts
            "I prefer to": {
                "child": "I like to",
                "teen": "I prefer to",
                "adult": "I prefer to"
            },
            "prefer": {
                "child": "like",
                "teen": "prefer",
                "adult": "prefer"
            }
        }
    
    def _get_life_stage(self, age: int) -> str:
        """Determine life stage for contextual framing."""
        if age <= 12:
            return "child"
        elif age <= 17:
            return "teen"
        else:
            return "adult"
    
    def shape_text(self, text: str, scalars: TAPScalars) -> str:
        """
        Apply language shaping based on LC and CD scalars.
        
        Args:
            text: Input text to shape
            scalars: User's TAP scalars
        
        Returns:
            str: Shaped text
        """
        lc = scalars.lc
        cd = scalars.cd
        age = scalars.age
        
        # Apply age-appropriate contextual framing first
        text = self._apply_age_context(text, age, lc)
        
        # Apply structural transformations based on LC
        text = self._adjust_sentence_length(text, lc, age)
        
        # Apply complexity adjustments (considers both LC and CD)
        text = self._adjust_complexity(text, lc, age)
        
        # For low CD (< 0.5), add clarifications regardless of LC
        if cd < 0.5:
            text = self._add_beginner_clarifications(text, cd)
        
        return text
    
    def _apply_age_context(self, text: str, age: int, lc: float) -> str:
        """
        Apply age-appropriate contextual framing.
        NOT synonym replacement - this is life-stage context adaptation.
        """
        life_stage = self._get_life_stage(age)
        
        # Only apply contextual shifts for child/teen
        if life_stage == "adult":
            return text
        
        # Apply contextual reframings (longest phrases first to avoid partial matches)
        for phrase in sorted(self.age_based_contexts.keys(), key=len, reverse=True):
            if phrase in text.lower():
                context_map = self.age_based_contexts[phrase]
                if life_stage in context_map:
                    # Case-insensitive replacement
                    pattern = re.compile(re.escape(phrase), re.IGNORECASE)
                    text = pattern.sub(context_map[life_stage], text)
        
        return text
    
    def _adjust_sentence_length(self, text: str, lc: float, age: int) -> str:
        """
        Adjust sentence length and structure based on LC and age.
        
        Rules:
        - LC < 0.15 (very young): 4-6 word sentences, very simple
        - LC < 0.3: Break into 6-10 word sentences
        - LC < 0.6: Allow 10-15 word sentences
        - LC >= 0.6: Allow 15-25 word sentences
        
        Args:
            text: Input text
            lc: Language Complexity scalar
            age: User age
        
        Returns:
            str: Text with adjusted sentence length
        """
        # Split into sentences
        sentences = re.split(r'(?<=[.!?])\s+', text.strip())
        
        if lc >= 0.6:
            # High LC: Allow complex sentences as-is
            return text
        
        elif lc >= 0.3:
            # Medium LC: Keep moderate sentences but simplify structure
            result = []
            for sentence in sentences:
                # Remove parenthetical phrases for medium LC
                sentence = re.sub(r'\s*\([^)]*\)', '', sentence)
                result.append(sentence)
            return ' '.join(result)
        
        elif lc >= 0.15:
            # Low LC: Break long sentences, simplify
            result = []
            for sentence in sentences:
                # Remove commas and parentheses
                sentence = re.sub(r'\s*\([^)]*\)', '', sentence)
                # Replace commas with periods to break up clauses
                parts = sentence.split(',')
                for part in parts:
                    part = part.strip()
                    if part:
                        if not part.endswith('.'):
                            part += '.'
                        result.append(part)
            return ' '.join(result)
        
        else:
            # Very low LC (< 0.15): Very simple, short sentences
            # Split by commas first to break clauses
            text = text.replace(',', '.')
            # Remove multiple periods
            text = re.sub(r'\.+', '.', text)
            # Remove period-space-period patterns
            text = re.sub(r'\.\s+\.', '.', text)
            # Split into sentences
            parts = [p.strip() for p in text.split('.') if p.strip()]
            # Add period to each part and capitalize first letter
            result = []
            for part in parts:
                if part:
                    # Capitalize first letter
                    part = part[0].upper() + part[1:] if len(part) > 1 else part.upper()
                    if not part.endswith('.'):
                        part += '.'
                    result.append(part)
            return ' '.join(result)
    
    def _adjust_complexity(self, text: str, lc: float, age: int) -> str:
        """
        Adjust overall complexity - vocabulary, structure, terminology.
        
        Args:
            text: Input text
            lc: Language Complexity scalar
            age: User age
        
        Returns:
            str: Text with adjusted complexity
        """
        if lc < 0.15:
            # Very simple - child under 8
            # Replace complex words with simple ones
            replacements = {
                "extensively": "a lot",
                "decisions": "choices",
                "before deciding": "first",
                "thoroughly": "carefully",
                "comprehensive": "complete",
                "utilize": "use",
                "facilitate": "help",
            }
            for old, new in replacements.items():
                text = re.sub(rf'\b{old}\b', new, text, flags=re.IGNORECASE)
        
        return text
    
    def _add_beginner_clarifications(self, text: str, cd: float) -> str:
        """
        Add clarifications for users with low Conceptual Depth.
        This applies to adults with low financial experience.
        
        Args:
            text: Input text
            cd: Conceptual Depth scalar
        
        Returns:
            str: Text with clarifications
        """
        if cd < 0.3:
            # Very low CD: Add basic explanations
            clarifications = {
                "financial": "money-related",
                "decisions": "choices",
                "research": "learn about",
                "extensively": "carefully",
            }
            for term, clarification in clarifications.items():
                if term in text.lower() and '(' not in text:
                    text = re.sub(
                        rf'\b{term}\b',
                        f"{term} ({clarification})",
                        text,
                        count=1,
                        flags=re.IGNORECASE
                    )
        elif cd < 0.5:
            # Medium-low CD: Add brief context at the end
            if "financial decisions" in text.lower() and "money choices" not in text.lower():
                # Add period if missing
                if not text.endswith('.'):
                    text += '.'
                text += " This is about how you handle money choices."
        
        return text
    
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
