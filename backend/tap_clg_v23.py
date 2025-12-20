"""
TAP v2.3 - CLG (Controlled Language Generator)
==============================================
Clean-room implementation. NO paraphrasing. NO synonym replacement.

TAP has 2 layers:
A) Decision Layer (TAP CoreLogic): compute LC/CD/IA/stretch, select content
B) Realization Layer (CLG): render grammar-safe text using PBM + STL slot fill

Version: 2.3.0
EL_MAX: 5 (POC fixed)
"""

from dataclasses import dataclass
from typing import Dict, List, Optional, Any


# =============================================================================
# CONFIGURATION
# =============================================================================

EL_MAX_POC = 5  # POC uses fixed EL_MAX=5


# =============================================================================
# TAP CORE SCALARS
# =============================================================================

def clamp(value: float, lo: float = 0.0, hi: float = 1.0) -> float:
    """Clamp value between lo and hi."""
    return max(lo, min(hi, value))


@dataclass
class TAPScalars:
    """TAP v2.3 core scalars."""
    age: int
    el: int
    el_max: int
    age_norm: float
    el_norm: float
    lc: float   # Language Complexity (age-dominant)
    cd: float   # Conceptual Depth (EL-dominant)
    ia: float   # Ideological Abstraction (balanced)
    stretch_el: int
    stretch_norm: float


def compute_tap_scalars(age: int, el: int, el_max: int = EL_MAX_POC) -> TAPScalars:
    """
    Compute TAP v2.3 scalars.
    
    Formulas:
        age_norm = clamp(age/100, 0..1)
        el_norm  = (EL-1)/(EL_MAX-1)
        
        LC = clamp(0.65*age_norm + 0.35*el_norm, 0..1)
        CD = clamp(0.85*el_norm  + 0.15*age_norm, 0..1)
        IA = clamp(0.50*age_norm + 0.50*el_norm, 0..1)
        
        stretch_EL   = min(EL+1, EL_MAX)
        stretch_norm = (stretch_EL-1)/(EL_MAX-1)
    """
    age_norm = clamp(age / 100.0)
    el_norm = (el - 1) / (el_max - 1) if el_max > 1 else 0.0
    
    lc = clamp(0.65 * age_norm + 0.35 * el_norm)
    cd = clamp(0.85 * el_norm + 0.15 * age_norm)
    ia = clamp(0.50 * age_norm + 0.50 * el_norm)
    
    stretch_el = min(el + 1, el_max)
    stretch_norm = (stretch_el - 1) / (el_max - 1) if el_max > 1 else 1.0
    
    return TAPScalars(
        age=age, el=el, el_max=el_max,
        age_norm=round(age_norm, 4),
        el_norm=round(el_norm, 4),
        lc=round(lc, 4),
        cd=round(cd, 4),
        ia=round(ia, 4),
        stretch_el=stretch_el,
        stretch_norm=round(stretch_norm, 4)
    )


# =============================================================================
# PHRASE BANK MATRIX (PBM)
# =============================================================================
# Structure: concept_id -> list of entries
# Each entry: band_score (0..1), term, definition, example, analogy (optional)
# Selection: NEAREST band_score to CD

@dataclass
class PBMEntry:
    """Single entry in the Phrase Bank Matrix."""
    band: float
    term: str
    definition: str
    example: Optional[str] = None
    analogy: Optional[str] = None


PHRASE_BANK: Dict[str, List[PBMEntry]] = {
    
    # =========================================================================
    # CREDIT_CARD
    # =========================================================================
    "CREDIT_CARD": [
        PBMEntry(
            band=0.10,
            term="credit card",
            definition="a card that lets you borrow money to buy something now and pay it back later",
            example="You buy something today, then you pay the card back.",
            analogy="like borrowing a toy and returning it"
        ),
        PBMEntry(
            band=0.35,
            term="credit card",
            definition="a borrowing tool with a limit; if you don't pay the full balance, interest is charged",
            example="Paying the full balance avoids extra cost."
        ),
        PBMEntry(
            band=0.70,
            term="revolving credit",
            definition="a line of credit where balances carry month to month and accrue interest based on APR",
            example="Carrying a balance increases total cost over time."
        ),
        PBMEntry(
            band=0.90,
            term="revolving facility",
            definition="issuer-provided revolving line; cost depends on APR, accrual method, statement timing, and payment behavior",
            example="Optimize by avoiding revolving interest and managing utilization."
        ),
    ],
    
    # =========================================================================
    # PAYING_BILLS
    # =========================================================================
    "PAYING_BILLS": [
        PBMEntry(
            band=0.10,
            term="bills",
            definition="money you must pay for things you use, like lights or a phone",
            example="You pay each month so the service keeps working.",
            analogy="like paying for a game subscription"
        ),
        PBMEntry(
            band=0.35,
            term="due date",
            definition="the deadline to pay; paying late adds fees",
            example="Pay before the due date to avoid late fees."
        ),
        PBMEntry(
            band=0.70,
            term="cash-flow management",
            definition="planning when money comes in and goes out so bills are covered first",
            example="Set aside bill money before spending on wants."
        ),
        PBMEntry(
            band=0.90,
            term="accounts payable controls",
            definition="a system for scheduling, delegating, auditing, and confirming recurring payments",
            example="Use automation plus reviews to prevent misses or errors."
        ),
    ],
    
    # =========================================================================
    # INVESTING
    # =========================================================================
    "INVESTING": [
        PBMEntry(
            band=0.10,
            term="investing",
            definition="putting money into something that can grow over time",
            example="You put money in and it might become more later.",
            analogy="like planting a seed"
        ),
        PBMEntry(
            band=0.35,
            term="stocks and bonds",
            definition="stocks are pieces of companies; bonds are loans that get paid back",
            example="A fund can hold many stocks at once."
        ),
        PBMEntry(
            band=0.70,
            term="index fund",
            definition="a fund that tracks many investments to spread risk; returns depend on the market",
            example="Regular investing smooths ups and downs."
        ),
        PBMEntry(
            band=0.90,
            term="asset allocation",
            definition="designing a portfolio mix across assets to manage risk, taxes, and long-term goals",
            example="Rebalance to keep risk aligned with plan."
        ),
    ],
    
    # =========================================================================
    # SAVING
    # =========================================================================
    "SAVING": [
        PBMEntry(
            band=0.10,
            term="saving",
            definition="keeping some of your money instead of spending it all",
            example="You put coins in a piggy bank.",
            analogy="like storing acorns for winter"
        ),
        PBMEntry(
            band=0.35,
            term="savings account",
            definition="a safe place at a bank where your money can grow a little over time",
            example="The bank adds a small amount of interest to your savings."
        ),
        PBMEntry(
            band=0.70,
            term="emergency fund",
            definition="money set aside to cover unexpected expenses, usually 3-6 months of living costs",
            example="This fund covers you if you lose your job or have a big repair."
        ),
        PBMEntry(
            band=0.90,
            term="liquidity reserve",
            definition="highly liquid assets held for contingencies, opportunity cost balanced against risk mitigation",
            example="Optimize placement across HYSA, money market, and T-bills."
        ),
    ],
    
    # =========================================================================
    # BUDGETING
    # =========================================================================
    "BUDGETING": [
        PBMEntry(
            band=0.10,
            term="budget",
            definition="a plan for how you spend your money",
            example="You decide how much to spend on snacks and toys.",
            analogy="like dividing your allowance into jars"
        ),
        PBMEntry(
            band=0.35,
            term="budget",
            definition="tracking income and expenses to make sure you can pay for what you need",
            example="Write down what you earn and spend each month."
        ),
        PBMEntry(
            band=0.70,
            term="zero-based budget",
            definition="a system where every dollar is assigned a purpose, with income minus expenses equaling zero",
            example="Each paycheck gets fully allocated to categories."
        ),
        PBMEntry(
            band=0.90,
            term="envelope accounting",
            definition="categorical cash-flow management with hard constraints, variance tracking, and reallocation protocols",
            example="Monthly variance analysis informs next-period allocations."
        ),
    ],
    
    # =========================================================================
    # DEBT
    # =========================================================================
    "DEBT": [
        PBMEntry(
            band=0.10,
            term="debt",
            definition="money you owe to someone else",
            example="If you borrow $5, you owe $5 back.",
            analogy="like borrowing a book from the library"
        ),
        PBMEntry(
            band=0.35,
            term="loan",
            definition="money borrowed that you pay back over time, usually with interest",
            example="Student loans help pay for college and are paid back after."
        ),
        PBMEntry(
            band=0.70,
            term="debt-to-income ratio",
            definition="a comparison of how much you owe versus how much you earn",
            example="Lenders use this to decide if you can afford more debt."
        ),
        PBMEntry(
            band=0.90,
            term="leverage ratio",
            definition="a measure of debt exposure relative to equity or income, used to assess financial risk",
            example="Optimize leverage for growth while maintaining debt serviceability."
        ),
    ],
}


def select_pbm_entry(concept_id: str, cd: float) -> Optional[PBMEntry]:
    """
    Select PBM entry with band_score NEAREST to CD.
    
    This is NOT threshold-based. It finds the mathematically closest band.
    """
    entries = PHRASE_BANK.get(concept_id)
    if not entries:
        return None
    return min(entries, key=lambda e: abs(e.band - cd))


# =============================================================================
# SENTENCE TEMPLATE LIBRARY (STL)
# =============================================================================
# Grammar-safe frames with slots. NO paraphrasing.

TEMPLATES = {
    "T_DEF": "{TERM} means {DEFINITION}.",
    "T_DEF_IS": "{TERM} is {DEFINITION}.",
    "T_EXAMPLE": "Example: {EXAMPLE}",
    "T_ANALOGY": "Think of it {ANALOGY}.",
    "T_STRETCH": "Next step: learn about {STRETCH_TERM}.",
    "T_MECH": "If {CONDITION}, then {OUTCOME}.",
    "T_RULE": "A good rule is: {RULE}. {REASON}",
}


# =============================================================================
# CLG ENGINE (Controlled Language Generator)
# =============================================================================

@dataclass
class CLGOutput:
    """Output from CLG rendering."""
    concept_id: str
    scalars: TAPScalars
    pbm_band_selected: float
    pbm_term: str
    templates_used: List[str]
    text: str
    synonym_replacement_used: bool = False  # ALWAYS False


class CLGEngine:
    """
    Controlled Language Generator.
    
    Renders grammar-safe text by:
    1. Selecting PBM entry NEAREST to CD
    2. Filling STL template slots with PBM data
    3. Including support (example/analogy) based on LC
    4. Adding stretch content if stretch_norm > cd
    
    NO synonym replacement. NO paraphrasing. ONLY slot filling.
    """
    
    def render(self, concept_id: str, scalars: TAPScalars) -> CLGOutput:
        """
        Render content for a concept using CLG.
        
        Rules:
        - PBM band selection: NEAREST to CD
        - Include example if LC < 0.7
        - Include analogy if LC < 0.3 and analogy exists
        - Include stretch if stretch_norm > cd + 0.1
        """
        cd = scalars.cd
        lc = scalars.lc
        stretch_norm = scalars.stretch_norm
        
        # Select PBM entry nearest to CD
        entry = select_pbm_entry(concept_id, cd)
        if not entry:
            return CLGOutput(
                concept_id=concept_id,
                scalars=scalars,
                pbm_band_selected=0,
                pbm_term="UNKNOWN",
                templates_used=[],
                text=f"[No PBM entry for {concept_id}]"
            )
        
        # Build output from templates
        lines = []
        templates_used = []
        
        # 1. Definition (always)
        def_text = TEMPLATES["T_DEF"].format(
            TERM=entry.term,
            DEFINITION=entry.definition
        )
        lines.append(def_text)
        templates_used.append("T_DEF")
        
        # 2. Example (if LC < 0.7)
        if lc < 0.7 and entry.example:
            ex_text = TEMPLATES["T_EXAMPLE"].format(EXAMPLE=entry.example)
            lines.append(ex_text)
            templates_used.append("T_EXAMPLE")
        
        # 3. Analogy (if LC < 0.3 and analogy exists)
        if lc < 0.3 and entry.analogy:
            an_text = TEMPLATES["T_ANALOGY"].format(ANALOGY=entry.analogy)
            lines.append(an_text)
            templates_used.append("T_ANALOGY")
        
        # 4. Stretch (if stretch_norm > cd + 0.1)
        if stretch_norm > cd + 0.1:
            stretch_entry = select_pbm_entry(concept_id, stretch_norm)
            if stretch_entry and stretch_entry.band > entry.band:
                st_text = TEMPLATES["T_STRETCH"].format(STRETCH_TERM=stretch_entry.term)
                lines.append(st_text)
                templates_used.append("T_STRETCH")
        
        return CLGOutput(
            concept_id=concept_id,
            scalars=scalars,
            pbm_band_selected=entry.band,
            pbm_term=entry.term,
            templates_used=templates_used,
            text=" ".join(lines),
            synonym_replacement_used=False  # NEVER True
        )
    
    def render_for_user(
        self,
        concept_id: str,
        age: int,
        el: int,
        el_max: int = EL_MAX_POC
    ) -> CLGOutput:
        """Convenience method: compute scalars and render."""
        scalars = compute_tap_scalars(age, el, el_max)
        return self.render(concept_id, scalars)


# Singleton
_clg_engine: Optional[CLGEngine] = None

def get_clg_engine() -> CLGEngine:
    """Get CLG engine singleton."""
    global _clg_engine
    if _clg_engine is None:
        _clg_engine = CLGEngine()
    return _clg_engine


# =============================================================================
# 9-CASE STEP TEST
# =============================================================================

def run_clg_step_test() -> Dict[str, Any]:
    """
    Run 9-case step test (EL_MAX=5).
    
    Users:
    - U1: age=8, EL=1
    - U2: age=28, EL=2
    - U3: age=60, EL=5
    
    Concepts:
    - CREDIT_CARD
    - PAYING_BILLS
    - INVESTING
    """
    clg = get_clg_engine()
    
    users = [
        {"label": "U1_child", "age": 8, "el": 1},
        {"label": "U2_adult_beginner", "age": 28, "el": 2},
        {"label": "U3_senior_expert", "age": 60, "el": 5},
    ]
    
    concepts = ["CREDIT_CARD", "PAYING_BILLS", "INVESTING"]
    
    results = {
        "el_max": EL_MAX_POC,
        "cases": [],
        "confirmation": {
            "synonym_replacement_used": False,
            "all_outputs_from_templates": True
        }
    }
    
    for user in users:
        scalars = compute_tap_scalars(user["age"], user["el"], EL_MAX_POC)
        
        for concept in concepts:
            output = clg.render(concept, scalars)
            
            results["cases"].append({
                "case_id": f"{user['label']}_{concept}",
                "user": user,
                "scalars": {
                    "age_norm": scalars.age_norm,
                    "el_norm": scalars.el_norm,
                    "lc": scalars.lc,
                    "cd": scalars.cd,
                    "ia": scalars.ia,
                    "stretch_el": scalars.stretch_el,
                    "stretch_norm": scalars.stretch_norm
                },
                "pbm_band_selected": output.pbm_band_selected,
                "pbm_term": output.pbm_term,
                "templates_used": output.templates_used,
                "output_preview": output.text[:150] + "..." if len(output.text) > 150 else output.text,
                "synonym_replacement_used": output.synonym_replacement_used
            })
    
    return results


# =============================================================================
# MAIN
# =============================================================================

if __name__ == "__main__":
    import json
    results = run_clg_step_test()
    print(json.dumps(results, indent=2))
