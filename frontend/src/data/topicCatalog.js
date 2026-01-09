/**
 * Topic Catalog - 67 Financial Topics
 * Organized by 10 categories with detailed tooltips
 */

export const TOPIC_CATALOG = [
  // ==================== EVERYDAY MONEY (7 topics) ====================
  {
    id: "everyday_money_paycheck",
    label: "I'm stuck in a paycheck-to-paycheck cycle",
    category: "everyday_money",
    displayOrder: 1,
    tooltipDescription: "The exhausting pattern of earning just enough to cover bills with nothing left over—often caused by spending timing mismatches, not just low income. You'll learn: • How to break the cycle without earning more first • The 'paycheck float' strategy that creates breathing room • Timing tricks that make the same income go further • Building a buffer even on a tight budget"
  },
  {
    id: "everyday_money_emergency",
    label: "I need an emergency fund",
    category: "everyday_money",
    displayOrder: 2,
    tooltipDescription: "A savings cushion (typically 3-6 months of expenses) that protects you from financial emergencies turning into financial disasters. You'll learn: • How much you actually need (it's probably less than you think) • Where to keep it so it's accessible but not tempting • How to build it gradually without feeling deprived • When to use it (and when not to)"
  },
  {
    id: "everyday_money_budget",
    label: "Budgeting hasn't worked for me",
    category: "everyday_money",
    displayOrder: 3,
    tooltipDescription: "Traditional budgeting fails most people because it requires constant willpower and tracking. You'll learn: • Why most budgeting advice doesn't work • The 'set it and forget it' approach that actually sticks • How to budget for your actual life, not an idealized version • Systems that work with your habits, not against them"
  },
  {
    id: "everyday_money_overspend",
    label: "I struggle with overspending",
    category: "everyday_money",
    displayOrder: 4,
    tooltipDescription: "Spending more than intended, often on small purchases that add up or emotional purchases that provide temporary relief. You'll learn: • The psychological triggers behind overspending • Strategies to interrupt the spending impulse • How to enjoy spending without guilt or regret • Building awareness without shame"
  },
  {
    id: "everyday_money_stress",
    label: "Money constantly stresses me out",
    category: "everyday_money",
    displayOrder: 5,
    tooltipDescription: "The chronic anxiety and mental burden of financial worry—affecting sleep, relationships, and daily functioning. You'll learn: • How to separate money facts from money feelings • Systems that reduce financial anxiety • When stress is a signal vs. when it's just noise • Building financial peace even before everything is 'fixed'"
  },
  {
    id: "everyday_money_disorganized",
    label: "My finances feel disorganized",
    category: "everyday_money",
    displayOrder: 6,
    tooltipDescription: "Not knowing where your money is, when bills are due, or what you actually have—creating chaos and missed opportunities. You'll learn: • Simple systems to organize accounts and bills • How to create a money command center • Digital tools that reduce overwhelm • Staying organized with minimal ongoing effort"
  },
  {
    id: "everyday_money_automate",
    label: "I want to automate my money management",
    category: "everyday_money",
    displayOrder: 7,
    tooltipDescription: "Setting up systems where your money moves automatically to where it needs to go—reducing decisions, mistakes, and mental burden. You'll learn: • Which financial tasks should be automated (and which shouldn't) • How to set up automatic bill pay, savings, and investing • Failsafes to prevent automation disasters • Maintaining automation without constant monitoring"
  },

  // ==================== DEBT & CREDIT (6 topics) ====================
  {
    id: "debt_credit_overwhelmed",
    label: "I'm overwhelmed by debt",
    category: "debt_credit",
    displayOrder: 1,
    tooltipDescription: "Feeling buried under multiple debts with no clear path forward—often leading to avoidance or paralysis. You'll learn: • How to inventory and face your debt without shame • The debt avalanche vs. snowball methods (and which to use) • How to prioritize which debts to tackle first • Building momentum with small wins that create hope"
  },
  {
    id: "debt_credit_cards",
    label: "Credit card debt is a major issue",
    category: "debt_credit",
    displayOrder: 2,
    tooltipDescription: "High-interest revolving debt (typically 18-25% APR) that compounds rapidly and feels impossible to escape. You'll learn: • Why credit card debt grows so fast • Strategies to stop the bleeding (stop accruing more) • Balance transfer tactics and when they help • How to pay it down efficiently while staying motivated"
  },
  {
    id: "debt_credit_student",
    label: "Student loans feel unmanageable",
    category: "debt_credit",
    displayOrder: 3,
    tooltipDescription: "Educational debt that can feel like a life sentence, especially with unclear repayment options and forbearance traps. You'll learn: • Understanding your loan types and their rules • Income-driven repayment plans explained simply • Forgiveness programs (what's real, what's not) • When to prioritize student loans vs. other goals"
  },
  {
    id: "debt_credit_personal",
    label: "I have personal loans to pay off",
    category: "debt_credit",
    displayOrder: 4,
    tooltipDescription: "Loans from banks, credit unions, or online lenders—typically with fixed payments and terms you need to understand. You'll learn: • How personal loans differ from credit cards • When to consolidate debt vs. tackle separately • Prepayment strategies that save on interest • Avoiding common personal loan traps"
  },
  {
    id: "debt_credit_score",
    label: "My credit score needs improvement",
    category: "debt_credit",
    displayOrder: 5,
    tooltipDescription: "Your credit score affects loan rates, apartment applications, and sometimes job prospects—understanding and improving it matters. You'll learn: • What actually impacts your credit score (and what doesn't) • Quick wins that boost your score in 30-90 days • How to dispute errors and rebuild after mistakes • Maintaining good credit long-term"
  },
  {
    id: "debt_credit_relying",
    label: "I rely on debt to cover basic expenses",
    category: "debt_credit",
    displayOrder: 6,
    tooltipDescription: "Using credit cards or loans to pay for groceries, rent, or utilities—a dangerous cycle that compounds quickly. You'll learn: • Why this happens (it's often structural, not personal failure) • Emergency measures to stop the spiral • Building income and reducing expenses simultaneously • Creating a bridge to stability"
  },

  // ==================== SAVING & PLANNING (7 topics) ====================
  {
    id: "saving_planning_home",
    label: "I want to buy a home",
    category: "saving_planning",
    displayOrder: 1,
    tooltipDescription: "Preparing for one of life's biggest purchases requires understanding true costs, saving for a down payment, and timing the market. You'll learn: • How much house you can actually afford (beyond what lenders approve) • Down payment strategies and assistance programs • Hidden costs of homeownership • When renting makes more financial sense"
  },
  {
    id: "saving_planning_kids",
    label: "I need to save for my children's future",
    category: "saving_planning",
    displayOrder: 2,
    tooltipDescription: "Balancing your own financial security with funding your children's education, activities, and future needs. You'll learn: • College savings vehicles (529s, ESAs, etc.) explained • How much to save (and when it's okay to say no) • Balancing retirement savings vs. kid savings • Teaching kids about money as you save"
  },
  {
    id: "saving_planning_retirement",
    label: "Retirement planning feels urgent",
    category: "saving_planning",
    displayOrder: 3,
    tooltipDescription: "Whether you're behind on savings or just realizing you need a plan, retirement planning can feel overwhelming and abstract. You'll learn: • How much you'll actually need (simplified calculations) • Catch-up strategies if you started late • 401(k), IRA, Roth explained without jargon • Making retirement feel real and achievable"
  },
  {
    id: "saving_planning_purchase",
    label: "I'm saving for a major purchase",
    category: "saving_planning",
    displayOrder: 4,
    tooltipDescription: "Planning for a car, wedding, home renovation, or other significant expense requires specific savings strategies and timeline planning. You'll learn: • How to calculate the true cost (not just sticker price) • Savings timelines that actually work • High-yield savings account strategies • When to finance vs. save up fully"
  },
  {
    id: "saving_planning_plan",
    label: "I need a solid financial plan",
    category: "saving_planning",
    displayOrder: 5,
    tooltipDescription: "A comprehensive roadmap that connects your goals, resources, and timeline—without paying thousands for a financial advisor. You'll learn: • Creating a DIY financial plan that actually guides decisions • Prioritizing competing goals (retirement vs. house vs. debt) • When to adjust the plan vs. stick with it • Tracking progress without obsessing"
  },
  {
    id: "saving_planning_health",
    label: "I'm preparing for health/medical costs",
    category: "saving_planning",
    displayOrder: 6,
    tooltipDescription: "Healthcare costs can destroy even solid financial plans—learning to prepare and protect yourself matters. You'll learn: • HSAs and FSAs explained (powerful tools most people underuse) • Planning for predictable medical expenses • Catastrophic insurance vs. comprehensive coverage • Negotiating medical bills and payment plans"
  },
  {
    id: "saving_planning_big_purchase",
    label: "Save for a big purchase (car, house, etc.)",
    category: "saving_planning",
    displayOrder: 7,
    tooltipDescription: "Strategic saving for large expenses with specific timelines and amounts—requiring discipline and smart account choices. You'll learn: • Reverse engineering your savings timeline • Automating savings to hit targets • Where to keep money based on timeline • Adjusting when life changes the plan"
  },

  // ==================== INVESTING & WEALTH (8 topics) ====================
  {
    id: "investing_wealth_new",
    label: "I'm new to investing and need guidance",
    category: "investing_wealth",
    displayOrder: 1,
    tooltipDescription: "Starting to invest feels intimidating with jargon, risk, and complexity—but it's more accessible than you think. You'll learn: • Investing basics without overwhelming jargon • Stocks, bonds, and funds explained simply • How to start with small amounts • Common beginner mistakes to avoid"
  },
  {
    id: "investing_wealth_working",
    label: "I want my money working for me",
    category: "investing_wealth",
    displayOrder: 2,
    tooltipDescription: "Moving beyond saving to having your money generate passive returns through investments and compound growth. You'll learn: • The difference between saving and investing • How compound interest creates wealth over time • Low-effort investing strategies (index funds, robo-advisors) • Setting up automatic investment systems"
  },
  {
    id: "investing_wealth_stocks",
    label: "I want to understand the stock market",
    category: "investing_wealth",
    displayOrder: 3,
    tooltipDescription: "Demystifying how the stock market actually works, how to participate, and what drives prices up and down. You'll learn: • How stock markets function (without a finance degree) • Individual stocks vs. mutual funds vs. ETFs • How to research investments (or not research at all) • Managing market volatility and emotions"
  },
  {
    id: "investing_wealth_retire_early",
    label: "Early retirement is a goal",
    category: "investing_wealth",
    displayOrder: 4,
    tooltipDescription: "The FIRE movement (Financial Independence, Retire Early) offers a path to escaping traditional work timelines—but requires specific strategies. You'll learn: • How much you need to retire early (the 4% rule) • Aggressive savings and investing strategies • Healthcare before Medicare age • Coast FIRE, Barista FIRE, Lean FIRE explained"
  },
  {
    id: "investing_wealth_building",
    label: "I'm focused on building real wealth",
    category: "investing_wealth",
    displayOrder: 5,
    tooltipDescription: "Moving beyond financial stability to significant asset accumulation—requiring strategic thinking and discipline. You'll learn: • The wealth-building formula (earn more, spend less, invest difference) • Asset allocation as wealth grows • Tax-efficient investing strategies • Building multiple income streams"
  },
  {
    id: "investing_wealth_passive",
    label: "I want to create passive income streams",
    category: "investing_wealth",
    displayOrder: 6,
    tooltipDescription: "Income that continues flowing without active work—from dividends, rental properties, or other investments. You'll learn: • Types of passive income (and which are truly passive) • Dividend investing strategies • Real estate investment without being a landlord (REITs) • Digital products and intellectual property income"
  },
  {
    id: "investing_wealth_retirement_accounts",
    label: "I need help with retirement accounts",
    category: "investing_wealth",
    displayOrder: 7,
    tooltipDescription: "Understanding 401(k)s, IRAs, Roth accounts, and how to maximize these powerful tax-advantaged tools. You'll learn: • 401(k) vs. IRA vs. Roth (which to use when) • Employer matching (free money you shouldn't leave behind) • Contribution limits and strategies • Rollovers when changing jobs"
  },
  {
    id: "investing_wealth_strategic",
    label: "I want to grow my wealth strategically",
    category: "investing_wealth",
    displayOrder: 8,
    tooltipDescription: "Taking a sophisticated approach to wealth building with asset allocation, rebalancing, and tax optimization. You'll learn: • Strategic asset allocation based on goals and timeline • When and how to rebalance your portfolio • Tax-loss harvesting and other advanced tactics • Adjusting strategy as you age and goals change"
  },

  // ==================== INCOME & CAREER (6 topics) ====================
  {
    id: "income_career_increase",
    label: "I need to increase my income",
    category: "income_career",
    displayOrder: 1,
    tooltipDescription: "Sometimes the solution isn't budgeting better—it's earning more money through raises, career moves, or side income. You'll learn: • Strategies to boost income at your current job • When to switch jobs for significant raises • Side hustle ideas that actually pay • Skills that command higher pay in the market"
  },
  {
    id: "income_career_raise",
    label: "I want a raise or career advancement",
    category: "income_career",
    displayOrder: 2,
    tooltipDescription: "Positioning yourself for promotion or raise requires strategy, documentation, and knowing when to ask. You'll learn: • Building the case for a raise (documenting your value) • Timing your request (when to ask, when to wait) • What to do if they say no • When staying vs. leaving is the better move"
  },
  {
    id: "income_career_side_business",
    label: "I'm interested in starting a side business",
    category: "income_career",
    displayOrder: 3,
    tooltipDescription: "Creating additional income outside your main job—requires balancing time, energy, and realistic expectations. You'll learn: • Validating side business ideas before investing heavily • Starting with minimal upfront costs • Managing time between job and side business • Tax and legal basics for side income"
  },
  {
    id: "income_career_leverage",
    label: "I want to earn without trading all my time",
    category: "income_career",
    displayOrder: 4,
    tooltipDescription: "Moving from hourly thinking to leveraged income models where your earning isn't capped by hours worked. You'll learn: • What leverage means in income generation • Digital products and scalable services • Automation and delegation strategies • When to reinvest vs. take profits"
  },
  {
    id: "income_career_change",
    label: "I'm considering a major career change",
    category: "income_career",
    displayOrder: 5,
    tooltipDescription: "Switching careers can boost income and satisfaction—but requires financial planning for potential gaps and retraining. You'll learn: • Assessing whether a career change makes financial sense • Planning for income gaps during transition • Identifying transferable skills • Reskilling efficiently (bootcamps, certifications, degrees)"
  },
  {
    id: "income_career_negotiation",
    label: "Negotiation skills would help me",
    category: "income_career",
    displayOrder: 6,
    tooltipDescription: "Whether negotiating salary, freelance rates, or contract terms—learning to advocate for yourself financially. You'll learn: • Researching market rates for your role • How to counter an offer effectively • Negotiating beyond salary (benefits, equity, flexibility) • Handling objections and rejection"
  },

  // ==================== LIFESTYLE & WELLBEING (6 topics) ====================
  {
    id: "lifestyle_wellbeing_peace",
    label: "I want financial peace of mind",
    category: "lifestyle_wellbeing",
    displayOrder: 1,
    tooltipDescription: "The feeling that your finances are under control and won't derail your life—independent of how much you have. You'll learn: • What creates financial peace (it's not just money) • Building systems that reduce anxiety • Separating money from self-worth • Finding contentment at any income level"
  },
  {
    id: "lifestyle_wellbeing_comfortable",
    label: "I want to live more comfortably",
    category: "lifestyle_wellbeing",
    displayOrder: 2,
    tooltipDescription: "Improving daily quality of life and reducing financial stress—without necessarily getting rich. You'll learn: • Defining what 'comfortable' means for you • Identifying and closing specific comfort gaps • Small upgrades with high quality-of-life impact • Balancing comfort with long-term financial health"
  },
  {
    id: "lifestyle_wellbeing_upgrade",
    label: "I want to upgrade my lifestyle responsibly",
    category: "lifestyle_wellbeing",
    displayOrder: 3,
    tooltipDescription: "Enjoying your income with lifestyle improvements without falling into lifestyle inflation traps. You'll learn: • The 50/30/20 rule for needs, wants, and savings • Recognizing lifestyle creep before it becomes a problem • Prioritizing upgrades that truly improve life • Scaling lifestyle with income sustainably"
  },
  {
    id: "lifestyle_wellbeing_guilt_free",
    label: "I want to enjoy my money guilt-free",
    category: "lifestyle_wellbeing",
    displayOrder: 4,
    tooltipDescription: "Learning to spend on things you value without shame, guilt, or fear—creating a healthy relationship with money. You'll learn: • How to create a 'fun money' category in your budget • Distinguishing guilt from actual overspending • Aligning spending with your values • Permission to enjoy money you've earned"
  },
  {
    id: "lifestyle_wellbeing_travel",
    label: "Travel is important to me",
    category: "lifestyle_wellbeing",
    displayOrder: 5,
    tooltipDescription: "Making travel a financial priority without derailing other goals—requires intentional planning and creative strategies. You'll learn: • Building a dedicated travel fund • Estimating true costs (not just flights and hotels) • Travel hacking and points strategies • Budget travel without feeling deprived"
  },
  {
    id: "lifestyle_wellbeing_treat",
    label: "I want to treat myself sometimes",
    category: "lifestyle_wellbeing",
    displayOrder: 6,
    tooltipDescription: "Finding balance between discipline and enjoyment—treating yourself as a sustainable practice, not a budget-buster. You'll learn: • Budgeting for treats without guilt • The psychology of rewards and motivation • Distinguishing treats from compulsive spending • Making treats meaningful, not mindless"
  },

  // ==================== FAMILY & RELATIONSHIPS (5 topics) ====================
  {
    id: "family_relationships_tension",
    label: "Money creates tension in my relationship",
    category: "family_relationships",
    displayOrder: 1,
    tooltipDescription: "Money is one of the top sources of conflict in relationships—learning to navigate differences is critical. You'll learn: • Common money fights and their real underlying causes • How to have productive money conversations • Aligning values when you have different money styles • Joint vs. separate accounts (pros and cons)"
  },
  {
    id: "family_relationships_provide",
    label: "I need to provide for my family",
    category: "family_relationships",
    displayOrder: 2,
    tooltipDescription: "The responsibility of supporting family members financially—managing the pressure and making smart decisions. You'll learn: • Calculating what your family actually needs • How to prioritize when resources are limited • Building adequate safety nets (emergency fund, insurance) • Balancing provider role with self-care"
  },
  {
    id: "family_relationships_kids_literacy",
    label: "I want to teach my kids financial literacy",
    category: "family_relationships",
    displayOrder: 3,
    tooltipDescription: "Raising financially capable kids requires intentional teaching—schools often don't cover this critical life skill. You'll learn: • Age-appropriate money lessons (5, 10, 15 years old) • Allowance strategies (should you? how much?) • Teaching budgeting and delayed gratification • Modeling good financial behavior"
  },
  {
    id: "family_relationships_generational",
    label: "Building generational wealth matters to me",
    category: "family_relationships",
    displayOrder: 4,
    tooltipDescription: "Creating wealth that outlasts you—passing financial security and knowledge to the next generation. You'll learn: • What generational wealth really means • Real estate and stock portfolios as legacy tools • Trusts, wills, and estate planning basics • Teaching money stewardship, not just inheritance"
  },
  {
    id: "family_relationships_asks",
    label: "Family members frequently ask me for money",
    category: "family_relationships",
    displayOrder: 5,
    tooltipDescription: "Navigating requests for financial help from family—balancing generosity, boundaries, and your own financial security. You'll learn: • How to say no with love and without guilt • When helping is healthy vs. when it's enabling • Setting clear boundaries around money and family • Handling guilt and managing expectations"
  },

  // ==================== CONFIDENCE & MINDSET (8 topics) ====================
  {
    id: "confidence_mindset_lack",
    label: "I lack confidence managing money",
    category: "confidence_mindset",
    displayOrder: 1,
    tooltipDescription: "Feeling incompetent or overwhelmed by financial decisions—often from lack of education, not lack of ability. You'll learn: • Why most people feel this way (it's not just you) • Building competence through small wins • Reframing mistakes as learning, not failure • Taking action despite uncertainty"
  },
  {
    id: "confidence_mindset_avoid",
    label: "I avoid financial decisions",
    category: "confidence_mindset",
    displayOrder: 2,
    tooltipDescription: "Procrastinating on money choices from fear or overwhelm—which often makes problems worse over time. You'll learn: • Why avoidance happens (and why it's normal) • How to face money decisions without panic • Breaking big decisions into tiny steps • Building tolerance for financial discomfort"
  },
  {
    id: "confidence_mindset_control",
    label: "I want to feel in control of my finances",
    category: "confidence_mindset",
    displayOrder: 3,
    tooltipDescription: "Moving from feeling at the mercy of money to feeling like you're steering the ship—even if you're not rich. You'll learn: • What financial control actually feels like • Creating systems that give you visibility and choice • How to maintain control when things go wrong • The difference between control and perfection"
  },
  {
    id: "confidence_mindset_mistakes",
    label: "I repeat the same financial mistakes",
    category: "confidence_mindset",
    displayOrder: 4,
    tooltipDescription: "Falling into the same money traps repeatedly—overspending, undersaving, avoiding decisions. You'll learn: • Identifying your specific patterns • Understanding the triggers behind your mistakes • How to interrupt patterns before they repeat • Building new habits to replace old ones"
  },
  {
    id: "confidence_mindset_anxious",
    label: "I'm anxious about checking my accounts",
    category: "confidence_mindset",
    displayOrder: 5,
    tooltipDescription: "The dread of looking at bank balances or credit card statements—creating a cycle of avoidance and anxiety. You'll learn: • Why looking at accounts causes panic • How to check balances without spiraling • Gradual exposure techniques that work • Separating facts from feelings about money"
  },
  {
    id: "confidence_mindset_shame",
    label: "I carry shame about my financial situation",
    category: "confidence_mindset",
    displayOrder: 6,
    tooltipDescription: "Feeling embarrassed or worthless because of debt, low income, or past mistakes—shame that prevents progress. You'll learn: • Why money shame is so pervasive in our culture • How to separate your worth from your net worth • Forgiving yourself for past financial mistakes • Building pride in progress, not perfection"
  },
  {
    id: "confidence_mindset_habits",
    label: "I need to develop better money habits",
    category: "confidence_mindset",
    displayOrder: 7,
    tooltipDescription: "Building sustainable routines around checking accounts, paying bills, saving, and spending wisely. You'll learn: • The science of habit formation • How to stack new money habits onto existing ones • Starting with micro-habits (2 minutes or less) • Why willpower fails and what works instead"
  },
  {
    id: "confidence_mindset_ashamed",
    label: "I want to stop feeling ashamed",
    category: "confidence_mindset",
    displayOrder: 8,
    tooltipDescription: "Releasing the heavy burden of financial shame that keeps you stuck—regardless of your current situation. You'll learn: • Where money shame comes from (family, culture, media) • How shame differs from guilt (and why it matters) • Rewriting your money story • Building compassion for yourself and your journey"
  },

  // ==================== BIG PICTURE (7 topics) ====================
  {
    id: "big_picture_wealth",
    label: "I want to build significant wealth",
    category: "big_picture",
    displayOrder: 1,
    tooltipDescription: "Aiming for high net worth and financial abundance—requires strategic thinking beyond basic budgeting. You'll learn: • What significant wealth means in concrete numbers • High-net-worth strategies (multiple income streams, tax optimization) • Asset accumulation at scale • How wealthy people think differently about money"
  },
  {
    id: "big_picture_not_work",
    label: "I don't want to work until traditional retirement age",
    category: "big_picture",
    displayOrder: 2,
    tooltipDescription: "Escaping the 9-5 grind before 65—requires aggressive saving, strategic investing, and lifestyle design. You'll learn: • Calculating your financial independence number • Aggressive savings rates and trade-offs • Bridge strategies to cover healthcare before Medicare • What early retirement actually feels like (pros and cons)"
  },
  {
    id: "big_picture_options",
    label: "I want financial options, not constraints",
    category: "big_picture",
    displayOrder: 3,
    tooltipDescription: "Building enough wealth to make choices from abundance rather than necessity—career, location, time. You'll learn: • How much 'f-you money' you need • Building a freedom fund that buys choices • Creating career flexibility and mobility • Living life aligned with values, not just money"
  },
  {
    id: "big_picture_legacy",
    label: "Leaving a legacy for the next generation is important",
    category: "big_picture",
    displayOrder: 4,
    tooltipDescription: "Creating something that outlasts you—financial security for heirs and causes you care about. You'll learn: • Estate planning essentials (wills, trusts) • Strategies to minimize inheritance taxes • How to prepare heirs to receive wealth responsibly • Balancing legacy giving with living your own life"
  },
  {
    id: "big_picture_impact",
    label: "I want to make a meaningful impact",
    category: "big_picture",
    displayOrder: 5,
    tooltipDescription: "Using money as a tool for change—whether through charitable giving, impact investing, or supporting causes. You'll learn: • How to align money with your values • Strategic giving that creates real impact • Impact investing (making money while doing good) • Balancing generosity with financial security"
  },
  {
    id: "big_picture_semi_retire",
    label: "Early or semi-retirement appeals to me",
    category: "big_picture",
    displayOrder: 6,
    tooltipDescription: "Partially stepping back from full-time work while maintaining some income—Coast FIRE, Barista FIRE, and phased retirement. You'll learn: • Different flavors of semi-retirement • How much you need to work part-time forever • Healthcare strategies for semi-retirees • Designing a semi-retired life that's fulfilling"
  },
  {
    id: "big_picture_trapped",
    label: "I want to have options (not feel trapped by money)",
    category: "big_picture",
    displayOrder: 7,
    tooltipDescription: "Building financial freedom that lets you say no to bad jobs, toxic situations, and unfulfilling paths. You'll learn: • The 'exit fund' that buys freedom • Reducing fixed expenses to increase flexibility • Creating portable income streams • Making decisions from opportunity, not desperation"
  },

  // ==================== HONEST REFLECTIONS (7 topics) ====================
  {
    id: "honest_reflections_poor_decisions",
    label: "I keep making poor financial decisions",
    category: "honest_reflections",
    displayOrder: 1,
    tooltipDescription: "A pattern of choices that don't serve your goals—often driven by emotions, cognitive biases, or lack of systems. You'll learn: • Common cognitive biases that sabotage money decisions • How to recognize emotional vs. rational money choices • Building decision frameworks that reduce mistakes • Slowing down impulses without paralysis"
  },
  {
    id: "honest_reflections_recover",
    label: "I need to recover from years of mistakes",
    category: "honest_reflections",
    displayOrder: 2,
    tooltipDescription: "Looking back at lost time, missed opportunities, or accumulating damage—and needing a path forward. You'll learn: • How to assess damage without spiraling into shame • Triage: what to fix first, what to accept • Realistic timelines for recovery • Forgiving yourself while moving forward"
  },
  {
    id: "honest_reflections_instability",
    label: "Financial instability is exhausting",
    category: "honest_reflections",
    displayOrder: 3,
    tooltipDescription: "The chronic stress of unpredictable income, unexpected expenses, or always feeling on the edge. You'll learn: • What financial stability actually looks like • First steps from chaos to calm • Building buffers and reducing volatility • Managing emotions during the transition"
  },
  {
    id: "honest_reflections_inadequate",
    label: "Money makes me feel inadequate",
    category: "honest_reflections",
    displayOrder: 4,
    tooltipDescription: "Tying self-worth to net worth—feeling less-than because of financial struggles or comparison to others. You'll learn: • Why we conflate money with personal value • How to separate worth from net worth • Handling comparison and social pressure • Building identity beyond financial status"
  },
  {
    id: "honest_reflections_parents",
    label: "I don't want to repeat my parents' patterns",
    category: "honest_reflections",
    displayOrder: 5,
    tooltipDescription: "Recognizing unhealthy money behaviors inherited from family—and consciously choosing a different path. You'll learn: • Identifying patterns you learned growing up • Understanding without blaming • How to consciously choose different behaviors • Breaking generational cycles"
  },
  {
    id: "honest_reflections_late",
    label: "I'm starting later than I should have",
    category: "honest_reflections",
    displayOrder: 6,
    tooltipDescription: "Feeling behind—whether you're 30, 40, or 50—and needing to catch up on saving, investing, or planning. You'll learn: • Why 'late' is better than never (compound growth still works) • Catch-up strategies for different ages • Prioritizing when you can't do everything at once • Managing regret without letting it paralyze you"
  },
  {
    id: "honest_reflections_stability",
    label: "I just want financial stability",
    category: "honest_reflections",
    displayOrder: 7,
    tooltipDescription: "Not aiming for wealth—just wanting predictability, breathing room, and freedom from constant financial stress. You'll learn: • What 'stable' means in concrete terms • First steps from unstable to stable • Maintaining stability once achieved • When you're ready to reach for more (or not)"
  }
];

// Category metadata for UI display
export const TOPIC_CATEGORIES = {
  everyday_money: {
    id: "everyday_money",
    name: "Everyday Money",
    icon: "💰",
    description: "Day-to-day money management and budgeting",
    color: "#22C55E",
    displayOrder: 1
  },
  debt_credit: {
    id: "debt_credit",
    name: "Debt & Credit",
    icon: "💳",
    description: "Managing debt and improving credit",
    color: "#EF4444",
    displayOrder: 2
  },
  saving_planning: {
    id: "saving_planning",
    name: "Saving & Planning",
    icon: "🎯",
    description: "Saving for goals and financial planning",
    color: "#3B82F6",
    displayOrder: 3
  },
  investing_wealth: {
    id: "investing_wealth",
    name: "Investing & Wealth",
    icon: "📈",
    description: "Growing wealth through investing",
    color: "#8B5CF6",
    displayOrder: 4
  },
  income_career: {
    id: "income_career",
    name: "Income & Career",
    icon: "💼",
    description: "Increasing earning power",
    color: "#F59E0B",
    displayOrder: 5
  },
  lifestyle_wellbeing: {
    id: "lifestyle_wellbeing",
    name: "Lifestyle & Wellbeing",
    icon: "🌟",
    description: "Enjoying money and quality of life",
    color: "#EC4899",
    displayOrder: 6
  },
  family_relationships: {
    id: "family_relationships",
    name: "Family & Relationships",
    icon: "👨‍👩‍👧",
    description: "Money and relationships",
    color: "#14B8A6",
    displayOrder: 7
  },
  confidence_mindset: {
    id: "confidence_mindset",
    name: "Confidence & Mindset",
    icon: "🧠",
    description: "Financial psychology and confidence",
    color: "#6366F1",
    displayOrder: 8
  },
  big_picture: {
    id: "big_picture",
    name: "Big Picture",
    icon: "🔭",
    description: "Long-term vision and goals",
    color: "#0EA5E9",
    displayOrder: 9
  },
  honest_reflections: {
    id: "honest_reflections",
    name: "Honest Reflections",
    icon: "💭",
    description: "Personal growth and recovery",
    color: "#78716C",
    displayOrder: 10
  }
};

// Helper functions
export function getTopicById(id) {
  return TOPIC_CATALOG.find(topic => topic.id === id) || null;
}

export function getTopicsByCategory(categoryId) {
  return TOPIC_CATALOG
    .filter(topic => topic.category === categoryId)
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

export function getCategoriesWithTopics() {
  return Object.values(TOPIC_CATEGORIES)
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map(category => ({
      ...category,
      topics: getTopicsByCategory(category.id)
    }));
}

export function getTotalTopicCount() {
  return TOPIC_CATALOG.length;
}
