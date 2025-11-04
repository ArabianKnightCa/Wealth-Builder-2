"""
Adaptive Engine v2.0 - Wealth Builder POC
Implements Contract v1.1-stable

Functions:
- AE_FN_COMPOSE_PPI: Dynamically select 20 PPI questions from bank
- AE_FN_GENERATE_PLAN: Generate Financial DNA + personalized LPI plan
"""

import json
import random
from typing import Dict, List, Any, Tuple
from datetime import datetime
from pathlib import Path


class AdaptiveEngineV2:
    """
    Wealth Builder Adaptive Engine V2
    Implements stable contract v1.1.1
    """
    
    def __init__(self):
        self.contracts = self._load_json('ae_contracts_stable_v1_1.json')
        self.rules = self._load_json('ae_rules_poc_v1_1.json')
        # Use baseline bank with 20 standard questions
        self.ppi_bank = self._load_json('ppi_bank_baseline_v1_1.json')
        self.lpi_index = self._load_json('lpi_lessons_index.json')
    
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
        age_constraints = self.rules['constraints']['age_bands'].get(age_band, {})
        
        # Get experience constraints
        exp_constraints = self.rules['constraints']['experience'].get(financial_experience, {})
        
        # Filter items from bank
        eligible_items = []
        for item in self.ppi_bank['items']:
            # Check age range
            if not (item['age_min'] <= age <= item['age_max']):
                continue
            
            # Check experience level
            if financial_experience not in item['experience_levels']:
                continue
            
            # Check age band exclusions
            exclude_tags = age_constraints.get('exclude_tags', [])
            if any(tag in item['tags'] for tag in exclude_tags):
                continue
            
            # Check experience exclusions
            exp_exclude = exp_constraints.get('exclude_tags', [])
            if any(tag in item['tags'] for tag in exp_exclude):
                continue
            
            # Check experience inclusions (if specified)
            exp_include = exp_constraints.get('include_tags', [])
            if exp_include:
                if not any(tag in item['tags'] for tag in exp_include):
                    continue
            
            eligible_items.append(item)
        
        # Organize by buckets
        bucket_weights = self.rules['selection']['bucket_weights']
        buckets = {
            'base': [],
            'motivation': [],
            'habits': [],
            'risk_confidence': []
        }
        
        for item in eligible_items:
            tags = item['tags']
            if 'motivation' in tags:
                buckets['motivation'].append(item)
            elif 'habits' in tags:
                buckets['habits'].append(item)
            elif any(t in tags for t in ['risk_tolerance', 'confidence']):
                buckets['risk_confidence'].append(item)
            else:
                buckets['base'].append(item)
        
        # Select items according to bucket weights
        selected_items = []
        
        # Select from each bucket
        for bucket_name, target_count in bucket_weights.items():
            available = buckets[bucket_name]
            if len(available) >= target_count:
                selected = random.sample(available, target_count)
            else:
                # Take all available and note the shortage
                selected = available.copy()
            selected_items.extend(selected)
        
        # If we don't have 20, fill from all eligible
        total_needed = self.rules['selection']['total_items']
        if len(selected_items) < total_needed:
            remaining_items = [item for item in eligible_items if item not in selected_items]
            shortage = total_needed - len(selected_items)
            if remaining_items:
                additional = random.sample(remaining_items, min(shortage, len(remaining_items)))
                selected_items.extend(additional)
        
        # Shuffle for presentation
        random.shuffle(selected_items)
        
        # Take exactly 20 (or all if less)
        final_items = selected_items[:total_needed]
        
        # Format output according to contract
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
            "ppi_version": "POC-v1.1.1",
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
    
    def generate_plan(self, user_id: str, answers: List[Dict[str, str]]) -> Dict[str, Any]:
        """
        AE_FN_GENERATE_PLAN
        
        Generate Financial DNA profile and personalized LPI plan based on PPI responses
        
        Args:
            user_id: User identifier
            answers: List of {"id": "PPI_Q01", "value": "A"}
        
        Returns:
            {
                "dna": {
                    "profile": "Planner",
                    "weights": {
                        "discipline": 0.7,
                        "impulse": 0.3,
                        "confidence": 0.6,
                        "tempo": "steady"
                    }
                },
                "lpi_plan": {
                    "version": "POC-v1.1.1",
                    "chapters": [...]
                }
            }
        """
        # Convert answers to dict for easier lookup
        answer_map = {ans['id']: ans['value'] for ans in answers}
        
        # Calculate Financial DNA weights
        dna = self._calculate_financial_dna(answer_map)
        
        # Generate LPI plan based on DNA
        lpi_plan = self._generate_lpi_plan(dna)
        
        return {
            "dna": dna,
            "lpi_plan": lpi_plan,
            "user_id": user_id,
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
    
    def _generate_lpi_plan(self, dna: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate personalized LPI plan based on Financial DNA
        
        Returns chapter order and configuration
        """
        profile = dna['profile']
        tempo = dna['weights']['tempo']
        
        # Define chapter orders for different profiles
        chapter_orders = {
            "Planner": [1, 2, 4, 3, 8, 7, 9, 6, 5, 10],
            "Spontaneous": [1, 8, 2, 3, 7, 4, 6, 9, 5, 10],
            "Confident Explorer": [1, 2, 3, 5, 4, 6, 8, 7, 9, 10],
            "Cautious Learner": [1, 2, 8, 3, 7, 9, 4, 6, 5, 10],
            "Balanced Builder": [1, 2, 3, 4, 8, 7, 9, 6, 5, 10]
        }
        
        # Get chapter order for profile
        chapter_order = chapter_orders.get(profile, chapter_orders["Balanced Builder"])
        
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
            "profile": profile
        }


# Singleton instance
_ae_v2_instance = None

def get_adaptive_engine_v2() -> AdaptiveEngineV2:
    """Get or create singleton AE V2 instance"""
    global _ae_v2_instance
    if _ae_v2_instance is None:
        _ae_v2_instance = AdaptiveEngineV2()
    return _ae_v2_instance
