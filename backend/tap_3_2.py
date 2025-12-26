"""
tap_3_2.py
==========
TAP 3.2 (v3.2.1) — Sentence-Level Scaffolding Engine
----------------------------------------------------
Design goals:
- Deterministic
- NO baseline mutation: baseline text must appear verbatim in output
- No synonym replacement INSIDE baseline
- Sentence-by-sentence scaffolding interleaved AFTER each baseline sentence
- "Inline definitions" implemented as a separate "Decode" line (does not modify baseline)
- Preamble generation strength is continuous (driven by LC + baseline complexity)
- Adaptive CLS scales scaffolding capacity for low-LC users facing complex text
- PPI option adaptation + option glosses for low LC

Note:
- "No buckets" is respected for core math (continuous LC/CD/IA and continuous intensity).
  There are a few practical thresholds for turning features on/off; those thresholds are
  driven by continuous scalar values (not age bands).
"""

from __future__ import annotations

import hashlib
import math
import re
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple


# =============================================================================
# Utilities
# =============================================================================

def clamp(x: float, lo: float = 0.0, hi: float = 1.0) -> float:
    return max(lo, min(hi, x))

def safe_div(a: float, b: float, default: float = 0.0) -> float:
    return a / b if b else default

def sha16(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()[:16]

def normalize_age(age: int) -> float:
    # continuous (age is integer input; normalization is continuous scalar)
    return clamp(age / 100.0)

def normalize_el(el_declared: int, el_max: int) -> float:
    if el_max <= 1:
        return 0.0
    # allow EL=1 safely -> 0.0
    return clamp((el_declared - 1) / (el_max - 1))

def split_sentences(text: str) -> List[str]:
    """
    Lightweight deterministic sentence splitter.
    Keeps punctuation and avoids heavy NLP deps.
    """
    text = text.strip()
    if not text:
        return []

    # normalize weird dashes
    text = text.replace("—", "—")

    # Split on sentence end markers while keeping marker
    parts = re.split(r'(?<=[.!?])\s+', text)
    # Also handle cases where baseline has long em-dash clauses without periods:
    # keep as single sentence if no punctuation end.
    return [p.strip() for p in parts if p and p.strip()]

def count_syllable_like(word: str) -> int:
    """
    Tiny heuristic for readability. Deterministic. Not perfect, but stable.
    """
    w = re.sub(r'[^a-zA-Z]', '', word.lower())
    if not w:
        return 0
    vowels = "aeiouy"
    groups = 0
    prev_vowel = False
    for ch in w:
        is_v = ch in vowels
        if is_v and not prev_vowel:
            groups += 1
        prev_vowel = is_v
    # silent e
    if w.endswith("e") and groups > 1:
        groups -= 1
    return max(1, groups)

def word_list(text: str) -> List[str]:
    return [w for w in re.findall(r"[A-Za-z']+", text)]

def title_case_topic_hint(text: str) -> str:
    """
    Cheap topic hint from the first sentence: pick a keyword if present.
    """
    tl = text.lower()
    for k in ("money", "budget", "saving", "bank", "credit", "invest", "debt", "interest"):
        if k in tl:
            return k.capitalize()
    return "this"

# =============================================================================
# Data Models
# =============================================================================

@dataclass
class TAPControlInputs:
    # optional control knobs (default neutral)
    support_need: float = 0.5
    guardrail_need: float = 0.5
    structure_preference: float = 0.5
    exploration_bias: float = 0.5
    social_frame_bias: float = 0.5
    tone_warmth: float = 0.5
    pacing_density: float = 0.5
    stretch_appetite: float = 0.5

    @classmethod
    def neutral(cls) -> "TAPControlInputs":
        return cls()

@dataclass
class PPIOptionSpec:
    option_id: str      # "A", "B", "C", "D"
    option_text: str    # original option text
    option_key: str     # semantic key e.g. "RESEARCH_FIRST"

@dataclass
class CLGAddition:
    type: str  # "preamble", "decode", "definition", "example", "analogy", "framing"
    text: str
    position: str  # "before" | "after"
    sentence_index: Optional[int] = None  # which sentence it attaches to (for interleaving)

@dataclass
class TAP32Scalars:
    age: int
    el: int
    lc: float
    cd: float
    ia: float
    baseline_complexity: float
    cls: int
    scaffold_intensity: float

@dataclass
class CLGOutput:
    baseline_text: str
    baseline_hash: str
    scalars: TAP32Scalars
    additions: List[CLGAddition]
    final_output: str
    baseline_mutated: bool
    cls_exceeded: bool
    debug: Dict[str, Any] = field(default_factory=dict)


# =============================================================================
# Glossary (Terms + Phrases)
# =============================================================================

@dataclass
class GlossaryEntry:
    key: str
    complexity: float  # 0.0-1.0 higher = more complex
    simple: str        # simple definition
    standard: str      # standard definition
    example: Optional[str] = None
    analogy: Optional[str] = None

# Phrase-level entries first (so we match longer phrases deterministically)
GLOSSARY: List[GlossaryEntry] = [
    GlossaryEntry(
        key="digital entries in a secure ledger",
        complexity=0.75,
        simple="computer records that say who has money",
        standard="digital records stored in a trusted accounting system",
        example="Like a scoreboard that tracks points, but it tracks money.",
        analogy="Like a notebook that the bank keeps, but it's on computers."
    ),
    GlossaryEntry(
        key="asset allocation",
        complexity=0.72,
        simple="how you split your money into different places",
        standard="how you divide investments across categories",
        example="Some in savings, some in stocks, some in bonds.",
        analogy="Like putting snacks into different lunch boxes."
    ),
    GlossaryEntry(
        key="cash flow",
        complexity=0.60,
        simple="money coming in and going out",
        standard="the movement of money into and out of an account",
        example="Paycheck in, bills out.",
        analogy="Like water flowing into and out of a bathtub."
    ),
    GlossaryEntry(
        key="shared agreement",
        complexity=0.55,
        simple="when everyone agrees money can be used",
        standard="a common understanding that money has value",
        example="Everyone agrees dollars can buy things in stores.",
        analogy="Like agreeing that a gold star means "good job.""
    ),
    GlossaryEntry(
        key="timing problem",
        complexity=0.50,
        simple="not needing the same thing at the same time",
        standard="a mismatch in when people want to trade goods or services",
        example="You have bread now, but want apples later.",
        analogy="Like trying to trade toys when your friend isn't there."
    ),
    # Single-term entries
    GlossaryEntry(
        key="ledger",
        complexity=0.70,
        simple="a record book that tracks money",
        standard="an accounting record of balances and transactions",
        example="A bank ledger tracks deposits and withdrawals.",
        analogy="Like a score sheet for money."
    ),
    GlossaryEntry(
        key="bartered",
        complexity=0.40,
        simple="traded things without money",
        standard="exchanged goods directly without currency",
        example="Bread for grain.",
        analogy="Trading your chips for a cookie."
    ),
    GlossaryEntry(
        key="barter",
        complexity=0.40,
        simple="trade without money",
        standard="direct exchange of goods or services",
        example="A shirt for a basket.",
        analogy="Swap toys with a friend."
    ),
    GlossaryEntry(
        key="budget",
        complexity=0.35,
        simple="a plan for your money",
        standard="a plan for income, spending, and saving",
        example="Decide how much to save and how much to spend.",
        analogy="Like planning how to use your time in a day."
    ),
    GlossaryEntry(
        key="expenses",
        complexity=0.42,
        simple="things you spend money on",
        standard="costs you pay for goods and services",
        example="Snacks, games, bills.",
        analogy="Like the points you spend in a video game store."
    ),
    GlossaryEntry(
        key="patterns",
        complexity=0.45,
        simple="things that happen again and again",
        standard="repeated behaviors you can observe over time",
        example="Buying a drink every day adds up.",
        analogy="Like repeating the same level in a game."
    ),
    GlossaryEntry(
        key="savings",
        complexity=0.30,
        simple="money you keep for later",
        standard="money set aside for future use",
        example="Saving for a bike.",
        analogy="Like storing snacks for later."
    ),
    GlossaryEntry(
        key="value",
        complexity=0.40,
        simple="how much something is worth",
        standard="the worth or usefulness of something",
        example="A rare card has high value.",
        analogy="Like how some toys are harder to get."
    ),
    GlossaryEntry(
        key="trade",
        complexity=0.35,
        simple="give something to get something",
        standard="exchange goods, services, or money",
        example="Money for food.",
        analogy="Swap cards."
    ),
    GlossaryEntry(
        key="confidence",
        complexity=0.55,
        simple="trust that things will work",
        standard="belief that a system or agreement will hold",
        example="People trust the store will accept dollars.",
        analogy="Like trusting rules in a game."
    ),
]

# Sort glossary keys by length desc for deterministic "longest first" matching
GLOSSARY_SORTED = sorted(GLOSSARY, key=lambda e: len(e.key), reverse=True)

def find_glossary_hits(text: str) -> List[GlossaryEntry]:
    tl = text.lower()
    hits: List[GlossaryEntry] = []
    for entry in GLOSSARY_SORTED:
        if entry.key.lower() in tl:
            hits.append(entry)
    return hits


# =============================================================================
# Core Formulas (continuous)
# =============================================================================

def compute_lc_cd_ia(age: int, el: int, el_max: int) -> Tuple[float, float, float]:
    age_norm = normalize_age(age)
    el_norm = normalize_el(el, el_max)

    # Baseline formulas (continuous)
    lc = clamp(0.65 * age_norm + 0.35 * el_norm)
    cd = clamp(0.85 * el_norm + 0.15 * age_norm)
    ia = clamp(0.50 * age_norm + 0.50 * el_norm)
    return (round(lc, 4), round(cd, 4), round(ia, 4))

def score_baseline_complexity(text: str) -> float:
    """
    Deterministic heuristic complexity score 0..1.
    Uses:
    - avg sentence length
    - avg syllable-ish per word
    - glossary technical hits density
    - abstract marker density
    """
    words = word_list(text)
    sents = split_sentences(text)
    wc = len(words)
    sc = max(1, len(sents))

    avg_sent_len = safe_div(wc, sc, 0.0)
    avg_syll = safe_div(sum(count_syllable_like(w) for w in words), max(1, wc), 0.0)

    hits = find_glossary_hits(text)
    tech_density = safe_div(len(hits), max(1, wc), 0.0) * 40.0  # scaled

    abstract_markers = ["agreement", "confidence", "system", "believe", "value", "trust", "stable", "ledger"]
    tl = text.lower()
    abstract_count = sum(tl.count(m) for m in abstract_markers)
    abstract_density = safe_div(abstract_count, max(1, wc), 0.0) * 18.0  # scaled

    # Normalize components
    sent_factor = clamp((avg_sent_len - 8) / 25)          # 8..33 words/sent -> 0..1
    syll_factor = clamp((avg_syll - 1.2) / 1.2)           # ~1.2..2.4 -> 0..1
    tech_factor = clamp(tech_density)
    abstract_factor = clamp(abstract_density)

    # Weighted blend
    complexity = (
        0.35 * sent_factor +
        0.25 * syll_factor +
        0.25 * tech_factor +
        0.15 * abstract_factor
    )
    return round(clamp(complexity), 4)

def compute_scaffold_intensity(lc: float, baseline_complexity: float, controls: Optional[TAPControlInputs]) -> float:
    """
    Continuous intensity 0..1.
    Higher when:
    - LC is low (needs help)
    - baseline complexity is high
    - support_need is high (optional)
    """
    support_boost = 0.0
    if controls is not None:
        support_boost = (controls.support_need - 0.5) * 0.20  # +/- 0.10 max

    intensity = (1 - lc) * 0.60 + baseline_complexity * 0.40 + support_boost
    return round(clamp(intensity), 4)

def compute_adaptive_cls(lc: float, baseline_complexity: float, controls: Optional[TAPControlInputs]) -> int:
    """
    Adaptive Cognitive Load Span (CLS): integer capacity for scaffolds.
    Continuous inside, integer at the end.
    """
    density_boost = 0.0
    if controls is not None:
        density_boost = (controls.pacing_density - 0.5) * 2.0  # -1..+1

    # continuous core (no age buckets)
    cls_float = (
        2.0 +
        (1 - lc) * 6.0 +                    # low LC => more support capacity
        baseline_complexity * 3.0 +         # complex baseline => more scaffolds
        density_boost
    )
    cls_int = int(round(clamp(cls_float / 12.0, 0.0, 1.0) * 10.0))  # 0..10
    return max(2, min(10, cls_int))


# =============================================================================
# Preamble / framing (generated, not baseline)
# =============================================================================

def generate_preamble(baseline_text: str, lc: float, age: int, baseline_complexity: float, controls: Optional[TAPControlInputs]) -> str:
    """
    Continuous strength. Returns "" when not needed.
    """
    warmth = 0.5 if controls is None else controls.tone_warmth
    guard = 0.5 if controls is None else controls.guardrail_need

    # strength increases with (baseline_complexity) and (1-lc)
    strength = clamp((1 - lc) * 0.7 + baseline_complexity * 0.3)

    # tiny cutoff so adults don't get fluff spam
    if strength < 0.18:
        return ""

    topic = title_case_topic_hint(baseline_text)

    # Keep it short for very young: still add, but don't ramble.
    # We are not bucketing by age; we only use LC and strength.
    intro_emoji = "🌟" if warmth >= 0.55 else "📌"
    if guard > 0.70 and strength > 0.45:
        opener = f"{intro_emoji} Quick heads-up before we start:\n"
        line2 = f"This topic can be tricky, so we'll take it step by step.\n\n"
    else:
        opener = f"{intro_emoji} Let's learn about {topic.lower()}!\n"
        line2 = f"We'll keep it clear and use examples.\n\n"

    # Add a micro-bridge line tuned by LC (continuous via wording length)
    bridge = ""
    if strength > 0.55:
        if lc < 0.18:
            bridge = "First, here's the simple idea. Then we'll show the expert words.\n\n"
        else:
            bridge = "Here's the idea, then we'll read the expert version.\n\n"

    return opener + line2 + bridge


# =============================================================================
# Sentence-level scaffolding
# =============================================================================

def make_decode_line(sentence: str, hits: List[GlossaryEntry], lc: float) -> Optional[str]:
    """
    "Inline definitions" without mutating baseline:
    Provide a decoded version of the sentence with parenthetical glosses.
    """
    if not hits:
        return None

    # Only decode when user likely needs it:
    # driven by LC continuously; very high LC => no decode
    need = clamp((0.35 - lc) / 0.35)  # lc=0 -> 1, lc=0.35 -> 0
    if need <= 0.05:
        return None

    decoded = sentence
    used: List[str] = []

    # Add up to 2-3 glosses depending on need
    max_terms = 1 + int(round(need * 2.2))  # 1..3
    for entry in hits:
        if len(used) >= max_terms:
            break
        key = entry.key
        if key.lower() in decoded.lower():
            # choose definition style based on lc
            definition = entry.simple if lc < 0.30 else entry.standard
            # insert gloss after first occurrence (case-insensitive)
            pattern = re.compile(re.escape(key), re.IGNORECASE)
            decoded, n = pattern.subn(lambda m: f"{m.group(0)} ({definition})", decoded, count=1)
            if n:
                used.append(key)

    if decoded == sentence:
        return None

    return f"🔎 Decode: {decoded}"

def make_definition_or_example(entry: GlossaryEntry, lc: float) -> Optional[str]:
    """
    Generates a short scaffold line. Deterministic.
    """
    definition = entry.simple if lc < 0.30 else entry.standard
    # keep it short for very low lc
    if lc < 0.12:
        return f"💡 {entry.key!r} means: {definition}."
    return f"💡 {entry.key!r} means {definition}."

def make_analogy(entry: GlossaryEntry, lc: float) -> Optional[str]:
    if not entry.analogy:
        return None
    # For very low lc, keep analogies extremely concrete and short
    if lc < 0.12:
        return f"🧠 Like: {entry.analogy}"
    return f"🧠 Analogy: {entry.analogy}"

def make_example(entry: GlossaryEntry, lc: float) -> Optional[str]:
    if not entry.example:
        return None
    if lc < 0.12:
        return f"📎 Example: {entry.example}"
    return f"📎 Example: {entry.example}"

def pick_sentence_scaffolds(
    hits: List[GlossaryEntry],
    lc: float,
    intensity: float,
    controls: TAPControlInputs
) -> List[str]:
    """
    Decide which scaffold lines to add after a sentence.
    Deterministic, driven by continuous scalars.
    """
    out: List[str] = []
    if not hits:
        return out

    # Controls influence preferences
    support_need = controls.support_need
    exploration = controls.exploration_bias
    structure = controls.structure_preference

    # Determine budget for this sentence (0..3)
    budget = 1 + int(round(intensity * 2.0))  # 1..3
    budget = max(1, min(3, budget))

    # deterministic ordering:
    # 1) definition
    # 2) example (if support/exploration high)
    # 3) analogy (if exploration high)
    primary = hits[0]

    # Always try definition first when intensity is moderate+
    if intensity > 0.18:
        d = make_definition_or_example(primary, lc)
        if d:
            out.append(d)

    if len(out) < budget:
        if (support_need + exploration) / 2 > 0.55 and primary.example:
            ex = make_example(primary, lc)
            if ex:
                out.append(ex)

    if len(out) < budget:
        if exploration > 0.55 and primary.analogy:
            an = make_analogy(primary, lc)
            if an:
                out.append(an)

    # If structure preference is high, add a tiny "step" marker (short)
    if len(out) < budget and structure > 0.70 and intensity > 0.30:
        out.append("✅ Step check: does that sentence make sense before we continue?")

    return out[:budget]


# =============================================================================
# PPI option adaptation
# =============================================================================

PPI_OPTION_LIBRARY: Dict[str, Dict[str, Any]] = {
    "RESEARCH_FIRST": {
        "simple": "Look up information first",
        "standard": "Research options before deciding",
        "gloss_simple": "You like to learn first, then choose.",
        "gloss_standard": "You prefer evidence and details before choosing."
    },
    "GUT_FEELING": {
        "simple": "Go with what feels right",
        "standard": "Trust my instincts",
        "gloss_simple": "You choose fast based on feelings.",
        "gloss_standard": "You rely on intuition more than research."
    },
    "ASK_FAMILY": {
        "simple": "Ask a grown-up I trust",
        "standard": "Ask friends or family for advice",
        "gloss_simple": "You like help from people you know.",
        "gloss_standard": "You value input from your circle."
    },
    "FOLLOW_EXPERTS": {
        "simple": "Follow advice from experts",
        "standard": "Follow what experts recommend",
        "gloss_simple": "You trust people who study this stuff.",
        "gloss_standard": "You prefer expert guidance and best practices."
    },
}

def adapt_ppi_option(opt: PPIOptionSpec, lc: float) -> Dict[str, Any]:
    """
    Deterministic:
    - For low LC: simpler option text + gloss
    - For high LC: keep original option text, no gloss
    """
    pack = PPI_OPTION_LIBRARY.get(opt.option_key, None)

    # Decide "help needed" continuously
    help_need = clamp((0.40 - lc) / 0.40)  # lc=0 ->1, lc>=0.40 -> 0

    # Keep original for high LC
    if help_need <= 0.08 or pack is None:
        return {
            "option_id": opt.option_id,
            "option_text": opt.option_text,
            "option_key": opt.option_key,
            "option_gloss": ""
        }

    # choose simple vs standard phrasing by lc (still continuous thresholding)
    option_text = pack["simple"] if lc < 0.25 else pack["standard"]

    gloss = pack["gloss_simple"] if lc < 0.18 else pack["gloss_standard"]
    return {
        "option_id": opt.option_id,
        "option_text": option_text,
        "option_key": opt.option_key,
        "option_gloss": gloss
    }


# =============================================================================
# Engine
# =============================================================================

class TAP32Engine_v321:
    """
    TAP 3.2.1 Engine

    process_lpi:
    - sentence-level interleaving scaffolds
    - baseline included verbatim
    - decode lines provide "inline definitions" without mutating baseline
    - adaptive CLS
    - baseline complexity scoring
    """

    def __init__(self, el_max_poc: int = 5):
        self.el_max_poc = el_max_poc

    def process_lpi(
        self,
        baseline_text: str,
        age: int,
        el_declared: int,
        controls: Optional[TAPControlInputs] = None
    ) -> CLGOutput:
        if controls is None:
            controls = TAPControlInputs.neutral()

        baseline_hash = sha16(baseline_text)
        lc, cd, ia = compute_lc_cd_ia(age, el_declared, self.el_max_poc)
        baseline_complexity = score_baseline_complexity(baseline_text)
        intensity = compute_scaffold_intensity(lc, baseline_complexity, controls)
        cls = compute_adaptive_cls(lc, baseline_complexity, controls)

        scalars = TAP32Scalars(
            age=age,
            el=el_declared,
            lc=lc,
            cd=cd,
            ia=ia,
            baseline_complexity=baseline_complexity,
            cls=cls,
            scaffold_intensity=intensity
        )

        additions: List[CLGAddition] = []

        # Preamble (before baseline)
        preamble = generate_preamble(
            baseline_text=baseline_text,
            lc=lc,
            age=age,
            baseline_complexity=baseline_complexity,
            controls=controls
        )
        if preamble:
            additions.append(CLGAddition(type="preamble", text=preamble.strip(), position="before"))

        # Sentence-level processing
        sentences = split_sentences(baseline_text)

        # Per-sentence scaffolding budget (scaled by intensity and cls)
        # Continuous distribution across sentences.
        total_budget = cls  # total scaffold lines allowed (rough)
        if len(sentences) > 0:
            per_sentence_budget = max(1, int(round(total_budget / len(sentences))))
        else:
            per_sentence_budget = total_budget

        debug = {
            "sentence_count": len(sentences),
            "per_sentence_budget": per_sentence_budget,
        }

        # Build final output interleaving baseline sentences + scaffolds
        final_lines: List[str] = []

        if preamble:
            final_lines.append(preamble.strip())
            final_lines.append("---")

        scaffolds_used = 0
        cls_exceeded = False

        for i, sent in enumerate(sentences):
            # Always include baseline sentence verbatim
            final_lines.append(sent)

            # Determine hits for this sentence
            hits = find_glossary_hits(sent)
            if not hits:
                continue

            # Add "decode" line for low LC / high intensity
            decode_line = make_decode_line(sent, hits, lc)
            if decode_line and scaffolds_used < total_budget:
                additions.append(CLGAddition(type="decode", text=decode_line, position="after", sentence_index=i))
                final_lines.append(decode_line)
                scaffolds_used += 1

            # Add extra scaffolds
            if scaffolds_used < total_budget:
                remaining_for_sentence = min(per_sentence_budget, total_budget - scaffolds_used)
                # Pick scaffolds deterministically (definition/example/analogy)
                lines = pick_sentence_scaffolds(hits, lc, intensity, controls)

                for line in lines:
                    if scaffolds_used >= total_budget:
                        break
                    additions.append(CLGAddition(type="scaffold", text=line, position="after", sentence_index=i))
                    final_lines.append(line)
                    scaffolds_used += 1

        if scaffolds_used > total_budget:
            cls_exceeded = True

        final_output = "\n\n".join([ln.strip() for ln in final_lines if ln.strip()]).strip()

        # Baseline mutation check: baseline must still appear verbatim somewhere in output.
        # We also check we didn't accidentally replace baseline (we didn't touch it).
        baseline_mutated = baseline_text not in final_output

        return CLGOutput(
            baseline_text=baseline_text,
            baseline_hash=baseline_hash,
            scalars=scalars,
            additions=additions,
            final_output=final_output,
            baseline_mutated=baseline_mutated,
            cls_exceeded=cls_exceeded,
            debug=debug
        )

    def process_ppi(
        self,
        question_text: str,
        options: List[PPIOptionSpec],
        age: int,
        el_declared: int
    ) -> Dict[str, Any]:
        lc, cd, ia = compute_lc_cd_ia(age, el_declared, self.el_max_poc)

        # Question scaffolding (do NOT rewrite; we can add a helper line)
        help_need = clamp((0.40 - lc) / 0.40)
        question_help = ""
        if help_need > 0.10:
            # Deterministic short helper (not a rewrite)
            if lc < 0.18:
                question_help = "💡 This question is asking how you like to choose when money is involved."
            else:
                question_help = "💡 This asks how you prefer to choose when dealing with money."

        adapted_options = [adapt_ppi_option(o, lc) for o in options]

        return {
            "question_text": question_text,
            "question_help": question_help,
            "options": adapted_options,
            "lc": lc,
            "cd": cd,
            "ia": ia
        }


# =============================================================================
# Test Harness (broad sample base)
# =============================================================================

if __name__ == "__main__":
    engine = TAP32Engine_v321()

    def run_lpi_case(case_name: str, baseline: str, age: int, el: int, controls: Optional[TAPControlInputs] = None):
        out = engine.process_lpi(baseline_text=baseline, age=age, el_declared=el, controls=controls)
        print("\n" + "="*95)
        print(f"LPI CASE: {case_name}")
        print(f"age={age} el={el} | LC={out.scalars.lc} CD={out.scalars.cd} IA={out.scalars.ia}")
        print(f"baseline_complexity={out.scalars.baseline_complexity} cls={out.scalars.cls} intensity={out.scalars.scaffold_intensity}")
        print(f"baseline_hash={out.baseline_hash} mutated={out.baseline_mutated} additions={len(out.additions)} cls_exceeded={out.cls_exceeded}")
        print("-"*95)
        print(out.final_output)

        # extra check: baseline must appear verbatim
        assert out.baseline_text in out.final_output, "Baseline missing verbatim in final output!"

    def run_ppi_case(case_name: str, question: str, age: int, el: int):
        opts = [
            PPIOptionSpec("A", "Research extensively before deciding", "RESEARCH_FIRST"),
            PPIOptionSpec("B", "Go with my gut feeling", "GUT_FEELING"),
            PPIOptionSpec("C", "Ask friends or family for advice", "ASK_FAMILY"),
            PPIOptionSpec("D", "Follow what experts recommend", "FOLLOW_EXPERTS"),
        ]
        out = engine.process_ppi(question_text=question, options=opts, age=age, el_declared=el)
        print("\n" + "="*95)
        print(f"PPI CASE: {case_name}")
        print(f"age={age} el={el} | LC={out['lc']} CD={out['cd']} IA={out['ia']}")
        if out["question_help"]:
            print(out["question_help"])
        print("-"*95)
        print(out["question_text"])
        for o in out["options"]:
            gloss = f"  -> {o['option_gloss']}" if o["option_gloss"] else ""
            print(f"{o['option_id']}. {o['option_text']}{gloss}")

    # -------------------------------------------------------------------------
    # LPI BASELINES (variety)
    # -------------------------------------------------------------------------

    BASELINE_MONEY_ORIGIN = (
        "Money is a shared agreement. We accept it today because we believe others will accept it tomorrow. "
        "Before money, people bartered—two loaves of bread for one bowl of grain. "
        "That only worked when both sides needed each other at the same time. Money solved the timing problem."
    )

    BASELINE_BUDGET = (
        "A budget is a plan for income and spending. Tracking expenses helps you notice patterns and control cash flow. "
        "Without a budget, small purchases can quietly add up and reduce savings."
    )

    BASELINE_BANK_LEDGER = (
        "Modern money can be cash, balances in a bank account, or digital entries in a secure ledger. "
        "Because money is an agreement, confidence matters. Stable rules and trusted systems keep people willing to trade."
    )

    BASELINE_SAVING_VALUE = (
        "Saving means keeping some money for later instead of spending it all now. "
        "If you save regularly, you can handle surprises and work toward bigger goals."
    )

    BASELINE_ASSET_ALLOC = (
        "Diversification reduces portfolio risk through asset allocation. "
        "A balanced approach can help limit losses when markets change."
    )

    # -------------------------------------------------------------------------
    # LPI RUNS (broad grid)
    # -------------------------------------------------------------------------

    run_lpi_case("Money origin | age 6 EL1", BASELINE_MONEY_ORIGIN, age=6, el=1)
    run_lpi_case("Money origin | age 12 EL1", BASELINE_MONEY_ORIGIN, age=12, el=1)
    run_lpi_case("Money origin | age 35 EL1", BASELINE_MONEY_ORIGIN, age=35, el=1)
    run_lpi_case("Money origin | age 35 EL5", BASELINE_MONEY_ORIGIN, age=35, el=5)

    run_lpi_case("Bank/ledger | age 6 EL1 (stress)", BASELINE_BANK_LEDGER, age=6, el=1)
    run_lpi_case("Bank/ledger | age 12 EL2", BASELINE_BANK_LEDGER, age=12, el=2)
    run_lpi_case("Bank/ledger | age 45 EL5", BASELINE_BANK_LEDGER, age=45, el=5)

    run_lpi_case("Budget | age 8 EL1", BASELINE_BUDGET, age=8, el=1)
    run_lpi_case("Budget | age 16 EL2", BASELINE_BUDGET, age=16, el=2)
    run_lpi_case("Budget | age 40 EL3", BASELINE_BUDGET, age=40, el=3)

    run_lpi_case("Saving | age 6 EL1", BASELINE_SAVING_VALUE, age=6, el=1)
    run_lpi_case("Saving | age 45 EL5", BASELINE_SAVING_VALUE, age=45, el=5)

    run_lpi_case("Diversification/Allocation | age 10 EL1", BASELINE_ASSET_ALLOC, age=10, el=1)
    run_lpi_case("Diversification/Allocation | age 30 EL2", BASELINE_ASSET_ALLOC, age=30, el=2)
    run_lpi_case("Diversification/Allocation | age 30 EL5", BASELINE_ASSET_ALLOC, age=30, el=5)

    # Control scalar stress: warm/supportive vs guardrail-heavy
    warm_controls = TAPControlInputs(
        support_need=0.8, guardrail_need=0.3, tone_warmth=0.9, pacing_density=0.4,
        structure_preference=0.6, exploration_bias=0.6
    )
    guardrail_controls = TAPControlInputs(
        support_need=0.7, guardrail_need=0.95, tone_warmth=0.3, pacing_density=0.4,
        structure_preference=0.7, exploration_bias=0.3
    )

    run_lpi_case("Budget | age 10 EL1 | warm controls", BASELINE_BUDGET, age=10, el=1, controls=warm_controls)
    run_lpi_case("Budget | age 10 EL1 | guardrail controls", BASELINE_BUDGET, age=10, el=1, controls=guardrail_controls)

    # -------------------------------------------------------------------------
    # PPI RUNS (broad)
    # -------------------------------------------------------------------------

    Q = "When making financial decisions, I prefer to:"
    run_ppi_case("PPI Q | age 6 EL1", Q, age=6, el=1)
    run_ppi_case("PPI Q | age 12 EL1", Q, age=12, el=1)
    run_ppi_case("PPI Q | age 35 EL1", Q, age=35, el=1)
    run_ppi_case("PPI Q | age 35 EL5", Q, age=35, el=5)
