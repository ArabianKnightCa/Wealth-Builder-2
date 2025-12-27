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
    # No buckets: continuous base + continuous bonuses, then rounded.
    base = 3.0 + (1.0 - age_norm) * 4.0  # 3..7 roughly
    bonus = (1.0 - lc) * baseline_complexity * (3.0 + 2.0 * controls.support_need)
    pacing_bonus = 0.6 * controls.pacing_density
    cls = base + bonus + pacing_bonus
    return int(clamp(round(cls), 2, 12))

def scaffold_intensity(lc: float, baseline_complexity: float, controls: TAPControlInputs) -> float:
    drive = (1.0 - lc) * 0.55 + baseline_complexity * 0.35 + controls.support_need * 0.20
    return clamp(drive)

def blend_weights(lc: float, baseline_complexity: float) -> Dict[str, float]:
    # No buckets: continuous blend of child/bridge/expert weights.
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
    # Deterministic noise gate (display). Not a bucket in LC-space.
    return weight >= min_weight

# -----------------------------
# Deterministic generators (template-based)
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
    """
    Generate a child-friendly version based on topic.
    Keep it SHORT - 2-3 sentences max for young readers.
    """
    topic_lower = topic.lower()
    
    # Topic-specific child-friendly explanations
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
        # Generic fallback
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

def inline_define_sentence(sentence: str, lc: float, max_inlines: int = 2) -> str:
    # Insert inline parentheticals into a COPY for decode/help lines (never baseline).
    out = sentence
    used = 0
    for term in GLOSSARY_KEYS_SORTED:
        if used >= max_inlines:
            break
        pattern = re.compile(r'\b' + re.escape(term) + r'\b', re.IGNORECASE)
        if pattern.search(out):
            d = definition_for(term, lc)
            if d:
                out = pattern.sub(lambda m: f"{m.group(0)} ({d})", out, count=1)
                used += 1
    return out

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
            age_norm=round(age_norm, 4),
            el_norm=round(el_norm, 4),
            lc=round(lc, 4),
            cd=round(cd, 4),
            ia=round(ia, 4),
            baseline_complexity=round(bc, 4),
            cls=cls,
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

        # Primary (child/bridge) is optional but allowed; baseline always included verbatim.
        if include_section(w["child"]):
            child = spec.child_version.strip() or generate_child_version_from_concepts(spec.topic or "Lesson", concepts, scalars.lc)
            additions.append(CLGAddition("child_primary", child, "before"))
            parts.append(child)

        if include_section(w["bridge"]):
            bridge = spec.teen_bridge.strip() or generate_bridge_from_concepts(spec.topic or "Lesson", concepts, scalars.lc)
            additions.append(CLGAddition("bridge_primary", bridge, "before"))
            parts.append(bridge)

        label = "📖 Expert version (verbatim):" if (w["child"] > 0.5 and include_section(w["child"])) else "📖 Baseline (verbatim):"
        parts.append(label)
        parts.append(baseline_text)
        additions.append(CLGAddition("baseline_block", baseline_text, "after"))

        # Sentence-level help (interleaved conceptually; displayed as a help section, deterministic)
        help_drive = clamp(
            (1 - scalars.lc) * 0.55 +
            scalars.baseline_complexity * 0.35 +
            w["child"] * 0.25 +
            w["bridge"] * 0.15 +
            controls.support_need * 0.10
        )
        target_help = int(clamp(round(help_drive * scalars.cls), 0, scalars.cls))

        if target_help > 0:
            parts.append("🧩 Sentence help:")
            sentences = split_sentences(baseline_text)
            for idx, s in enumerate(sentences[:target_help]):
                decoded = inline_define_sentence(s, scalars.lc, max_inlines=2 if w["child"] > 0.5 else 1)
                if decoded != s:
                    line = f"• Decode {idx+1}: {decoded}"
                else:
                    hits = [c for c in concepts if c in s.lower()][:2]
                    glosses = []
                    for h in hits:
                        d = definition_for(h, scalars.lc)
                        if d:
                            glosses.append(f"{h} = {d}")
                    line = f"• Help {idx+1}: " + ("; ".join(glosses) if glosses else "This sentence is explaining a key idea.")
                parts.append(line)
                additions.append(CLGAddition("sentence_help", line, "after"))

        final_output = "\n\n".join(parts).strip()
        baseline_mutated = baseline_text not in final_output

        return CLGOutput(
            baseline_text=baseline_text,
            baseline_hash=baseline_hash,
            scalars=scalars,
            additions=additions,
            final_output=final_output,
            baseline_mutated=baseline_mutated,
            cls_exceeded=False,
            debug={"weights": scalars.weights, "help_drive": round(help_drive, 4), "target_help": target_help, "concepts": concepts[:8]}
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
        return {"question": "\n".join(stem_parts).strip(), "options": adapted, "scalars": {"age": scalars.age, "el": scalars.el, "lc": scalars.lc, "cd": scalars.cd, "ia": scalars.ia, "weights": scalars.weights}}

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
            # Child-friendly adaptations - more specific patterns first
            
            # Tracking spending frequency
            if "daily" in t or "weekly" in t:
                display = "Very often"
                gloss = "You check your money a lot."
            elif "monthly" in t and ("track" in t or key == "UNKNOWN"):
                display = "Once a month"
                gloss = "You check your money sometimes."
            elif "rarely" in t or "never" in t:
                display = "Not very often"
                gloss = "You don't check your money much."
            elif "worried about money" in t:
                display = "Only when I'm worried"
                gloss = "You check when something feels wrong."
            
            # Learning preferences
            elif "reading and research" in t:
                display = "Reading books or articles"
                gloss = "You like to read to learn."
            elif "hands-on" in t or "practice" in t:
                display = "Trying things myself"
                gloss = "You learn by doing."
            elif "video" in t or "tutorial" in t:
                display = "Watching videos"
                gloss = "You like to watch and learn."
            elif "discussion" in t or "conversation" in t:
                display = "Talking with others"
                gloss = "You like to learn by chatting."
            
            # Research/information first
            elif "research" in t or "extensively" in t or key == "RESEARCH_FIRST":
                display = "Look up lots of information first"
                gloss = "You like to learn first, then choose."
            
            # Gut feeling / intuition
            elif "gut" in t or ("feeling" in t and "anxious" not in t and "worried" not in t) or "instinct" in t or key == "GUT_FEELING":
                display = "Pick what feels right"
                gloss = "You choose fast based on feelings."
            
            # Ask family/friends
            elif "friends" in t or "family" in t or "grown" in t or ("advice" in t and "expert" not in t) or key == "ASK_FAMILY":
                display = "Ask a grown-up I trust"
                gloss = "You like help from someone you know."
            
            # Follow experts
            elif "expert" in t or "professional" in t or ("recommend" in t and "friend" not in t) or key == "FOLLOW_EXPERTS":
                display = "Do what smart helpers say"
                gloss = "You trust people who study this."
            
            # Save - different variations
            elif "fixed amount" in t or "same amount" in t:
                display = "Save the same amount every time"
                gloss = "You save a little bit often."
            elif "left over" in t or "leftover" in t or "whatever is left" in t:
                display = "Save what's extra"
                gloss = "You save after getting what you need."
            elif "emergency" in t:
                display = "Save for surprises"
                gloss = "You keep money ready for emergencies."
            elif "specific goal" in t:
                display = "Save for something special"
                gloss = "You save up for things you want."
            elif "struggle to save" in t:
                display = "Saving is hard for me"
                gloss = "It's tricky to save sometimes."
            elif "save most" in t or "save all" in t:
                display = "Save it all"
                gloss = "You like to keep your money."
            
            # Spend variations
            elif "spend it on something" in t or "something i've wanted" in t:
                display = "Buy something fun"
                gloss = "You like to get things you want."
            elif "split" in t and "saving" in t and "spending" in t:
                display = "Save some, spend some"
                gloss = "You do a little of both."
            
            # Bills / debt
            elif "pay bills" in t or "pay off debt" in t or "paying off debt" in t:
                display = "Pay what I owe"
                gloss = "You make sure to pay people back."
            
            # Budget
            elif "budget" in t or "learn to budget" in t:
                display = "Learn to plan my money"
                gloss = "You want to get better at planning."
            
            # Goal setting preferences
            elif "detailed plan" in t or "specific timeline" in t:
                display = "Make a careful plan"
                gloss = "You like to know exactly what to do."
            elif "general direction" in t or "without strict" in t:
                display = "Have a basic idea"
                gloss = "You like some freedom in your plan."
            elif "short-term goal" in t or "achieve quickly" in t:
                display = "Small goals I can do soon"
                gloss = "You like quick wins."
            elif "long-term" in t and ("vision" in t or "flexibility" in t):
                display = "Big dreams with room to change"
                gloss = "You think big but stay flexible."
            
            # Spending habits
            elif "disciplined" in t:
                display = "Very careful with money"
                gloss = "You're good at controlling spending."
            elif "controlled" in t and "splurge" in t:
                display = "Mostly careful, sometimes not"
                gloss = "You're usually careful but sometimes spend extra."
            elif "impulsive" in t:
                display = "Sometimes buy things suddenly"
                gloss = "You sometimes buy without planning."
            elif "reactive to emotions" in t or "emotional" in t:
                display = "Feelings affect my spending"
                gloss = "How you feel changes what you buy."
            
            # Handling setbacks
            elif "quickly adjust" in t or "move forward" in t:
                display = "Fix it and keep going"
                gloss = "You bounce back fast."
            elif "discouraged" in t and "recover" in t:
                display = "Feel sad but get better"
                gloss = "It's hard at first but you recover."
            elif "need support" in t or "support from others" in t:
                display = "Need help from others"
                gloss = "You like help when things are hard."
            elif "difficult to bounce back" in t or "very difficult" in t:
                display = "It's really hard to recover"
                gloss = "Setbacks are tough for you."
            
            # Risk comfort
            elif "high" in t and "calculated risk" in t:
                display = "I like trying new things"
                gloss = "You're brave with money choices."
            elif "moderate" in t and "some risk" in t:
                display = "A little risk is okay"
                gloss = "You're careful but not too scared."
            elif ("low" in t or "prefer safety" in t) and ("stability" in t or "safe" in t):
                display = "I like to keep my money safe"
                gloss = "You don't like taking chances."
            
            # Emotional states
            elif "excited" in t and "optimistic" in t:
                display = "Happy and hopeful"
                gloss = "You feel good about money."
            elif "anxious" in t or "worried" in t:
                display = "A little worried"
                gloss = "Money can feel tricky sometimes."
            elif "uncertain" in t and "hopeful" in t:
                display = "Not sure, but hopeful"
                gloss = "You're still figuring it out."
            elif "confident" in t and "prepared" in t:
                display = "Ready and sure"
                gloss = "You feel you know what to do."
            
            # Credit card related
            elif "pay in full" in t or "responsibly" in t:
                display = "I'm careful with it"
                gloss = "You use cards wisely."
            elif "avoid" in t and "completely" in t:
                display = "I don't use them"
                gloss = "You prefer not to use cards."
            elif "carry a balance" in t:
                display = "Sometimes I owe money on it"
                gloss = "You sometimes have money left to pay."
            elif "struggle" in t and "credit" in t:
                display = "It's hard to manage"
                gloss = "Cards can be tricky."
            
            else:
                # For unknown patterns, simplify language if possible
                display = self._simplify_option_text(baseline)
                if display != baseline:
                    gloss = "Same idea, simpler words."
                    
        elif bridginess >= 0.25:
            if not gloss:
                gloss = "Same meaning, clearer wording."

        return {"id": opt.option_id, "key": opt.option_key, "baseline": baseline, "display": display, "gloss": gloss}
    
    def _simplify_option_text(self, text: str) -> str:
        """Attempt basic text simplification for child display."""
        # Simple word replacements
        replacements = {
            "extensively": "a lot",
            "research": "look up info",
            "financial": "money",
            "decisions": "choices",
            "recommend": "say to do",
            "consider": "think about",
            "prioritize": "focus on",
            "accumulate": "save up",
            "expenditure": "spending",
            "immediately": "right away",
            "purchase": "buy",
            "evaluate": "check",
            "analyze": "look at",
            "consult": "ask",
            "professional": "expert",
            "determine": "figure out",
            "sufficient": "enough",
            "allocate": "split up",
        }
        result = text
        for old, new in replacements.items():
            result = result.replace(old, new)
            result = result.replace(old.capitalize(), new.capitalize())
        return result


# -----------------------------
# Test Harness
# -----------------------------
if __name__ == "__main__":
    BASELINE_MONEY_ORIGIN = (
        "Money is a shared agreement. We accept it today because we believe others will accept it tomorrow. "
        "Before money, people bartered—two loaves of bread for one bowl of grain. That only worked when both sides "
        "needed each other at the same time. Money solved the timing problem. It became a convenient 'middle step' "
        "that stores value until you're ready to use it. Modern money can be cash, balances in a bank account, or "
        "digital entries in a secure ledger. Because money is an agreement, confidence matters. Stable rules and trusted systems "
        "keep people willing to trade."
    )

    engine = TAP32Engine_v324(el_max_poc=5)
    spec = LessonSpec(
        topic="What is Money?",
        baseline_text=BASELINE_MONEY_ORIGIN,
        concepts=["money", "shared agreement", "barter", "value", "ledger", "digital entries in a secure ledger"]
    )

    print("=" * 80)
    print("--- Processing LPI for Age 6, EL 1 ---")
    print("=" * 80)
    out_age6_el1 = engine.process_lpi(spec, age=6, el_declared=1)
    print(out_age6_el1.final_output)
    print("\nDebug Info:")
    for k, v in out_age6_el1.debug.items():
        print(f"  {k}: {v}")
    print("-" * 80)

    print("\n" + "=" * 80)
    print("--- Processing LPI for Age 12, EL 2 ---")
    print("=" * 80)
    out_age12_el2 = engine.process_lpi(spec, age=12, el_declared=2)
    print(out_age12_el2.final_output)
    print("\nDebug Info:")
    for k, v in out_age12_el2.debug.items():
        print(f"  {k}: {v}")
    print("-" * 80)

    print("\n" + "=" * 80)
    print("--- Processing LPI for Age 35, EL 5 ---")
    print("=" * 80)
    out_age35_el5 = engine.process_lpi(spec, age=35, el_declared=5)
    print(out_age35_el5.final_output)
    print("\nDebug Info:")
    for k, v in out_age35_el5.debug.items():
        print(f"  {k}: {v}")
    print("-" * 80)

    print("\n" + "=" * 80)
    print("--- Processing PPI for Age 6, EL 1 ---")
    print("=" * 80)
    ppi_question = "When making financial decisions, I prefer to:"
    ppi_options = [
        PPIOptionSpec(option_id="A", option_text="Research extensively before deciding", option_key="RESEARCH_FIRST"),
        PPIOptionSpec(option_id="B", option_text="Go with my gut feeling", option_key="GUT_FEELING"),
        PPIOptionSpec(option_id="C", option_text="Ask friends or family for advice", option_key="ASK_FAMILY"),
        PPIOptionSpec(option_id="D", option_text="Follow what experts recommend", option_key="FOLLOW_EXPERTS"),
    ]
    ppi_result = engine.process_ppi(ppi_question, ppi_options, age=6, el_declared=1)
    print("Question:")
    print(ppi_result["question"])
    print("\nOptions:")
    for opt in ppi_result["options"]:
        print(f"  {opt['id']}. Display: '{opt['display']}' | Baseline: '{opt['baseline']}' | Gloss: '{opt['gloss']}'")
    print(f"\nScalars: {ppi_result['scalars']}")
    print("-" * 80)

    print("\n" + "=" * 80)
    print("--- Processing PPI for Age 35, EL 5 ---")
    print("=" * 80)
    ppi_result_adult = engine.process_ppi(ppi_question, ppi_options, age=35, el_declared=5)
    print("Question:")
    print(ppi_result_adult["question"])
    print("\nOptions:")
    for opt in ppi_result_adult["options"]:
        print(f"  {opt['id']}. Display: '{opt['display']}' | Baseline: '{opt['baseline']}' | Gloss: '{opt['gloss']}'")
    print(f"\nScalars: {ppi_result_adult['scalars']}")
    print("-" * 80)
