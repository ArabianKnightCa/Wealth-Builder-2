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
            analogy="like planting a seed"
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
# PPI QUESTION BANK - BASELINE + TRANSFORMATION RULES
# =============================================================================
# Each question has a BASELINE (expert level) and transformation rules
# that apply based on continuous LC value derived from user's age.
# NO BUCKETS - LC is used as a continuous parameter.

@dataclass
class PPIQuestion:
    """PPI Question with baseline and transformation rules."""
    question_id: str
    baseline_prompt: str
    baseline_options: List[str]
    # Word substitutions: (original, simple, lc_threshold)
    # Applied when LC < threshold
    prompt_substitutions: List[tuple] = field(default_factory=list)
    option_substitutions: List[tuple] = field(default_factory=list)


# Transformation rules based on LC thresholds
# These create GRADUAL transitions, not discrete buckets
# Lower LC = more simplification

PPI_QUESTIONS: Dict[str, PPIQuestion] = {
    "PPI_Q01": PPIQuestion(
        question_id="PPI_Q01",
        baseline_prompt="When making financial decisions, I prefer to:",
        baseline_options=[
            "A Research extensively before deciding",
            "B Go with my gut feeling",
            "C Ask friends or family for advice",
            "D Follow what experts recommend"
        ],
        prompt_substitutions=[
            ("financial decisions", "money choices", 0.40),
            ("money choices", "choose about money", 0.20),
            ("I prefer to", "I like to", 0.25),
        ],
        option_substitutions=[
            ("Research extensively before deciding", "Ask lots of questions first", 0.20),
            ("Research extensively", "Research", 0.40),
            ("Ask friends or family for advice", "Ask my family what to do", 0.20),
            ("Follow what experts recommend", "Do what smart people say", 0.20),
        ]
    ),
    "PPI_Q02": PPIQuestion(
        question_id="PPI_Q02",
        baseline_prompt="My approach to saving money is:",
        baseline_options=[
            "A Save a fixed amount each month",
            "B Save whatever is left over",
            "C Save only for specific goals",
            "D I struggle to save consistently"
        ],
        prompt_substitutions=[
            ("My approach to saving money is", "How I save my money", 0.25),
        ],
        option_substitutions=[
            ("Save a fixed amount each month", "Put away the same amount each time", 0.20),
            ("Save whatever is left over", "Save what I have left", 0.25),
            ("Save only for specific goals", "Save for special things I want", 0.20),
            ("I struggle to save consistently", "I find it hard to save", 0.25),
        ]
    ),
    "PPI_Q03": PPIQuestion(
        question_id="PPI_Q03",
        baseline_prompt="When I think about my financial future, I feel:",
        baseline_options=[
            "A Excited and optimistic",
            "B Anxious or worried",
            "C Uncertain but hopeful",
            "D Confident and prepared"
        ],
        prompt_substitutions=[
            ("my financial future", "my money future", 0.40),
            ("my money future", "money in the future", 0.20),
        ],
        option_substitutions=[
            ("Excited and optimistic", "Happy and hopeful", 0.25),
            ("Anxious or worried", "Worried or scared", 0.20),
            ("Uncertain but hopeful", "Okay, not too worried", 0.20),
            ("Confident and prepared", "Ready and not worried", 0.20),
        ]
    ),
    "PPI_Q04": PPIQuestion(
        question_id="PPI_Q04",
        baseline_prompt="I track my spending:",
        baseline_options=[
            "A Daily or weekly",
            "B Monthly",
            "C Rarely or never",
            "D Only when I'm worried about money"
        ],
        prompt_substitutions=[
            ("I track my spending", "I keep track of what I spend", 0.25),
        ],
        option_substitutions=[
            ("Daily or weekly", "Every day or almost every day", 0.20),
            ("Rarely or never", "Not very often", 0.25),
            ("Only when I'm worried about money", "Only when I need to", 0.20),
        ]
    ),
    "PPI_Q05": PPIQuestion(
        question_id="PPI_Q05",
        baseline_prompt="My biggest financial priority right now is:",
        baseline_options=[
            "A Building an emergency fund",
            "B Paying off debt",
            "C Saving for a specific goal",
            "D Learning to budget better"
        ],
        prompt_substitutions=[
            ("My biggest financial priority", "The most important money thing for me", 0.20),
            ("financial priority", "money goal", 0.35),
        ],
        option_substitutions=[
            ("Building an emergency fund", "Saving money for emergencies", 0.25),
            ("Paying off debt", "Paying back money I owe", 0.20),
            ("Saving for a specific goal", "Saving for something special", 0.25),
            ("Learning to budget better", "Learning to plan my money better", 0.25),
        ]
    ),
    "PPI_Q06": PPIQuestion(
        question_id="PPI_Q06",
        baseline_prompt="When I receive unexpected money, I usually:",
        baseline_options=[
            "A Save most or all of it",
            "B Spend it on something I've wanted",
            "C Split it between saving and spending",
            "D Use it to pay bills or debt"
        ],
        prompt_substitutions=[
            ("receive unexpected money", "get extra money I didn't expect", 0.25),
        ],
        option_substitutions=[
            ("Save most or all of it", "Save most of it", 0.30),
            ("Spend it on something I've wanted", "Buy something I wanted", 0.25),
            ("Split it between saving and spending", "Save some and spend some", 0.25),
            ("Use it to pay bills or debt", "Use it to pay for things I owe", 0.20),
        ]
    ),
    "PPI_Q07": PPIQuestion(
        question_id="PPI_Q07",
        baseline_prompt="I learn best through:",
        baseline_options=[
            "A Reading and research",
            "B Hands-on practice",
            "C Watching videos or tutorials",
            "D Discussion and conversation"
        ],
        prompt_substitutions=[
            ("I learn best through", "I learn best by", 0.30),
        ],
        option_substitutions=[
            ("Reading and research", "Reading and looking things up", 0.25),
            ("Hands-on practice", "Trying things myself", 0.20),
            ("Watching videos or tutorials", "Watching videos", 0.30),
            ("Discussion and conversation", "Talking with others", 0.25),
        ]
    ),
    "PPI_Q08": PPIQuestion(
        question_id="PPI_Q08",
        baseline_prompt="My relationship with credit cards is:",
        baseline_options=[
            "A I use them responsibly and pay in full",
            "B I avoid them completely",
            "C I sometimes carry a balance",
            "D I struggle with credit card debt"
        ],
        prompt_substitutions=[
            ("My relationship with credit cards is", "How I use credit cards", 0.30),
            ("How I use credit cards", "About credit cards", 0.20),
        ],
        option_substitutions=[
            ("I use them responsibly and pay in full", "I use them carefully and pay everything back", 0.25),
            ("I avoid them completely", "I don't use them at all", 0.25),
            ("I sometimes carry a balance", "I sometimes owe money on them", 0.25),
            ("I struggle with credit card debt", "I have trouble paying them back", 0.20),
        ]
    ),
    "PPI_Q09": PPIQuestion(
        question_id="PPI_Q09",
        baseline_prompt="When setting financial goals, I prefer:",
        baseline_options=[
            "A Detailed plans with specific timelines",
            "B General direction without strict deadlines",
            "C Short-term goals I can achieve quickly",
            "D Long-term vision with flexibility"
        ],
        prompt_substitutions=[
            ("setting financial goals", "making money goals", 0.30),
            ("making money goals", "planning what to do with money", 0.20),
        ],
        option_substitutions=[
            ("Detailed plans with specific timelines", "Plans with exact dates", 0.25),
            ("General direction without strict deadlines", "A general idea without deadlines", 0.25),
            ("Short-term goals I can achieve quickly", "Small goals I can reach soon", 0.20),
            ("Long-term vision with flexibility", "Big goals that can change", 0.25),
        ]
    ),
    "PPI_Q10": PPIQuestion(
        question_id="PPI_Q10",
        baseline_prompt="Financial stress affects me by:",
        baseline_options=[
            "A Making me more motivated to improve",
            "B Causing me to avoid thinking about money",
            "C Impacting my sleep or mood significantly",
            "D I don't experience much financial stress"
        ],
        prompt_substitutions=[
            ("Financial stress affects me by", "When I worry about money, it", 0.25),
            ("Financial stress", "Money worries", 0.35),
        ],
        option_substitutions=[
            ("Making me more motivated to improve", "Makes me want to do better", 0.25),
            ("Causing me to avoid thinking about money", "Makes me not want to think about it", 0.20),
            ("Impacting my sleep or mood significantly", "Makes me feel bad or lose sleep", 0.20),
            ("I don't experience much financial stress", "I don't worry much about money", 0.25),
        ]
    ),
    "PPI_Q11": PPIQuestion(
        question_id="PPI_Q11",
        baseline_prompt="I would describe my spending habits as:",
        baseline_options=[
            "A Very disciplined",
            "B Mostly controlled with occasional splurges",
            "C Impulsive at times",
            "D Often reactive to emotions"
        ],
        prompt_substitutions=[
            ("I would describe my spending habits as", "How I spend money", 0.25),
        ],
        option_substitutions=[
            ("Very disciplined", "Very careful", 0.25),
            ("Mostly controlled with occasional splurges", "Mostly careful but sometimes I spend a lot", 0.20),
            ("Impulsive at times", "Sometimes I buy things without thinking", 0.20),
            ("Often reactive to emotions", "I often buy things based on how I feel", 0.20),
        ]
    ),
    "PPI_Q12": PPIQuestion(
        question_id="PPI_Q12",
        baseline_prompt="My knowledge of investing is:",
        baseline_options=[
            "A Strong – I actively invest",
            "B Basic – I understand the concepts",
            "C Limited – I'm just starting to learn",
            "D None – It seems too complicated"
        ],
        prompt_substitutions=[
            ("My knowledge of investing is", "What I know about investing", 0.30),
            ("What I know about investing", "What I know about growing money", 0.20),
        ],
        option_substitutions=[
            ("Strong – I actively invest", "A lot – I invest my money", 0.30),
            ("Basic – I understand the concepts", "Some – I understand the basics", 0.30),
            ("Limited – I'm just starting to learn", "A little – I'm still learning", 0.25),
            ("None – It seems too complicated", "Not much – It seems hard", 0.20),
        ]
    ),
    "PPI_Q13": PPIQuestion(
        question_id="PPI_Q13",
        baseline_prompt="When facing a financial setback, I:",
        baseline_options=[
            "A Quickly adjust my plan and move forward",
            "B Feel discouraged but eventually recover",
            "C Need support from others to cope",
            "D Find it very difficult to bounce back"
        ],
        prompt_substitutions=[
            ("facing a financial setback", "something goes wrong with money", 0.25),
            ("a financial setback", "a money problem", 0.35),
        ],
        option_substitutions=[
            ("Quickly adjust my plan and move forward", "Change my plan and keep going", 0.25),
            ("Feel discouraged but eventually recover", "Feel sad but get better", 0.20),
            ("Need support from others to cope", "Need help from others", 0.25),
            ("Find it very difficult to bounce back", "Find it hard to feel better", 0.20),
        ]
    ),
    "PPI_Q14": PPIQuestion(
        question_id="PPI_Q14",
        baseline_prompt="I prefer to make purchases:",
        baseline_options=[
            "A After careful comparison shopping",
            "B When I find a good deal",
            "C When I need or want something",
            "D Impulsively if it feels right"
        ],
        prompt_substitutions=[
            ("I prefer to make purchases", "I like to buy things", 0.25),
        ],
        option_substitutions=[
            ("After careful comparison shopping", "After looking at different options", 0.25),
            ("When I find a good deal", "When I find a good price", 0.30),
            ("When I need or want something", "When I need or want it", 0.35),
            ("Impulsively if it feels right", "Right away if I want it", 0.20),
        ]
    ),
    "PPI_Q15": PPIQuestion(
        question_id="PPI_Q15",
        baseline_prompt="My comfort level with financial risk is:",
        baseline_options=[
            "A High – I'm willing to take calculated risks",
            "B Moderate – Some risk is okay",
            "C Low – I prefer safety and stability",
            "D Very low – I avoid risk completely"
        ],
        prompt_substitutions=[
            ("My comfort level with financial risk is", "How I feel about taking chances with money", 0.25),
            ("financial risk", "money risk", 0.35),
        ],
        option_substitutions=[
            ("High – I'm willing to take calculated risks", "I like taking smart chances", 0.25),
            ("Moderate – Some risk is okay", "Some risk is okay with me", 0.30),
            ("Low – I prefer safety and stability", "I like to be safe", 0.25),
            ("Very low – I avoid risk completely", "I don't like taking any chances", 0.20),
        ]
    ),
    "PPI_Q16": PPIQuestion(
        question_id="PPI_Q16",
        baseline_prompt="I talk about money with friends/family:",
        baseline_options=[
            "A Openly and regularly",
            "B Occasionally when relevant",
            "C Rarely – it feels uncomfortable",
            "D Never – it's too personal"
        ],
        prompt_substitutions=[
            ("I talk about money with friends/family", "I talk about money with my family", 0.25),
        ],
        option_substitutions=[
            ("Openly and regularly", "Often and freely", 0.30),
            ("Occasionally when relevant", "Sometimes when it comes up", 0.25),
            ("Rarely – it feels uncomfortable", "Not much – it feels weird", 0.20),
            ("Never – it's too personal", "Never – it's private", 0.25),
        ]
    ),
    "PPI_Q17": PPIQuestion(
        question_id="PPI_Q17",
        baseline_prompt="My biggest financial challenge is:",
        baseline_options=[
            "A Not earning enough",
            "B Controlling my spending",
            "C Understanding financial concepts",
            "D Staying motivated to save"
        ],
        prompt_substitutions=[
            ("My biggest financial challenge is", "The hardest thing about money for me is", 0.25),
            ("financial challenge", "money problem", 0.35),
        ],
        option_substitutions=[
            ("Not earning enough", "Not having enough money", 0.25),
            ("Controlling my spending", "Not spending too much", 0.25),
            ("Understanding financial concepts", "Understanding money stuff", 0.20),
            ("Staying motivated to save", "Wanting to keep saving", 0.25),
        ]
    ),
    "PPI_Q18": PPIQuestion(
        question_id="PPI_Q18",
        baseline_prompt="When planning my budget, I:",
        baseline_options=[
            "A Use detailed spreadsheets or apps",
            "B Keep a rough mental estimate",
            "C Follow a simple system",
            "D Don't really budget"
        ],
        prompt_substitutions=[
            ("When planning my budget", "When I plan how to spend my money", 0.25),
        ],
        option_substitutions=[
            ("Use detailed spreadsheets or apps", "Use apps or charts", 0.30),
            ("Keep a rough mental estimate", "Keep track in my head", 0.25),
            ("Follow a simple system", "Use a simple way", 0.30),
            ("Don't really budget", "Don't really plan it", 0.30),
        ]
    ),
    "PPI_Q19": PPIQuestion(
        question_id="PPI_Q19",
        baseline_prompt="I would describe my financial personality as:",
        baseline_options=[
            "A Planner and saver",
            "B Balanced and practical",
            "C Spontaneous spender",
            "D Still figuring it out"
        ],
        prompt_substitutions=[
            ("I would describe my financial personality as", "When it comes to money, I am", 0.25),
            ("my financial personality", "how I am with money", 0.35),
        ],
        option_substitutions=[
            ("Planner and saver", "Someone who plans and saves", 0.25),
            ("Balanced and practical", "Careful and sensible", 0.25),
            ("Spontaneous spender", "Someone who spends when I want to", 0.20),
            ("Still figuring it out", "Still learning", 0.25),
        ]
    ),
    "PPI_Q20": PPIQuestion(
        question_id="PPI_Q20",
        baseline_prompt="My motivation for improving financial literacy is:",
        baseline_options=[
            "A Achieving specific financial goals",
            "B Reducing stress and anxiety",
            "C Building long-term wealth",
            "D Feeling more confident and in control"
        ],
        prompt_substitutions=[
            ("My motivation for improving financial literacy is", "I want to learn about money because", 0.25),
            ("improving financial literacy", "learning about money", 0.35),
        ],
        option_substitutions=[
            ("Achieving specific financial goals", "I want to reach my money goals", 0.25),
            ("Reducing stress and anxiety", "I want to worry less", 0.25),
            ("Building long-term wealth", "I want to have more money later", 0.20),
            ("Feeling more confident and in control", "I want to feel sure about money", 0.20),
        ]
    ),
}


def transform_ppi_question(question_id: str, lc: float) -> Optional[Dict]:
    """
    Transform a PPI question based on continuous LC value.
    
    NO BUCKETS - applies substitutions based on LC thresholds.
    Lower LC = more simplification applied.
    
    Args:
        question_id: The PPI question ID (e.g., "PPI_Q01")
        lc: Language Complexity (0.0-1.0) - continuous value from user's age
    
    Returns:
        Dict with transformed prompt and options
    """
    if question_id not in PPI_QUESTIONS:
        return None
    
    q = PPI_QUESTIONS[question_id]
    
    # Start with baseline
    prompt = q.baseline_prompt
    options = q.baseline_options.copy()
    
    # Apply prompt substitutions where LC < threshold
    # Sort by threshold descending so we apply most restrictive last
    for original, simple, threshold in sorted(q.prompt_substitutions, key=lambda x: x[2], reverse=True):
        if lc < threshold and original in prompt:
            prompt = prompt.replace(original, simple)
    
    # Apply option substitutions where LC < threshold
    for original, simple, threshold in sorted(q.option_substitutions, key=lambda x: x[2], reverse=True):
        if lc < threshold:
            options = [opt.replace(original, simple) for opt in options]
    
    return {
        "prompt": prompt,
        "options": options,
        "lc_applied": round(lc, 4)
    }


def get_ppi_question(question_id: str, target_lc: float) -> Optional[Dict]:
    """
    Get transformed PPI question based on continuous LC.
    Wrapper for backward compatibility.
    """
    return transform_ppi_question(question_id, target_lc)


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
