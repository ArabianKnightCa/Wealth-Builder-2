# Financial Education App Content Data
# POC v2.6 - All PPI Questions and LPI Chapters

PPI_QUESTIONS = [
    {
        "id": "ppi_01",
        "text": "When you try something new, what excites you most?",
        "options": {
            "A": "Discovering how it all works step-by-step",
            "B": "Seeing small wins as I go",
            "C": "Testing myself to see if I can handle it",
            "D": "Talking it out or sharing the process"
        }
    },
    {
        "id": "ppi_02",
        "text": "When a concept feels confusing, you usually…",
        "options": {
            "A": "Break it into tiny steps",
            "B": "Look for examples or visuals",
            "C": "Jump in and learn by doing",
            "D": "Ask someone who's done it before"
        }
    },
    {
        "id": "ppi_03",
        "text": "What keeps you showing up?",
        "options": {
            "A": "Clear progress I can see",
            "B": "Encouragement or reminders",
            "C": "New challenges that push me",
            "D": "Working together with others"
        }
    },
    {
        "id": "ppi_04",
        "text": "If something feels unfamiliar, what do you do first?",
        "options": {
            "A": "Read or watch a short guide",
            "B": "Try it once to get a feel for it",
            "C": "Compare it to something I already know",
            "D": "Ask questions until it clicks"
        }
    },
    {
        "id": "ppi_05",
        "text": "When making an important money decision, you're most likely to…",
        "options": {
            "A": "Research deeply before acting",
            "B": "Use a simple rule and move on",
            "C": "Trust your gut after a quick check",
            "D": "Ask for a second opinion"
        }
    },
    {
        "id": "ppi_06",
        "text": "When you finish something, what feels best?",
        "options": {
            "A": "Checking it off a list",
            "B": "Seeing the bigger pattern",
            "C": "Setting a harder goal next time",
            "D": "Sharing what you learned"
        }
    },
    {
        "id": "ppi_07",
        "text": "What helps you focus?",
        "options": {
            "A": "Quiet, steady rhythm",
            "B": "Short bursts with breaks",
            "C": "A clear goal and timer",
            "D": "Someone learning alongside you"
        }
    },
    {
        "id": "ppi_08",
        "text": "Which reward keeps you motivated?",
        "options": {
            "A": "Unlocking a new tool or feature",
            "B": "Seeing accuracy improve",
            "C": "Beating a time or score",
            "D": "Recognition from others"
        }
    },
    {
        "id": "ppi_09",
        "text": "When feedback is tough, what helps you?",
        "options": {
            "A": "A clear next step",
            "B": "Seeing how much I've grown",
            "C": "Turning it into a challenge",
            "D": "Hearing it from someone I trust"
        }
    },
    {
        "id": "ppi_10",
        "text": "Which pace feels right for learning?",
        "options": {
            "A": "Slow and steady",
            "B": "Moderate and consistent",
            "C": "Fast with high energy",
            "D": "Flexible — depends on the day"
        }
    },
    {
        "id": "ppi_11",
        "text": "How do you like to see your progress?",
        "options": {
            "A": "Detailed lists or logs",
            "B": "Visual bars or streaks",
            "C": "Timed milestones",
            "D": "Shared goals or friendly competitions"
        }
    },
    {
        "id": "ppi_12",
        "text": "When beginning a new topic, you prefer to…",
        "options": {
            "A": "Read a short intro first",
            "B": "Try a small example",
            "C": "Dive straight into a challenge",
            "D": "Talk it out with someone"
        }
    },
    {
        "id": "ppi_13",
        "text": "When you get something wrong, you…",
        "options": {
            "A": "Re-check the steps and retry",
            "B": "Study why the right answer works",
            "C": "Tackle a harder version next",
            "D": "Discuss it out loud"
        }
    },
    {
        "id": "ppi_14",
        "text": "What time or setting works best for you?",
        "options": {
            "A": "Early and calm",
            "B": "Midday with focus bursts",
            "C": "Late-night deep dives",
            "D": "Whenever inspiration hits"
        }
    },
    {
        "id": "ppi_15",
        "text": "When things get tough, what keeps you going?",
        "options": {
            "A": "Remembering my goals",
            "B": "Visualizing success",
            "C": "Competing with myself",
            "D": "Thinking of who benefits from it"
        }
    },
    {
        "id": "ppi_16",
        "text": "Which line would grab your attention first?",
        "options": {
            "A": "\"Discover a hidden pattern\"",
            "B": "\"Master a quick skill\"",
            "C": "\"Beat this challenge\"",
            "D": "\"See how others solved it\""
        }
    },
    {
        "id": "ppi_17",
        "text": "Money to you feels mostly like…",
        "options": {
            "A": "A tool for freedom",
            "B": "A scorecard for progress",
            "C": "A puzzle to solve",
            "D": "A language to share and learn"
        }
    },
    {
        "id": "ppi_18",
        "text": "When thinking about your future, you focus on…",
        "options": {
            "A": "Building safety and stability",
            "B": "Creating habits and systems",
            "C": "Growing faster each year",
            "D": "Supporting family or friends"
        }
    },
    {
        "id": "ppi_19",
        "text": "When deadlines or bills stack up, you…",
        "options": {
            "A": "Prioritize calmly",
            "B": "Tackle quick wins first",
            "C": "Work faster under pressure",
            "D": "Reach out for help or advice"
        }
    },
    {
        "id": "ppi_20",
        "text": "If you could describe your learning style in one word, it would be…",
        "options": {
            "A": "Curious",
            "B": "Organized",
            "C": "Competitive",
            "D": "Collaborative"
        }
    }
]

LPI_CHAPTERS = [
    {
        "id": "CH01",
        "title": "The Power of a Dollar",
        "lessons": [
            {"id": "lesson_1", "text": "A dollar isn't just money; it's a seed. What you plant with it determines what grows."},
            {"id": "lesson_2", "text": "Small savings repeated daily become habits that compound."},
            {"id": "lesson_3", "text": "What matters most is consistency, not size."}
        ],
        "quiz": [
            {
                "id": "CH01_Q01",
                "text": "What does the dollar represent in this lesson?",
                "options": {"A": "Spare change", "B": "A seed", "C": "A score", "D": "A burden"},
                "correct": "B",
                "rationale": "It's a seed for future growth."
            },
            {
                "id": "CH01_Q02",
                "text": "The biggest key to growth is…",
                "options": {"A": "Big income", "B": "Luck", "C": "Consistency", "D": "One-time gains"},
                "correct": "C",
                "rationale": "Consistency compounds results."
            },
            {
                "id": "CH01_Q03",
                "text": "Habits help because they…",
                "options": {"A": "Require thought each time", "B": "Automate good choices", "C": "Waste time", "D": "Limit freedom"},
                "correct": "B",
                "rationale": "Habits automate positive behavior."
            }
        ]
    },
    {
        "id": "CH02",
        "title": "Needs, Wants, and Whys",
        "lessons": [
            {"id": "lesson_1", "text": "Every expense has a \"why.\" Ask it before you buy."},
            {"id": "lesson_2", "text": "Needs keep life running; wants add flavor."},
            {"id": "lesson_3", "text": "Control your wants, and your money obeys you."}
        ],
        "quiz": [
            {
                "id": "CH02_Q01",
                "text": "The word \"why\" helps you…",
                "options": {"A": "Spend faster", "B": "Delay everything", "C": "Think before buying", "D": "Ignore goals"},
                "correct": "C",
                "rationale": "It triggers mindful spending."
            },
            {
                "id": "CH02_Q02",
                "text": "Needs are best described as…",
                "options": {"A": "Essentials", "B": "Luxuries", "C": "Impulses", "D": "Dreams"},
                "correct": "A",
                "rationale": "Needs keep life running."
            },
            {
                "id": "CH02_Q03",
                "text": "What happens when wants run your wallet?",
                "options": {"A": "Control increases", "B": "Stress grows", "C": "Savings rise", "D": "Bills shrink"},
                "correct": "B",
                "rationale": "Stress replaces control."
            }
        ]
    },
    {
        "id": "CH03",
        "title": "Time Is Currency",
        "lessons": [
            {"id": "lesson_1", "text": "Every hour traded for work has hidden value."},
            {"id": "lesson_2", "text": "Spend time on goals that repay you later."},
            {"id": "lesson_3", "text": "Free time invested in learning multiplies future earning."}
        ],
        "quiz": [
            {
                "id": "CH03_Q01",
                "text": "How is time similar to money?",
                "options": {"A": "It can be invested", "B": "It never ends", "C": "It's free", "D": "It's worthless"},
                "correct": "A",
                "rationale": "Both can be invested for returns."
            },
            {
                "id": "CH03_Q02",
                "text": "Using time wisely means…",
                "options": {"A": "Overworking", "B": "Prioritizing purpose", "C": "Doing everything", "D": "Ignoring rest"},
                "correct": "B",
                "rationale": "Purpose brings balance and growth."
            },
            {
                "id": "CH03_Q03",
                "text": "One strong habit for time is…",
                "options": {"A": "Planning daily", "B": "Waiting for energy", "C": "Avoiding schedules", "D": "Multitasking constantly"},
                "correct": "A",
                "rationale": "Planning directs energy intentionally."
            }
        ]
    },
    {
        "id": "CH04",
        "title": "Save Before You Spend",
        "lessons": [
            {"id": "lesson_1", "text": "The first expense should always be your savings."},
            {"id": "lesson_2", "text": "Automatic transfers make willpower unnecessary."},
            {"id": "lesson_3", "text": "Even $1 builds momentum."}
        ],
        "quiz": [
            {
                "id": "CH04_Q01",
                "text": "Paying yourself first means…",
                "options": {"A": "Treating others", "B": "Saving before bills", "C": "Spending freely", "D": "Waiting for leftovers"},
                "correct": "B",
                "rationale": "It ensures saving happens."
            },
            {
                "id": "CH04_Q02",
                "text": "Why automate savings?",
                "options": {"A": "To forget about goals", "B": "To remove decision friction", "C": "To lose control", "D": "To impress others"},
                "correct": "B",
                "rationale": "Automation removes resistance."
            },
            {
                "id": "CH04_Q03",
                "text": "What builds fastest?",
                "options": {"A": "Rare large deposits", "B": "Frequent small ones", "C": "Gambling wins", "D": "Borrowed funds"},
                "correct": "B",
                "rationale": "Small consistent inputs compound."
            }
        ]
    },
    {
        "id": "CH05",
        "title": "The Magic of Compound Growth",
        "lessons": [
            {"id": "lesson_1", "text": "Interest on interest is growth's secret engine."},
            {"id": "lesson_2", "text": "Start early; time does the heavy lifting."},
            {"id": "lesson_3", "text": "Delays cost invisible fortune."}
        ],
        "quiz": [
            {
                "id": "CH05_Q01",
                "text": "Compounding means…",
                "options": {"A": "Earning interest on prior interest", "B": "Linear growth", "C": "Spending loops", "D": "Flat savings"},
                "correct": "A",
                "rationale": "It multiplies earnings."
            },
            {
                "id": "CH05_Q02",
                "text": "Best time to start investing?",
                "options": {"A": "Later", "B": "When ready", "C": "As early as possible", "D": "After retirement"},
                "correct": "C",
                "rationale": "Time matters most."
            },
            {
                "id": "CH05_Q03",
                "text": "Missed years equal…",
                "options": {"A": "Opportunity lost", "B": "Guaranteed returns", "C": "No effect", "D": "Bonus growth"},
                "correct": "A",
                "rationale": "Time lost = growth lost."
            }
        ]
    },
    {
        "id": "CH06",
        "title": "Budget Like a Boss",
        "lessons": [
            {"id": "lesson_1", "text": "A budget shows direction, not limits."},
            {"id": "lesson_2", "text": "Tracking reveals habits invisible to memory."},
            {"id": "lesson_3", "text": "Adjust, don't quit."}
        ],
        "quiz": [
            {
                "id": "CH06_Q01",
                "text": "Budgeting is mainly about…",
                "options": {"A": "Restriction", "B": "Awareness", "C": "Punishment", "D": "Guessing"},
                "correct": "B",
                "rationale": "It reveals the truth of spending."
            },
            {
                "id": "CH06_Q02",
                "text": "Best first step?",
                "options": {"A": "Hide receipts", "B": "Track one week", "C": "Ignore bills", "D": "Overspend intentionally"},
                "correct": "B",
                "rationale": "Tracking creates clarity."
            },
            {
                "id": "CH06_Q03",
                "text": "Budgets fail when…",
                "options": {"A": "Updated", "B": "Ignored", "C": "Flexible", "D": "Shared"},
                "correct": "B",
                "rationale": "Neglect breaks control."
            }
        ]
    },
    {
        "id": "CH07",
        "title": "Credit Confidence",
        "lessons": [
            {"id": "lesson_1", "text": "Credit shows how you handle borrowed trust."},
            {"id": "lesson_2", "text": "Payment history outweighs perfection."},
            {"id": "lesson_3", "text": "Use credit to build, not bail out."}
        ],
        "quiz": [
            {
                "id": "CH07_Q01",
                "text": "Credit measures…",
                "options": {"A": "Wealth", "B": "Behavior with borrowed money", "C": "Income", "D": "Age"},
                "correct": "B",
                "rationale": "It reflects responsibility."
            },
            {
                "id": "CH07_Q02",
                "text": "Strong credit comes from…",
                "options": {"A": "On-time payments", "B": "Closing all cards", "C": "Ignoring bills", "D": "Maxing out limits"},
                "correct": "A",
                "rationale": "Consistency builds trust."
            },
            {
                "id": "CH07_Q03",
                "text": "Using credit wisely means…",
                "options": {"A": "Borrowing often", "B": "Paying fully monthly", "C": "Paying minimums only", "D": "Avoiding credit entirely"},
                "correct": "B",
                "rationale": "Full payments maintain score health."
            }
        ]
    },
    {
        "id": "CH08",
        "title": "Smart Spending",
        "lessons": [
            {"id": "lesson_1", "text": "Every swipe is a vote for your future."},
            {"id": "lesson_2", "text": "Price and value rarely mean the same thing."},
            {"id": "lesson_3", "text": "Conscious spending = joyful ownership."}
        ],
        "quiz": [
            {
                "id": "CH08_Q01",
                "text": "Smart spending means…",
                "options": {"A": "Avoiding all fun", "B": "Buying intentionally", "C": "Guessing deals", "D": "Chasing sales"},
                "correct": "B",
                "rationale": "Intent drives alignment."
            },
            {
                "id": "CH08_Q02",
                "text": "Value differs from price because…",
                "options": {"A": "They're identical", "B": "Value is perceived benefit", "C": "Price never changes", "D": "Value equals discount"},
                "correct": "B",
                "rationale": "Value reflects meaning, not number."
            },
            {
                "id": "CH08_Q03",
                "text": "Joyful ownership comes from…",
                "options": {"A": "Impulse", "B": "Gratitude", "C": "Debt", "D": "Envy"},
                "correct": "B",
                "rationale": "Gratitude sustains satisfaction."
            }
        ]
    },
    {
        "id": "CH09",
        "title": "Grow While You Earn",
        "lessons": [
            {"id": "lesson_1", "text": "Income is your training ground for investments."},
            {"id": "lesson_2", "text": "Learn where money leaks before chasing raises."},
            {"id": "lesson_3", "text": "Each paycheck is a classroom."}
        ],
        "quiz": [
            {
                "id": "CH09_Q01",
                "text": "Work is mainly…",
                "options": {"A": "Endless labor", "B": "Income + learning", "C": "Punishment", "D": "Waiting game"},
                "correct": "B",
                "rationale": "Learning fuels earning."
            },
            {
                "id": "CH09_Q02",
                "text": "Before chasing raises, track…",
                "options": {"A": "Coworkers", "B": "Leaks and habits", "C": "Free lunches", "D": "Office gossip"},
                "correct": "B",
                "rationale": "Plug leaks first."
            },
            {
                "id": "CH09_Q03",
                "text": "Growth mindset at work means…",
                "options": {"A": "Blaming", "B": "Learning", "C": "Complaining", "D": "Coasting"},
                "correct": "B",
                "rationale": "Curiosity beats comfort."
            }
        ]
    },
    {
        "id": "CH10",
        "title": "Give, Grow, and Glow",
        "lessons": [
            {"id": "lesson_1", "text": "Generosity multiplies fulfillment."},
            {"id": "lesson_2", "text": "Giving resets perspective."},
            {"id": "lesson_3", "text": "Wealth's purpose is impact."}
        ],
        "quiz": [
            {
                "id": "CH10_Q01",
                "text": "Giving builds…",
                "options": {"A": "Guilt", "B": "Connection", "C": "Loss", "D": "Waste"},
                "correct": "B",
                "rationale": "It deepens community."
            },
            {
                "id": "CH10_Q02",
                "text": "Sharing money's purpose is…",
                "options": {"A": "Ego", "B": "Gratitude", "C": "Debt", "D": "Comparison"},
                "correct": "B",
                "rationale": "It keeps success grounded."
            },
            {
                "id": "CH10_Q03",
                "text": "True wealth means…",
                "options": {"A": "Endless accumulation", "B": "Balanced impact", "C": "Flashy status", "D": "Isolation"},
                "correct": "B",
                "rationale": "Impact completes growth."
            }
        ]
    }
]
