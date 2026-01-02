# WEALTH BUILDER - 67 FINANCIAL GOALS FOR DATABASE

## INSTRUCTIONS
Store these 67 financial goals in the database, organized by 10 categories. Each goal should be stored with:
- `id`: Unique identifier (snake_case)
- `label`: Display text
- `category_id`: Parent category ID
- `category_label`: Parent category name

---

## DATABASE SCHEMA

```json
{
  "goals": [
    {
      "id": "string (unique)",
      "label": "string (display text)",
      "category_id": "string",
      "category_label": "string",
      "order": "integer (display order within category)"
    }
  ]
}
```

---

## CATEGORY 1: CORE MONEY GOALS (7 goals)

| Order | ID | Label |
|-------|-----|-------|
| 1 | core_money_change_habits | Change my money habits |
| 2 | core_money_stop_paycheck | Stop living paycheck to paycheck |
| 3 | core_money_improve_situation | Improve my financial situation |
| 4 | core_money_emergency_fund | Build an emergency fund |
| 5 | core_money_budget | Learn to budget in a way that fits me |
| 6 | core_money_stop_overspending | Stop overspending |
| 7 | core_money_no_stress | Manage money without stress |

---

## CATEGORY 2: DEBT & CREDIT GOALS (6 goals)

| Order | ID | Label |
|-------|-----|-------|
| 1 | debt_credit_get_out | Get out of debt |
| 2 | debt_credit_cards | Pay off credit cards |
| 3 | debt_credit_loans | Pay off personal loans |
| 4 | debt_credit_interest | Reduce interest payments |
| 5 | debt_credit_score | Fix or improve my credit score |
| 6 | debt_credit_stop_relying | Stop relying on debt to survive |

---

## CATEGORY 3: SAVING & LIFE PLANNING GOALS (7 goals)

| Order | ID | Label |
|-------|-----|-------|
| 1 | saving_planning_home | Save for a home |
| 2 | saving_planning_car | Save for a car |
| 3 | saving_planning_vacation | Save for vacations |
| 4 | saving_planning_retirement | Save for retirement |
| 5 | saving_planning_security | Build long-term financial security |
| 6 | saving_planning_kids | Save for kids / future kids |
| 7 | saving_planning_rainy_day | Build a 'rainy day' fund |

---

## CATEGORY 4: INVESTING GOALS (8 goals)

| Order | ID | Label |
|-------|-----|-------|
| 1 | investing_learn | Learn how to invest |
| 2 | investing_stock_market | Understand the stock market |
| 3 | investing_first_time | Start investing for the first time |
| 4 | investing_grow | Grow my investments |
| 5 | investing_strategies | Learn long-term investing strategies |
| 6 | investing_real_estate | Learn real-estate investing |
| 7 | investing_passive_income | Build passive income |
| 8 | investing_wealth | Grow my wealth over time |

---

## CATEGORY 5: INCOME & CAREER GOALS (6 goals)

| Order | ID | Label |
|-------|-----|-------|
| 1 | income_career_increase | Increase my income |
| 2 | income_career_side_hustle | Start a side hustle |
| 3 | income_career_business | Start my own business |
| 4 | income_career_switch | Switch careers |
| 5 | income_career_negotiate | Learn how to negotiate pay |
| 6 | income_career_streams | Build multiple income streams |

---

## CATEGORY 6: LIFESTYLE & QUALITY OF LIFE GOALS (7 goals)

| Order | ID | Label |
|-------|-----|-------|
| 1 | lifestyle_quality_bills | Reduce monthly bills |
| 2 | lifestyle_quality_stress | Stop stressing about money |
| 3 | lifestyle_quality_comfortable | Live comfortably |
| 4 | lifestyle_quality_upgrade | Upgrade my lifestyle responsibly |
| 5 | lifestyle_quality_freedom | Have financial freedom |
| 6 | lifestyle_quality_travel | Travel more |
| 7 | lifestyle_quality_flexibility | Have flexibility in life decisions |

---

## CATEGORY 7: FAMILY & RELATIONSHIP GOALS (6 goals)

| Order | ID | Label |
|-------|-----|-------|
| 1 | family_relationship_provide | Provide for my family |
| 2 | family_relationship_wealth | Build generational wealth |
| 3 | family_relationship_teach_kids | Teach my kids strong money habits |
| 4 | family_relationship_arguments | Stop money-related arguments |
| 5 | family_relationship_parents | Support aging parents |
| 6 | family_relationship_stability | Create stability at home |

---

## CATEGORY 8: CONFIDENCE & MINDSET GOALS (7 goals)

| Order | ID | Label |
|-------|-----|-------|
| 1 | confidence_mindset_build | Build confidence with money |
| 2 | confidence_mindset_anxiety | Overcome money anxiety |
| 3 | confidence_mindset_patterns | Break negative money patterns |
| 4 | confidence_mindset_decisions | Stop avoiding financial decisions |
| 5 | confidence_mindset_discipline | Build discipline |
| 6 | confidence_mindset_control | Feel in control |
| 7 | confidence_mindset_understand | Understand how money actually works |

---

## CATEGORY 9: BIG DREAM & FUTURE VISION GOALS (6 goals)

| Order | ID | Label |
|-------|-----|-------|
| 1 | big_dream_future_independent | Become financially independent |
| 2 | big_dream_future_fire | Retire early (FIRE) |
| 3 | big_dream_future_plan | Create a long-term money plan |
| 4 | big_dream_future_lifestyle | Build a lifestyle I dream about |
| 5 | big_dream_future_legacy | Leave wealth behind for the next generation |
| 6 | big_dream_future_no_stress | Reach a point where money isn't stressful |

---

## CATEGORY 10: "REAL TALK" PERSONAL GOALS (7 goals)

| Order | ID | Label |
|-------|-----|-------|
| 1 | real_talk_mistakes | Stop repeating the same financial mistakes |
| 2 | real_talk_cycle | Break the cycle I grew up with |
| 3 | real_talk_undo | Undo years of bad habits |
| 4 | real_talk_prove | Prove to myself I can do this |
| 5 | real_talk_safe | Feel safe financially |
| 6 | real_talk_comparing | Stop comparing myself to others |
| 7 | real_talk_learn | Learn what school never taught me |

---

## COMPLETE JSON EXPORT

```json
{
  "schema_version": "1.0",
  "total_goals": 67,
  "total_categories": 10,
  "categories": [
    {
      "id": "core_money",
      "label": "Core Money Goals",
      "order": 1,
      "goals": [
        {"id": "core_money_change_habits", "label": "Change my money habits", "order": 1},
        {"id": "core_money_stop_paycheck", "label": "Stop living paycheck to paycheck", "order": 2},
        {"id": "core_money_improve_situation", "label": "Improve my financial situation", "order": 3},
        {"id": "core_money_emergency_fund", "label": "Build an emergency fund", "order": 4},
        {"id": "core_money_budget", "label": "Learn to budget in a way that fits me", "order": 5},
        {"id": "core_money_stop_overspending", "label": "Stop overspending", "order": 6},
        {"id": "core_money_no_stress", "label": "Manage money without stress", "order": 7}
      ]
    },
    {
      "id": "debt_credit",
      "label": "Debt & Credit Goals",
      "order": 2,
      "goals": [
        {"id": "debt_credit_get_out", "label": "Get out of debt", "order": 1},
        {"id": "debt_credit_cards", "label": "Pay off credit cards", "order": 2},
        {"id": "debt_credit_loans", "label": "Pay off personal loans", "order": 3},
        {"id": "debt_credit_interest", "label": "Reduce interest payments", "order": 4},
        {"id": "debt_credit_score", "label": "Fix or improve my credit score", "order": 5},
        {"id": "debt_credit_stop_relying", "label": "Stop relying on debt to survive", "order": 6}
      ]
    },
    {
      "id": "saving_planning",
      "label": "Saving & Life Planning Goals",
      "order": 3,
      "goals": [
        {"id": "saving_planning_home", "label": "Save for a home", "order": 1},
        {"id": "saving_planning_car", "label": "Save for a car", "order": 2},
        {"id": "saving_planning_vacation", "label": "Save for vacations", "order": 3},
        {"id": "saving_planning_retirement", "label": "Save for retirement", "order": 4},
        {"id": "saving_planning_security", "label": "Build long-term financial security", "order": 5},
        {"id": "saving_planning_kids", "label": "Save for kids / future kids", "order": 6},
        {"id": "saving_planning_rainy_day", "label": "Build a 'rainy day' fund", "order": 7}
      ]
    },
    {
      "id": "investing",
      "label": "Investing Goals",
      "order": 4,
      "goals": [
        {"id": "investing_learn", "label": "Learn how to invest", "order": 1},
        {"id": "investing_stock_market", "label": "Understand the stock market", "order": 2},
        {"id": "investing_first_time", "label": "Start investing for the first time", "order": 3},
        {"id": "investing_grow", "label": "Grow my investments", "order": 4},
        {"id": "investing_strategies", "label": "Learn long-term investing strategies", "order": 5},
        {"id": "investing_real_estate", "label": "Learn real-estate investing", "order": 6},
        {"id": "investing_passive_income", "label": "Build passive income", "order": 7},
        {"id": "investing_wealth", "label": "Grow my wealth over time", "order": 8}
      ]
    },
    {
      "id": "income_career",
      "label": "Income & Career Goals",
      "order": 5,
      "goals": [
        {"id": "income_career_increase", "label": "Increase my income", "order": 1},
        {"id": "income_career_side_hustle", "label": "Start a side hustle", "order": 2},
        {"id": "income_career_business", "label": "Start my own business", "order": 3},
        {"id": "income_career_switch", "label": "Switch careers", "order": 4},
        {"id": "income_career_negotiate", "label": "Learn how to negotiate pay", "order": 5},
        {"id": "income_career_streams", "label": "Build multiple income streams", "order": 6}
      ]
    },
    {
      "id": "lifestyle_quality",
      "label": "Lifestyle & Quality of Life Goals",
      "order": 6,
      "goals": [
        {"id": "lifestyle_quality_bills", "label": "Reduce monthly bills", "order": 1},
        {"id": "lifestyle_quality_stress", "label": "Stop stressing about money", "order": 2},
        {"id": "lifestyle_quality_comfortable", "label": "Live comfortably", "order": 3},
        {"id": "lifestyle_quality_upgrade", "label": "Upgrade my lifestyle responsibly", "order": 4},
        {"id": "lifestyle_quality_freedom", "label": "Have financial freedom", "order": 5},
        {"id": "lifestyle_quality_travel", "label": "Travel more", "order": 6},
        {"id": "lifestyle_quality_flexibility", "label": "Have flexibility in life decisions", "order": 7}
      ]
    },
    {
      "id": "family_relationship",
      "label": "Family & Relationship Goals",
      "order": 7,
      "goals": [
        {"id": "family_relationship_provide", "label": "Provide for my family", "order": 1},
        {"id": "family_relationship_wealth", "label": "Build generational wealth", "order": 2},
        {"id": "family_relationship_teach_kids", "label": "Teach my kids strong money habits", "order": 3},
        {"id": "family_relationship_arguments", "label": "Stop money-related arguments", "order": 4},
        {"id": "family_relationship_parents", "label": "Support aging parents", "order": 5},
        {"id": "family_relationship_stability", "label": "Create stability at home", "order": 6}
      ]
    },
    {
      "id": "confidence_mindset",
      "label": "Confidence & Mindset Goals",
      "order": 8,
      "goals": [
        {"id": "confidence_mindset_build", "label": "Build confidence with money", "order": 1},
        {"id": "confidence_mindset_anxiety", "label": "Overcome money anxiety", "order": 2},
        {"id": "confidence_mindset_patterns", "label": "Break negative money patterns", "order": 3},
        {"id": "confidence_mindset_decisions", "label": "Stop avoiding financial decisions", "order": 4},
        {"id": "confidence_mindset_discipline", "label": "Build discipline", "order": 5},
        {"id": "confidence_mindset_control", "label": "Feel in control", "order": 6},
        {"id": "confidence_mindset_understand", "label": "Understand how money actually works", "order": 7}
      ]
    },
    {
      "id": "big_dream_future",
      "label": "Big Dream & Future Vision Goals",
      "order": 9,
      "goals": [
        {"id": "big_dream_future_independent", "label": "Become financially independent", "order": 1},
        {"id": "big_dream_future_fire", "label": "Retire early (FIRE)", "order": 2},
        {"id": "big_dream_future_plan", "label": "Create a long-term money plan", "order": 3},
        {"id": "big_dream_future_lifestyle", "label": "Build a lifestyle I dream about", "order": 4},
        {"id": "big_dream_future_legacy", "label": "Leave wealth behind for the next generation", "order": 5},
        {"id": "big_dream_future_no_stress", "label": "Reach a point where money isn't stressful", "order": 6}
      ]
    },
    {
      "id": "real_talk",
      "label": "\"Real Talk\" Personal Goals",
      "order": 10,
      "goals": [
        {"id": "real_talk_mistakes", "label": "Stop repeating the same financial mistakes", "order": 1},
        {"id": "real_talk_cycle", "label": "Break the cycle I grew up with", "order": 2},
        {"id": "real_talk_undo", "label": "Undo years of bad habits", "order": 3},
        {"id": "real_talk_prove", "label": "Prove to myself I can do this", "order": 4},
        {"id": "real_talk_safe", "label": "Feel safe financially", "order": 5},
        {"id": "real_talk_comparing", "label": "Stop comparing myself to others", "order": 6},
        {"id": "real_talk_learn", "label": "Learn what school never taught me", "order": 7}
      ]
    }
  ]
}
```

---

## SUMMARY TABLE

| Category | Goals Count |
|----------|-------------|
| Core Money Goals | 7 |
| Debt & Credit Goals | 6 |
| Saving & Life Planning Goals | 7 |
| Investing Goals | 8 |
| Income & Career Goals | 6 |
| Lifestyle & Quality of Life Goals | 7 |
| Family & Relationship Goals | 6 |
| Confidence & Mindset Goals | 7 |
| Big Dream & Future Vision Goals | 6 |
| "Real Talk" Personal Goals | 7 |
| **TOTAL** | **67** |

---

## USAGE IN TAP/LPI PERSONALIZATION

These goals are used by TAP v5.0 to:
1. **Personalize lesson content** - Prioritize chapters matching user goals
2. **Select relevant examples** - Financial scenarios aligned with goals
3. **Frame DNA-based content** - Combine traits + goals for maximum relevance
4. **Track progress** - Measure user advancement toward stated goals
5. **Generate exercises** - Create goal-specific practice activities

---

## UI CONFIGURATION

```json
{
  "component": "GoalSelector",
  "display": {
    "multiSelect": true,
    "minRequired": 1,
    "maxAllowed": null,
    "showCategoryHeaders": true,
    "collapsibleCategories": true,
    "searchEnabled": false
  },
  "customGoal": {
    "enabled": true,
    "maxLength": 200,
    "placeholder": "Describe your financial goal..."
  },
  "position": {
    "step": 3,
    "stepLabel": "Your Goals",
    "afterField": "experience_level",
    "beforeField": "ppi"
  }
}
```
