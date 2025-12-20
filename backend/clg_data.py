"""
CLG Data Structures - Phrase Bank Matrix (PBM) & Sentence Template Library (STL)
================================================================================
Controlled Language Generator data for TAP v2.3.1

Version: 1.0.0
"""

from typing import Dict, List, Optional
from dataclasses import dataclass, field


@dataclass
class PhraseEntry:
    """Single entry in the Phrase Bank Matrix."""
    band_score: float  # 0.0 to 1.0
    term: str
    definition: str
    example: Optional[str] = None
    analogy: Optional[str] = None
    do_not_use: List[str] = field(default_factory=list)


@dataclass
class SentenceTemplate:
    """Single entry in the Sentence Template Library."""
    template_id: str
    frame: str
    use_when: str = "default"


# =============================================================================
# PHRASE BANK MATRIX (PBM)
# =============================================================================
# NO synonyms. Only pull from PBM.
# Use CD for concept depth phrases, LC for wording/definition length.

PHRASE_BANK_MATRIX: Dict[str, List[PhraseEntry]] = {
    
    # -------------------------------------------------------------------------
    # CREDIT_CARD Concept
    # -------------------------------------------------------------------------
    "CREDIT_CARD": [
        PhraseEntry(
            band_score=0.10,
            term="credit card",
            definition="a card that lets you borrow money to buy something now and pay it back later",
            example="You buy something today, then you pay the card back.",
            analogy="like borrowing a toy and returning it"
        ),
        PhraseEntry(
            band_score=0.35,
            term="credit card",
            definition="a borrowing tool with a limit; if you don't pay the full balance, interest can be charged",
            example="Paying the full balance avoids extra cost."
        ),
        PhraseEntry(
            band_score=0.70,
            term="revolving credit",
            definition="a line of credit where balances can carry month to month and accrue interest based on APR",
            example="Carrying a balance increases total cost over time."
        ),
        PhraseEntry(
            band_score=0.90,
            term="revolving facility",
            definition="issuer-provided revolving line; cost depends on APR, accrual method, statement timing, and payment behavior",
            example="Optimize by avoiding revolving interest and managing utilization."
        ),
    ],
    
    # -------------------------------------------------------------------------
    # PAYING_BILLS Concept
    # -------------------------------------------------------------------------
    "PAYING_BILLS": [
        PhraseEntry(
            band_score=0.10,
            term="bills",
            definition="money you must pay for things you use, like lights or a phone",
            example="You pay each month so the service keeps working.",
            analogy="like paying for a game subscription"
        ),
        PhraseEntry(
            band_score=0.35,
            term="due date",
            definition="the deadline to pay; paying late can add fees",
            example="Pay before the due date to avoid late fees."
        ),
        PhraseEntry(
            band_score=0.70,
            term="cash-flow",
            definition="planning when money comes in and goes out so bills get covered first",
            example="Set aside bill money before spending on wants."
        ),
        PhraseEntry(
            band_score=0.90,
            term="accounts payable controls",
            definition="a system for scheduling, delegating, auditing, and confirming recurring payments",
            example="Use automation plus reviews to prevent misses or errors."
        ),
    ],
    
    # -------------------------------------------------------------------------
    # INVESTING Concept
    # -------------------------------------------------------------------------
    "INVESTING": [
        PhraseEntry(
            band_score=0.10,
            term="investing",
            definition="putting money into something that can grow over time",
            example="You put money in and it might become more later.",
            analogy="planting a seed"
        ),
        PhraseEntry(
            band_score=0.35,
            term="stocks and bonds",
            definition="stocks are pieces of companies; bonds are loans that get paid back",
            example="A fund can hold many stocks at once."
        ),
        PhraseEntry(
            band_score=0.70,
            term="index fund",
            definition="a fund that tracks many investments to spread risk; returns depend on the market over time",
            example="Regular investing can smooth ups and downs."
        ),
        PhraseEntry(
            band_score=0.90,
            term="asset allocation",
            definition="designing a portfolio mix across assets to manage risk, taxes, and long-term goals",
            example="Rebalance to keep risk aligned with plan."
        ),
    ],
    
    # -------------------------------------------------------------------------
    # BUDGETING Concept
    # -------------------------------------------------------------------------
    "BUDGETING": [
        PhraseEntry(
            band_score=0.10,
            term="budget",
            definition="a plan for how you spend your money",
            example="You decide how much to spend on snacks and toys.",
            analogy="like dividing your allowance into jars"
        ),
        PhraseEntry(
            band_score=0.35,
            term="budget",
            definition="tracking income and expenses to make sure you can pay for what you need",
            example="Write down what you earn and spend each month."
        ),
        PhraseEntry(
            band_score=0.70,
            term="zero-based budget",
            definition="a system where every dollar is assigned a purpose, with income minus expenses equaling zero",
            example="Each paycheck gets fully allocated to categories."
        ),
        PhraseEntry(
            band_score=0.90,
            term="envelope accounting",
            definition="categorical cash-flow management with hard constraints, variance tracking, and reallocation protocols",
            example="Monthly variance analysis informs next-period allocations."
        ),
    ],
    
    # -------------------------------------------------------------------------
    # SAVING Concept
    # -------------------------------------------------------------------------
    "SAVING": [
        PhraseEntry(
            band_score=0.10,
            term="saving",
            definition="keeping some of your money instead of spending it all",
            example="You put coins in a piggy bank.",
            analogy="like storing acorns for winter"
        ),
        PhraseEntry(
            band_score=0.35,
            term="savings account",
            definition="a safe place at a bank where your money can grow a little over time",
            example="The bank adds a small amount of interest to your savings."
        ),
        PhraseEntry(
            band_score=0.70,
            term="emergency fund",
            definition="money set aside to cover unexpected expenses, usually 3-6 months of living costs",
            example="This fund covers you if you lose your job or have a big repair."
        ),
        PhraseEntry(
            band_score=0.90,
            term="liquidity reserve",
            definition="highly liquid assets held for contingencies, opportunity cost balanced against risk mitigation",
            example="Optimize placement across HYSA, money market, and T-bills."
        ),
    ],
    
    # -------------------------------------------------------------------------
    # DEBT Concept
    # -------------------------------------------------------------------------
    "DEBT": [
        PhraseEntry(
            band_score=0.10,
            term="debt",
            definition="money you owe to someone else",
            example="If you borrow $5, you owe $5 back.",
            analogy="like borrowing a book from the library"
        ),
        PhraseEntry(
            band_score=0.35,
            term="loan",
            definition="money borrowed that you pay back over time, usually with interest",
            example="Student loans help pay for college and are paid back after."
        ),
        PhraseEntry(
            band_score=0.70,
            term="debt-to-income ratio",
            definition="a comparison of how much you owe versus how much you earn",
            example="Lenders use this to decide if you can afford more debt."
        ),
        PhraseEntry(
            band_score=0.90,
            term="leverage ratio",
            definition="a measure of debt exposure relative to equity or income, used to assess financial risk and capacity",
            example="Optimize leverage for growth while maintaining debt serviceability."
        ),
    ],
    
    # -------------------------------------------------------------------------
    # FINANCIAL_LITERACY Concept (for PPI/LPI intro text)
    # -------------------------------------------------------------------------
    "FINANCIAL_LITERACY": [
        PhraseEntry(
            band_score=0.10,
            term="learning about money",
            definition="knowing how to use money wisely",
            example="You learn how to save and spend.",
            analogy="like learning the rules of a game"
        ),
        PhraseEntry(
            band_score=0.35,
            term="financial skills",
            definition="the ability to manage money well, including budgeting and saving",
            example="Good money skills help you avoid running out of cash."
        ),
        PhraseEntry(
            band_score=0.70,
            term="financial literacy",
            definition="understanding financial concepts and being able to make informed money decisions",
            example="Financially literate people compare options before borrowing."
        ),
        PhraseEntry(
            band_score=0.90,
            term="financial acumen",
            definition="comprehensive understanding of financial instruments, markets, and strategic wealth management",
            example="Apply acumen to optimize tax efficiency and portfolio construction."
        ),
    ],
    
    # -------------------------------------------------------------------------
    # MONEY_DECISION Concept (for PPI questions)
    # -------------------------------------------------------------------------
    "MONEY_DECISION": [
        PhraseEntry(
            band_score=0.10,
            term="money choice",
            definition="deciding what to do with your money",
            example="Should you buy a toy now or save for something bigger?",
            analogy="like choosing which game to play"
        ),
        PhraseEntry(
            band_score=0.35,
            term="financial decision",
            definition="choosing how to spend, save, or use money",
            example="Deciding between two phones at different prices."
        ),
        PhraseEntry(
            band_score=0.70,
            term="financial decision-making",
            definition="evaluating options based on costs, benefits, and long-term impact",
            example="Compare interest rates before choosing a loan."
        ),
        PhraseEntry(
            band_score=0.90,
            term="capital allocation decision",
            definition="strategic deployment of resources across competing priorities with risk-adjusted return analysis",
            example="Evaluate opportunity cost and NPV before committing capital."
        ),
    ],
}


# =============================================================================
# SENTENCE TEMPLATE LIBRARY (STL)
# =============================================================================
# Grammar-safe frames with slots. NO paraphrasing.

SENTENCE_TEMPLATES: Dict[str, SentenceTemplate] = {
    
    # Definition template
    "T_DEF": SentenceTemplate(
        template_id="T_DEF",
        frame="{TERM} means {DEFINITION}.",
        use_when="always"
    ),
    
    # Definition with article (for terms starting with vowel sounds)
    "T_DEF_A": SentenceTemplate(
        template_id="T_DEF_A",
        frame="A {TERM} is {DEFINITION}.",
        use_when="term_needs_article"
    ),
    
    # Mechanism template
    "T_MECH": SentenceTemplate(
        template_id="T_MECH",
        frame="If {CONDITION}, then {OUTCOME}.",
        use_when="has_condition_outcome"
    ),
    
    # Rule template
    "T_RULE": SentenceTemplate(
        template_id="T_RULE",
        frame="A good rule is: {RULE}. {REASON}",
        use_when="has_rule"
    ),
    
    # Example template
    "T_EXAMPLE": SentenceTemplate(
        template_id="T_EXAMPLE",
        frame="Example: {EXAMPLE}",
        use_when="has_example"
    ),
    
    # Analogy template
    "T_ANALOGY": SentenceTemplate(
        template_id="T_ANALOGY",
        frame="Think of it {ANALOGY}.",
        use_when="has_analogy"
    ),
    
    # Stretch template
    "T_STRETCH": SentenceTemplate(
        template_id="T_STRETCH",
        frame="Next step: {STRETCH_ACTION}",
        use_when="stretch_enabled"
    ),
    
    # Simple explanation (for very young users)
    "T_SIMPLE": SentenceTemplate(
        template_id="T_SIMPLE",
        frame="{TERM} is {DEFINITION}.",
        use_when="lc_very_low"
    ),
}


# =============================================================================
# TONE VARIANTS
# =============================================================================

TONE_PREPENDS = {
    "supportive": "You've got this—",
    "playful": "Okay, real talk—",
    "direct": "",  # No prepend
}


# =============================================================================
# PPI INTEGRITY GATE DATA
# =============================================================================
# Required keywords and forbidden drift phrases per trait

PPI_INTEGRITY_RULES: Dict[str, Dict] = {
    # Default rules for all PPI questions
    "default": {
        "required_keywords": [],  # Must be present
        "forbidden_drift": [],    # Must NOT be present
        "allow_transformation": True
    },
    
    # Trait-specific rules
    "risk_tolerance": {
        "required_keywords": ["risk", "comfortable", "willing"],
        "forbidden_drift": ["should", "must", "always"],
        "allow_transformation": True
    },
    
    "planning_preference": {
        "required_keywords": ["plan", "decide", "prefer"],
        "forbidden_drift": ["wrong", "bad", "never"],
        "allow_transformation": True
    },
    
    "spending_behavior": {
        "required_keywords": ["spend", "buy", "money"],
        "forbidden_drift": ["wasteful", "stupid", "irresponsible"],
        "allow_transformation": True
    },
}


def get_phrase_entry(concept_id: str, target_cd: float) -> Optional[PhraseEntry]:
    """
    Get the nearest phrase entry for a concept based on target CD.
    
    Args:
        concept_id: The concept identifier (e.g., "CREDIT_CARD")
        target_cd: Target conceptual depth (0.0-1.0)
    
    Returns:
        PhraseEntry or None if concept not found
    """
    if concept_id not in PHRASE_BANK_MATRIX:
        return None
    
    entries = PHRASE_BANK_MATRIX[concept_id]
    if not entries:
        return None
    
    # Find entry with band_score nearest to target_cd
    nearest = min(entries, key=lambda e: abs(e.band_score - target_cd))
    return nearest


def get_template(template_id: str) -> Optional[SentenceTemplate]:
    """
    Get a sentence template by ID.
    
    Args:
        template_id: Template identifier (e.g., "T_DEF")
    
    Returns:
        SentenceTemplate or None
    """
    return SENTENCE_TEMPLATES.get(template_id)
