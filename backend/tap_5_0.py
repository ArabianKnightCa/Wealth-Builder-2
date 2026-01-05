# TAP v5.0 - Text Adaptation Processor
# Version: 5.0
# Release Date: January 1, 2026
# Status: Production

"""
TAP v5.0 - Complete System Implementation

TAP adapts financial education content based on:
- Age: 6-99 (continuous)
- EL (Experience Level): 1-5 (POC), scalable to 15
- DNA: 3-6 personality traits from 24 VIA Character Strengths

Core Principle: TAP changes HOW content is delivered, NOT WHAT is taught.
"""

import re
import hashlib
import statistics
import logging
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Tuple, Any
from collections import defaultdict
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

# =============================================================================
# CONFIGURATION
# =============================================================================

POC_CONFIG = {
    'version': '5.0',
    'ppi_questions_l1': 30,
    'ppi_questions_total': 270,
    'ppi_layers': 7,
    'el_range': (1, 5),
    'el_max': 5,
    'age_range': (6, 99),
    'lpi_lessons': 10,
    'dna_target_size': (3, 4),
    'dna_max_size': 6,
    'via_traits_total': 24,
    'confidence_threshold': 0.40,
    'confidence_primary_threshold': 0.55,
    'differentiation_threshold': 0.20,
    'ceiling_detection_threshold': 0.90,
    'coverage_weight': 0.75,
    'signal_weight': 0.25,
}

COMMERCIAL_CONFIG = {
    'version': '5.0',
    'ppi_questions_l1': 30,
    'ppi_questions_total': 270,
    'ppi_layers': 7,
    'el_range': (1, 15),
    'el_max': 15,
    'age_range': (6, 99),
    'lpi_lessons': 'unlimited',
    'dna_target_size': (3, 6),
    'dna_max_size': 6,
    'via_traits_total': 24,
    'confidence_threshold': 0.40,
    'confidence_primary_threshold': 0.55,
    'differentiation_threshold': 0.20,
    'ceiling_detection_threshold': 0.90,
    'coverage_weight': 0.75,
    'signal_weight': 0.25,
}

# Layer Configuration
LAYER_CONFIGS = {
    1: {'weight': 1.0, 'questions': 30, 'depth': 'broad_baseline'},
    2: {'weight': 1.1, 'questions': 40, 'depth': 'contextual'},
    3: {'weight': 1.2, 'questions': 40, 'depth': 'situational'},
    4: {'weight': 1.3, 'questions': 40, 'depth': 'emotional'},
    5: {'weight': 1.4, 'questions': 40, 'depth': 'psychological'},
    6: {'weight': 1.5, 'questions': 40, 'depth': 'nuanced'},
    7: {'weight': 1.5, 'questions': 40, 'depth': 'maximum_resolution'},
}

# VIA Character Strengths (24 traits)
VIA_TRAITS = [
    'Creativity', 'Curiosity', 'Judgment', 'Love of Learning', 'Perspective',
    'Bravery', 'Perseverance', 'Honesty', 'Zest',
    'Love', 'Kindness', 'Social Intelligence',
    'Teamwork', 'Fairness', 'Leadership',
    'Forgiveness', 'Humility', 'Prudence', 'Self-Regulation',
    'Appreciation of Beauty', 'Gratitude', 'Hope', 'Humor', 'Spirituality'
]

# Trait Conflicts
CONFLICTS = {
    'Prudence': ['Zest', 'Bravery'],
    'Judgment': ['Creativity'],
    'Perspective': ['Curiosity'],
    'Self-Regulation': ['Zest'],
    'Humility': ['Leadership'],
}

# Term Complexity for Micro-Gloss System
TERM_COMPLEXITY = {
    'compound interest': 3,
    'diversification': 4,
    'liquidity': 3,
    'appreciation': 2,
    'amortization': 5,
    'portfolio': 3,
    'asset': 2,
    'liability': 3,
    'equity': 4,
    'dividend': 3,
    'interest rate': 2,
    'principal': 3,
    'budget': 1,
    'savings': 1,
    'investment': 2,
    'stock': 2,
    'bond': 3,
    'mutual fund': 3,
    'index fund': 3,
    'etf': 4,
    'inflation': 3,
    'depreciation': 3,
    'credit score': 2,
    'apr': 3,
    'apy': 3,
}

MICRO_GLOSSES = {
    'compound interest': 'growth that builds on itself',
    'diversification': 'spreading money across different investments',
    'liquidity': 'how quickly you can turn something into cash',
    'appreciation': 'when something grows in value',
    'amortization': 'paying off a loan bit by bit over time',
    'portfolio': 'collection of investments',
    'asset': 'something you own that has value',
    'liability': 'money you owe',
    'equity': 'ownership in something',
    'dividend': 'money a company pays to shareholders',
    'interest rate': 'the cost of borrowing money',
    'principal': 'the original amount of money',
    'budget': 'a plan for your money',
    'savings': 'money you keep for later',
    'investment': 'using money to make more money',
    'stock': 'a piece of ownership in a company',
    'bond': 'lending money to a company or government',
    'mutual fund': 'a basket of many investments',
    'index fund': 'a fund that tracks the whole market',
    'etf': 'exchange-traded fund - like a mutual fund you can trade',
    'inflation': 'when prices go up over time',
    'depreciation': 'when something loses value',
    'credit score': 'a number showing how trustworthy you are with money',
    'apr': 'annual percentage rate - yearly cost of borrowing',
    'apy': 'annual percentage yield - yearly return on savings',
}

# Framing Strategies
FRAMING_STRATEGIES = {
    'Curiosity': {
        'prefix': "Let's explore why...",
        'tone': 'explanatory',
        'examples': 'mechanism-focused',
        'questions': 'encourages deeper inquiry'
    },
    'Prudence': {
        'prefix': "Let's carefully consider...",
        'tone': 'cautious',
        'examples': 'risk-aware',
        'questions': 'focuses on consequences'
    },
    'Hope': {
        'prefix': "This will help you progress toward...",
        'tone': 'optimistic',
        'examples': 'goal-oriented',
        'questions': 'emphasizes future benefits'
    },
    'Perseverance': {
        'prefix': "Building on what you've learned...",
        'tone': 'steady',
        'examples': 'incremental-progress',
        'questions': 'acknowledges effort'
    },
    'Judgment': {
        'prefix': "Let's analyze the key factors...",
        'tone': 'analytical',
        'examples': 'comparison-focused',
        'questions': 'encourages critical thinking'
    },
    'Self-Regulation': {
        'prefix': "Let's approach this systematically...",
        'tone': 'structured',
        'examples': 'step-by-step',
        'questions': 'emphasizes control and planning'
    },
    'Zest': {
        'prefix': "Here's an exciting opportunity...",
        'tone': 'energetic',
        'examples': 'dynamic and engaging',
        'questions': 'emphasizes enthusiasm'
    },
    'Love': {
        'prefix': "This matters for you and those you care about...",
        'tone': 'relational',
        'examples': 'people-focused',
        'questions': 'emphasizes relationships'
    },
    'Bravery': {
        'prefix': "This might feel challenging, but...",
        'tone': 'encouraging',
        'examples': 'courage-focused',
        'questions': 'acknowledges difficulty'
    },
    'Kindness': {
        'prefix': "Understanding this helps you help others...",
        'tone': 'compassionate',
        'examples': 'impact-on-others',
        'questions': 'emphasizes giving'
    },
    'Gratitude': {
        'prefix': "Appreciating what you have...",
        'tone': 'thankful',
        'examples': 'abundance-focused',
        'questions': 'emphasizes contentment'
    },
    'Honesty': {
        'prefix': "Here's the truth about...",
        'tone': 'direct',
        'examples': 'reality-based',
        'questions': 'emphasizes authenticity'
    },
}

# Safe split patterns for sentence splitting
SAFE_SPLIT_PATTERNS = [
    r'\s+and\s+',
    r'\s+but\s+',
    r';\s*',
    r'—',
    r'\.\s+',
]

UNSAFE_STARTS = ['and', 'but', 'or', 'because', 'so', 'yet']


# =============================================================================
# DATA CLASSES
# =============================================================================

@dataclass
class ValidationError(Exception):
    """Custom exception for input validation failures"""
    message: str


@dataclass
class PPIAnswer:
    """Represents a single PPI answer"""
    question_id: str
    option: str  # A, B, C, or D
    deltas: List[Dict[str, float]] = field(default_factory=list)


@dataclass
class TraitScore:
    """Represents a trait with its scores"""
    name: str
    score: float
    norm: float
    confidence: float


@dataclass 
class DNAResult:
    """Result of DNA generation"""
    primary: List[TraitScore]
    secondary: List[TraitScore]
    all_traits: List[TraitScore]
    differentiation: float
    coverage: float


@dataclass
class TAPScalars:
    """TAP calculation scalars"""
    age: int
    el: int
    age_norm: float
    el_norm: float
    lc: float  # Learning Complexity
    childiness: float
    weights: Dict[str, float]


@dataclass
class TAPControlInputs:
    """Control inputs for TAP processing"""
    friction: float = 0.0
    momentum: float = 0.5
    verbosity: float = 0.0
    
    @classmethod
    def neutral(cls) -> "TAPControlInputs":
        return cls(friction=0.0, momentum=0.5, verbosity=0.0)


@dataclass
class LessonSpec:
    """Specification for a lesson"""
    baseline_text: str
    topic: str
    takeaway: str


@dataclass
class PPIOptionSpec:
    """Specification for a PPI option"""
    id: str
    baseline: str
    display: str = ""
    gloss: str = ""


@dataclass
class AdaptedContent:
    """Result of content adaptation"""
    child_text: str
    bridge_text: str
    expert_text: str
    selected_text: str
    blend_weights: Dict[str, float]
    tap_version: str = "5.0"
    scalars: Optional[TAPScalars] = None


@dataclass
class QuizAnalysis:
    """Result of quiz camouflage analysis"""
    passed: bool
    issues: List[Dict[str, Any]]
    statistics: Dict[str, float]


# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

def clamp(x: float, lo: float = 0.0, hi: float = 1.0) -> float:
    """Bound value to [lo, hi] range"""
    return max(lo, min(hi, x))


def get_question_layer(question_id: str) -> int:
    """
    Extract layer number from question_id
    Format: PPI_L#_Q##
    """
    match = re.search(r'PPI_L(\d+)_Q\d+', question_id)
    return int(match.group(1)) if match else 1


def get_valid_question_ids() -> List[str]:
    """Get list of valid question IDs"""
    valid_ids = []
    
    # Layer 1: 30 questions
    for i in range(1, 31):
        valid_ids.append(f"PPI_L1_Q{i:02d}")
    
    # Layers 2-7: 40 questions each
    for layer in range(2, 8):
        for i in range(1, 41):
            valid_ids.append(f"PPI_L{layer}_Q{i:02d}")
    
    return valid_ids


def assign_variant(user_id: str, test_name: str) -> int:
    """
    Deterministic hash-based A/B assignment
    Same user + test always gets same variant
    """
    hash_input = f"{user_id}:{test_name}"
    hash_val = hashlib.md5(hash_input.encode()).hexdigest()
    return int(hash_val, 16) % 2


# =============================================================================
# COMPONENT 1: INPUT VALIDATION
# =============================================================================

def validate_inputs(age: int, el: int, ppi_answers: List[PPIAnswer] = None) -> bool:
    """
    Validate all user inputs before processing
    
    Args:
        age: User age (should be 6-99)
        el: Experience level (should be 1-5 for POC)
        ppi_answers: List of PPI answer objects (optional)
    
    Raises:
        ValidationError: If any validation fails
    
    Returns:
        True if all validation passes
    """
    errors = []
    
    # Age validation
    if not isinstance(age, (int, float)):
        errors.append(f"Age must be numeric, got {type(age)}")
    elif not (6 <= age <= 99):
        errors.append(f"Age {age} out of range [6, 99]")
    
    # EL validation
    if not isinstance(el, int):
        errors.append(f"EL must be integer, got {type(el)}")
    elif not (1 <= el <= 5):
        errors.append(f"EL {el} out of range [1, 5] (POC limit)")
    
    # PPI answers validation (if provided)
    if ppi_answers is not None:
        if not isinstance(ppi_answers, list):
            errors.append(f"PPI answers must be list, got {type(ppi_answers)}")
        else:
            VALID_QUESTION_IDS = get_valid_question_ids()
            
            for i, answer in enumerate(ppi_answers):
                if not hasattr(answer, 'question_id'):
                    errors.append(f"Answer {i} missing question_id")
                elif answer.question_id not in VALID_QUESTION_IDS:
                    errors.append(f"Invalid question ID: {answer.question_id}")
                
                if not hasattr(answer, 'option'):
                    errors.append(f"Answer {i} missing option")
                elif answer.option not in ['A', 'B', 'C', 'D']:
                    errors.append(f"Invalid option: {answer.option}")
    
    if errors:
        raise ValidationError("; ".join(errors))
    
    return True


# =============================================================================
# COMPONENT 2: AGE + EL NORMALIZATION
# =============================================================================

def normalize_age(age: int) -> float:
    """
    Normalize age to [0, 1] range
    Full 6-99 range (not truncated at 66)
    """
    return clamp((age - 6) / 93)


def normalize_el(el: int, el_max: int = 5) -> float:
    """
    Normalize experience level to [0, 1] range
    POC: el_max=5, Commercial: el_max=15
    """
    if el_max <= 1:
        return 0.0
    return clamp((el - 1) / (el_max - 1))


def calculate_lc(age: int, el: int, el_max: int = 5) -> float:
    """
    Calculate Learning Complexity
    40/60 weighting: experience matters more than age
    """
    age_norm = normalize_age(age)
    el_norm = normalize_el(el, el_max)
    LC = 0.4 * age_norm + 0.6 * el_norm
    return LC


def calculate_childiness(LC: float) -> float:
    """
    Calculate simplification pressure
    Higher childiness = more simplification needed
    """
    return 1.0 - LC


def compute_scalars(age: int, el: int, el_max: int = 5) -> TAPScalars:
    """
    Compute all TAP scalars for a user
    """
    age_norm = normalize_age(age)
    el_norm = normalize_el(el, el_max)
    lc = calculate_lc(age, el, el_max)
    childiness = calculate_childiness(lc)
    
    # Calculate blend weights
    if childiness >= 0.67:
        weights = {'child': 0.8, 'bridge': 0.15, 'expert': 0.05}
    elif childiness >= 0.33:
        weights = {'child': 0.3, 'bridge': 0.5, 'expert': 0.2}
    else:
        weights = {'child': 0.05, 'bridge': 0.25, 'expert': 0.7}
    
    return TAPScalars(
        age=age,
        el=el,
        age_norm=round(age_norm, 4),
        el_norm=round(el_norm, 4),
        lc=round(lc, 4),
        childiness=round(childiness, 4),
        weights=weights
    )


# =============================================================================
# COMPONENT 3: DELTA ACCUMULATION
# =============================================================================

def accumulate_scores(ppi_answers: List[PPIAnswer]) -> Dict[str, float]:
    """
    Accumulate trait scores from PPI answers with depth-based weighting
    
    Args:
        ppi_answers: List of PPIAnswer objects
    
    Returns:
        Dict of {trait_name: weighted_score}
    """
    trait_scores = {trait: 0.0 for trait in VIA_TRAITS}
    
    for answer in ppi_answers:
        layer = get_question_layer(answer.question_id)
        layer_weight = LAYER_CONFIGS.get(layer, {'weight': 1.0})['weight']
        
        for delta in answer.deltas:
            if isinstance(delta, dict):
                trait = delta.get('trait', '')
                value = delta.get('value', 0.0)
            else:
                trait = getattr(delta, 'trait', '')
                value = getattr(delta, 'value', 0.0)
            
            if trait in trait_scores:
                weighted_delta = value * layer_weight
                trait_scores[trait] += weighted_delta
    
    return trait_scores


# =============================================================================
# COMPONENT 4: DNA GENERATION ENGINE
# =============================================================================

def calculate_differentiation(traits: List[TraitScore]) -> float:
    """Measure spread between top trait and median trait"""
    if not traits:
        return 0.0
    
    sorted_norms = sorted([t.norm for t in traits], reverse=True)
    top = sorted_norms[0]
    median_idx = len(sorted_norms) // 2
    median = sorted_norms[median_idx]
    
    return (top - median) / max(top, 0.01)


def resolve_conflicts(traits: List[TraitScore]) -> List[TraitScore]:
    """Remove psychologically conflicting trait pairs"""
    resolved = []
    excluded = set()
    
    for trait in traits:
        if trait.name in excluded:
            continue
        
        resolved.append(trait)
        
        # Mark conflicts as excluded (higher confidence trait wins)
        for conflict_name in CONFLICTS.get(trait.name, []):
            excluded.add(conflict_name)
    
    return resolved


def generate_dna(
    trait_scores: Dict[str, float],
    answered_questions: int,
    total_available: int
) -> DNAResult:
    """
    Generate personality DNA from PPI responses
    
    Args:
        trait_scores: Dict of {trait_name: accumulated_score}
        answered_questions: Number of questions answered
        total_available: Total questions available to user
    
    Returns:
        DNAResult with primary and secondary traits
    """
    config = POC_CONFIG
    
    # 1. NORMALIZE SCORES (Division by zero protected)
    max_abs_score = max((abs(score) for score in trait_scores.values()), default=1.0)
    M = max(max_abs_score, 1.0)
    
    normalized = {
        trait: clamp((score / M + 1) / 2)
        for trait, score in trait_scores.items()
    }
    
    # 2. CALCULATE CONFIDENCE (75/25 weighting - emphasizes coverage)
    coverage = answered_questions / max(total_available, 1)
    traits = []
    
    for trait_name, norm_score in normalized.items():
        signal = 2 * abs(norm_score - 0.5)
        confidence = clamp(
            config['coverage_weight'] * coverage + 
            config['signal_weight'] * signal
        )
        
        traits.append(TraitScore(
            name=trait_name,
            score=trait_scores[trait_name],
            norm=round(norm_score, 4),
            confidence=round(confidence, 4)
        ))
    
    # 3. SORT DETERMINISTICALLY (3-level key)
    traits.sort(key=lambda t: (-t.norm, -t.confidence, t.name))
    
    # 4. FLAT PROFILE DETECTION
    differentiation = calculate_differentiation(traits)
    
    if differentiation < config['differentiation_threshold']:
        # Weak signal: return top 2 traits with penalty
        primary = traits[:2]
        for t in primary:
            t.confidence = round(t.confidence * 0.85, 4)
        
        return DNAResult(
            primary=primary,
            secondary=[],
            all_traits=traits,
            differentiation=round(differentiation, 4),
            coverage=round(coverage, 4)
        )
    
    # 5. DYNAMIC THRESHOLD CALCULATION
    top_norm = traits[0].norm if traits else 0.5
    
    # Ceiling detection: prevent early dominant trait from raising threshold too high
    if top_norm > config['ceiling_detection_threshold'] and coverage < 0.80:
        threshold = 0.75 * top_norm
    else:
        threshold = 0.80 * top_norm  # Standard proportional threshold
    
    # 6. SELECT QUALIFIED TRAITS
    qualified = [
        t for t in traits 
        if t.norm >= threshold and t.confidence >= config['confidence_threshold']
    ]
    
    # 7. EMPTY DNA FALLBACK
    if len(qualified) == 0:
        qualified = [traits[0]] if traits else []
    
    # 8. CONFLICT RESOLUTION
    resolved = resolve_conflicts(qualified)
    
    # 9. TIERED CATEGORIZATION
    primary = [
        t for t in resolved 
        if t.confidence >= config['confidence_primary_threshold']
    ][:config['dna_max_size']]
    
    secondary = [
        t for t in resolved 
        if config['confidence_threshold'] <= t.confidence < config['confidence_primary_threshold']
    ][:config['dna_max_size']]
    
    return DNAResult(
        primary=primary,
        secondary=secondary,
        all_traits=traits,
        differentiation=round(differentiation, 4),
        coverage=round(coverage, 4)
    )


# =============================================================================
# COMPONENT 5: TEXT ADAPTATION ENGINE (CONTINUOUS - NO BUCKETS)
# =============================================================================

# Word simplification dictionary with complexity levels (0.0 = simple, 1.0 = complex)
# Words are replaced when user's LC is BELOW the complexity threshold
# Threshold = LC value below which simplification applies
# 
# CONTINUOUS ADAPTATION for ALL ages (6-99):
# - LC 0.0 (6yo beginner) → Maximum simplification
# - LC 0.5 (middle range) → Moderate simplification  
# - LC 1.0 (99yo expert) → Minimal simplification
#
# Thresholds spread across FULL range so EVERYONE gets appropriate adaptation
WORD_SIMPLIFICATIONS = {
    # Threshold 0.95: Apply to almost everyone (LC < 0.95)
    # Only the most expert users (LC > 0.95) skip these
    0.95: [
        ('furthermore', 'also'),
        ('however', 'but'),
        ('therefore', 'so'),
        ('approximately', 'about'),
        ('subsequently', 'then'),
        ('consequently', 'so'),
        ('nevertheless', 'still'),
        ('notwithstanding', 'despite'),
        ('henceforth', 'from now on'),
        ('aforementioned', 'mentioned before'),
        ('heretofore', 'until now'),
        ('whereby', 'by which'),
        ('wherein', 'in which'),
        ('thereof', 'of that'),
        ('therein', 'in that'),
        ('utilize', 'use'),
        ('utilise', 'use'),
        ('utilization', 'use'),
        ('purchase', 'buy'),
        ('acquire', 'get'),
        ('obtain', 'get'),
        ('require', 'need'),
        ('demonstrate', 'show'),
        ('establish', 'set up'),
        ('implement', 'do'),
        ('maintain', 'keep'),
        ('facilitate', 'help'),
        ('assist', 'help'),
        ('commence', 'start'),
        ('conclude', 'end'),
        ('endeavor', 'try'),
        ('endeavour', 'try'),
        ('ascertain', 'find out'),
        ('inquire', 'ask'),
        ('remuneration', 'pay'),
        ('terminate', 'end'),
        ('prior to', 'before'),
        ('subsequent to', 'after'),
        ('in lieu of', 'instead of'),
        ('in the event that', 'if'),
        ('for the purpose of', 'to'),
        ('in order to', 'to'),
        ('with regard to', 'about'),
        ('pertaining to', 'about'),
    ],
    
    # Threshold 0.85: Most users except advanced experts (LC < 0.85)
    0.85: [
        ('sufficient', 'enough'),
        ('various', 'different'),
        ('primary', 'main'),
        ('significant', 'important'),
        ('fundamental', 'basic'),
        ('numerous', 'many'),
        ('occur', 'happen'),
        ('provide', 'give'),
        ('receive', 'get'),
        ('additional', 'more'),
        ('initial', 'first'),
        ('subsequent', 'next'),
        ('constitutes', 'makes up'),
        ('comprises', 'includes'),
        ('encompasses', 'covers'),
        ('optimal', 'best'),
        ('minimal', 'smallest'),
        ('maximum', 'most'),
        ('minimum', 'least'),
        ('preliminary', 'early'),
        ('comprehensive', 'complete'),
        ('substantial', 'large'),
        ('considerable', 'large'),
        ('essential', 'needed'),
        ('mandatory', 'required'),
        ('optional', 'extra'),
        ('feasible', 'possible'),
        ('viable', 'workable'),
    ],
    
    # Threshold 0.70: Intermediate users and below (LC < 0.70)
    0.70: [
        ('expenditure', 'spending'),
        ('revenue', 'money coming in'),
        ('deficit', 'shortage'),
        ('surplus', 'extra'),
        ('inflation', 'prices going up'),
        ('deflation', 'prices going down'),
        ('interest rate', 'cost of borrowing'),
        ('credit score', 'trust score'),
        ('mortgage', 'home loan'),
        ('premium', 'payment'),
        ('deductible', 'amount you pay first'),
        ('bartered', 'traded'),
        ('exchange', 'trade'),
        ('transaction', 'deal'),
        ('portfolio', 'collection of investments'),
        ('equity', 'ownership share'),
        ('liability', 'what you owe'),
        ('asset', 'something valuable'),
        ('collateral', 'something you promise'),
        ('depreciation', 'losing value'),
        ('appreciation', 'gaining value'),
        ('amortization', 'paying off over time'),
        ('liquidate', 'turn into cash'),
        ('diversify', 'spread out'),
    ],
    
    # Threshold 0.55: Beginners through intermediate (LC < 0.55)
    0.55: [
        ('medium of exchange', 'way to trade'),
        ('economic transactions', 'buying and selling'),
        ('financial instrument', 'money tool'),
        ('monetary policy', 'money rules'),
        ('fiscal responsibility', 'being careful with money'),
        ('double coincidence of wants', 'both people wanting to trade'),
        ('universal medium', 'something everyone uses'),
        ('compound interest', 'interest that grows on itself'),
        ('principal', 'the main amount'),
        ('dividend', 'share of profits'),
        ('capital gains', 'profit from selling'),
        ('tax bracket', 'how much tax you pay'),
        ('tax deduction', 'money you don\'t pay tax on'),
        ('tax credit', 'money off your taxes'),
        ('401k', 'retirement savings account'),
        ('IRA', 'retirement savings account'),
        ('mutual fund', 'group of investments'),
        ('index fund', 'investment that follows the market'),
        ('stock market', 'place to buy company shares'),
        ('bond', 'loan to a company or government'),
    ],
    
    # Threshold 0.40: Children and teens (LC < 0.40)
    0.40: [
        # Q1: Financial decisions
        ('research extensively before deciding', 'look up lots of information first'),
        ('go with my gut feeling', 'pick what feels right'),
        ('ask friends or family for advice', 'ask people I trust'),
        ('follow what experts recommend', 'do what smart people say'),
        # Q2: Saving approach
        ('save a fixed amount each month', 'save the same amount every month'),
        ('save whatever is left over', 'save what I have left'),
        ('save only for specific goals', 'save for things I want'),
        ('struggle to save consistently', 'find it hard to save'),
        # Q3: Financial future feelings
        ('excited and optimistic', 'happy and hopeful'),
        ('anxious or worried', 'nervous or scared'),
        ('uncertain but hopeful', 'not sure but hopeful'),
        ('confident and prepared', 'ready and sure'),
        # Q4: Track spending
        ('daily or weekly', 'every day or week'),
        ('rarely or never', 'almost never'),
        ('only when i feel concerned about my balance', 'only when I worry about money'),
        # Q5: Unexpected money
        ('split it between saving and spending', 'save some and spend some'),
        ('use it to pay bills or debt', 'use it for things I owe'),
        # Q6: Learning style
        ('reading and research', 'reading and looking things up'),
        ('hands-on practice', 'trying things myself'),
        ('watching videos or tutorials', 'watching videos'),
        ('discussion and conversation', 'talking with others'),
        # Q7: Setting financial goals
        ('detailed plans with specific timelines', 'step-by-step plans with dates'),
        ('general direction without strict deadlines', 'a rough idea without due dates'),
        ('short-term goals i can achieve quickly', 'small goals I can reach soon'),
        ('long-term vision with flexibility', 'big dreams that can change'),
        # Q8 (Q11 in bank): Spending habits  
        ('very disciplined', 'very careful'),
        ('mostly controlled with occasional splurges', 'usually careful but sometimes I treat myself'),
        ('impulsive at times', 'sometimes I buy without thinking'),
        ('often reactive to emotions', 'I buy based on how I feel'),
        # Q9 (Q13): Financial setback
        ('quickly adjust my plan and move forward', 'fix my plan and keep going'),
        ('feel discouraged but eventually recover', 'feel sad but get better'),
        ('need support from others to cope', 'need help from others'),
        ('find it very difficult to bounce back', 'find it really hard to feel better'),
        # Q10 (Q15): Risk comfort
        ("high – i'm willing to take calculated risks", 'high - I like trying new things'),
        ('moderate – some risk is okay', 'medium - a little risk is okay'),
        ('low – i prefer safety and stability', 'low - I like being safe'),
        ('very low – i avoid risk completely', 'very low - I stay away from risk'),
        # Q11 (Q17): Financial challenge
        ('not earning enough', 'not getting enough money'),
        ('controlling my spending', 'being careful with what I spend'),
        ('understanding financial concepts', 'understanding money stuff'),
        ('staying motivated to save', 'wanting to keep saving'),
        # Credit card options (ADAPTED for comprehension)
        ('use them responsibly and pay in full', 'use them carefully and pay it all back'),
        ('avoid them entirely', 'stay away from them'),
        ('use them for emergencies only', 'only use them when I really need to'),
        ('use them for rewards and points', 'use them to get prizes and points'),
        # Investment options (ADAPTED)
        ('stocks and higher-risk investments', 'things that can go up or down a lot'),
        ('safe, low-risk options', 'safe choices that don\'t change much'),
        ('mix of both depending on goals', 'a mix of safe and risky based on what I want'),
        ('real estate or physical assets', 'houses or things I can touch'),
        # Budget options (ADAPTED)
        ('strict budget with categories', 'a careful plan with groups for spending'),
        ('flexible spending limits', 'rules that can change'),
        ('track everything meticulously', 'write down every little thing'),
        ('general awareness without strict rules', 'just know roughly where money goes'),
        # Debt options (ADAPTED)
        ('pay it off aggressively', 'pay it back as fast as I can'),
        ('pay minimum and invest extra', 'pay a little and save the rest'),
        ('balance payoff with other goals', 'pay some back and do other things too'),
        ('consolidate for lower rates', 'put it together to pay less'),
        # Retirement options (ADAPTED)
        ('start early and maximize contributions', 'start young and save as much as I can'),
        ('save when convenient', 'save when I can'),
        ('rely on employer plans', 'let my job help me save'),
        ('haven\'t started yet', 'haven\'t started saving yet'),
        # Insurance options (ADAPTED)
        ('comprehensive coverage', 'protection for everything'),
        ('basic coverage only', 'just the simple protection'),
        ('shop for best rates', 'look for the best price'),
        ('minimal insurance', 'just a little protection'),
        # General terms
        ('building an emergency fund', 'saving for emergencies'),
        ('paying off debt', 'paying back money I owe'),
        ('learning to budget better', 'learning to plan my money'),
        ('extensively', 'a lot'),
        ('financial', 'money'),
        ('disciplined', 'careful'),
        ('impulsive', 'without thinking'),
        ('splurges', 'treats'),
        ('discouraged', 'sad'),
        ('recover', 'get better'),
        ('bounce back', 'feel better'),
        ('calculated risks', 'smart risks'),
        ('stability', 'staying safe'),
        ('investments', 'ways to grow money'),
        ('retirement', 'when you stop working'),
        ('insurance', 'protection'),
        ('debt', 'money you owe'),
        ('budget', 'money plan'),
        ('credit', 'borrow now pay later'),
        # Financial concepts simplified
        ('medium of exchange', 'way to trade'),
        ('economic transactions', 'buying and selling'),
        ('financial instrument', 'money tool'),
        ('monetary policy', 'money rules'),
        ('fiscal responsibility', 'being careful with money'),
        ('double coincidence of wants', 'problem of finding someone who wants to trade'),
        ('universal medium', 'common way'),
        ('liquidity', 'cash you can use now'),
        ('volatility', 'ups and downs'),
        ('diversification', 'spreading out'),
        ('portfolio', 'collection of investments'),
        ('compound interest', 'interest that grows on itself'),
        ('principal', 'the main amount'),
        ('dividend', 'share of profits'),
        ('equity', 'ownership'),
        ('liability', 'what you owe'),
        ('asset', 'something valuable you own'),
        ('collateral', 'something you promise to give'),
        ('depreciation', 'losing value over time'),
    ],
    
    # Threshold 0.25: Apply to LC < 0.25 (young children only - age 6-10)
    0.25: [
        ('that facilitates', 'that helps with'),
        ('which facilitates', 'which helps with'),
        ('facilitates', 'helps with'),
        ('subsequently', 'then'),
        ('consequently', 'so'),
        ('accumulate', 'build up'),
        ('allocate', 'set aside'),
        ('amortization', 'paying off slowly'),
        ('amortize', 'pay off slowly'),
        ('annuity', 'regular payments'),
        ('appreciation', 'going up in value'),
        ('arbitrage', 'buying low selling high'),
        ('funds', 'money'),
        ('finances', 'money'),
        ('currency', 'money'),
        ('capital', 'money'),
        ('income', 'money you earn'),
        ('expenses', 'money you spend'),
        ('budget', 'money plan'),
        ('savings', 'money you keep'),
        ('debt', 'money you owe'),
        ('investment', 'money you grow'),
    ],
}

# Child-friendly phrase additions based on childiness
CHILD_FRIENDLY_STARTERS = {
    0.9: "Let's learn something cool! ",
    0.85: "Here's something fun to know: ",
    0.8: "Did you know? ",
    0.7: "Here's the thing: ",
    0.6: "",
    0.0: "",
}

# Emoji mappings for very young users (high childiness)
CONCEPT_EMOJIS = {
    'money': '💰',
    'dollar': '💵',
    'cash': '💵',
    'coin': '🪙',
    'save': '🏦',
    'saving': '🏦',
    'bank': '🏦',
    'grow': '📈',
    'growth': '📈',
    'increase': '📈',
    'profit': '📈',
    'spend': '🛒',
    'buy': '🛒',
    'purchase': '🛒',
    'goal': '🎯',
    'target': '🎯',
    'plan': '📋',
    'budget': '📋',
    'learn': '📚',
    'understand': '💡',
    'idea': '💡',
    'smart': '🧠',
    'wise': '🧠',
    'safe': '🔒',
    'protect': '🛡️',
    'risk': '⚠️',
    'danger': '⚠️',
    'win': '🏆',
    'success': '🏆',
    'help': '🤝',
    'share': '🤝',
    'family': '👨‍👩‍👧‍👦',
    'future': '🔮',
    'time': '⏰',
}


def get_adaptation_params(childiness: float) -> dict:
    """
    Calculate CONTINUOUS adaptation parameters based on childiness (0.0 to 1.0)
    NO BUCKETS - all values scale smoothly
    """
    return {
        # Sentence length scales from 25 words (adult) to 8 words (child)
        'max_words_per_sentence': int(25 - (17 * childiness)),
        # Number of sentences scales from 10 (adult) to 2 (child)
        'max_sentences': int(10 - (8 * childiness)),
        # Word complexity threshold - higher childiness = more simplification
        'simplification_threshold': childiness,
        # Add emoji for childiness > 0.75
        'add_emoji': childiness > 0.75,
        # Add friendly starter for childiness > 0.6
        'add_starter': childiness > 0.6,
        # Add inline explanations for childiness > 0.5
        'add_explanations': childiness > 0.5,
    }


def apply_word_simplifications(text: str, lc: float) -> str:
    """
    Apply word-level simplifications based on LC (Learning Complexity)
    Lower LC = more simplification applied
    CONTINUOUS - no buckets
    """
    result = text
    
    # Apply simplifications for all thresholds ABOVE the user's LC
    for threshold, replacements in sorted(WORD_SIMPLIFICATIONS.items(), reverse=True):
        if lc < threshold:
            for item in replacements:
                if len(item) == 2:
                    complex_word, simple_word = item
                    # Case-insensitive replacement, preserve first letter case
                    pattern = re.compile(re.escape(complex_word), re.IGNORECASE)
                    
                    def replace_preserve_case(match):
                        matched = match.group(0)
                        if matched[0].isupper():
                            return simple_word.capitalize()
                        return simple_word
                    
                    result = pattern.sub(replace_preserve_case, result)
    
    return result


def add_inline_explanations(text: str, childiness: float, age: int) -> str:
    """
    Add inline explanations for complex terms based on childiness
    Higher childiness = more explanations
    """
    result = text
    
    # Only add explanations if childiness is high enough
    if childiness < 0.5:
        return result
    
    # Terms that need explanation with their simple definitions
    explanations = {
        'interest': '(extra money the bank gives you)',
        'loan': '(money you borrow and pay back later)',
        'credit': '(buying now, paying later)',
        'invest': '(putting money somewhere to grow)',
        'stock': '(a tiny piece of a company)',
        'bond': '(lending money to get it back with extra)',
        'tax': '(money we give to help our community)',
        'insurance': '(protection if something bad happens)',
        'retirement': '(when you stop working and relax)',
        'salary': '(money from your job)',
        'wage': '(money from your job)',
    }
    
    # Scale which explanations to add based on childiness
    explanation_threshold = 1.0 - childiness  # Higher childiness = lower threshold
    
    for term, explanation in explanations.items():
        # Add explanation if term exists and childiness warrants it
        if term in result.lower() and childiness > 0.4:
            # Only add once per term
            pattern = re.compile(f'\\b({re.escape(term)})\\b(?![^(]*\\))', re.IGNORECASE)
            result = pattern.sub(f'\\1 {explanation}', result, count=1)
    
    return result


def add_emoji_markers(text: str, childiness: float) -> str:
    """
    Add contextual emojis for young users (high childiness)
    CONTINUOUS scaling - more emojis for higher childiness
    """
    if childiness < 0.75:
        return text
    
    result = text
    emojis_added = 0
    max_emojis = int(3 * childiness)  # Scale max emojis with childiness
    
    for word, emoji in CONCEPT_EMOJIS.items():
        if emojis_added >= max_emojis:
            break
        if word in result.lower():
            # Add emoji at start if this is a key concept
            if emojis_added == 0:
                result = f"{emoji} {result}"
                emojis_added += 1
    
    return result


def get_friendly_starter(childiness: float) -> str:
    """Get age-appropriate conversation starter based on childiness"""
    for threshold, starter in sorted(CHILD_FRIENDLY_STARTERS.items(), reverse=True):
        if childiness >= threshold:
            return starter
    return ""


def adapt_ppi_text(text: str, age: int, el: int, el_max: int = 5) -> str:
    """
    Adapt PPI question/option text - WORD SIMPLIFICATION ONLY
    
    NO emojis, NO friendly starters - just vocabulary simplification
    for age-appropriate comprehension.
    
    Args:
        text: Baseline text
        age: User age (6-99)
        el: Experience level (1-5 for POC)
        el_max: Maximum EL
    
    Returns:
        Text with vocabulary simplified for user's level
    """
    if not text:
        return text
    
    # Calculate LC (Learning Complexity)
    lc = calculate_lc(age, el, el_max)
    
    # Apply ONLY word-level simplifications (no emoji, no starters, no truncation)
    result = apply_word_simplifications(text, lc)
    
    return result


def adapt_text_continuous(text: str, age: int, el: int, el_max: int = 5) -> str:
    """
    MAIN CONTINUOUS TEXT ADAPTATION FUNCTION
    
    Adapts text based on continuous LC value derived from age (6-99) and EL (1-5/15)
    NO BUCKETS - smooth scaling across entire range
    
    Args:
        text: Baseline expert text
        age: User age (6-99)
        el: Experience level (1-5 for POC)
        el_max: Maximum EL (5 for POC, 15 for commercial)
    
    Returns:
        Adapted text appropriate for user's level
    """
    if not text:
        return text
    
    # Calculate LC and childiness (CONTINUOUS values)
    lc = calculate_lc(age, el, el_max)
    childiness = calculate_childiness(lc)
    
    # Get adaptation parameters (all continuous)
    params = get_adaptation_params(childiness)
    
    # Step 1: Apply word-level simplifications
    result = apply_word_simplifications(text, lc)
    
    # Step 2: Add inline explanations for complex terms
    if params['add_explanations']:
        result = add_inline_explanations(result, childiness, age)
    
    # Step 3: Apply sentence-level constraints
    max_words = params['max_words_per_sentence']
    max_sentences = params['max_sentences']
    
    # Split into sentences and limit
    sentences = re.split(r'(?<=[.!?])\s+', result)
    processed_sentences = []
    
    for sentence in sentences[:max_sentences]:
        words = sentence.split()
        if len(words) > max_words:
            # Truncate at a natural break point (not mid-phrase)
            truncated_words = words[:max_words]
            truncated = ' '.join(truncated_words)
            
            # Try to find a better break point (before prepositions, conjunctions)
            break_words = ['for', 'by', 'with', 'to', 'of', 'and', 'or', 'but', 'that', 'which', 'a', 'an', 'the']
            for i in range(len(truncated_words) - 1, max(0, len(truncated_words) - 5), -1):
                if truncated_words[i].lower() in break_words:
                    truncated = ' '.join(truncated_words[:i])
                    break
            
            # Ensure proper ending
            truncated = truncated.rstrip('.,;:—- ')
            if not truncated.endswith(('.', '!', '?')):
                truncated += '.'
            processed_sentences.append(truncated)
        else:
            processed_sentences.append(sentence)
    
    result = ' '.join(processed_sentences)
    
    # Step 4: Add friendly starter for young users
    if params['add_starter']:
        starter = get_friendly_starter(childiness)
        if starter and not result.startswith(starter):
            result = starter + result
    
    # Step 5: Add emoji markers for very young users
    if params['add_emoji']:
        result = add_emoji_markers(result, childiness)
    
    return result


def split_sentence_safe(sentence: str, max_words: int) -> List[str]:
    """
    Split sentences at grammatically safe boundaries
    Avoids creating sentence fragments with dangling conjunctions
    """
    words = sentence.split()
    if len(words) <= max_words:
        return [sentence]
    
    # Try splitting at safe boundaries
    for pattern in SAFE_SPLIT_PATTERNS:
        parts = re.split(pattern, sentence)
        if len(parts) > 1 and all(len(p.split()) <= max_words for p in parts if p.strip()):
            # Remove dangling conjunctions
            cleaned = []
            for part in parts:
                if not part.strip():
                    continue
                part_words = part.strip().split()
                if not part_words:
                    continue
                first_word = part_words[0].lower()
                if first_word not in UNSAFE_STARTS:
                    cleaned.append(part.strip())
                elif cleaned:
                    # Reattach to previous part
                    cleaned[-1] += ' ' + part.strip()
                else:
                    # Remove conjunction and keep rest
                    remaining = ' '.join(part_words[1:])
                    if remaining:
                        cleaned.append(remaining)
            if cleaned:
                return cleaned
    
    # Fallback: truncate with ellipsis
    return [' '.join(words[:max_words]) + '...']


def should_add_microgloss(term: str, childiness: float, age: int) -> bool:
    """
    Determine if financial term needs inline definition
    """
    complexity = TERM_COMPLEXITY.get(term.lower(), 0)
    
    # Age-based threshold
    if age < 12:
        threshold = 2
    elif age < 18:
        threshold = 3
    else:
        threshold = 4
    
    # Childiness adjustment (higher childiness = lower threshold)
    adjusted_threshold = threshold - (childiness * 2)
    
    return complexity >= adjusted_threshold


def apply_microgloss(text: str, term: str) -> str:
    """Add inline definition to term"""
    gloss = MICRO_GLOSSES.get(term.lower(), '')
    if gloss:
        return f"{term} ({gloss})"
    return term


def apply_microglosses(text: str, childiness: float, age: int) -> str:
    """Apply micro-glosses to all applicable terms in text"""
    result = text
    for term in TERM_COMPLEXITY.keys():
        if term.lower() in result.lower() and should_add_microgloss(term, childiness, age):
            # Case-insensitive replacement
            pattern = re.compile(re.escape(term), re.IGNORECASE)
            gloss = MICRO_GLOSSES.get(term.lower(), '')
            if gloss:
                # Only replace first occurrence
                result = pattern.sub(f"{term} ({gloss})", result, count=1)
    return result


def simplify_for_child(text: str, childiness: float) -> str:
    """Simplify text for child audience"""
    max_words, max_sentences = get_child_params(childiness)
    
    # Split into sentences
    sentences = re.split(r'(?<=[.!?])\s+', text)
    
    simplified_sentences = []
    for sentence in sentences[:max_sentences]:
        parts = split_sentence_safe(sentence, max_words)
        simplified_sentences.extend(parts)
    
    # Add emoji for very young users
    if childiness > 0.8:
        result = ' '.join(simplified_sentences[:max_sentences])
        # Add contextual emoji
        if any(word in result.lower() for word in ['money', 'dollar', 'cash', 'coin']):
            result = '💰 ' + result
        elif any(word in result.lower() for word in ['save', 'saving', 'savings']):
            result = '🏦 ' + result
        elif any(word in result.lower() for word in ['grow', 'growth', 'increase']):
            result = '📈 ' + result
        return result
    
    return ' '.join(simplified_sentences[:max_sentences])


def create_bridge_text(expert_text: str, child_text: str, childiness: float) -> str:
    """Create bridge text between expert and child versions"""
    max_words, max_sentences = get_bridge_params(childiness)
    
    # Start with expert text and simplify slightly
    sentences = re.split(r'(?<=[.!?])\s+', expert_text)
    
    bridge_sentences = []
    for sentence in sentences[:max_sentences]:
        # Light simplification
        simplified = sentence.replace('consequently', 'so')
        simplified = simplified.replace('therefore', 'so')
        simplified = simplified.replace('furthermore', 'also')
        simplified = simplified.replace('however', 'but')
        simplified = simplified.replace('additionally', 'also')
        simplified = simplified.replace('utilize', 'use')
        simplified = simplified.replace('approximately', 'about')
        simplified = simplified.replace('demonstrate', 'show')
        simplified = simplified.replace('subsequently', 'then')
        
        parts = split_sentence_safe(simplified, max_words)
        bridge_sentences.extend(parts)
    
    return ' '.join(bridge_sentences[:max_sentences])


# =============================================================================
# COMPONENT 6: DNA FRAMING ENGINE
# =============================================================================

def apply_strong_framing(content: str, trait: TraitScore) -> str:
    """
    Apply primary DNA trait framing
    Explicit prefixes and tone adjustments
    """
    strategy = FRAMING_STRATEGIES.get(trait.name, {})
    prefix = strategy.get('prefix', '')
    
    if prefix and not content.startswith(prefix):
        # Add prefix to first sentence
        sentences = re.split(r'(?<=[.!?])\s+', content, maxsplit=1)
        if sentences:
            sentences[0] = prefix + ' ' + sentences[0]
            return ' '.join(sentences)
    
    return content


def apply_subtle_framing(content: str, trait: TraitScore) -> str:
    """
    Apply secondary DNA trait framing
    Subtle word choice only, no explicit prefixes
    """
    # Subtle adjustments based on trait
    if trait.name == 'Curiosity':
        content = content.replace('You should', 'You might wonder why')
        content = content.replace('It is important', 'It is interesting')
    elif trait.name == 'Prudence':
        content = content.replace('You can', 'You might want to carefully consider')
        content = content.replace('Try', 'Consider')
    elif trait.name == 'Hope':
        content = content.replace('will help', 'will lead you closer to')
        content = content.replace('can improve', 'will improve')
    
    return content


def apply_personalization(
    content: str, 
    ppi_completed: bool,
    primary_dna: List[TraitScore], 
    secondary_dna: List[TraitScore]
) -> str:
    """
    Apply DNA-based framing to content
    Only applies AFTER PPI is marked complete
    """
    if not ppi_completed:
        return content  # No framing until PPI complete
    
    result = content
    
    # Apply primary DNA framing (explicit tone/prefixes)
    for trait in primary_dna[:2]:  # Limit to top 2 primary traits
        result = apply_strong_framing(result, trait)
    
    # Apply secondary DNA framing (subtle word choice)
    for trait in secondary_dna[:2]:  # Limit to top 2 secondary traits
        result = apply_subtle_framing(result, trait)
    
    return result


# =============================================================================
# COMPONENT 7: QUIZ CAMOUFLAGE ANALYSIS
# =============================================================================

def analyze_quiz_balance(correct: str, distractors: List[str]) -> QuizAnalysis:
    """
    Analyze quiz for statistical giveaways
    """
    all_answers = [correct] + distractors
    word_counts = [len(a.split()) for a in all_answers]
    
    mean_wc = statistics.mean(word_counts)
    stdev_wc = statistics.stdev(word_counts) if len(word_counts) > 1 else 1
    
    correct_wc = len(correct.split())
    z_score = (correct_wc - mean_wc) / max(stdev_wc, 1)
    
    issues = []
    
    # 1. WORD COUNT OUTLIER DETECTION
    if abs(z_score) > 1.5:
        issues.append({
            'type': 'word_count_outlier',
            'severity': 'high',
            'z_score': round(z_score, 2),
            'current_wc': correct_wc,
            'target_wc': int(mean_wc),
            'action': 'condense' if correct_wc > mean_wc else 'expand',
            'recommendation': f"Adjust correct answer to {int(mean_wc)} ± 2 words"
        })
    
    # 2. UNIQUE CAUSAL LANGUAGE DETECTION
    causal_words = ['because', 'therefore', 'thus', 'since', 'as a result',
                    'consequently', 'hence', 'so']
    correct_has_causal = any(word in correct.lower() for word in causal_words)
    distractor_causal = [any(word in d.lower() for word in causal_words)
                         for d in distractors]
    
    if correct_has_causal and not any(distractor_causal):
        issues.append({
            'type': 'unique_causal_language',
            'severity': 'medium',
            'recommendation': 'Add causal language to at least one distractor',
            'causal_words_found': [w for w in causal_words if w in correct.lower()]
        })
    
    # 3. UNIQUE PUNCTUATION PATTERNS
    correct_punct = set(c for c in correct if c in '.,;:!?—')
    distractor_puncts = [set(c for c in d if c in '.,;:!?—')
                         for d in distractors]
    
    if distractor_puncts:
        all_distractor_punct = set.union(*distractor_puncts) if distractor_puncts else set()
        unique_punct = correct_punct - all_distractor_punct
        if unique_punct:
            issues.append({
                'type': 'unique_punctuation',
                'severity': 'low',
                'characters': list(unique_punct),
                'recommendation': f"Add {', '.join(unique_punct)} to at least one distractor"
            })
    
    # 4. STRUCTURAL UNIQUENESS
    if correct.istitle() and not any(d.istitle() for d in distractors):
        issues.append({
            'type': 'unique_capitalization',
            'severity': 'low',
            'recommendation': 'Match capitalization style across all options'
        })
    
    return QuizAnalysis(
        passed=len(issues) == 0,
        issues=issues,
        statistics={
            'mean_word_count': round(mean_wc, 1),
            'stdev_word_count': round(stdev_wc, 1),
            'correct_z_score': round(z_score, 2)
        }
    )


# =============================================================================
# COMPONENT 8: USER FEEDBACK LOOP
# =============================================================================

class AdaptationMetrics:
    """Track user learning outcomes to optimize TAP"""
    
    def __init__(self, user_id: str):
        self.user_id = user_id
        self.quiz_success_by_lc = defaultdict(list)
        self.time_per_lesson_by_lc = defaultdict(list)
        self.reread_frequency = defaultdict(int)
        self.progression_velocity = []
    
    def record_quiz_result(self, lesson_id: str, lc: float, score: float):
        """Track quiz performance by LC level"""
        self.quiz_success_by_lc[round(lc, 1)].append(score)
    
    def record_lesson_time(self, lesson_id: str, lc: float, seconds: float):
        """Track time spent per lesson by LC level"""
        self.time_per_lesson_by_lc[round(lc, 1)].append(seconds)
    
    def record_reread(self, lesson_id: str):
        """Track how often user re-reads content (confusion indicator)"""
        self.reread_frequency[lesson_id] += 1
    
    def find_optimal_lc(self) -> Optional[float]:
        """Identify LC level with best learning outcomes"""
        avg_scores = {}
        for lc, scores in self.quiz_success_by_lc.items():
            if len(scores) >= 3:  # Minimum sample size
                avg_scores[lc] = statistics.mean(scores)
        
        return max(avg_scores, key=avg_scores.get) if avg_scores else None


# Global tracking for DNA effectiveness
TRAIT_EFFECTIVENESS = defaultdict(lambda: {
    'quiz_scores': [],
    'completion_rates': [],
    'engagement_time': []
})


def track_dna_outcomes(user_id: str, dna_traits: List[TraitScore], lesson_outcomes: Any):
    """Track which DNA framings lead to better learning outcomes"""
    for trait in dna_traits:
        TRAIT_EFFECTIVENESS[trait.name]['quiz_scores'].append(
            getattr(lesson_outcomes, 'quiz_score', 0)
        )
        TRAIT_EFFECTIVENESS[trait.name]['completion_rates'].append(
            getattr(lesson_outcomes, 'completed', False)
        )
        TRAIT_EFFECTIVENESS[trait.name]['engagement_time'].append(
            getattr(lesson_outcomes, 'time_spent', 0)
        )


# =============================================================================
# MAIN TAP v5.0 ENGINE
# =============================================================================

class TAP50Engine:
    """
    TAP v5.0 - Text Adaptation Processor Engine
    
    Main engine for content adaptation with DNA-based personalization.
    """
    
    def __init__(self, el_max_poc: int = 5, config: Dict = None):
        self.el_max = el_max_poc
        self.config = config or POC_CONFIG
        self.version = "5.0"
        logger.info(f"TAP v{self.version} Engine initialized with el_max={el_max_poc}")
    
    def compute_scalars(
        self, 
        age: int, 
        el_declared: int, 
        baseline_text: str = "",
        controls: TAPControlInputs = None
    ) -> TAPScalars:
        """
        Calculate TAP scalars for a user
        
        Args:
            age: User age (6-99)
            el_declared: User's declared experience level (1-5)
            baseline_text: Optional baseline text (for future text analysis)
            controls: Optional control inputs
        
        Returns:
            TAPScalars with all computed values
        """
        try:
            validate_inputs(age, el_declared)
        except ValidationError as e:
            logger.warning(f"Validation warning: {e.message}")
            # Clamp to valid ranges
            age = max(6, min(99, age))
            el_declared = max(1, min(5, el_declared))
        
        return compute_scalars(age, el_declared, self.el_max)
    
    def generate_dna(
        self,
        ppi_answers: List[PPIAnswer],
        total_available: int = 30
    ) -> DNAResult:
        """
        Generate personality DNA from PPI answers
        
        Args:
            ppi_answers: List of PPIAnswer objects
            total_available: Total questions available to user
        
        Returns:
            DNAResult with primary and secondary traits
        """
        trait_scores = accumulate_scores(ppi_answers)
        return generate_dna(trait_scores, len(ppi_answers), total_available)
    
    def process_lpi(
        self,
        spec: LessonSpec,
        age: int,
        el_declared: int,
        controls: TAPControlInputs = None,
        dna_result: DNAResult = None,
        ppi_completed: bool = False
    ) -> AdaptedContent:
        """
        Process LPI lesson content using CONTINUOUS adaptation (NO BUCKETS)
        
        Args:
            spec: LessonSpec with baseline text, topic, and takeaway
            age: User age (6-99)
            el_declared: User's experience level (1-5)
            controls: Optional control inputs
            dna_result: Optional DNA result for personalization
            ppi_completed: Whether PPI is complete
        
        Returns:
            AdaptedContent with continuously adapted text based on age/EL
        """
        scalars = self.compute_scalars(age, el_declared, spec.baseline_text, controls)
        
        # CONTINUOUS TEXT ADAPTATION - NO BUCKETS
        # Directly adapt baseline text based on continuous LC/childiness values
        adapted_text = adapt_text_continuous(
            text=spec.baseline_text,
            age=age,
            el=el_declared,
            el_max=self.el_max
        )
        
        # Apply DNA personalization if available
        if dna_result and ppi_completed:
            adapted_text = apply_personalization(
                adapted_text,
                ppi_completed,
                dna_result.primary,
                dna_result.secondary
            )
        
        return AdaptedContent(
            child_text=adapted_text,  # For backward compat, same as selected
            bridge_text=adapted_text,  # For backward compat, same as selected
            expert_text=spec.baseline_text,  # Original baseline preserved
            selected_text=adapted_text,  # THE ADAPTED TEXT
            blend_weights=scalars.weights,
            tap_version=self.version,
            scalars=scalars
        )
    
    def process_ppi(
        self,
        options: List[PPIOptionSpec],
        age: int,
        el_declared: int,
        controls: TAPControlInputs = None
    ) -> List[PPIOptionSpec]:
        """
        Adapt PPI question options - WORD SIMPLIFICATION ONLY
        
        NO emojis, NO friendly starters - just vocabulary simplification
        for age-appropriate comprehension.
        
        Args:
            options: List of PPIOptionSpec with baseline text
            age: User age (6-99)
            el_declared: User's experience level (1-5)
            controls: Optional control inputs
        
        Returns:
            List of PPIOptionSpec with vocabulary-simplified display text
        """
        adapted_options = []
        for opt in options:
            # PPI options get ONLY word simplification (no emoji/starters)
            display = adapt_ppi_text(
                text=opt.baseline,
                age=age,
                el=el_declared,
                el_max=self.el_max
            )
            
            adapted_options.append(PPIOptionSpec(
                id=opt.id,
                baseline=opt.baseline,
                display=display,
                gloss=""
            ))
        
        return adapted_options
    
    def analyze_quiz(
        self,
        correct_answer: str,
        distractors: List[str]
    ) -> QuizAnalysis:
        """
        Analyze quiz question for statistical giveaways
        
        Args:
            correct_answer: The correct answer text
            distractors: List of incorrect answer texts
        
        Returns:
            QuizAnalysis with pass/fail and issues
        """
        return analyze_quiz_balance(correct_answer, distractors)


# =============================================================================
# BACKWARD COMPATIBILITY EXPORTS
# =============================================================================

# Export for use with existing code
EL_MAX_POC = 5

def get_tap_v5_engine(el_max: int = 5) -> TAP50Engine:
    """Get a TAP v5.0 engine instance"""
    return TAP50Engine(el_max_poc=el_max)


# =============================================================================
# TEST HARNESS
# =============================================================================

if __name__ == "__main__":
    print("=" * 60)
    print("TAP v5.0 - Test Harness")
    print("=" * 60)
    
    # Initialize engine
    engine = TAP50Engine(el_max_poc=5)
    
    # Test 1: Scalars for 6-year-old EL1
    print("\n--- Test 1: 6yo EL1 Scalars ---")
    scalars = engine.compute_scalars(6, 1, "test")
    print(f"Age: {scalars.age}, EL: {scalars.el}")
    print(f"LC: {scalars.lc}, Childiness: {scalars.childiness}")
    print(f"Weights: {scalars.weights}")
    
    # Test 2: Scalars for 35-year-old EL5
    print("\n--- Test 2: 35yo EL5 Scalars ---")
    scalars = engine.compute_scalars(35, 5, "test")
    print(f"Age: {scalars.age}, EL: {scalars.el}")
    print(f"LC: {scalars.lc}, Childiness: {scalars.childiness}")
    print(f"Weights: {scalars.weights}")
    
    # Test 3: LPI Processing
    print("\n--- Test 3: LPI Processing ---")
    spec = LessonSpec(
        baseline_text="Compound interest is growth on growth - you earn returns on your principal AND on previous earnings. This exponential growth is why starting early matters so much.",
        topic="Saving Early",
        takeaway="Start small, stay steady."
    )
    
    # For 6yo
    output = engine.process_lpi(spec, 6, 1)
    print(f"Child (6yo EL1): {output.child_text[:100]}...")
    print(f"Selected: {output.selected_text[:100]}...")
    
    # For 35yo
    output = engine.process_lpi(spec, 35, 5)
    print(f"Expert (35yo EL5): {output.expert_text[:100]}...")
    print(f"Selected: {output.selected_text[:100]}...")
    
    # Test 4: DNA Generation (mock data)
    print("\n--- Test 4: DNA Generation ---")
    mock_answers = [
        PPIAnswer(
            question_id="PPI_L1_Q01",
            option="B",
            deltas=[
                {"trait": "Prudence", "value": 0.3},
                {"trait": "Self-Regulation", "value": 0.2}
            ]
        ),
        PPIAnswer(
            question_id="PPI_L1_Q02",
            option="C",
            deltas=[
                {"trait": "Judgment", "value": 0.4},
                {"trait": "Curiosity", "value": 0.2}
            ]
        ),
    ]
    
    dna = engine.generate_dna(mock_answers, total_available=30)
    print(f"Primary DNA: {[t.name for t in dna.primary]}")
    print(f"Secondary DNA: {[t.name for t in dna.secondary]}")
    print(f"Differentiation: {dna.differentiation}")
    print(f"Coverage: {dna.coverage}")
    
    # Test 5: Quiz Analysis
    print("\n--- Test 5: Quiz Camouflage Analysis ---")
    analysis = engine.analyze_quiz(
        correct_answer="Because compound interest allows your money to grow exponentially over time",
        distractors=[
            "Saving money is good",
            "Banks pay interest",
            "Money can grow"
        ]
    )
    print(f"Passed: {analysis.passed}")
    print(f"Issues: {len(analysis.issues)}")
    for issue in analysis.issues:
        print(f"  - {issue['type']}: {issue.get('recommendation', '')}")
    
    print("\n" + "=" * 60)
    print("TAP v5.0 Test Harness Complete")
    print("=" * 60)
