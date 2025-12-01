"""
Adaptive Engine (AE) - Mizo Wealth Builder POC v1.0
MRI Adaptive Map v1.3 Implementation

Purpose: Analyzes PPI responses and generates personalized LPI learning pathways
Independent, portable, no external dependencies
"""

import json
from typing import Dict, List, Any
from datetime import datetime


class AdaptiveEngine:
    """
    Wealth Builder Adaptive Engine
    Processes PPI responses and generates dynamic learning maps
    """
    
    def __init__(self):
        self.mri_map = self._load_mri_adaptive_map()
    
    def _load_mri_adaptive_map(self) -> Dict:
        """
        MRI Adaptive Map v1.3 - Behavioral Templates
        Maps PPI responses to learning profiles
        """
        return {
            "version": "1.3",
            "behavioral_templates": {
                "planner_saver": {
                    "indicators": ["Q01:A", "Q02:A", "Q06:A", "Q09:A", "Q19:A"],
                    "learning_style": "structured",
                    "difficulty_preference": "progressive",
                    "pacing": "steady"
                },
                "practical_balanced": {
                    "indicators": ["Q01:D", "Q02:C", "Q07:B", "Q14:A", "Q19:B"],
                    "learning_style": "hands_on",
                    "difficulty_preference": "moderate",
                    "pacing": "moderate"
                },
                "spontaneous_spender": {
                    "indicators": ["Q02:B", "Q06:B", "Q11:C", "Q14:D", "Q19:C"],
                    "learning_style": "quick_wins",
                    "difficulty_preference": "easy_start",
                    "pacing": "fast"
                },
                "exploring_learner": {
                    "indicators": ["Q01:C", "Q04:A", "Q07:A", "Q12:C", "Q19:D"],
                    "learning_style": "comprehensive",
                    "difficulty_preference": "deep_dive",
                    "pacing": "slow"
                },
                "goal_oriented": {
                    "indicators": ["Q05:A", "Q05:C", "Q09:A", "Q13:A", "Q18:A"],
                    "learning_style": "outcome_focused",
                    "difficulty_preference": "challenging",
                    "pacing": "fast"
                },
                "anxiety_driven": {
                    "indicators": ["Q03:B", "Q08:D", "Q10:B", "Q10:C", "Q17:B"],
                    "learning_style": "supportive",
                    "difficulty_preference": "gentle",
                    "pacing": "slow"
                }
            },
            "chapter_difficulty_base": {
                "CH01": 1,  # Money Basics
                "CH02": 2,  # Budgeting
                "CH03": 2,  # Saving & Spending
                "CH04": 3,  # Credit
                "CH05": 4,  # Investing
                "CH06": 3,  # Income
                "CH07": 3,  # Mindset
                "CH08": 2,  # Goals
                "CH09": 3,  # Risk & Protection
                "CH10": 4   # Safety & Scams
            },
            "learning_paths": {
                "structured": ["CH01", "CH02", "CH03", "CH04", "CH08", "CH07", "CH09", "CH06", "CH05", "CH10"],
                "hands_on": ["CH01", "CH02", "CH08", "CH03", "CH06", "CH04", "CH07", "CH09", "CH05", "CH10"],
                "quick_wins": ["CH01", "CH08", "CH02", "CH03", "CH07", "CH04", "CH06", "CH09", "CH05", "CH10"],
                "comprehensive": ["CH01", "CH02", "CH03", "CH04", "CH05", "CH06", "CH07", "CH08", "CH09", "CH10"],
                "outcome_focused": ["CH01", "CH08", "CH06", "CH02", "CH03", "CH05", "CH04", "CH07", "CH09", "CH10"],
                "supportive": ["CH01", "CH02", "CH08", "CH03", "CH07", "CH09", "CH04", "CH06", "CH05", "CH10"]
            }
        }
    
    def process_ppi(self, ppi_responses: Dict[str, str]) -> Dict[str, Any]:
        """
        Main AE Processing Function
        
        Input: PPI_Q01 through PPI_Q20 responses
        Output: Dynamic learning map with lesson order, difficulty, pacing
        
        Args:
            ppi_responses: Dict with keys like "PPI_Q01", "PPI_Q02", etc.
                          and values like "A", "B", "C", "D"
        
        Returns:
            {
                "user_profile": "planner_saver",
                "learning_style": "structured",
                "lesson_order": ["CH01", "CH02", ...],
                "difficulty_weights": {"CH01": 1, "CH02": 2, ...},
                "pacing": "steady",
                "reinforcement_rate": 0.7,
                "generated_at": "2025-01-01T00:00:00Z"
            }
        """
        # Step 1: Analyze PPI responses
        profile = self._identify_behavioral_profile(ppi_responses)
        
        # Step 2: Generate lesson order based on profile
        lesson_order = self._generate_lesson_order(profile)
        
        # Step 3: Calculate difficulty weights
        difficulty_weights = self._calculate_difficulty_weights(profile, ppi_responses)
        
        # Step 4: Determine pacing
        pacing_config = self._determine_pacing(profile, ppi_responses)
        
        # Step 5: Generate dynamic learning map
        learning_map = {
            "user_profile": profile["profile_type"],
            "learning_style": profile["learning_style"],
            "lesson_order": lesson_order,
            "difficulty_weights": difficulty_weights,
            "pacing": pacing_config["pacing"],
            "reinforcement_rate": pacing_config["reinforcement_rate"],
            "confidence_score": profile["confidence_score"],
            "generated_at": datetime.utcnow().isoformat() + "Z",
            "mri_version": "1.3"
        }
        
        return learning_map
    
    def _identify_behavioral_profile(self, ppi_responses: Dict[str, str]) -> Dict[str, Any]:
        """
        Map PPI responses to behavioral template using MRI Adaptive Map v1.3
        """
        templates = self.mri_map["behavioral_templates"]
        profile_scores = {}
        
        # Score each behavioral template
        for profile_name, template in templates.items():
            score = 0
            indicators = template["indicators"]
            
            for indicator in indicators:
                # Format: "Q01:A" means Question 1, Answer A
                q_num, expected_answer = indicator.split(":")
                ppi_key = f"PPI_{q_num}"
                
                if ppi_key in ppi_responses:
                    actual_answer = ppi_responses[ppi_key]
                    if actual_answer == expected_answer:
                        score += 1
            
            # Calculate confidence percentage
            confidence = (score / len(indicators)) * 100 if indicators else 0
            profile_scores[profile_name] = {
                "score": score,
                "confidence": confidence,
                "learning_style": template["learning_style"],
                "difficulty_preference": template["difficulty_preference"],
                "pacing": template["pacing"]
            }
        
        # Select best matching profile
        best_profile = max(profile_scores.items(), key=lambda x: x[1]["score"])
        profile_name = best_profile[0]
        profile_data = best_profile[1]
        
        return {
            "profile_type": profile_name,
            "learning_style": profile_data["learning_style"],
            "difficulty_preference": profile_data["difficulty_preference"],
            "pacing": profile_data["pacing"],
            "confidence_score": profile_data["confidence"],
            "all_scores": profile_scores
        }
    
    def _generate_lesson_order(self, profile: Dict[str, Any]) -> List[str]:
        """
        Generate personalized lesson order based on learning style
        """
        learning_style = profile["learning_style"]
        learning_paths = self.mri_map["learning_paths"]
        
        # Get base path for learning style
        if learning_style in learning_paths:
            return learning_paths[learning_style].copy()
        else:
            # Default to comprehensive path
            return learning_paths["comprehensive"].copy()
    
    def _calculate_difficulty_weights(self, profile: Dict[str, Any], 
                                      ppi_responses: Dict[str, str]) -> Dict[str, int]:
        """
        Calculate difficulty weights for each chapter based on:
        - Base difficulty
        - User's difficulty preference
        - Experience level (from PPI Q04 if available)
        """
        base_difficulty = self.mri_map["chapter_difficulty_base"]
        difficulty_pref = profile["difficulty_preference"]
        
        # Adjust based on preference
        adjustments = {
            "easy_start": -1,
            "gentle": -1,
            "moderate": 0,
            "progressive": 0,
            "challenging": +1,
            "deep_dive": +1
        }
        
        adjustment = adjustments.get(difficulty_pref, 0)
        
        # Apply adjustment
        difficulty_weights = {}
        for chapter, base_diff in base_difficulty.items():
            adjusted_diff = max(1, min(5, base_diff + adjustment))
            difficulty_weights[chapter] = adjusted_diff
        
        return difficulty_weights
    
    def _determine_pacing(self, profile: Dict[str, Any], 
                         ppi_responses: Dict[str, str]) -> Dict[str, Any]:
        """
        Determine pacing and reinforcement rate
        
        Reinforcement rate: 0.0 to 1.0
        - Lower = more repetition/review
        - Higher = faster progression
        """
        pacing = profile["pacing"]
        
        pacing_config = {
            "fast": {"pacing": "fast", "reinforcement_rate": 0.8},
            "moderate": {"pacing": "moderate", "reinforcement_rate": 0.6},
            "steady": {"pacing": "steady", "reinforcement_rate": 0.5},
            "slow": {"pacing": "slow", "reinforcement_rate": 0.4}
        }
        
        return pacing_config.get(pacing, pacing_config["moderate"])
    
    def recalibrate(self, current_map: Dict[str, Any], 
                   performance_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Recalibrate learning map based on performance
        Called after each lesson/quiz completion
        
        Args:
            current_map: Current learning map
            performance_data: {
                "chapter_id": "CH01",
                "quiz_score": 85,
                "completion_time_seconds": 300,
                "attention_score": 0.9
            }
        
        Returns:
            Updated learning map
        """
        updated_map = current_map.copy()
        
        # Analyze performance
        quiz_score = performance_data.get("quiz_score", 0)
        completion_time = performance_data.get("completion_time_seconds", 0)
        
        # Adjust difficulty based on performance
        if quiz_score >= 90:
            # User is excelling - can increase difficulty
            updated_map["reinforcement_rate"] = min(1.0, updated_map["reinforcement_rate"] + 0.1)
        elif quiz_score < 70:
            # User struggling - decrease difficulty, add support
            updated_map["reinforcement_rate"] = max(0.2, updated_map["reinforcement_rate"] - 0.1)
        
        # Adjust pacing based on completion time
        # (This is simplified - production would have more nuanced logic)
        
        updated_map["last_recalibration"] = datetime.utcnow().isoformat() + "Z"
        updated_map["recalibration_count"] = updated_map.get("recalibration_count", 0) + 1
        
        return updated_map


# Singleton instance
_ae_instance = None

def get_adaptive_engine() -> AdaptiveEngine:
    """Get or create singleton AE instance"""
    global _ae_instance
    if _ae_instance is None:
        _ae_instance = AdaptiveEngine()
    return _ae_instance
