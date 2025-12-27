"""
Adaptive Engine v2.0 - Mizo Wealth Builder POC
Implements Contract v1.1-stable

Functions:
- AE_FN_COMPOSE_PPI: Dynamically select 20 PPI questions from bank
- AE_FN_GENERATE_PLAN: Generate Financial DNA + personalized LPI plan

Updated: TAP 3.0 integration (immutable baseline + scaffolding injection)
"""

import json
import random
from typing import Dict, List, Any, Tuple
from datetime import datetime
from pathlib import Path
from config import MINIMUM_USER_AGE, CHILD_AGE_MAX, TEEN_AGE_MAX
from ae_v3_tap import get_tap_engine, UserProfile, compute_experience_band


class AdaptiveEngineV2:
    """
    Mizo Wealth Builder Adaptive Engine V2
    Implements stable contract v1.1.1
    """
    
    # Age band configuration - imported from config.py
    MINIMUM_AGE = MINIMUM_USER_AGE
    CHILD_AGE_MAX = CHILD_AGE_MAX
    TEEN_AGE_MAX = TEEN_AGE_MAX
    
    def __init__(self):
        self.contracts = self._load_json('ae_contracts_stable_v1_1.json')
        self.rules = self._load_json('ae_rules_poc_v1_1.json')
        # Use baseline bank with 20 standard questions
        self.ppi_bank = self._load_json('ppi_bank_baseline_v1_1.json')
        self.lpi_index = self._load_json('lpi_lessons_index.json')
        # Load goal-to-chapter mapping for personalization
        self.goal_mapping = self._load_json('goal_chapter_mapping.json')
    
    def _load_json(self, filename: str) -> Dict:
        """Load JSON file from backend directory"""
        try:
            file_path = Path(__file__).parent / filename
            with open(file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            print(f"Warning: {filename} not found")
            return {}
    
    def compose_ppi(self, user_id: str, age: int, financial_experience: str, 
                   occupation_bucket: str = None, locale: str = "en-US") -> Dict[str, Any]:
        """
        AE_FN_COMPOSE_PPI
        
        Dynamically select 20 PPI questions from bank based on:
        - Age constraints
        - Financial experience level
        - Bucket weights (base:8, motivation:4, habits:4, risk_confidence:4)
        - Deterministic selection using user_id as seed
        
        Args:
            user_id: User identifier (used as deterministic seed)
            age: User age
            financial_experience: "beginner" | "intermediate" | "advanced"
            occupation_bucket: Optional occupation bucket
            locale: Locale string (default: en-US)
        
        Returns:
            {
                "ppi_version": "POC-v1.1.1",
                "items": [20 PPI items with id, prompt, options]
            }
        """
        # Set deterministic seed based on user_id
        random.seed(user_id)
        
        # Get age band constraints
        age_band = self._get_age_band(age)
        # Try to get exact match first, then fallback to default child/teen/adult rules
        age_constraints = self.rules['constraints']['age_bands'].get(age_band, {})
        
        # If no exact match, apply default rules based on age category
        if not age_constraints:
            if age <= self.CHILD_AGE_MAX:
                # Child: exclude advanced content
                age_constraints = {'exclude_tags': ['advanced'], 'reading_level': 'simple'}
            elif age <= self.TEEN_AGE_MAX:
                # Teen: allow most content
                age_constraints = {'exclude_tags': [], 'reading_level': 'youth'}
            else:
                # Adult: allow all content
                age_constraints = {'exclude_tags': [], 'reading_level': 'standard'}
        
        # Get experience constraints
        exp_constraints = self.rules['constraints']['experience'].get(financial_experience, {})
        
        # SIMPLIFIED: Use all 20 baseline questions, filtered by age appropriateness
        # All users get the same 20 questions, just filtered for age/experience
        eligible_items = []
        for item in self.ppi_bank['items']:
            # Check age range
            if not (item['age_min'] <= age <= item['age_max']):
                continue
            
            # Check experience level
            if financial_experience not in item['experience_levels']:
                continue
            
            # Check age band exclusions (e.g., kids don't get "advanced" questions)
            exclude_tags = age_constraints.get('exclude_tags', [])
            if any(tag in item['tags'] for tag in exclude_tags):
                continue
            
            eligible_items.append(item)
        
        # Since we have exactly 20 baseline questions and all are appropriate for most users,
        # we'll use all eligible items (should be 20 or close to it)
        final_items = eligible_items[:20]  # Take up to 20
        
        # Check if TAP 3.0 is enabled
        from feature_flags import is_tap_v3_0_enabled, is_tap_v3_2_4_enabled
        use_tap324 = is_tap_v3_2_4_enabled()
        use_tap3 = is_tap_v3_0_enabled() and not use_tap324
        
        # Convert experience string to level (1-5 for POC)
        exp_level_map = {"beginner": 1, "intermediate": 3, "advanced": 5}
        exp_level = exp_level_map.get(financial_experience, 1)
        
        output_items = []
        
        if use_tap324:
            # TAP 3.2.4: Child-friendly PPI with option adaptation
            from tap_3_2_4 import TAP32Engine_v324, PPIOptionSpec as TAP324PPIOptionSpec, TAPControlInputs as TAP324ControlInputs
            
            tap324_engine = TAP32Engine_v324(el_max_poc=5)
            
            for idx, item in enumerate(final_items, 1):
                # Create PPIOptionSpec list from item options
                option_specs = []
                for opt_idx, opt_text in enumerate(item['options']):
                    opt_id = chr(65 + opt_idx)  # A, B, C, D
                    # Try to determine option key from text
                    opt_key = self._infer_option_key(opt_text)
                    option_specs.append(TAP324PPIOptionSpec(
                        option_id=opt_id,
                        option_text=opt_text,
                        option_key=opt_key
                    ))
                
                # Process through TAP 3.2.4 engine
                ppi_result = tap324_engine.process_ppi(
                    question_text=item['prompt'],
                    options=option_specs,
                    age=age,
                    el_declared=exp_level
                )
                
                # Extract adapted options
                adapted_options = []
                for opt in ppi_result['options']:
                    adapted_options.append({
                        "id": opt['id'],
                        "display": opt['display'],
                        "baseline": opt['baseline'],
                        "gloss": opt['gloss']
                    })
                
                output_items.append({
                    "question_id": f"PPI_Q{idx:02d}",
                    "bank_id": item['id'],
                    "type": item['type'],
                    "prompt": ppi_result['question'],
                    "options": [opt['display'] for opt in adapted_options],  # Use display text for frontend
                    "options_detail": adapted_options,  # Include full detail for reference
                    "tap_version": "3.2.4",
                    "scalars": ppi_result['scalars']
                })
        elif use_tap3:
            # TAP 3.0: Immutable baseline + scaffolding injection
            from tap_3_0 import compute_scalars as tap3_compute_scalars, get_clg_engine as get_tap3_clg_engine, EL_MAX_POC, extract_concepts_from_text
            
            tap3_clg = get_tap3_clg_engine()
            scalars = tap3_compute_scalars(age, exp_level, EL_MAX_POC)
            
            for idx, item in enumerate(final_items, 1):
                # Extract concepts from the question prompt
                concepts = extract_concepts_from_text(item['prompt'])
                
                # Process through TAP 3.0 CLG (baseline immutable, scaffolding only)
                prompt_output = tap3_clg.process(
                    baseline_text=item['prompt'],
                    scalars=scalars,
                    content_type="ppi",
                    concepts=concepts
                )
                
                # For options, we keep them as-is (don't add scaffolding to options)
                output_items.append({
                    "question_id": f"PPI_Q{idx:02d}",
                    "bank_id": item['id'],
                    "type": item['type'],
                    "prompt": prompt_output.final_output,
                    "options": item['options'],  # Options remain unchanged
                    "tap_version": "3.0",
                    "baseline_preserved": not prompt_output.baseline_mutated,
                    "scaffolding_count": len(prompt_output.additions)
                })
        else:
            # Legacy TAP v2.3: Use CLG PPI Question Bank
            from tap_v2_3_engine import get_tap_v23_engine
            from feature_flags import get_el_max
            from tap_v2_3_formulas import compute_tap_scalars
            from clg_data import get_ppi_question
            
            el_max = get_el_max()
            
            for idx, item in enumerate(final_items, 1):
                # Get TAP scalars first
                scalars = compute_tap_scalars(age, exp_level, el_max)
                
                # Try to get CLG-adapted version of the question
                clg_question = get_ppi_question(item['id'], scalars.lc)
                
                if clg_question:
                    # Use CLG-adapted prompt and options
                    transformed_prompt = clg_question['prompt']
                    transformed_options = clg_question['options']
                    lc_applied = clg_question.get('lc_applied', scalars.lc)
                else:
                    # Fallback to baseline (no CLG entry for this question)
                    transformed_prompt = item['prompt']
                    transformed_options = item['options']
                    lc_applied = None
                
                output_items.append({
                    "question_id": f"PPI_Q{idx:02d}",
                    "bank_id": item['id'],
                    "type": item['type'],
                    "prompt": transformed_prompt,
                    "options": transformed_options,
                    "clg_adapted": clg_question is not None,
                    "lc_applied": round(lc_applied, 4) if lc_applied else None
                })
        
        return {
            "ppi_version": "POC-v1.1.1",
            "items": output_items,
            "user_id": user_id,
            "age": age,
            "financial_experience": financial_experience,
            "composed_at": datetime.utcnow().isoformat() + "Z"
        }
    
    def _get_age_band(self, age: int) -> str:
        """
        Determine age band from age - dynamically calculated based on constants
        Age bands are automatically adjusted when MINIMUM_AGE is changed
        """
        if self.MINIMUM_AGE <= age <= self.CHILD_AGE_MAX:
            return f"{self.MINIMUM_AGE}-{self.CHILD_AGE_MAX}"
        elif self.CHILD_AGE_MAX < age <= self.TEEN_AGE_MAX:
            return f"{self.CHILD_AGE_MAX + 1}-{self.TEEN_AGE_MAX}"
        else:
            return f"{self.TEEN_AGE_MAX + 1}-99"
    
    
    def _infer_option_key(self, option_text: str) -> str:
        """
        Infer option key from option text for TAP 3.2.4 PPI processing.
        Maps common PPI option patterns to semantic keys.
        """
        t = option_text.lower()
        
        # Research/information gathering
        if "research" in t or "extensively" in t or "information" in t or "look up" in t:
            return "RESEARCH_FIRST"
        
        # Gut feeling / intuition
        if "gut" in t or "feeling" in t or "instinct" in t or "feels right" in t:
            return "GUT_FEELING"
        
        # Ask others (family/friends)
        if "friends" in t or "family" in t or "advice" in t or "grown-up" in t or "parent" in t:
            return "ASK_FAMILY"
        
        # Follow experts
        if "expert" in t or "professional" in t or "recommend" in t or "smart helper" in t:
            return "FOLLOW_EXPERTS"
        
        # Save / conservative
        if "save" in t or "saving" in t or "put away" in t:
            return "SAVE_FIRST"
        
        # Spend / buy now
        if "spend" in t or "buy" in t or "purchase" in t:
            return "SPEND_NOW"
        
        # Wait / patience
        if "wait" in t or "patient" in t or "later" in t:
            return "WAIT_AND_SEE"
        
        # Plan / organize
        if "plan" in t or "budget" in t or "organize" in t:
            return "PLAN_AHEAD"
        
        # Default
        return "UNKNOWN"
    def calculate_combined_score(self, age: int, experience_level: int) -> float:
        """
        AE-CORE v2.0 Formula: Calculate combined personalization score
        
        Formula: combined_score = 0.4 * age_score + 0.6 * exp_score
        
        Args:
            age: User age (6-99)
            experience_level: Financial experience level (1-5)
                1 = Beginner
                2 = Novice
                3 = Intermediate
                4 = Advanced
                5 = Expert
        
        Returns:
            float: Combined score (0.0-1.0)
        """
        # Normalize age to 0.0-1.0 scale
        # Age range: 6 (min) to 99 (max)
        age_normalized = (age - self.MINIMUM_AGE) / (99 - self.MINIMUM_AGE)
        age_score = min(1.0, max(0.0, age_normalized))
        
        # Normalize experience level to 0.0-1.0 scale
        # Experience: 1 (beginner) to 5 (expert)
        exp_score = (experience_level - 1) / 4.0
        
        # Apply AE-CORE v2.0 formula
        combined_score = 0.4 * age_score + 0.6 * exp_score
        
        return round(combined_score, 3)
    
    def generate_plan(self, user_id: str, answers: List[Dict[str, str]], 
                      age: int = None, goals: List[str] = None) -> Dict[str, Any]:
        """
        AE_FN_GENERATE_PLAN
        
        Generate Financial DNA profile and personalized LPI plan based on:
        - PPI responses (psychological profile)
        - Age (developmental appropriateness)
        - Financial goals (content prioritization)
        
        NEW: Now includes age + goals for enhanced personalization
        
        Args:
            user_id: User identifier
            answers: List of {"id": "PPI_Q01", "value": "A"}
            age: User age (optional, for goal filtering)
            goals: List of financial goal IDs (optional, for chapter prioritization)
        
        Returns:
            {
                "dna": {
                    "profile": "Planner",
                    "weights": {...}
                },
                "lpi_plan": {
                    "version": "POC-v1.1.1",
                    "chapters": [...],
                    "goals_applied": 2
                }
            }
        """
        # Convert answers to dict for easier lookup
        answer_map = {ans['id']: ans['value'] for ans in answers}
        
        # Calculate Financial DNA weights (from PPI)
        dna = self._calculate_financial_dna(answer_map)
        
        # Generate LPI plan based on DNA + Age + Goals
        lpi_plan = self._generate_lpi_plan(dna, age=age, goals=goals)
        
        return {
            "dna": dna,
            "lpi_plan": lpi_plan,
            "user_id": user_id,
            "age": age,
            "goals": goals or [],
            "generated_at": datetime.utcnow().isoformat() + "Z"
        }
    
    def _calculate_financial_dna(self, answers: Dict[str, str]) -> Dict[str, Any]:
        """
        Calculate Financial DNA profile based on PPI responses
        
        Weights calculated:
        - discipline: Planning and structure tendency (0.0-1.0)
        - impulse: Spontaneous spending tendency (0.0-1.0)
        - confidence: Financial confidence level (0.0-1.0)
        - tempo: Learning pace ("fast" | "steady" | "slow")
        """
        # Initialize weights
        discipline_score = 0
        impulse_score = 0
        confidence_score = 0
        tempo_votes = {"fast": 0, "steady": 0, "slow": 0}
        
        # Analyze responses (simplified mapping)
        # In production, this would use more sophisticated analysis
        for q_id, answer in answers.items():
            # Discipline indicators (structure, planning)
            if answer == "A":
                discipline_score += 0.15
            
            # Impulse indicators (spontaneity)
            if answer in ["C", "D"]:
                impulse_score += 0.1
            
            # Confidence indicators
            if answer in ["A", "C"]:
                confidence_score += 0.1
            
            # Tempo indicators
            if answer == "A":
                tempo_votes["fast"] += 1
            elif answer == "B":
                tempo_votes["steady"] += 1
            elif answer in ["C", "D"]:
                tempo_votes["slow"] += 1
        
        # Normalize weights to 0.0-1.0
        discipline = min(1.0, discipline_score)
        impulse = min(1.0, impulse_score)
        confidence = min(1.0, confidence_score)
        
        # Determine tempo
        tempo = max(tempo_votes, key=tempo_votes.get)
        
        # Determine archetype profile
        profile = self._determine_archetype(discipline, impulse, confidence, tempo)
        
        return {
            "profile": profile,
            "weights": {
                "discipline": round(discipline, 2),
                "impulse": round(impulse, 2),
                "confidence": round(confidence, 2),
                "tempo": tempo
            }
        }
    
    def _determine_archetype(self, discipline: float, impulse: float, 
                           confidence: float, tempo: str) -> str:
        """Determine financial archetype based on DNA weights"""
        if discipline > 0.6 and impulse < 0.4:
            return "Planner"
        elif impulse > 0.6 and discipline < 0.4:
            return "Spontaneous"
        elif confidence > 0.6:
            return "Confident Explorer"
        elif confidence < 0.4:
            return "Cautious Learner"
        else:
            return "Balanced Builder"
    
    def _apply_goal_prioritization(self, base_order: List[int], goals: List[str], age: int) -> List[int]:
        """
        Adjust chapter order based on user's financial goals
        
        Args:
            base_order: Chapter order from PPI profile
            goals: List of goal IDs from user registration
            age: User age for goal filtering
        
        Returns:
            Reordered chapter list prioritizing goal-relevant chapters
        """
        if not goals or not self.goal_mapping.get('goal_definitions'):
            return base_order
        
        # Build priority scores for each chapter
        chapter_scores = {ch: 0 for ch in base_order}
        
        for goal_id in goals:
            # Find goal definition
            goal_def = next((g for g in self.goal_mapping['goal_definitions'] if g['id'] == goal_id), None)
            if not goal_def:
                continue
            
            # Check if goal is age-appropriate
            age_min, age_max = goal_def.get('age_appropriate', [0, 99])
            if not (age_min <= age <= age_max):
                continue
            
            # Add priority for primary chapters
            for ch in goal_def.get('primary_chapters', []):
                if ch in chapter_scores:
                    chapter_scores[ch] += 10 * goal_def.get('priority_boost', 1)
            
            # Add priority for secondary chapters
            for ch in goal_def.get('secondary_chapters', []):
                if ch in chapter_scores:
                    chapter_scores[ch] += 5 * goal_def.get('priority_boost', 1)
        
        # Sort chapters: high priority first, then preserve base order
        # CH01 (Money Basics) always stays first
        ch01 = [1] if 1 in base_order else []
        other_chapters = [ch for ch in base_order if ch != 1]
        
        # Sort by priority score (desc), then by original position
        sorted_others = sorted(other_chapters, key=lambda ch: (-chapter_scores[ch], other_chapters.index(ch)))
        
        return ch01 + sorted_others
    
    def _generate_lpi_plan(self, dna: Dict[str, Any], age: int = None, goals: List[str] = None) -> Dict[str, Any]:
        """
        Generate personalized LPI plan based on Financial DNA + Age + Goals
        
        NEW: Now incorporates user goals for chapter prioritization
        
        Args:
            dna: Financial DNA profile from PPI
            age: User age (for goal filtering)
            goals: List of financial goal IDs
        
        Returns chapter order and configuration
        """
        profile = dna['profile']
        tempo = dna['weights']['tempo']
        
        # Define base chapter orders for different profiles (from PPI)
        chapter_orders = {
            "Planner": [1, 2, 4, 3, 8, 7, 9, 6, 5, 10],
            "Spontaneous": [1, 8, 2, 3, 7, 4, 6, 9, 5, 10],
            "Confident Explorer": [1, 2, 3, 5, 4, 6, 8, 7, 9, 10],
            "Cautious Learner": [1, 2, 8, 3, 7, 9, 4, 6, 5, 10],
            "Balanced Builder": [1, 2, 3, 4, 8, 7, 9, 6, 5, 10]
        }
        
        # Get base chapter order for profile (from PPI)
        base_order = chapter_orders.get(profile, chapter_orders["Balanced Builder"])
        
        # Apply goal-based prioritization if goals provided
        if goals and age:
            chapter_order = self._apply_goal_prioritization(base_order, goals, age)
        else:
            chapter_order = base_order
        
        # Build chapter plan
        chapters = []
        for ch_num in chapter_order:
            chapters.append({
                "ch": ch_num,
                "lessons": [1, 2, 3, 4],  # All 4 lessons per chapter
                "quiz_mode": "choice_abcd"
            })
        
        return {
            "version": "POC-v1.1.1",
            "chapters": chapters,
            "tempo": tempo,
            "profile": profile,
            "goals_applied": len(goals) if goals else 0
        }


# Singleton instance
_ae_v2_instance = None

def get_adaptive_engine_v2() -> AdaptiveEngineV2:
    """Get or create singleton AE V2 instance"""
    global _ae_v2_instance
    if _ae_v2_instance is None:
        _ae_v2_instance = AdaptiveEngineV2()
    return _ae_v2_instance
