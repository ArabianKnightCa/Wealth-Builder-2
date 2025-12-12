"""
AE v3.55-RE + TAP 2.0
=====================

PURPOSE
-------
This module replaces Emergent's existing "Content Transformer / AE" logic
with a unified Adaptive Engine (AE) v3.55-RE and TAP 2.0.

VERSIONING
----------
ADAPTIVE_ENGINE_VERSION = "3.55-RE"
TAP_VERSION             = "2.0"
"""

from dataclasses import dataclass, field
from typing import Dict, Any, List, Optional, Tuple
import math
import datetime


# ================================================================
# 0. GLOBAL CONSTANTS & VERSION TAGS
# ================================================================

ADAPTIVE_ENGINE_VERSION = "3.55-RE"
TAP_VERSION = "2.0"

# Minimal sane defaults – Emergent can override from config if desired
from config import MINIMUM_USER_AGE, CHILD_AGE_MAX, TEEN_AGE_MAX

# Financial experience levels for POC: 1–5 (will expand later to 10, then 15)
MIN_EXP_LEVEL = 1
MAX_EXP_LEVEL = 5


# ================================================================
# 1. USER PROFILE & CONTEXT STRUCTS
# ================================================================

@dataclass
class UserProfile:
    """
    Core user signals used by AE + TAP.

    NOTE:
        - `experience_level` is an integer 1–5 in POC, expandable to 1–10, 1–15 later.
        - `dna_profile` is a label like "Planner", "Spontaneous", etc.
        - `dna_weights` is a vector of trait weights, e.g. {"Planner": 0.6, "Builder":0.4}
    """
    user_id: str
    age: int
    experience_level: int  # 1..5 POC
    dna_profile: str
    dna_weights: Dict[str, float] = field(default_factory=dict)
    goals: List[str] = field(default_factory=list)  # e.g. ['save_for_purchase', 'build_wealth']
    culture_code: Optional[str] = None  # e.g. "US_EN", "US_PUNJABI", "US_SPANISH"
    religion_code: Optional[str] = None  # e.g. "NONE", "MUSLIM", "HINDU", "CHRISTIAN"


@dataclass
class LessonContext:
    """
    Context for a single lesson or snippet of content.
    AE sets this BEFORE calling TAP.
    """
    chapter_id: str
    lesson_id: str
    attempt_number: int = 1
    last_score: Optional[float] = None     # 0..1
    rolling_mastery: Optional[float] = None  # 0..1
    fatigue_score: Optional[float] = None  # 0..1 (AE computed)


# ================================================================
# 2. HELPER: AGE & EXPERIENCE MAPPING (TAP FOUNDATION)
# ================================================================

def _clamp(val: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, val))


def compute_age_band(age: int) -> str:
    """
    Coarse band, but AE/TAP still uses raw age for finer tuning.
    """
    if age <= CHILD_AGE_MAX:
        return "child"
    elif age <= TEEN_AGE_MAX:
        return "teen"
    return "adult"


def compute_experience_band(exp_level: int) -> str:
    """
    Map 1..5 to a conceptual band.
    POC:
        1–2 -> 'beginner'
        3   -> 'intermediate'
        4–5 -> 'advanced'
    """
    lvl = _clamp(exp_level, MIN_EXP_LEVEL, MAX_EXP_LEVEL)
    if lvl <= 2:
        return "beginner"
    if lvl == 3:
        return "intermediate"
    return "advanced"


def compute_dvcl_factor(age: int, exp_level: int) -> float:
    """
    DVCL (Dynamic Verbal Challenge Level) factor.
    
    Idea:
        - Younger users get lower DVCL.
        - Higher experience levels push DVCL up.
        - We roughly target "0.75 grade above comfort" without tying to US-grade specifics.

    Returns:
        numeric factor ~0.3 (very simple) to ~1.4 (quite complex).
    """
    # Age contribution: roughly 0.3 at age 6, up to ~1.2 by age 40+
    age_norm = _clamp((age - MINIMUM_USER_AGE) / 30.0, 0.0, 1.0)
    age_component = 0.3 + 0.9 * age_norm  # 0.3–1.2

    # Experience contribution: 1..5 -> 0.0–0.3
    exp_norm = (exp_level - MIN_EXP_LEVEL) / (MAX_EXP_LEVEL - MIN_EXP_LEVEL) if MAX_EXP_LEVEL > MIN_EXP_LEVEL else 0.0
    exp_component = 0.3 * exp_norm

    dvcl = age_component + exp_component  # ~0.3–1.5
    return _clamp(dvcl, 0.3, 1.4)


# ================================================================
# 3. TAP 2.0 – TEXT ADAPTATION PROCESSOR (PPI + LPI)
# ================================================================

class TAPEngine:
    """
    TAP 2.0 – Text Adaptation Processor

    ROLE:
        - Translates baseline PPI & LPI text into user-appropriate language.
        - Uses:
            age + experience_level + dna_profile + goals (+ culture/religion hooks later)

    SCOPE:
        - Does NOT pick which chapter or lesson to show. AE does that.
        - Does NOT manage databases or telemetry. AE / app layer handle that.
    """

    def __init__(self):
        # Personality adaptations (Financial DNA archetypes)
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

    # ------------------------------
    # PUBLIC API
    # ------------------------------

    def transform_ppi_question(self, baseline_text: str, user: UserProfile) -> str:
        """
        Make a PPI question age-/experience-friendly without changing its psychological intent.
        """
        age_band = compute_age_band(user.age)
        exp_band = compute_experience_band(user.experience_level)
        dvcl = compute_dvcl_factor(user.age, user.experience_level)

        text = baseline_text

        # 1) Age simplification
        text = self._simplify_sentence_structure(text, age_band, dvcl)

        # 2) Experience-based explanation injection (WITHOUT changing the core meaning)
        text = self._inject_experience_clarity(text, exp_band, is_ppi=True)

        # 3) Remove heavy financial jargon from PPI (we care more about style than teaching here)
        text = self._soften_overt_finance_terms_for_ppi(text, age_band)

        return text

    def transform_lpi_lesson(self, baseline_text: str, user: UserProfile, ctx: LessonContext) -> str:
        """
        Full lesson-body transformation for LPI lesson content.
        """
        age_band = compute_age_band(user.age)
        exp_band = compute_experience_band(user.experience_level)
        dvcl = compute_dvcl_factor(user.age, user.experience_level)

        text = baseline_text

        # 1) Age-driven structural simplification / complexity tuning
        text = self._simplify_sentence_structure(text, age_band, dvcl)

        # 2) Experience-based depth tuning
        text = self._inject_experience_clarity(text, exp_band, is_ppi=False)

        # 3) Personality tone & motivational tail
        text = self._append_personality_tail(text, user.dna_profile)

        # 4) Goal connections (if concept words match)
        text = self._add_goal_hook(text, user.goals)

        return text

    def transform_lpi_takeaway(self, baseline_text: str, user: UserProfile, ctx: LessonContext) -> str:
        """
        Short takeaway transformation. Similar to lesson, but slightly more direct and punchy.
        """
        age_band = compute_age_band(user.age)
        exp_band = compute_experience_band(user.experience_level)
        dvcl = compute_dvcl_factor(user.age, user.experience_level)

        text = baseline_text
        text = self._simplify_sentence_structure(text, age_band, dvcl)
        text = self._inject_experience_clarity(text, exp_band, is_ppi=False, is_takeaway=True)
        text = self._append_personality_tail(text, user.dna_profile, soft=True)
        return text

    # ------------------------------
    # INTERNAL HELPERS
    # ------------------------------

    def _count_syllables(self, word: str) -> int:
        """
        Estimate syllables in a word using vowel counting heuristic.
        Not perfect but good enough for readability scoring.
        """
        word = word.lower().strip()
        vowels = "aeiouy"
        syllable_count = 0
        previous_was_vowel = False
        
        for char in word:
            is_vowel = char in vowels
            if is_vowel and not previous_was_vowel:
                syllable_count += 1
            previous_was_vowel = is_vowel
        
        # Adjust for silent 'e'
        if word.endswith('e'):
            syllable_count -= 1
        
        # Every word has at least 1 syllable
        if syllable_count == 0:
            syllable_count = 1
            
        return syllable_count
    
    def _simplify_word(self, word: str, target_syllables: int) -> str:
        """
        Algorithmically simplify a word if it exceeds target syllable count.
        Uses linguistic rules, not dictionaries.
        """
        syllables = self._count_syllables(word)
        
        # If word is already simple enough, return as-is
        if syllables <= target_syllables:
            return word
        
        # Apply simplification rules based on common patterns
        word_lower = word.lower()
        
        # Multi-syllable -> simpler synonyms (pattern-based, not dictionary)
        # Rule 1: Words ending in -tion/-sion (3+ syllables) -> root
        if syllables >= 3:
            if word_lower.endswith('tion'):
                root = word_lower[:-4]
                if len(root) > 2:
                    return root
            if word_lower.endswith('sion'):
                root = word_lower[:-4]
                if len(root) > 2:
                    return root
        
        # Rule 2: Words ending in -ly (adverbs) -> remove -ly
        if syllables >= 2 and word_lower.endswith('ly'):
            return word_lower[:-2]
        
        # Rule 3: Words ending in -ment -> root verb
        if syllables >= 2 and word_lower.endswith('ment'):
            root = word_lower[:-4]
            if len(root) > 2:
                return root
        
        # If can't simplify, return original
        return word
    
    def _simplify_sentence_structure(self, text: str, age_band: str, dvcl: float) -> str:
        """
        Algorithmic sentence simplification based on:
        - Target syllable count per word
        - Target words per sentence
        - Complexity reduction via syllable analysis
        """
        # Calculate targets based on DVCL
        # DVCL 0.3 (age 6) -> 1-2 syllables/word, 6-8 words/sentence
        # DVCL 0.5 (age 12) -> 2-3 syllables/word, 10-12 words/sentence
        # DVCL 1.0 (adult) -> any syllables, 15-20 words/sentence
        
        if age_band == "child":
            target_syllables_per_word = 1 + int(dvcl * 2)  # 1-2 syllables for young kids
            max_words_per_sentence = 6 + int(dvcl * 6)     # 6-12 words
        elif age_band == "teen":
            target_syllables_per_word = 2 + int(dvcl * 2)  # 2-4 syllables
            max_words_per_sentence = 10 + int(dvcl * 8)    # 10-18 words
        else:
            # Adult - minimal changes
            return text
        
        # Split into sentences
        sentences = [s.strip() for s in text.replace("?", ".").split(".") if s.strip()]
        new_sentences: List[str] = []
        
        for sent in sentences:
            words = sent.split()
            
            # Step 1: Simplify complex words
            simplified_words = []
            for word in words:
                # Keep punctuation attached
                clean_word = word.strip('.,!?;:')
                punct = word[len(clean_word):] if len(word) > len(clean_word) else ''
                
                if clean_word.isalpha():
                    simple = self._simplify_word(clean_word, target_syllables_per_word)
                    simplified_words.append(simple + punct)
                else:
                    simplified_words.append(word)
            
            # Step 2: Split long sentences
            if len(simplified_words) > max_words_per_sentence:
                # Split at natural break points (and, but, or, because)
                mid = len(simplified_words) // 2
                # Look for conjunction near midpoint
                conjunctions = ['and', 'but', 'or', 'so', 'because']
                split_point = mid
                for i in range(max(0, mid-3), min(len(simplified_words), mid+3)):
                    if simplified_words[i].lower() in conjunctions:
                        split_point = i
                        break
                
                first_half = " ".join(simplified_words[:split_point])
                second_half = " ".join(simplified_words[split_point:])
                
                if first_half:
                    new_sentences.append(first_half)
                if second_half:
                    new_sentences.append(second_half)
            else:
                new_sentences.append(" ".join(simplified_words))
        
        # Rejoin with periods
        text = ". ".join(new_sentences)
        if text and not text.endswith((".", "!", "?")):
            text += "."
        
        # Lowercase for young children (more approachable)
        if age_band == "child" and dvcl < 0.6:
            text = text.lower()
        
        return text

    def _inject_experience_clarity(
        self,
        text: str,
        exp_band: str,
        is_ppi: bool = False,
        is_takeaway: bool = False
    ) -> str:
        """
        Make explanations shallow, normal, or deeper depending on experience.
        DOES NOT change the core claim, only adds parenthetical or short clarifiers.
        """
        lowered = text.lower()

        # Basic teaching vocabulary hooks
        def add_clarifier(original: str, clarifier: str) -> str:
            if clarifier.lower() in lowered:
                return text  # avoid repeating
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
            # For advanced users, we can safely reference more technical framing.
            # Keep it light in POC – just a small upgrade.
            if "saving" in lowered and "opportunity cost" not in lowered and not is_ppi:
                text += " You're also managing opportunity cost when you choose where that money sits."
            if "interest" in lowered and "compound" not in lowered and not is_ppi:
                text += " Over time, compound effects matter more than one-time gains."

        # intermediate -> text unchanged (baseline is already mid-level)
        return text

    def _soften_overt_finance_terms_for_ppi(self, text: str, age_band: str) -> str:
        """
        PPI is measuring style, not teaching finance concepts.
        For young children (4-7), use extremely simple everyday language.
        """
        import re
        
        # Ultra-simple replacements for young children (4-7 years old)
        replacements_child = {
            # Complex sentence starters
            "when making financial decisions, i prefer to": "when i need to pick about money, i like to",
            "when making financial decisions": "when i pick about money",
            "when making money choices": "when i pick about money",
            "financial decisions": "pick about money",
            "money choices": "pick about money",
            "financial decision": "money pick",
            "money choice": "money pick",
            
            # Future concepts
            "when i think about my financial future": "when i think about money when i am big",
            "financial future": "money when i am big",
            "money when i grow up": "money when i am big",
            
            # Approach/method concepts  
            "my approach to saving money": "how i save money",
            "my approach to": "how i",
            "approach to": "how i",
            "my how i": "how i",
            
            # Preferences & decisions
            "prefer to": "like to",
            "i prefer": "i like",
            "prefer": "like",
            "when setting financial goals": "when setting money goals",
            "when setting money goals": "when i want to save money",
            
            # Actions & decision-making
            "research extensively before deciding": "ask my mom or dad",
            "research extensively": "ask a grownup",
            "before deciding": "before i pick",
            "before choosing": "before i pick",
            "making decisions": "picking",
            "go with my gut feeling": "do what feels right",
            
            # Saving concepts
            "track my spending": "watch my money",
            "save a fixed amount each month": "save the same amount every month",
            "save whatever is left over": "save what i have left",
            "save only for specific goals": "save for special things i want",
            "i struggle to save": "saving is hard for me",
            "i struggle to save my money": "saving money is hard for me",
            "save consistently": "save my money",
            
            # Future feelings
            "excited and optimistic": "happy and good",
            "anxious or worried": "worried or scared",
            "uncertain but hopeful": "not sure but okay",
            "confident and prepared": "ready and sure",
            
            # Frequency
            "daily or weekly": "every day or every week",
            "monthly": "every month",
            "rarely or never": "almost never",
            "only when i'm worried about money": "only when i worry about money",
            
            # Money concepts
            "unexpected money": "surprise money",
            "receive unexpected money": "get surprise money",
            "save most or all of it": "save most of it or all of it",
            "spend it on something i've wanted": "buy something i want",
            "split it between saving and spending": "save some and spend some",
            "use it to pay bills or": "use it to pay for things or",
            "investment": "save money to make more",
            "debt": "money i owe",
            "emergency fund": "saved money for bad times",
            "paying off debt": "paying back money",
            
            # Learning styles
            "i learn best through": "i learn best by",
            "reading and research": "reading and looking things up",
            "hands-on practice": "doing it myself",
            "watching videos or tutorials": "watching videos",
            "discussion and conversation": "talking with others",
            
            # Goals & planning
            "detailed plans with specific timelines": "make a clear plan with dates",
            "general direction without strict deadlines": "a loose plan without exact dates",
            "short-term goals i can achieve quickly": "small goals i can do fast",
            "long-term vision with flexibility": "big goals i can change",
            
            # Spending habits
            "i would describe my spending habits as": "when i spend money, i am",
            "spending habits": "how i spend",
            "very disciplined": "very careful",
            "mostly controlled with occasional splurges": "mostly careful but sometimes i buy fun things",
            "impulsive at times": "sometimes i buy without thinking",
            "often reactive to emotions": "i buy things when i feel sad or happy",
            
            # Setbacks & resilience  
            "when facing a financial setback": "when something bad happens with money",
            "when facing a money setback": "when something bad happens with money",
            "quickly adjust my plan and move forward": "change my plan and keep going",
            "feel discouraged but eventually recover": "feel sad but get better later",
            "need support from others to cope": "need help from others",
            "find it very difficult to bounce back": "have a really hard time feeling better",
            
            # Risk tolerance
            "my comfort level with money risk is": "how okay i am with losing money is",
            "my comfort level with": "how okay i am with",
            "high – i'm willing to take calculated risks": "high - i am okay taking some risks",
            "high – i'm willing": "high - i am okay",
            "moderate – some risk is okay": "medium - a little risk is okay",
            "low – i like safety and stability": "low - i like to be safe",
            "very low – i avoid risk completely": "very low - i do not want any risk",
            "i'm willing to take calculated risks": "i am okay taking some risks",
            "calculated risks": "some risks",
            "avoid risk": "stay away from risk",
            
            # Challenges
            "my biggest money challenge is": "the hardest thing about money for me is",
            "not earning enough": "not getting enough money",
            "controlling my spending": "not spending too much",
            "understanding money concepts": "learning about money",
            "understanding financial concepts": "learning about money",
            "staying motivated to save": "keeping myself saving",
            
            # Advice/help
            "friends or family for advice": "my mom or dad",
            "ask friends or family for advice": "ask my mom or dad",
            "for advice": "for help",
            "consult with": "ask",
            "follow what experts recommend": "do what grownups say",
            
            # General simplifications
            "financial": "money",
            "finances": "money",
        }
        
        replacements_teen = {
            "financial decisions": "money decisions",
            "financial decision": "money decision",
            "financial future": "my money future",
            "prefer to": "like to",
            "i prefer": "i like",
        }

        # Choose replacement set based on age band
        replacements = replacements_child if age_band == "child" else (replacements_teen if age_band == "teen" else {})
        
        # Sort by length descending to replace longer phrases first
        sorted_replacements = sorted(replacements.items(), key=lambda x: len(x[0]), reverse=True)
        
        # Case-insensitive replacement
        for key, val in sorted_replacements:
            pattern = re.compile(re.escape(key), re.IGNORECASE)
            text = pattern.sub(val, text)
        
        return text

    def _append_personality_tail(self, text: str, dna_profile: str, soft: bool = False) -> str:
        """
        Add one short motivational sentence at the end based on DNA profile.
        """
        archetype = self._resolve_archetype(dna_profile)
        tagline = archetype.get("tagline", "").strip()
        if not tagline:
            return text

        # Avoid repeating if text already ends similarly
        if tagline.lower() in text.lower():
            return text

        sep = " " if text.endswith((".", "!", "?")) else ". "
        if soft:
            # Softer, shorter hint
            tagline = tagline.replace("This", "It")
        return text + sep + tagline

    def _resolve_archetype(self, dna_profile: str) -> Dict[str, str]:
        """
        Fallback to Balanced if unknown DNA label.
        """
        for key in self.personality_adaptations.keys():
            if key.lower() in dna_profile.lower():
                return self.personality_adaptations[key]
        return self.personality_adaptations["Balanced"]

    def _add_goal_hook(self, text: str, goals: List[str]) -> str:
        """
        Attach one sentence describing how this lesson ties to one of the user's goals.
        """
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
                    # already conceptually present
                    return text
                if not text.endswith((".", "!", "?")):
                    text += "."
                return text + f" This directly helps with {phrase}."
        return text


# Singleton TAP instance for the whole app
_tap_instance: Optional[TAPEngine] = None


def get_tap_engine() -> TAPEngine:
    global _tap_instance
    if _tap_instance is None:
        _tap_instance = TAPEngine()
    return _tap_instance
