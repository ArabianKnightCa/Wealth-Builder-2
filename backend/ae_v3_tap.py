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

    def _simplify_sentence_structure(self, text: str, age_band: str, dvcl: float) -> str:
        """
        Very lightweight structural adjustment:
            - Children: shorter sentences, fewer clauses.
            - Teens: moderate simplification of formal words.
            - Adults: mostly untouched unless dvcl is very low.
        """
        sentences = [s.strip() for s in text.replace("?", ".").split(".") if s.strip()]
        new_sentences: List[str] = []

        for sent in sentences:
            words = sent.split()
            # If dvcl is low, enforce shorter sentences.
            max_len = 12 if age_band == "child" else (18 if age_band == "teen" else 30)
            if dvcl < 0.5:
                max_len = max_len - 3

            if len(words) > max_len and age_band in ("child", "teen"):
                # naive split at the midpoint
                mid = len(words) // 2
                first = " ".join(words[:mid])
                second = " ".join(words[mid:])
                if first:
                    new_sentences.append(first)
                if second:
                    new_sentences.append(second)
            else:
                new_sentences.append(sent)

        # Re-join with periods
        text = ". ".join(new_sentences)
        if text and not text.endswith("."):
            text += "."
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
        Here we lightly reword heavy finance terms for younger / lower experience users
        so they feel more like everyday language.
        """
        replacements_child = {
            "financial decisions": "money choices",
            "financial decision": "money choice",
            "investment": "putting money somewhere to grow it",
            "debt": "money you owe",
        }
        replacements_teen = {
            "financial decisions": "money decisions",
            "financial decision": "money decision",
        }

        lowered = text.lower()
        if age_band == "child":
            for key, val in replacements_child.items():
                if key in lowered:
                    text = text.replace(key, val)
        elif age_band == "teen":
            for key, val in replacements_teen.items():
                if key in lowered:
                    text = text.replace(key, val)
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
