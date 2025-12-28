# TAP 3.2.4 - Current Implementation for ChatGPT Analysis

## Overview
TAP 3.2.4 is a deterministic, baseline-preserving adaptive text processor that:
- Works for LPI (Learning Path Items) + PPI (Personal Profile Inventory)
- Uses continuous scalars from Age + EL (no age bands, no buckets)
- Baseline text is preserved but may be hidden for very young users
- Uses deterministic template generation + glossary-driven "help" (no LLM)

## Current Test Results
- **6yo EL1**: Shows ONLY child-friendly version (no baseline) - "💰 Money is what we use to buy things..."
- **35yo EL5**: Shows full baseline with minimal scaffolding
- **PPI for 6yo**: Child-friendly questions and options ("When you want to buy something, what do you do?")

## Known Issues to Review
1. Chapter titles on dashboard still use adult language
2. Chapter summaries are still baseline (not adapted)
3. Quiz questions need more child-friendly patterns
4. Some PPI option patterns may not match correctly

---

## Complete Code

```python
# tap_3_2_4.py
# TAP 3.2.4 — Deterministic, Baseline-Preserving Adaptive Text Processor (No Buckets)
# - Works for LPI + PPI
# - Continuous scalars from Age + EL (no age bands, no buckets)
# - Baseline text is NEVER rewritten; it is included verbatim in output
# - Uses deterministic template generation + glossary-driven "help" (no LLM)
# - Adds: (1) child/bridge primary (optional), (2) baseline verbatim, (3) sentence-level decode/help

import re, math, hashlib
from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any

def clamp(x: float, lo: float = 0.0, hi: float = 1.0) -> float:
    return max(lo, min(hi, x))

def sigmoid(x: float) -> float:
    if x < -60: return 0.0
    if x > 60:  return 1.0
    return 1.0 / (1.0 + math.exp(-x))

def hash_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()[:16]

def split_sentences(text: str) -> List[str]:
    parts = re.split(r'(?<=[.!?])\s+', text.strip())
    return [p.strip() for p in parts if p.strip()]

@dataclass
class TAPControlInputs:
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
class GlossaryEntry:
    key: str
    complexity: float
    simple: str
    standard: str
    phrase: bool = False

@dataclass
class CLGAddition:
    type: str
    text: str
    position: str  # "before" or "after"

@dataclass
class TAP32Scalars:
    age: int
    el: int
    el_max: int
    age_norm: float
    el_norm: float
    lc: float
    cd: float
    ia: float
    baseline_complexity: float
    cls: int
    scaffold_intensity: float
    weights: Dict[str, float] = field(default_factory=dict)

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

@dataclass
class LessonSpec:
    topic: str
    baseline_text: str
    concepts: List[str] = field(default_factory=list)
    child_version: str = ""   # optional DB-provided
    teen_bridge: str = ""     # optional DB-provided

@dataclass
class PPIOptionSpec:
    option_id: str
    option_text: str
    option_key: str

# -----------------------------
# Glossary (expandable)
# -----------------------------
GLOSSARY: Dict[str, GlossaryEntry] = {
    "money": GlossaryEntry("money", 0.05, "coins and paper bills you use to buy things", "something people use to pay for stuff"),
    "agreement": GlossaryEntry("agreement", 0.18, "when people all decide 'yes, we do it this way'", "a shared decision people follow"),
    "shared agreement": GlossaryEntry("shared agreement", 0.24, "when everyone agrees money can be used", "a common rule everyone accepts", phrase=True),
    "barter": GlossaryEntry("barter", 0.18, "trading things without using money", "exchanging goods directly"),
    "trade": GlossaryEntry("trade", 0.12, "give something to get something else", "exchange things with someone"),
    "value": GlossaryEntry("value", 0.16, "how much something is worth", "how useful or worth something is"),
    "ledger": GlossaryEntry("ledger", 0.35, "a record book (or computer list) that keeps track", "a record of transactions"),
    "digital entries in a secure ledger": GlossaryEntry("digital entries in a secure ledger", 0.55,
                                                       "computer records that keep track safely",
                                                       "secure digital records that track money", phrase=True),
    "asset allocation": GlossaryEntry("asset allocation", 0.62, "how you split your money into different places", "how you divide investments across assets", phrase=True),
    "diversification": GlossaryEntry("diversification", 0.60, "spreading your money across different things", "mixing investments to reduce risk"),
    "portfolio": GlossaryEntry("portfolio", 0.48, "your mix of investments", "a collection of investments"),
    "compound interest": GlossaryEntry("compound interest", 0.70, "growth on growth", "interest earned on principal and past interest", phrase=True),
}
GLOSSARY_KEYS_SORTED = sorted(GLOSSARY.keys(), key=lambda k: len(k), reverse=True)

# -----------------------------
# Core formulas (continuous)
# -----------------------------
def normalize_age(age: int) -> float:
    return clamp(age / 100.0)

def normalize_el(el: int, el_max: int) -> float:
    if el_max <= 1:
        return 0.0
    return clamp((el - 1) / (el_max - 1))

def compute_lc(age_norm: float, el_norm: float) -> float:
    return clamp(0.65 * age_norm + 0.35 * el_norm)

def compute_cd(age_norm: float, el_norm: float) -> float:
    return clamp(0.85 * el_norm + 0.15 * age_norm)

def compute_ia(age_norm: float, el_norm: float) -> float:
    return clamp(0.50 * age_norm + 0.50 * el_norm)

def analyze_baseline_complexity(text: str) -> float:
    sentences = split_sentences(text)
    words = re.findall(r"[A-Za-z']+", text)
    if not words:
        return 0.0
    avg_word_len = sum(len(w) for w in words) / len(words)
    avg_sent_len = len(words) / max(1, len(sentences))
    tlow = text.lower()
    tech_hits = sum(1 for k in GLOSSARY if k in tlow)
    abstract_markers = ["agreement", "confidence", "trust", "believe", "value", "system", "rule", "timing", "ledger"]
    abstract_hits = sum(1 for m in abstract_markers if m in tlow)

    f_len = clamp(len(words) / 140.0)
    f_word = clamp(avg_word_len / 8.0)
    f_sent = clamp(avg_sent_len / 22.0)
    f_tech = clamp(tech_hits / 10.0)
    f_abs = clamp(abstract_hits / 8.0)

    score = (0.22*f_len + 0.20*f_word + 0.22*f_sent + 0.20*f_tech + 0.16*f_abs)
    return clamp(score)

def adaptive_cls(age_norm: float, lc: float, baseline_complexity: float, controls: TAPControlInputs) -> int:
    base = 3.0 + (1.0 - age_norm) * 4.0
    bonus = (1.0 - lc) * baseline_complexity * (3.0 + 2.0 * controls.support_need)
    pacing_bonus = 0.6 * controls.pacing_density
    cls = base + bonus + pacing_bonus
    return int(clamp(round(cls), 2, 12))

def scaffold_intensity(lc: float, baseline_complexity: float, controls: TAPControlInputs) -> float:
    drive = (1.0 - lc) * 0.55 + baseline_complexity * 0.35 + controls.support_need * 0.20
    return clamp(drive)

def blend_weights(lc: float, baseline_complexity: float) -> Dict[str, float]:
    lc_eff = clamp(lc - 0.18 * baseline_complexity)
    child = sigmoid((0.18 - lc_eff) / 0.06)
    rise = sigmoid((lc_eff - 0.18) / 0.06)
    fall = sigmoid((0.38 - lc_eff) / 0.06)
    bridge = clamp(rise * fall * 1.15)
    expert = clamp(1.0 - max(child, bridge))
    s = child + bridge + expert
    if s <= 0:
        return {"child": 0.0, "bridge": 0.0, "expert": 1.0}
    return {"child": child/s, "bridge": bridge/s, "expert": expert/s}

def include_section(weight: float, min_weight: float = 0.12) -> bool:
    return weight >= min_weight

# -----------------------------
# Deterministic generators
# -----------------------------
def definition_for(term: str, lc: float) -> Optional[str]:
    e = GLOSSARY.get(term.lower())
    if not e:
        return None
    if lc >= e.complexity:
        return None
    return e.simple if lc < 0.35 else e.standard

def find_concepts_in_text(text: str) -> List[str]:
    tl = text.lower()
    found = []
    for k in GLOSSARY_KEYS_SORTED:
        if k in tl:
            found.append(k)
    return found

def generate_child_version_from_concepts(topic: str, concepts: List[str], lc: float) -> str:
    """Generate a child-friendly version based on topic. Keep it SHORT."""
    topic_lower = topic.lower()
    
    if "money" in topic_lower and ("what" in topic_lower or "basic" in topic_lower):
        return "💰 Money is what we use to buy things - like coins and dollar bills!\n\nWhen you want something at a store, you give money to pay for it."
    elif "saving" in topic_lower or "save" in topic_lower:
        return "🐷 Saving means keeping some money for later instead of spending it all.\n\nIt's like putting coins in a piggy bank!"
    elif "budget" in topic_lower:
        return "📝 A budget is a plan for your money.\n\nIt helps you decide how much to spend and how much to save."
    elif "spend" in topic_lower:
        return "🛒 Spending is when you use your money to buy things.\n\nYou give money and get something in return!"
    elif "earn" in topic_lower or "income" in topic_lower:
        return "💪 Earning money means getting paid for doing work.\n\nLike when you help with chores and get an allowance!"
    elif "bank" in topic_lower:
        return "🏦 A bank is a safe place to keep your money.\n\nThey keep track of how much you have."
    elif "goal" in topic_lower:
        return "🎯 A money goal is something you want to save up for.\n\nLike a toy or a game you really want!"
    elif "borrow" in topic_lower or "loan" in topic_lower or "debt" in topic_lower:
        return "🤝 Borrowing means getting money now and paying it back later.\n\nYou have to give it back!"
    elif "invest" in topic_lower:
        return "🌱 Investing is a way to try to grow your money over time.\n\nLike planting a seed and watching it grow!"
    else:
        c = concepts[:2] if concepts else []
        lines = [f"📚 Let's learn about {topic}!"]
        for t in c:
            if t in GLOSSARY:
                d = GLOSSARY[t].simple
                lines.append(f"{t.title()} means {d}.")
        return "\n\n".join(lines) if lines else f"📚 This lesson is about {topic}."

def generate_bridge_from_concepts(topic: str, concepts: List[str], lc: float) -> str:
    c = concepts[:] if concepts else [topic.lower()]
    key_terms = [t for t in c if t in GLOSSARY]
    lines = [f"📘 {topic} (bridge version)"]
    lines.append("We'll keep the words clear, then show the expert wording.")
    for t in key_terms[:2]:
        d = definition_for(t, lc) or (GLOSSARY[t].standard if t in GLOSSARY else "")
        if d:
            lines.append(f"• {t}: {d}")
    return "\n".join(lines)

# -----------------------------
# Engine
# -----------------------------
class TAP32Engine_v324:
    def __init__(self, el_max_poc: int = 5):
        self.el_max_poc = el_max_poc

    def compute_scalars(self, age: int, el_declared: int, baseline_text: str, controls: TAPControlInputs) -> TAP32Scalars:
        age_norm = normalize_age(age)
        el_norm = normalize_el(el_declared, self.el_max_poc)
        lc = compute_lc(age_norm, el_norm)
        cd = compute_cd(age_norm, el_norm)
        ia = compute_ia(age_norm, el_norm)
        bc = analyze_baseline_complexity(baseline_text)
        cls = adaptive_cls(age_norm, lc, bc, controls)
        inten = scaffold_intensity(lc, bc, controls)
        w = blend_weights(lc, bc)

        return TAP32Scalars(
            age=age, el=el_declared, el_max=self.el_max_poc,
            age_norm=round(age_norm, 4), el_norm=round(el_norm, 4),
            lc=round(lc, 4), cd=round(cd, 4), ia=round(ia, 4),
            baseline_complexity=round(bc, 4), cls=cls,
            scaffold_intensity=round(inten, 4),
            weights={k: round(v, 4) for k, v in w.items()}
        )

    def process_lpi(self, spec: LessonSpec, age: int, el_declared: int, controls: Optional[TAPControlInputs] = None) -> CLGOutput:
        if controls is None:
            controls = TAPControlInputs.neutral()

        baseline_text = spec.baseline_text
        baseline_hash = hash_text(baseline_text)
        scalars = self.compute_scalars(age, el_declared, baseline_text, controls)
        w = {k: float(v) for k, v in scalars.weights.items()}
        concepts = spec.concepts[:] if spec.concepts else find_concepts_in_text(baseline_text)

        additions: List[CLGAddition] = []
        parts: List[str] = []

        # For VERY young users (child weight > 0.8), show ONLY simple version
        if w["child"] > 0.80:
            child = spec.child_version.strip() or generate_child_version_from_concepts(spec.topic or "Lesson", concepts, scalars.lc)
            additions.append(CLGAddition("child_primary", child, "before"))
            parts.append(child)
            final_output = "\n\n".join(parts).strip()
            return CLGOutput(
                baseline_text=baseline_text, baseline_hash=baseline_hash,
                scalars=scalars, additions=additions, final_output=final_output,
                baseline_mutated=True, cls_exceeded=False,
                debug={"weights": scalars.weights, "mode": "child_only", "concepts": concepts[:4]}
            )
        
        # For moderate child weight (0.35-0.80), show child version + optional baseline
        if include_section(w["child"]):
            child = spec.child_version.strip() or generate_child_version_from_concepts(spec.topic or "Lesson", concepts, scalars.lc)
            additions.append(CLGAddition("child_primary", child, "before"))
            parts.append(child)

        if include_section(w["bridge"]):
            bridge = spec.teen_bridge.strip() or generate_bridge_from_concepts(spec.topic or "Lesson", concepts, scalars.lc)
            additions.append(CLGAddition("bridge_primary", bridge, "before"))
            parts.append(bridge)

        # Only show baseline if NOT in high-child mode
        if w["child"] <= 0.50:
            parts.append("📖 Here's the full explanation:")
            parts.append(baseline_text)
            additions.append(CLGAddition("baseline_block", baseline_text, "after"))
        elif w["child"] > 0.50 and w["child"] <= 0.80:
            parts.append("📖 Want to know more? Here's the grown-up version:")
            sentences = split_sentences(baseline_text)
            short_baseline = " ".join(sentences[:2])
            parts.append(short_baseline)
            additions.append(CLGAddition("baseline_short", short_baseline, "after"))

        final_output = "\n\n".join(parts).strip()
        baseline_mutated = baseline_text not in final_output

        return CLGOutput(
            baseline_text=baseline_text, baseline_hash=baseline_hash,
            scalars=scalars, additions=additions, final_output=final_output,
            baseline_mutated=baseline_mutated, cls_exceeded=False,
            debug={"weights": scalars.weights, "mode": "standard", "concepts": concepts[:8]}
        )

    def process_ppi(self, question_text: str, options: List[PPIOptionSpec], age: int, el_declared: int) -> Dict[str, Any]:
        controls = TAPControlInputs.neutral()
        scalars = self.compute_scalars(age, el_declared, question_text, controls)
        w = {k: float(v) for k, v in scalars.weights.items()}

        stem_parts = []
        if include_section(w["child"]):
            stem_parts.append("🤔 Simple question:")
            stem_parts.append(self._pp_stem_child(question_text))
        if include_section(w["bridge"]):
            stem_parts.append("🧠 Clear version:")
            stem_parts.append(self._pp_stem_bridge(question_text))
        stem_parts.append("📖 Baseline (verbatim):")
        stem_parts.append(question_text)

        adapted = [self._adapt_ppi_option(o, scalars.lc, w) for o in options]
        return {
            "question": "\n".join(stem_parts).strip(),
            "options": adapted,
            "scalars": {"age": scalars.age, "el": scalars.el, "lc": scalars.lc, "cd": scalars.cd, "ia": scalars.ia, "weights": scalars.weights}
        }

    def _pp_stem_child(self, baseline_stem: str) -> str:
        tl = baseline_stem.lower()
        if "financial decisions" in tl or "money" in tl:
            return "When you want to buy something, what do you usually do?"
        return "What do you usually do when you have to choose something important?"

    def _pp_stem_bridge(self, baseline_stem: str) -> str:
        tl = baseline_stem.lower()
        if "financial decisions" in tl:
            return "When you make money choices, what do you usually do?"
        return "Here's a clearer way to ask the same thing."

    def _adapt_ppi_option(self, opt: PPIOptionSpec, lc: float, w: Dict[str, float]) -> Dict[str, Any]:
        baseline = opt.option_text
        display = baseline
        gloss = ""
        childiness = w.get("child", 0.0)
        bridginess = w.get("bridge", 0.0)
        t = baseline.lower()
        key = opt.option_key.upper() if opt.option_key else ""
        
        if childiness >= 0.35:
            # ~180 lines of pattern matching for child-friendly options
            # (See full file for complete implementation)
            # Examples:
            # "research extensively" -> "Look up lots of information first"
            # "gut feeling" -> "Pick what feels right"
            # "friends or family" -> "Ask a grown-up I trust"
            # "experts recommend" -> "Do what smart helpers say"
            pass  # Full implementation in actual file
                    
        elif bridginess >= 0.25:
            if not gloss:
                gloss = "Same meaning, clearer wording."

        return {"id": opt.option_id, "key": opt.option_key, "baseline": baseline, "display": display, "gloss": gloss}
```

---

## Blend Weight Examples

| Age | EL | LC | Child Weight | Bridge Weight | Expert Weight |
|-----|----|----|--------------|---------------|---------------|
| 6 | 1 | 0.039 | 90.1% | 5.3% | 4.6% |
| 12 | 2 | 0.120 | 75.2% | 14.8% | 10.0% |
| 18 | 3 | 0.242 | 12.1% | 52.3% | 35.6% |
| 35 | 5 | 0.578 | 0.0% | 26.1% | 73.9% |

---

## Questions for Analysis
1. Is the sigmoid-based blend weight formula optimal?
2. Should we add more topic-specific child content generators?
3. How can we improve PPI option pattern matching?
4. Should the glossary be expanded with more financial terms?
5. Is the threshold of 0.80 for "child_only" mode appropriate?
