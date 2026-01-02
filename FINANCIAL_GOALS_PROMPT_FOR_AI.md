# WEALTH BUILDER - FINANCIAL GOALS CONFIGURATION

## Overview
These are the 63 financial goals organized into 10 categories that users can select during onboarding. Users must select at least one goal. These goals are used to personalize the Learning Path Index (LPI) lessons.

---

## GOAL CATEGORIES & ITEMS

### 1. Core Money Goals (7 goals)
| ID | Label |
|----|-------|
| core_money_change_habits | Change my money habits |
| core_money_stop_paycheck | Stop living paycheck to paycheck |
| core_money_improve_situation | Improve my financial situation |
| core_money_emergency_fund | Build an emergency fund |
| core_money_budget | Learn to budget in a way that fits me |
| core_money_stop_overspending | Stop overspending |
| core_money_no_stress | Manage money without stress |

### 2. Debt & Credit Goals (6 goals)
| ID | Label |
|----|-------|
| debt_credit_get_out | Get out of debt |
| debt_credit_cards | Pay off credit cards |
| debt_credit_loans | Pay off personal loans |
| debt_credit_interest | Reduce interest payments |
| debt_credit_score | Fix or improve my credit score |
| debt_credit_stop_relying | Stop relying on debt to survive |

### 3. Saving & Life Planning Goals (7 goals)
| ID | Label |
|----|-------|
| saving_planning_home | Save for a home |
| saving_planning_car | Save for a car |
| saving_planning_vacation | Save for vacations |
| saving_planning_retirement | Save for retirement |
| saving_planning_security | Build long-term financial security |
| saving_planning_kids | Save for kids / future kids |
| saving_planning_rainy_day | Build a 'rainy day' fund |

### 4. Investing Goals (8 goals)
| ID | Label |
|----|-------|
| investing_learn | Learn how to invest |
| investing_stock_market | Understand the stock market |
| investing_first_time | Start investing for the first time |
| investing_grow | Grow my investments |
| investing_strategies | Learn long-term investing strategies |
| investing_real_estate | Learn real-estate investing |
| investing_passive_income | Build passive income |
| investing_wealth | Grow my wealth over time |

### 5. Income & Career Goals (6 goals)
| ID | Label |
|----|-------|
| income_career_increase | Increase my income |
| income_career_side_hustle | Start a side hustle |
| income_career_business | Start my own business |
| income_career_switch | Switch careers |
| income_career_negotiate | Learn how to negotiate pay |
| income_career_streams | Build multiple income streams |

### 6. Lifestyle & Quality of Life Goals (7 goals)
| ID | Label |
|----|-------|
| lifestyle_quality_bills | Reduce monthly bills |
| lifestyle_quality_stress | Stop stressing about money |
| lifestyle_quality_comfortable | Live comfortably |
| lifestyle_quality_upgrade | Upgrade my lifestyle responsibly |
| lifestyle_quality_freedom | Have financial freedom |
| lifestyle_quality_travel | Travel more |
| lifestyle_quality_flexibility | Have flexibility in life decisions |

### 7. Family & Relationship Goals (6 goals)
| ID | Label |
|----|-------|
| family_relationship_provide | Provide for my family |
| family_relationship_wealth | Build generational wealth |
| family_relationship_teach_kids | Teach my kids strong money habits |
| family_relationship_arguments | Stop money-related arguments |
| family_relationship_parents | Support aging parents |
| family_relationship_stability | Create stability at home |

### 8. Confidence & Mindset Goals (7 goals)
| ID | Label |
|----|-------|
| confidence_mindset_build | Build confidence with money |
| confidence_mindset_anxiety | Overcome money anxiety |
| confidence_mindset_patterns | Break negative money patterns |
| confidence_mindset_decisions | Stop avoiding financial decisions |
| confidence_mindset_discipline | Build discipline |
| confidence_mindset_control | Feel in control |
| confidence_mindset_understand | Understand how money actually works |

### 9. Big Dream & Future Vision Goals (6 goals)
| ID | Label |
|----|-------|
| big_dream_future_independent | Become financially independent |
| big_dream_future_fire | Retire early (FIRE) |
| big_dream_future_plan | Create a long-term money plan |
| big_dream_future_lifestyle | Build a lifestyle I dream about |
| big_dream_future_legacy | Leave wealth behind for the next generation |
| big_dream_future_no_stress | Reach a point where money isn't stressful |

### 10. "Real Talk" Personal Goals (7 goals)
| ID | Label |
|----|-------|
| real_talk_mistakes | Stop repeating the same financial mistakes |
| real_talk_cycle | Break the cycle I grew up with |
| real_talk_undo | Undo years of bad habits |
| real_talk_prove | Prove to myself I can do this |
| real_talk_safe | Feel safe financially |
| real_talk_comparing | Stop comparing myself to others |
| real_talk_learn | Learn what school never taught me |

---

## SUMMARY

| Category | Goal Count |
|----------|------------|
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
| **TOTAL** | **67 goals** |

---

## CONFIGURATION OPTIONS

- **Multi-select:** Users can select multiple goals
- **Minimum required:** At least 1 goal must be selected
- **Custom goals:** Users can add their own custom goal (max 200 characters)
- **Position:** Displayed as Step 3 of 4 during onboarding (after personal info, before PPI)

---

## JSON FORMAT

```json
{
  "component": "orientationGoalsDropdown",
  "version": "1.0",
  "positionAfter": "financial_experience_level",
  "multiSelect": true,
  "categories": [
    {
      "id": "category_id",
      "label": "Category Label",
      "goals": [
        { "id": "goal_id", "label": "Goal Label" }
      ]
    }
  ],
  "allowCustomGoal": true,
  "customGoalField": {
    "id": "custom_goal",
    "label": "Add your own goal",
    "type": "text",
    "placeholder": "Describe your financial goal...",
    "maxLength": 200
  }
}
```

---

## USAGE IN TAP/LPI PERSONALIZATION

These goals are used to:
1. Personalize lesson content recommendations
2. Prioritize chapters that align with user goals
3. Customize examples and scenarios in lessons
4. Track progress toward specific financial objectives
5. Generate relevant quiz questions and exercises

The TAP (Text Adaptation Processor) uses these goals in combination with:
- User age (6-99)
- Experience Level (1-5)
- DNA traits (from PPI assessment)

To deliver highly personalized financial education content.
