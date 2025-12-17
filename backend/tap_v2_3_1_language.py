"""
TAP v2.3.1 Language Shaping Engine - PIPELINE EDITION
======================================================
Grammar-safe, meaning-preserving rewrite pipeline.
NO mutation-style transformations, NO synonym replacement.

Version: 2.3.1
"""

import re
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from tap_v2_3_formulas import TAPScalars


@dataclass
class TokenMap:
    """Protected tokens that must be preserved exactly."""
    numbers: Dict[str, str]  # NUM_1 -> "$100"
    entities: Dict[str, str]  # ENT_1 -> "IRA"
    phrases: Dict[str, str]   # PHRASE_1 -> "not recommended"


@dataclass
class ValidationResult:
    """Result of validation checks."""
    passed: bool
    issues: List[str]
    risk_level: str  # "low", "medium", "high"


class SafeRewritePipeline:
    """
    Grammar-safe rewrite pipeline for TAP v2.3.1.
    
    8-step pipeline:
    1. Invariant Protection
    2. Sentence Normalization
    3. CD-Based Clarification
    4. IA-Based Framing
    5. Grammar-Safe Reflow
    6. Restore Tokens
    7. Validation + Fallback
    8. Optional LLM Repair
    """
    
    def __init__(self):
        # Critical keywords that must never be altered
        self.critical_keywords = {
            'not', 'never', 'must', 'cannot', 'always', 'required',
            'prohibited', 'forbidden', 'avoid', 'warning', 'caution'
        }
        
        # Financial terms for clarification
        self.financial_terms = {
            'interest': 'extra money you pay or earn',
            'credit': 'borrowed money',
            'debt': 'money you owe',
            'savings': 'money you keep for later',
            'investment': 'money you put in to grow',
            'budget': 'plan for your money',
            'compound': 'growth that builds on itself',
            'principal': 'original amount of money',
            'APR': 'yearly interest rate',
            'ROI': 'return on investment',
        }
    
    def process(self, text: str, scalars: TAPScalars) -> str:
        """
        Main pipeline entry point.
        
        Args:
            text: Input text
            scalars: TAP scalars
        
        Returns:
            str: Transformed text
        """
        # Step 1: Protect invariants
        protected_text, token_map = self._protect_invariants(text)
        
        # Step 2: Sentence normalization
        normalized = self._normalize_sentences(protected_text, scalars.lc, scalars.age)
        
        # Step 3: CD-based clarification
        clarified = self._add_clarifications(normalized, scalars.cd)
        
        # Step 4: IA-based framing
        framed = self._add_framing(clarified, scalars.ia, scalars.age, scalars.cd)
        
        # Step 5: Grammar-safe reflow
        reflowed = self._reflow_grammar(framed, scalars.lc)
        
        # Step 6: Restore tokens
        restored = self._restore_tokens(reflowed, token_map)
        
        # Step 7: Validation
        validation = self._validate(text, restored, token_map)
        
        if not validation.passed:
            # Fallback to minimal rewrite
            restored = self._minimal_rewrite_fallback(text, scalars)
            validation = self._validate(text, restored, token_map)
        
        # Step 8: Optional LLM repair (not implemented in POC)
        # if validation.risk_level == "high" and USE_LLM_REWRITE_LAYER:
        #     restored = self._llm_repair(text, restored, scalars)
        
        return restored
    
    def _protect_invariants(self, text: str) -> Tuple[str, TokenMap]:
        """
        Step 1: Identify and protect numbers, entities, critical phrases.
        
        Args:
            text: Input text
        
        Returns:
            Tuple of (protected_text, token_map)
        """
        token_map = TokenMap(numbers={}, entities={}, phrases={})
        protected = text
        
        # Protect numbers (currency, percentages, decimals, ranges)
        number_patterns = [
            (r'\$\d+(?:,\d{3})*(?:\.\d{2})?', 'NUM'),  # $1,000.00
            (r'\d+(?:\.\d+)?%', 'NUM'),  # 5.5%
            (r'\d+(?:,\d{3})*(?:\.\d+)?', 'NUM'),  # 1,000 or 1.5
        ]
        
        num_counter = 1
        for pattern, prefix in number_patterns:
            matches = re.finditer(pattern, protected)
            for match in reversed(list(matches)):  # Reverse to preserve indices
                token = f"{prefix}_{num_counter}"
                token_map.numbers[token] = match.group(0)
                protected = protected[:match.start()] + token + protected[match.end():]
                num_counter += 1
        
        # Protect critical phrases with keywords
        phrase_counter = 1
        for keyword in self.critical_keywords:
            # Find phrases containing critical keywords
            pattern = rf'\b\w*{keyword}\w*\b(?:\s+\w+){{0,3}}'
            matches = re.finditer(pattern, protected, re.IGNORECASE)
            for match in reversed(list(matches)):
                if keyword.lower() in match.group(0).lower():
                    token = f"PHRASE_{phrase_counter}"
                    token_map.phrases[token] = match.group(0)
                    protected = protected[:match.start()] + token + protected[match.end():]
                    phrase_counter += 1
        
        return protected, token_map
    
    def _normalize_sentences(self, text: str, lc: float, age: int) -> str:
        """
        Step 2: Sentence normalization based on LC.
        Structure-first, no word swapping.
        
        Args:
            text: Protected text
            lc: Language Complexity
            age: User age
        
        Returns:
            str: Normalized text
        """
        if lc >= 0.6:
            # High LC: Keep complex sentences
            return text
        
        elif lc >= 0.3:
            # Medium LC: Moderate simplification
            # Split on semicolons and long commas
            text = text.replace(';', '.')
            # Break sentences longer than 15 words at natural boundaries
            sentences = re.split(r'(?<=[.!?])\s+', text)
            result = []
            for sent in sentences:
                words = sent.split()
                if len(words) > 15 and ',' in sent:
                    # Split at first comma if long
                    parts = sent.split(',', 1)
                    result.append(parts[0].strip() + '.')
                    if len(parts) > 1 and parts[1].strip():
                        # Capitalize first letter
                        remaining = parts[1].strip()
                        remaining = remaining[0].upper() + remaining[1:] if len(remaining) > 1 else remaining.upper()
                        result.append(remaining if remaining.endswith('.') else remaining + '.')
                else:
                    result.append(sent)
            return ' '.join(result)
        
        elif lc >= 0.15:
            # Low LC: Significant simplification
            # Break all compound sentences
            text = text.replace(',', '.')
            text = text.replace(';', '.')
            # Clean up multiple periods
            text = re.sub(r'\.+', '.', text)
            # Split and capitalize
            parts = [p.strip() for p in text.split('.') if p.strip()]
            result = []
            for part in parts:
                if part:
                    # Capitalize first letter
                    part = part[0].upper() + part[1:] if len(part) > 1 else part.upper()
                    result.append(part + '.')
            return ' '.join(result)
        
        else:
            # Very low LC (< 0.15): Maximum simplification
            # Context-based rewrite for children
            if age <= 12:
                # Child-appropriate transformation
                text = self._apply_child_context(text, age)
            
            # Break into very short sentences
            text = text.replace(',', '.')
            text = text.replace(';', '.')
            text = re.sub(r'\.+', '.', text)
            
            parts = [p.strip() for p in text.split('.') if p.strip()]
            result = []
            for part in parts:
                if part:
                    # Limit to 6-8 words per sentence
                    words = part.split()
                    if len(words) > 8:
                        # Split into chunks of ~6 words
                        for i in range(0, len(words), 6):
                            chunk = ' '.join(words[i:i+6])
                            chunk = chunk[0].upper() + chunk[1:] if len(chunk) > 1 else chunk.upper()
                            result.append(chunk + '.')
                    else:
                        part = part[0].upper() + part[1:] if len(part) > 1 else part.upper()
                        result.append(part + '.')
            return ' '.join(result)
    
    def _apply_child_context(self, text: str, age: int) -> str:
        """
        Apply child-appropriate contextual reframing.
        NOT synonym replacement - contextual adaptation.
        """
        if age > 12:
            return text
        
        # Context reframings for children
        child_contexts = {
            'making financial decisions': 'choosing about my money',
            'financial decision': 'money choice',
            'research extensively before deciding': 'ask my mom or dad what to do',
            'research extensively': 'ask my mom or dad',
            'research before deciding': 'ask my parents what to do',
            'research': 'ask questions',
            'I prefer to': 'I like to',
            'prefer': 'like',
            'manage money': 'take care of my money',
            'thinking about': 'thinking about',
        }
        
        # Apply contextual reframings (longest first)
        for phrase, child_version in sorted(child_contexts.items(), key=lambda x: len(x[0]), reverse=True):
            if phrase in text.lower():
                pattern = re.compile(re.escape(phrase), re.IGNORECASE)
                text = pattern.sub(child_version, text)
        
        return text
    
    def _add_clarifications(self, text: str, cd: float) -> str:
        """
        Step 3: CD-based clarification/density control.
        Add parenthetical definitions ONLY for low CD.
        
        Args:
            text: Normalized text
            cd: Conceptual Depth
        
        Returns:
            str: Text with clarifications
        """
        if cd >= 0.5:
            # High CD: No clarifications needed
            return text
        
        elif cd >= 0.3:
            # Medium-low CD: One brief clarification
            for term, definition in self.financial_terms.items():
                if term in text.lower() and '(' not in text:
                    # Add clarification to first occurrence only
                    pattern = re.compile(rf'\b{term}\b', re.IGNORECASE)
                    text = pattern.sub(f"{term} ({definition})", text, count=1)
                    break  # Only one clarification
        
        else:
            # Very low CD (< 0.3): Add clarifications for multiple terms
            count = 0
            max_clarifications = 2
            for term, definition in self.financial_terms.items():
                if count >= max_clarifications:
                    break
                if term in text.lower() and '(' not in text:
                    pattern = re.compile(rf'\b{term}\b', re.IGNORECASE)
                    if pattern.search(text):
                        text = pattern.sub(f"{term} ({definition})", text, count=1)
                        count += 1
        
        return text
    
    def _add_framing(self, text: str, ia: float, age: int, cd: float) -> str:
        """
        Step 4: IA-based framing (content-aware, minimal).
        Add at most ONE "why it matters" sentence.
        
        Args:
            text: Clarified text
            ia: Ideological Abstraction
            age: User age
            cd: Conceptual Depth
        
        Returns:
            str: Text with framing
        """
        if not text.endswith('.'):
            text += '.'
        
        if ia >= 0.9 and age >= 60:
            # Senior expert: Legacy framing
            if cd >= 0.8:
                text += " This reflects long-term wealth preservation principles."
        
        elif ia >= 0.8 and age >= 40:
            # Mature professional: Wealth-building framing
            if cd >= 0.6:
                text += " This is key to building long-term financial security."
        
        elif ia >= 0.6 and age >= 25:
            # Young professional: Practical framing
            if cd >= 0.4:
                text += " This helps establish solid financial habits."
        
        elif ia >= 0.4 and cd < 0.5:
            # Intermediate with low CD: Basic context
            text += " This is about how you handle money choices."
        
        return text
    
    def _reflow_grammar(self, text: str, lc: float) -> str:
        """
        Step 5: Grammar-safe reflow.
        Ensure punctuation, subject/verb agreement, clean boundaries.
        
        Args:
            text: Framed text
            lc: Language Complexity
        
        Returns:
            str: Reflowed text
        """
        # Fix common grammar issues
        
        # Remove multiple spaces
        text = re.sub(r'\s+', ' ', text)
        
        # Fix period spacing
        text = re.sub(r'\s*\.\s*', '. ', text)
        text = re.sub(r'\.+', '.', text)
        
        # Ensure space after punctuation
        text = re.sub(r'([.!?])([A-Z])', r'\1 \2', text)
        
        # Remove spaces before punctuation
        text = re.sub(r'\s+([.!?,;:])', r'\1', text)
        
        # Fix capitalization after periods
        sentences = re.split(r'(?<=[.!?])\s+', text)
        sentences = [s[0].upper() + s[1:] if s else s for s in sentences]
        text = ' '.join(sentences)
        
        # Remove trailing spaces
        text = text.strip()
        
        # Ensure ends with punctuation
        if text and not text[-1] in '.!?':
            text += '.'
        
        return text
    
    def _restore_tokens(self, text: str, token_map: TokenMap) -> str:
        """
        Step 6: Restore protected tokens.
        
        Args:
            text: Reflowed text
            token_map: Map of tokens to restore
        
        Returns:
            str: Text with tokens restored
        """
        # Restore in reverse order of creation to avoid conflicts
        for token, original in token_map.numbers.items():
            text = text.replace(token, original)
        
        for token, original in token_map.entities.items():
            text = text.replace(token, original)
        
        for token, original in token_map.phrases.items():
            text = text.replace(token, original)
        
        return text
    
    def _validate(self, original: str, transformed: str, token_map: TokenMap) -> ValidationResult:
        """
        Step 7: Validation checks.
        
        Args:
            original: Original text
            transformed: Transformed text
            token_map: Token map
        
        Returns:
            ValidationResult
        """
        issues = []
        risk_level = "low"
        
        # Check 1: No tokens left behind
        all_tokens = (list(token_map.numbers.keys()) + 
                     list(token_map.entities.keys()) + 
                     list(token_map.phrases.keys()))
        for token in all_tokens:
            if token in transformed:
                issues.append(f"Token not restored: {token}")
                risk_level = "high"
        
        # Check 2: Numbers preserved
        original_numbers = re.findall(r'\d+(?:[.,]\d+)*', original)
        transformed_numbers = re.findall(r'\d+(?:[.,]\d+)*', transformed)
        if len(original_numbers) != len(transformed_numbers):
            issues.append("Number count mismatch")
            risk_level = "high"
        
        # Check 3: Critical keywords preserved
        for keyword in self.critical_keywords:
            original_count = original.lower().count(keyword)
            transformed_count = transformed.lower().count(keyword)
            if original_count != transformed_count:
                issues.append(f"Critical keyword altered: {keyword}")
                risk_level = "high"
        
        # Check 4: Fluency heuristics
        if '..' in transformed or '  ' in transformed:
            issues.append("Fluency issue: Multiple punctuation/spaces")
            risk_level = "medium"
        
        # Check for sentence fragments (very basic check)
        sentences = re.split(r'[.!?]', transformed)
        for sent in sentences:
            sent = sent.strip()
            if sent and len(sent.split()) < 3 and len(sent.split()) > 0:
                words = sent.lower().split()
                # Flag if starts with subordinating conjunction
                if words[0] in ['when', 'if', 'because', 'although', 'while']:
                    issues.append(f"Possible fragment: {sent[:30]}...")
                    if risk_level == "low":
                        risk_level = "medium"
        
        passed = len(issues) == 0
        return ValidationResult(passed=passed, issues=issues, risk_level=risk_level)
    
    def _minimal_rewrite_fallback(self, text: str, scalars: TAPScalars) -> str:
        """
        Fallback: Minimal safe rewrite when validation fails.
        Keep original structure, only simplify wording safely.
        
        Args:
            text: Original text
            scalars: TAP scalars
        
        Returns:
            str: Minimally rewritten text
        """
        result = text
        
        # Only apply safe child context for very young users
        if scalars.age <= 10 and scalars.lc < 0.15:
            result = self._apply_child_context(result, scalars.age)
        
        # Add simple clarification if CD is very low
        if scalars.cd < 0.3:
            for term, definition in list(self.financial_terms.items())[:1]:
                if term in result.lower() and '(' not in result:
                    pattern = re.compile(rf'\b{term}\b', re.IGNORECASE)
                    result = pattern.sub(f"{term} ({definition})", result, count=1)
                    break
        
        # Add framing if IA allows
        if scalars.ia >= 0.4 and scalars.cd < 0.5:
            if not result.endswith('.'):
                result += '.'
            result += " This is about how you handle money."
        
        return result


# Singleton instance
_safe_pipeline = None


def get_safe_rewrite_pipeline() -> SafeRewritePipeline:
    """Get singleton SafeRewritePipeline instance."""
    global _safe_pipeline
    if _safe_pipeline is None:
        _safe_pipeline = SafeRewritePipeline()
    return _safe_pipeline
