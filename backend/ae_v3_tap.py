"""
AE v3.55-RE + TAP 2.0
=====================
This is the ORIGINAL ChatGPT version with minimal core vocabulary (4 phrases only).
"""

from dataclasses import dataclass, field
from typing import Dict, Any, List, Optional, Tuple
import datetime

# Import from config
from config import MINIMUM_USER_AGE, CHILD_AGE_MAX, TEEN_AGE_MAX

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

    def transform_ppi_question(self, baseline_text: str, user: UserProfile) -> str:
        age_band = compute_age_band(user.age)
        exp_band = compute_experience_band(user.experience_level)
        dvcl = compute_dvcl_factor(user.age, user.experience_level)

        text = baseline_text
        text = self._simplify_sentence_structure(text, age_band, dvcl)
        text = self._inject_experience_clarity(text, exp_band, is_ppi=True)
        text = self._soften_overt_finance_terms_for_ppi(text, age_band)
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
        sentences = [s.strip() for s in text.replace("?", ".").split(".") if s.strip()]
        new_sentences: List[str] = []

        for sent in sentences:
            words = sent.split()
            max_len = 12 if age_band == "child" else (18 if age_band == "teen" else 30)
            if dvcl < 0.5:
                max_len = max_len - 3

            if len(words) > max_len and age_band in ("child", "teen"):
                mid = len(words) // 2
                first = " ".join(words[:mid])
                second = " ".join(words[mid:])
                if first:
                    new_sentences.append(first)
                if second:
                    new_sentences.append(second)
            else:
                new_sentences.append(sent)

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

    def _soften_overt_finance_terms_for_ppi(self, text: str, age_band: str) -> str:
        """ORIGINAL ChatGPT version - only 4 core replacements"""
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
