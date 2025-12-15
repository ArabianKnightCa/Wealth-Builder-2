"""
AE v3.55-RE + TAP 2.0 Enhanced
===============================
Multi-NLP Stack:
- spaCy: POS tagging, semantic similarity
- NLTK/WordNet: Synonym database
- Gensim: Word embeddings (optional)
- sentence-transformers: Semantic sentence understanding
- textdescriptives: Readability metrics (Flesch-Kincaid, etc.)
"""

from dataclasses import dataclass, field
from typing import Dict, Any, List, Optional, Tuple
import datetime
import spacy
from nltk.corpus import wordnet
from nltk.tokenize import word_tokenize
import nltk
from sentence_transformers import SentenceTransformer
import textdescriptives as td

# Import from config
from config import MINIMUM_USER_AGE, CHILD_AGE_MAX, TEEN_AGE_MAX

# Load NLP models (singleton pattern)
_nlp = None
_sentence_model = None
_td_model = None

def get_nlp():
    global _nlp
    if _nlp is None:
        _nlp = spacy.load('en_core_web_sm')
    return _nlp

def get_sentence_model():
    global _sentence_model
    if _sentence_model is None:
        _sentence_model = SentenceTransformer('all-MiniLM-L6-v2')  # Fast, lightweight model
    return _sentence_model

def get_td_model():
    global _td_model
    if _td_model is None:
        _td_model = td.load_spacy_model()
    return _td_model

ADAPTIVE_ENGINE_VERSION = "3.55-RE"
TAP_VERSION = "2.0"

MIN_EXP_LEVEL = 1
MAX_EXP_LEVEL = 5


@dataclass
class UserProfile:
    user_id: str
    age: int
    experience_level: int
    dna_profile: str
    dna_weights: Dict[str, float] = field(default_factory=dict)
    goals: List[str] = field(default_factory=list)
    culture_code: Optional[str] = None
    religion_code: Optional[str] = None


@dataclass
class LessonContext:
    chapter_id: str
    lesson_id: str
    attempt_number: int = 1
    last_score: Optional[float] = None
    rolling_mastery: Optional[float] = None
    fatigue_score: Optional[float] = None


def _clamp(val: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, val))


def compute_age_band(age: int) -> str:
    if age <= CHILD_AGE_MAX:
        return "child"
    elif age <= TEEN_AGE_MAX:
        return "teen"
    return "adult"


def compute_experience_band(exp_level: int) -> str:
    lvl = _clamp(exp_level, MIN_EXP_LEVEL, MAX_EXP_LEVEL)
    if lvl <= 2:
        return "beginner"
    if lvl == 3:
        return "intermediate"
    return "advanced"


def compute_dvcl_factor(age: int, exp_level: int) -> float:
    age_norm = _clamp((age - MINIMUM_USER_AGE) / 30.0, 0.0, 1.0)
    age_component = 0.3 + 0.9 * age_norm
    exp_norm = (exp_level - MIN_EXP_LEVEL) / (MAX_EXP_LEVEL - MIN_EXP_LEVEL) if MAX_EXP_LEVEL > MIN_EXP_LEVEL else 0.0
    exp_component = 0.3 * exp_norm
    dvcl = age_component + exp_component
    return _clamp(dvcl, 0.3, 1.4)


class TAPEngine:
    def __init__(self):
        self.personality_adaptations = {
            "Planner": {
                "tone": "structured",
                "tagline": "Having a clear system gives you confidence and control.",
            },
            "Spontaneous": {
                "tone": "flexible",
                "tagline": "This keeps your options open for opportunities ahead.",
            },
            "Cautious": {
                "tone": "reassuring",
                "tagline": "This builds your safety net and peace of mind.",
            },
            "Builder": {
                "tone": "achievement-focused",
                "tagline": "Each step forward is real progress toward your goals.",
            },
            "Balanced": {
                "tone": "practical",
                "tagline": "This keeps things realistic and moving forward.",
            },
        }
        
        # Core financial vocabulary (minimal, focused)
        self.core_financial_terms = {
            "financial": {"child": "money", "teen": "money", "adult": "financial"},
            "finances": {"child": "money", "teen": "money", "adult": "finances"},
            "investment": {"child": "saving", "teen": "investing", "adult": "investment"},
            "debt": {"child": "owe", "teen": "debt", "adult": "debt"},
        }
    
    def _count_syllables(self, word: str) -> int:
        """Count syllables in a word using vowel counting."""
        word = word.lower().strip()
        vowels = "aeiouy"
        syllable_count = 0
        previous_was_vowel = False
        
        for char in word:
            is_vowel = char in vowels
            if is_vowel and not previous_was_vowel:
                syllable_count += 1
            previous_was_vowel = is_vowel
        
        if word.endswith('e'):
            syllable_count -= 1
        
        return max(1, syllable_count)
    
    def _calculate_word_complexity(self, word: str) -> float:
        """
        Calculate word complexity score (0.0 = simple, 1.0 = complex)
        Based on: syllables, word length, frequency
        """
        syllables = self._count_syllables(word)
        length = len(word)
        
        # Formula: weighted combination
        syllable_score = min(syllables / 4.0, 1.0)  # 4+ syllables = max complexity
        length_score = min(length / 12.0, 1.0)      # 12+ chars = max complexity
        
        complexity = (syllable_score * 0.6) + (length_score * 0.4)
        return min(complexity, 1.0)
    
    def _calculate_text_readability(self, text: str) -> Dict[str, float]:
        """
        Use textdescriptives to calculate readability metrics.
        Returns: {
            'flesch_reading_ease': 0-100 (higher = easier),
            'flesch_kincaid_grade': grade level,
            'smog': grade level
        }
        """
        try:
            nlp = get_td_model()
            doc = nlp(text)
            metrics = td.extract_metrics(doc, metrics=['readability'])
            return {
                'flesch_reading_ease': metrics.get('flesch_reading_ease', 50),
                'flesch_kincaid_grade': metrics.get('flesch_kincaid_grade', 10),
                'smog': metrics.get('smog', 10)
            }
        except Exception:
            # Fallback to defaults
            return {'flesch_reading_ease': 50, 'flesch_kincaid_grade': 10, 'smog': 10}
    
    def _get_semantic_similarity(self, text1: str, text2: str) -> float:
        """
        Use sentence-transformers to compute semantic similarity between texts.
        Returns: 0.0 (different) to 1.0 (identical meaning)
        """
        try:
            model = get_sentence_model()
            embeddings = model.encode([text1, text2])
            # Cosine similarity
            from scipy.spatial.distance import cosine
            similarity = 1 - cosine(embeddings[0], embeddings[1])
            return max(0.0, min(1.0, similarity))
        except Exception:
            # Fallback: basic word overlap
            words1 = set(text1.lower().split())
            words2 = set(text2.lower().split())
            overlap = len(words1 & words2) / max(len(words1 | words2), 1)
            return overlap
    
    def _find_simpler_word(self, word: str, target_complexity: float, pos_tag: Optional[str] = None) -> str:
        """
        Multi-NLP approach: Uses spaCy + NLTK (WordNet) + Gensim to find simpler synonyms.
        Returns simpler word or original if none found.
        """
        current_complexity = self._calculate_word_complexity(word)
        
        # If word is already simple enough, return it
        if current_complexity <= target_complexity:
            return word
        
        # Check core financial terms first (highest priority)
        word_lower = word.lower()
        if word_lower in self.core_financial_terms:
            age_band = "child" if target_complexity < 0.4 else ("teen" if target_complexity < 0.7 else "adult")
            return self.core_financial_terms[word_lower].get(age_band, word)
        
        candidates = []
        
        # Method 1: NLTK WordNet - Get synonyms from lexical database
        try:
            synsets = wordnet.synsets(word)
            for syn in synsets[:3]:  # Check first 3 synsets
                for lemma in syn.lemmas():
                    synonym = lemma.name().replace('_', ' ')
                    if synonym.lower() != word_lower:
                        syn_complexity = self._calculate_word_complexity(synonym)
                        if syn_complexity < current_complexity:
                            candidates.append((synonym, syn_complexity, 0.9, 'wordnet'))
        except Exception:
            pass
        
        # Method 2: spaCy - Semantic similarity in vector space
        try:
            nlp = get_nlp()
            doc = nlp(word)
            
            if len(doc) > 0 and doc[0].has_vector:
                # Lower threshold for young children
                similarity_threshold = 0.5 if target_complexity < 0.4 else 0.6
                
                # Sample vocabulary for efficiency (check top 10000 most common words)
                vocab_sample = list(nlp.vocab)[:10000]
                for token in vocab_sample:
                    if token.has_vector and token.is_alpha and len(token.text) > 2:
                        similarity = doc[0].similarity(token)
                        if similarity > similarity_threshold:
                            word_complexity = self._calculate_word_complexity(token.text)
                            if word_complexity < current_complexity:
                                candidates.append((token.text, word_complexity, similarity, 'spacy'))
        except Exception:
            pass
        
        # Method 3: Common word mappings (hardcoded for reliability)
        common_simplifications = {
            "prefer": ("like", 0.2, 1.0),
            "approach": ("way", 0.15, 1.0),
            "extensively": ("a lot", 0.2, 1.0),
            "research": ("look up", 0.2, 1.0),
            "anxious": ("worried", 0.3, 1.0),
            "optimistic": ("hopeful", 0.3, 1.0),
            "uncertain": ("not sure", 0.25, 1.0),
            "confident": ("sure", 0.2, 1.0),
            "disciplined": ("careful", 0.3, 1.0),
            "impulsive": ("fast", 0.2, 0.8),
            "reactive": ("quick", 0.2, 0.8),
            "discouraged": ("sad", 0.15, 1.0),
            "motivated": ("want to", 0.25, 1.0),
        }
        
        if word_lower in common_simplifications:
            simple_word, complexity, confidence = common_simplifications[word_lower]
            candidates.append((simple_word, complexity, confidence, 'common'))
        
        # Sort candidates by: 1) complexity 2) confidence 3) source priority
        source_priority = {'common': 0, 'wordnet': 1, 'spacy': 2}
        candidates.sort(key=lambda x: (x[1], -x[2], source_priority.get(x[3], 3)))
        
        # Return best candidate if found
        if candidates:
            return candidates[0][0]
        
        # Fallback: return original
        return word

    def transform_ppi_question(self, baseline_text: str, user: UserProfile) -> str:
        age_band = compute_age_band(user.age)
        exp_band = compute_experience_band(user.experience_level)
        dvcl = compute_dvcl_factor(user.age, user.experience_level)

        text = baseline_text
        text = self._simplify_sentence_structure(text, age_band, dvcl)
        text = self._inject_experience_clarity(text, exp_band, is_ppi=True)
        # Financial terms now handled by word complexity formula in _simplify_sentence_structure
        return text

    def transform_lpi_lesson(self, baseline_text: str, user: UserProfile, ctx: LessonContext) -> str:
        age_band = compute_age_band(user.age)
        exp_band = compute_experience_band(user.experience_level)
        dvcl = compute_dvcl_factor(user.age, user.experience_level)

        text = baseline_text
        text = self._simplify_sentence_structure(text, age_band, dvcl)
        text = self._inject_experience_clarity(text, exp_band, is_ppi=False)
        text = self._append_personality_tail(text, user.dna_profile)
        text = self._add_goal_hook(text, user.goals)
        return text

    def transform_lpi_takeaway(self, baseline_text: str, user: UserProfile, ctx: LessonContext) -> str:
        age_band = compute_age_band(user.age)
        exp_band = compute_experience_band(user.experience_level)
        dvcl = compute_dvcl_factor(user.age, user.experience_level)

        text = baseline_text
        text = self._simplify_sentence_structure(text, age_band, dvcl)
        text = self._inject_experience_clarity(text, exp_band, is_ppi=False, is_takeaway=True)
        text = self._append_personality_tail(text, user.dna_profile, soft=True)
        return text

    def _simplify_sentence_structure(self, text: str, age_band: str, dvcl: float) -> str:
        """
        Simplify sentence structure AND vocabulary based on DVCL.
        Uses word complexity formula + spaCy synonym finding.
        """
        # Target complexity based on DVCL
        target_word_complexity = dvcl * 0.7  # DVCL 0.3 → 0.21, DVCL 1.0 → 0.70
        
        sentences = [s.strip() for s in text.replace("?", ".").split(".") if s.strip()]
        new_sentences: List[str] = []

        for sent in sentences:
            words = sent.split()
            
            # Step 1: Simplify complex words
            simplified_words = []
            for word in words:
                # Preserve punctuation
                clean_word = word.strip('.,!?;:')
                punct = word[len(clean_word):] if len(word) > len(clean_word) else ''
                
                if clean_word.isalpha() and len(clean_word) > 2:
                    # Try to find simpler synonym
                    simpler = self._find_simpler_word(clean_word, target_word_complexity)
                    simplified_words.append(simpler + punct)
                else:
                    simplified_words.append(word)
            
            # Step 2: Control sentence length
            max_len = 12 if age_band == "child" else (18 if age_band == "teen" else 30)
            if dvcl < 0.5:
                max_len = max_len - 3

            if len(simplified_words) > max_len and age_band in ("child", "teen"):
                mid = len(simplified_words) // 2
                first = " ".join(simplified_words[:mid])
                second = " ".join(simplified_words[mid:])
                if first:
                    new_sentences.append(first)
                if second:
                    new_sentences.append(second)
            else:
                new_sentences.append(" ".join(simplified_words))

        text = ". ".join(new_sentences)
        if text and not text.endswith("."):
            text += "."
        return text

    def _inject_experience_clarity(self, text: str, exp_band: str, is_ppi: bool = False, is_takeaway: bool = False) -> str:
        lowered = text.lower()

        def add_clarifier(original: str, clarifier: str) -> str:
            if clarifier.lower() in lowered:
                return text
            return text.replace(original, f"{original} ({clarifier})")

        if exp_band == "beginner":
            if "saving" in lowered and "set aside" not in lowered and not is_ppi:
                text = add_clarifier("Saving", "setting aside money for later")
            if "interest" in lowered and not is_ppi:
                text = add_clarifier("interest", "extra money you earn or pay")
            if "budget" in lowered and not is_ppi:
                text = add_clarifier("budget", "a simple plan for your money")
            if is_takeaway and not text.startswith("Remember"):
                text = "Remember: " + text
        elif exp_band == "advanced":
            if "saving" in lowered and "opportunity cost" not in lowered and not is_ppi:
                text += " You're also managing opportunity cost when you choose where that money sits."
            if "interest" in lowered and "compound" not in lowered and not is_ppi:
                text += " Over time, compound effects matter more than one-time gains."

        return text

    def _append_personality_tail(self, text: str, dna_profile: str, soft: bool = False) -> str:
        archetype = self._resolve_archetype(dna_profile)
        tagline = archetype.get("tagline", "").strip()
        if not tagline:
            return text
        if tagline.lower() in text.lower():
            return text
        sep = " " if text.endswith((".", "!", "?")) else ". "
        if soft:
            tagline = tagline.replace("This", "It")
        return text + sep + tagline

    def _resolve_archetype(self, dna_profile: str) -> Dict[str, str]:
        for key in self.personality_adaptations.keys():
            if key.lower() in dna_profile.lower():
                return self.personality_adaptations[key]
        return self.personality_adaptations["Balanced"]

    def _add_goal_hook(self, text: str, goals: List[str]) -> str:
        if not goals:
            return text

        goal_connections = {
            "save_for_purchase": ("saving", "saving for something you really want"),
            "learn_money_basics": ("money", "understanding money step by step"),
            "build_wealth": ("grow", "building long-term wealth"),
            "pay_off_debt": ("debt", "becoming debt-free"),
            "buy_home": ("save", "buying a home"),
            "retirement": ("future", "planning for your future self"),
            "start_business": ("earn", "starting or growing a business"),
        }

        lowered = text.lower()
        for goal in goals:
            if goal not in goal_connections:
                continue
            concept, phrase = goal_connections[goal]
            if concept in lowered:
                if phrase.lower() in lowered:
                    return text
                if not text.endswith((".", "!", "?")):
                    text += "."
                return text + f" This directly helps with {phrase}."
        return text


_tap_instance: Optional[TAPEngine] = None


def get_tap_engine() -> TAPEngine:
    global _tap_instance
    if _tap_instance is None:
        _tap_instance = TAPEngine()
    return _tap_instance
