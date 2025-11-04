"""
Adaptive Engine v2.1 - Enhanced - Wealth Builder POC
Improved accuracy with question-specific analysis and user context

Enhancements:
- Question-specific scoring based on actual PPI content
- Age and experience influence on DNA calculation
- More nuanced archetype determination
- Better chapter ordering logic
"""

import json
import random
from typing import Dict, List, Any, Tuple
from datetime import datetime
from pathlib import Path


class AdaptiveEngineV2Enhanced:
    """
    Enhanced Adaptive Engine with improved accuracy
    """
    
    def __init__(self):
        self.contracts = self._load_json('ae_contracts_stable_v1_1.json')
        self.rules = self._load_json('ae_rules_poc_v1_1.json')
        self.ppi_bank = self._load_json('ppi_bank_baseline_v1_1.json')
        self.lpi_index = self._load_json('lpi_lessons_index.json')
        
        # Enhanced question mapping for accurate DNA calculation
        self.question_traits = self._build_question_trait_map()
    
    def _load_json(self, filename: str) -> Dict:
        """Load JSON file from backend directory"""
        try:
            file_path = Path(__file__).parent / filename
            with open(file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            print(f"Warning: {filename} not found")
            return {}
    
    def _build_question_trait_map(self) -> Dict[str, Dict[str, List[str]]]:
        """
        Map each PPI question and answer to specific traits
        Based on actual question content from baseline
        """
        return {
            "PPI_Q01": {  # Financial decision making
                "A": ["discipline", "analytical"],
                "B": ["impulse", "intuitive"],
                "C": ["social", "cautious"],
                "D": ["guided", "cautious"]
            },
            "PPI_Q02": {  # Saving approach
                "A": ["discipline", "systematic"],
                "B": ["flexible", "reactive"],
                "C": ["goal_oriented"],
                "D": ["challenged", "needs_support"]
            },
            "PPI_Q03": {  # Financial future feelings
                "A": ["confident", "optimistic"],
                "B": ["anxious", "needs_support"],
                "C": ["uncertain", "hopeful"],
                "D": ["confident", "prepared"]
            },
            "PPI_Q04": {  # Spending tracking
                "A": ["discipline", "systematic"],
                "B": ["moderate", "organized"],
                "C": ["reactive", "loose"],
                "D": ["stress_driven", "reactive"]
            },
            "PPI_Q05": {  # Financial priority
                "A": ["cautious", "security_focused"],
                "B": ["pragmatic", "problem_solver"],
                "C": ["goal_oriented", "forward_thinking"],
                "D": ["learning", "foundation_building"]
            },
            "PPI_Q06": {  # Unexpected money
                "A": ["discipline", "future_focused"],
                "B": ["impulse", "present_focused"],
                "C": ["balanced", "moderate"],
                "D": ["pragmatic", "responsible"]
            },
            "PPI_Q07": {  # Learning style
                "A": ["analytical", "researcher"],
                "B": ["hands_on", "practical"],
                "C": ["visual", "modern"],
                "D": ["social", "collaborative"]
            },
            "PPI_Q08": {  # Credit card relationship
                "A": ["discipline", "responsible"],
                "B": ["cautious", "risk_averse"],
                "C": ["moderate", "managing"],
                "D": ["challenged", "needs_support"]
            },
            "PPI_Q09": {  # Goal setting
                "A": ["discipline", "structured"],
                "B": ["flexible", "adaptive"],
                "C": ["quick_wins", "motivated"],
                "D": ["visionary", "flexible"]
            },
            "PPI_Q10": {  # Financial stress response
                "A": ["resilient", "motivated"],
                "B": ["avoidant", "needs_support"],
                "C": ["affected", "sensitive"],
                "D": ["confident", "stable"]
            },
            "PPI_Q11": {  # Spending habits
                "A": ["discipline", "controlled"],
                "B": ["moderate", "mostly_controlled"],
                "C": ["impulse", "reactive"],
                "D": ["emotional", "impulse"]
            },
            "PPI_Q12": {  # Investing knowledge
                "A": ["confident", "advanced"],
                "B": ["moderate", "learning"],
                "C": ["beginner", "curious"],
                "D": ["overwhelmed", "needs_support"]
            },
            "PPI_Q13": {  # Financial setback response
                "A": ["resilient", "adaptive"],
                "B": ["recovers", "moderate"],
                "C": ["needs_support", "social"],
                "D": ["challenged", "needs_support"]
            },
            "PPI_Q14": {  # Purchase preferences
                "A": ["analytical", "discipline"],
                "B": ["opportunistic", "value_focused"],
                "C": ["moderate", "need_based"],
                "D": ["impulse", "emotional"]
            },
            "PPI_Q15": {  # Risk comfort
                "A": ["confident", "risk_tolerant"],
                "B": ["moderate", "balanced"],
                "C": ["cautious", "risk_averse"],
                "D": ["very_cautious", "risk_averse"]
            },
            "PPI_Q16": {  # Money talk comfort
                "A": ["confident", "open"],
                "B": ["moderate", "selective"],
                "C": ["uncomfortable", "private"],
                "D": ["very_private", "uncomfortable"]
            },
            "PPI_Q17": {  # Biggest challenge
                "A": ["income_focused", "external"],
                "B": ["control_focused", "behavioral"],
                "C": ["knowledge_focused", "learning"],
                "D": ["motivation_focused", "emotional"]
            },
            "PPI_Q18": {  # Budget planning
                "A": ["discipline", "systematic"],
                "B": ["loose", "intuitive"],
                "C": ["simple", "basic"],
                "D": ["none", "needs_support"]
            },
            "PPI_Q19": {  # Financial personality
                "A": ["discipline", "saver"],
                "B": ["balanced", "pragmatic"],
                "C": ["impulse", "spontaneous"],
                "D": ["exploring", "learning"]
            },
            "PPI_Q20": {  # Motivation for learning
                "A": ["goal_oriented", "achievement"],
                "B": ["stress_reduction", "peace"],
                "C": ["wealth_building", "future"],
                "D": ["confidence_building", "empowerment"]
            }
        }
    
    def compose_ppi(self, user_id: str, age: int, financial_experience: str, 
                   occupation_bucket: str = None, locale: str = "en-US") -> Dict[str, Any]:
        """
        AE_FN_COMPOSE_PPI - Same as before but with better comments
        """
        random.seed(user_id)
        
        age_band = self._get_age_band(age)
        age_constraints = self.rules['constraints']['age_bands'].get(age_band, {})
        exp_constraints = self.rules['constraints']['experience'].get(financial_experience, {})
        
        eligible_items = []
        for item in self.ppi_bank['items']:
            if not (item['age_min'] <= age <= item['age_max']):
                continue
            
            if financial_experience not in item['experience_levels']:
                continue
            
            exclude_tags = age_constraints.get('exclude_tags', [])
            if any(tag in item['tags'] for tag in exclude_tags):
                continue
            
            eligible_items.append(item)
        
        final_items = eligible_items[:20]
        
        output_items = []
        for idx, item in enumerate(final_items, 1):
            output_items.append({
                "question_id": f"PPI_Q{idx:02d}",
                "bank_id": item['id'],
                "type": item['type'],
                "prompt": item['prompt'],
                "options": item['options']
            })
        
        return {
            "ppi_version": "POC-v1.1.1-baseline",
            "items": output_items,
            "user_id": user_id,
            "age": age,
            "financial_experience": financial_experience,
            "composed_at": datetime.utcnow().isoformat() + "Z"
        }
    
    def _get_age_band(self, age: int) -> str:
        """Determine age band from age"""
        if 8 <= age <= 12:
            return "8-12"
        elif 13 <= age <= 17:
            return "13-17"
        else:
            return "18-99"
    
    def generate_plan(self, user_id: str, answers: List[Dict[str, str]], 
                     age: int = None, financial_experience: str = None) -> Dict[str, Any]:
        """
        AE_FN_GENERATE_PLAN - Enhanced with user context
        
        Args:
            user_id: User identifier
            answers: List of {"id": "PPI_Q01", "value": "A"}
            age: User age (for context-aware DNA)
            financial_experience: User experience level
        """
        answer_map = {ans['id']: ans['value'] for ans in answers}
        
        # Enhanced DNA calculation with user context
        dna = self._calculate_financial_dna_enhanced(answer_map, age, financial_experience)
        
        # Generate LPI plan with enhanced logic
        lpi_plan = self._generate_lpi_plan_enhanced(dna, age, financial_experience)
        
        return {
            "dna": dna,
            "lpi_plan": lpi_plan,
            "user_id": user_id,
            "generated_at": datetime.utcnow().isoformat() + "Z"
        }
    
    def _calculate_financial_dna_enhanced(self, answers: Dict[str, str], 
                                         age: int = None, 
                                         financial_experience: str = None) -> Dict[str, Any]:
        """
        Enhanced DNA calculation using question-specific trait mapping
        """
        # Collect all traits from answers
        trait_counts = {}
        
        for q_id, answer in answers.items():
            if q_id in self.question_traits and answer in self.question_traits[q_id]:
                traits = self.question_traits[q_id][answer]
                for trait in traits:
                    trait_counts[trait] = trait_counts.get(trait, 0) + 1
        
        total_answers = len(answers)
        
        # Calculate discipline (planning, systematic, structured)
        discipline_traits = ['discipline', 'systematic', 'structured', 'analytical', 'organized']
        discipline_score = sum(trait_counts.get(t, 0) for t in discipline_traits) / total_answers
        
        # Calculate impulse (spontaneous, reactive, emotional)
        impulse_traits = ['impulse', 'reactive', 'emotional', 'spontaneous', 'impulse']
        impulse_score = sum(trait_counts.get(t, 0) for t in impulse_traits) / total_answers
        
        # Calculate confidence (confident, resilient, prepared)
        confidence_traits = ['confident', 'resilient', 'prepared', 'advanced', 'open']
        confidence_score = sum(trait_counts.get(t, 0) for t in confidence_traits) / total_answers
        
        # Calculate tempo based on traits
        fast_traits = ['confident', 'quick_wins', 'risk_tolerant', 'advanced']
        steady_traits = ['moderate', 'balanced', 'pragmatic', 'systematic']
        slow_traits = ['cautious', 'needs_support', 'learning', 'foundation_building']
        
        fast_score = sum(trait_counts.get(t, 0) for t in fast_traits)
        steady_score = sum(trait_counts.get(t, 0) for t in steady_traits)
        slow_score = sum(trait_counts.get(t, 0) for t in slow_traits)
        
        tempo_scores = {"fast": fast_score, "steady": steady_score, "slow": slow_score}
        tempo = max(tempo_scores, key=tempo_scores.get)
        
        # Apply age/experience modifiers with base adjustments
        if age and age < 18:
            # Youth: slightly lower confidence, prefer slower tempo
            confidence_score = confidence_score * 0.9 - 0.05  # Reduce confidence for youth
            if tempo == "fast":
                tempo = "steady"
        
        if financial_experience == "beginner":
            # Beginners: lower confidence and discipline
            confidence_score = confidence_score * 0.8 - 0.1
            discipline_score = discipline_score * 0.9
        elif financial_experience == "advanced":
            # Advanced: boost confidence and discipline
            confidence_score = confidence_score * 1.2 + 0.1
            discipline_score = discipline_score * 1.1
        
        # Normalize to 0.0-1.0
        discipline = min(1.0, max(0.0, discipline_score))
        impulse = min(1.0, max(0.0, impulse_score))
        confidence = min(1.0, max(0.0, confidence_score))
        
        # Determine archetype with more nuance
        profile = self._determine_archetype_enhanced(
            discipline, impulse, confidence, tempo, trait_counts
        )
        
        return {
            "profile": profile,
            "weights": {
                "discipline": round(discipline, 2),
                "impulse": round(impulse, 2),
                "confidence": round(confidence, 2),
                "tempo": tempo
            },
            "dominant_traits": sorted(trait_counts.items(), key=lambda x: x[1], reverse=True)[:5]
        }
    
    def _determine_archetype_enhanced(self, discipline: float, impulse: float, 
                                     confidence: float, tempo: str, 
                                     trait_counts: Dict[str, int]) -> str:
        """
        Enhanced archetype determination with more profiles and nuance
        """
        # Check for specific patterns first
        if trait_counts.get('needs_support', 0) >= 3:
            return "Guided Learner"
        
        if trait_counts.get('goal_oriented', 0) >= 2 and discipline > 0.25:
            return "Strategic Planner"
        
        if trait_counts.get('analytical', 0) >= 2 and discipline > 0.3:
            return "Analytical Planner"
        
        # Standard archetypes with adjusted thresholds for better differentiation
        if discipline > 0.4 and impulse < 0.2:
            return "Disciplined Planner"
        elif impulse > 0.3 and discipline < 0.2:
            return "Spontaneous Explorer"
        elif confidence > 0.3:
            return "Confident Builder"
        elif confidence < 0.15:
            return "Cautious Learner"
        elif discipline > 0.25 and confidence > 0.2:
            return "Steady Achiever"
        elif impulse > 0.2 and confidence > 0.2:
            return "Dynamic Adventurer"
        else:
            return "Balanced Builder"
    
    def _generate_lpi_plan_enhanced(self, dna: Dict[str, Any], 
                                   age: int = None, 
                                   financial_experience: str = None) -> Dict[str, Any]:
        """
        Enhanced LPI plan generation with more personalized chapter orders
        """
        profile = dna['profile']
        tempo = dna['weights']['tempo']
        discipline = dna['weights']['discipline']
        confidence = dna['weights']['confidence']
        
        # Expanded chapter orders for more profiles
        chapter_orders = {
            "Disciplined Planner": [1, 2, 8, 4, 3, 7, 9, 6, 5, 10],
            "Analytical Planner": [1, 2, 4, 5, 3, 8, 6, 7, 9, 10],
            "Strategic Planner": [1, 8, 2, 4, 6, 3, 5, 7, 9, 10],
            "Spontaneous Explorer": [1, 8, 7, 2, 3, 6, 4, 9, 5, 10],
            "Dynamic Adventurer": [1, 8, 6, 3, 2, 5, 7, 4, 9, 10],
            "Confident Builder": [1, 2, 3, 5, 6, 4, 8, 7, 9, 10],
            "Cautious Learner": [1, 2, 8, 3, 7, 9, 4, 6, 5, 10],
            "Guided Learner": [1, 2, 8, 7, 3, 4, 9, 6, 5, 10],
            "Steady Achiever": [1, 2, 3, 8, 4, 7, 6, 9, 5, 10],
            "Balanced Builder": [1, 2, 3, 4, 8, 7, 6, 9, 5, 10]
        }
        
        # Get base order
        chapter_order = chapter_orders.get(profile, chapter_orders["Balanced Builder"])
        
        # Apply age-based modifications
        if age and age < 14:
            # Youth: Start with mindset and goals earlier
            if 7 in chapter_order and chapter_order.index(7) > 4:
                chapter_order.remove(7)
                chapter_order.insert(3, 7)
        
        # Apply experience-based modifications
        if financial_experience == "beginner":
            # Beginners: Delay investing chapter
            if 5 in chapter_order and chapter_order.index(5) < 7:
                chapter_order.remove(5)
                chapter_order.insert(7, 5)
        elif financial_experience == "advanced":
            # Advanced: Prioritize investing and income
            if 5 in chapter_order and chapter_order.index(5) > 4:
                chapter_order.remove(5)
                chapter_order.insert(3, 5)
            if 6 in chapter_order and chapter_order.index(6) > 4:
                chapter_order.remove(6)
                chapter_order.insert(4, 6)
        
        # Build chapter plan
        chapters = []
        for ch_num in chapter_order:
            chapters.append({
                "ch": ch_num,
                "lessons": [1, 2, 3, 4],
                "quiz_mode": "choice_abcd"
            })
        
        return {
            "version": "POC-v1.1.1",
            "chapters": chapters,
            "tempo": tempo,
            "profile": profile
        }


# Singleton instance
_ae_v2_enhanced_instance = None

def get_adaptive_engine_v2_enhanced():
    """Get or create singleton AE V2 Enhanced instance"""
    global _ae_v2_enhanced_instance
    if _ae_v2_enhanced_instance is None:
        _ae_v2_enhanced_instance = AdaptiveEngineV2Enhanced()
    return _ae_v2_enhanced_instance
