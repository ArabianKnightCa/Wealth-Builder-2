"""
Dynamic Content Transformation Engine
Transforms baseline content at runtime based on user profile (Age, Experience, PPI, Goals)

Architecture: Takes static baseline text from content_data.py and algorithmically transforms it
based on the 4 pillars of personalization.
"""

import re
from typing import Dict, List, Any
from config import MINIMUM_USER_AGE, CHILD_AGE_MAX, TEEN_AGE_MAX


class ContentTransformer:
    """
    Transforms baseline financial education content dynamically based on user profile
    
    Personalization Factors:
    1. Age - Adjusts complexity, vocabulary, and sentence structure
    2. Experience - Modifies depth of explanation and technical terminology
    3. PPI Profile - Adapts tone, examples, and motivational framing
    4. Goals - Emphasizes relevant connections to user's financial objectives
    """
    
    def __init__(self):
        # Readability complexity factors by age band
        self.age_complexity = {
            'child': {'reading_level': 0.3, 'sentence_length': 'short', 'vocab': 'simple'},
            'teen': {'reading_level': 0.6, 'sentence_length': 'medium', 'vocab': 'moderate'},
            'adult': {'reading_level': 1.0, 'sentence_length': 'full', 'vocab': 'advanced'}
        }
        
        # Experience-based depth adjustment
        self.experience_depth = {
            'beginner': {'detail_level': 0.5, 'examples': 'basic', 'terminology': 'simplified'},
            'intermediate': {'detail_level': 0.75, 'examples': 'practical', 'terminology': 'standard'},
            'advanced': {'detail_level': 1.0, 'examples': 'nuanced', 'terminology': 'technical'}
        }
        
        # Personality profile adaptations (Financial DNA archetypes)
        self.personality_adaptations = {
            'Planner': {
                'tone': 'structured',
                'emphasis': 'steps and systems',
                'motivators': ['control', 'preparation', 'security']
            },
            'Spontaneous': {
                'tone': 'flexible',
                'emphasis': 'possibilities and freedom',
                'motivators': ['opportunity', 'growth', 'experiences']
            },
            'Cautious': {
                'tone': 'reassuring',
                'emphasis': 'safety and stability',
                'motivators': ['security', 'protection', 'predictability']
            },
            'Builder': {
                'tone': 'achievement-focused',
                'emphasis': 'progress and milestones',
                'motivators': ['growth', 'achievement', 'legacy']
            },
            'Balanced': {
                'tone': 'practical',
                'emphasis': 'pragmatic approach',
                'motivators': ['balance', 'flexibility', 'progress']
            }
        }
        
        # Financial jargon simplification rules
        self.jargon_simplification = {
            'shared agreement': {
                'child': 'something everyone agrees on',
                'teen': 'something we all accept',
                'adult': 'shared agreement'
            },
            'bartered': {
                'child': 'traded things',
                'teen': 'traded goods',
                'adult': 'bartered'
            },
            'medium of exchange': {
                'child': 'way to trade',
                'teen': 'tool for trading',
                'adult': 'medium of exchange'
            },
            'compound interest': {
                'child': 'money that grows itself',
                'teen': 'earning interest on your interest',
                'adult': 'compound interest'
            },
            'liquidity': {
                'child': 'how easily you can use your money',
                'teen': 'how quickly you can turn assets into cash',
                'adult': 'liquidity'
            },
            'diversification': {
                'child': 'not putting all your eggs in one basket',
                'teen': 'spreading your money across different things',
                'adult': 'diversification'
            },
            'asset allocation': {
                'child': 'deciding where to put your money',
                'teen': 'choosing how to split your investments',
                'adult': 'asset allocation'
            },
            'inflation': {
                'child': 'when things cost more money over time',
                'teen': 'when prices go up',
                'adult': 'inflation'
            },
            'investment': {
                'child': 'putting money somewhere to grow it',
                'teen': 'money you use to make more money',
                'adult': 'investment'
            },
            'budget': {
                'child': 'a plan for your money',
                'teen': 'tracking how you spend your money',
                'adult': 'budget'
            },
            'interest': {
                'child': 'extra money you get or pay',
                'teen': 'money earned or paid on borrowed money',
                'adult': 'interest'
            },
            'credit': {
                'child': 'borrowing money you pay back later',
                'teen': 'borrowed money with a promise to repay',
                'adult': 'credit'
            },
            'debt': {
                'child': 'money you owe someone',
                'teen': 'money borrowed that must be repaid',
                'adult': 'debt'
            }
        }
    
    def transform_lesson(self, baseline_text: str, user_profile: Dict[str, Any]) -> str:
        """
        Main transformation function - converts baseline content to personalized version
        
        Args:
            baseline_text: Original lesson text from content_data.py
            user_profile: {
                'age': int,
                'financial_experience': str,
                'dna_profile': str,
                'dna_weights': dict,
                'goals': list
            }
        
        Returns:
            Transformed text optimized for the specific user
        """
        # Extract profile components
        age = user_profile.get('age', 18)
        experience = user_profile.get('financial_experience', 'beginner')
        dna_profile = user_profile.get('dna_profile', 'Balanced')
        goals = user_profile.get('goals', [])
        
        # Determine age band
        age_band = self._get_age_band(age)
        
        # Step 1: Adjust complexity based on age
        text = self._adjust_for_age(baseline_text, age_band)
        
        # Step 2: Modify depth based on experience
        text = self._adjust_for_experience(text, experience)
        
        # Step 3: Adapt tone and framing for personality
        text = self._adapt_for_personality(text, dna_profile)
        
        # Step 4: Add goal-relevant connections (if applicable)
        text = self._add_goal_connections(text, goals, age_band)
        
        return text
    
    def _get_age_band(self, age: int) -> str:
        """Determine age band category"""
        if MINIMUM_USER_AGE <= age <= CHILD_AGE_MAX:
            return 'child'
        elif CHILD_AGE_MAX < age <= TEEN_AGE_MAX:
            return 'teen'
        else:
            return 'adult'
    
    def _adjust_for_age(self, text: str, age_band: str) -> str:
        """
        Transform text complexity based on age band
        - Simplifies vocabulary for younger users
        - Shortens sentences for children
        - Replaces financial jargon with age-appropriate terms
        """
        # For adults, return baseline as-is
        if age_band == 'adult':
            return text
        
        # Replace financial jargon with simpler terms
        for jargon, replacements in self.jargon_simplification.items():
            if jargon in text.lower():
                pattern = re.compile(re.escape(jargon), re.IGNORECASE)
                replacement = replacements.get(age_band, jargon)
                text = pattern.sub(replacement, text)
        
        # For children: simplify sentence structure
        if age_band == 'child':
            # Break long sentences (basic heuristic)
            sentences = text.split('. ')
            simplified_sentences = []
            
            for sentence in sentences:
                # If sentence is very long (>20 words), try to split at conjunctions
                words = sentence.split()
                if len(words) > 20:
                    # Find conjunction points (and, but, because)
                    for i, word in enumerate(words):
                        if word.lower() in ['and', 'but', 'because', 'so']:
                            # Split into two sentences
                            first_part = ' '.join(words[:i])
                            second_part = ' '.join(words[i+1:])
                            if first_part and second_part:
                                simplified_sentences.append(first_part + '.')
                                simplified_sentences.append(second_part.capitalize())
                                break
                    else:
                        simplified_sentences.append(sentence)
                else:
                    simplified_sentences.append(sentence)
            
            text = ' '.join(simplified_sentences)
        
        # For teens: moderate simplification
        elif age_band == 'teen':
            # Replace some complex words with simpler alternatives
            teen_replacements = {
                'utilize': 'use',
                'commence': 'start',
                'facilitate': 'help',
                'subsequently': 'then',
                'endeavor': 'try'
            }
            for complex_word, simple_word in teen_replacements.items():
                pattern = re.compile(r'\b' + complex_word + r'\b', re.IGNORECASE)
                text = pattern.sub(simple_word, text)
        
        return text
    
    def _adjust_for_experience(self, text: str, experience: str) -> str:
        """
        Modify depth and detail based on financial experience level
        - Beginners: Add more explanation, use analogies
        - Intermediate: Standard detail level
        - Advanced: Can include more technical depth
        """
        if experience == 'beginner':
            # Add explanatory phrases for beginners
            # Look for key financial concepts and add clarifying context
            
            # If talking about saving, add beginner context
            if 'saving' in text.lower() and 'set aside' not in text.lower():
                text = text.replace('Saving is', 'Saving (setting aside money for later) is')
                text = text.replace('saving is', 'saving (setting money aside) is')
            
            # If talking about interest, add clarification
            if 'interest' in text.lower() and 'money you earn' not in text.lower():
                text = text.replace('earn interest', 'earn interest (extra money paid to you)')
                text = text.replace('earns interest', 'earns interest (grows over time)')
            
            # Add encouraging beginner framing
            if text.startswith('The'):
                text = "Let's explore this together. " + text
        
        elif experience == 'advanced':
            # For advanced users, we can reference more sophisticated concepts
            # This is a placeholder for future enhancement
            pass
        
        return text
    
    def _adapt_for_personality(self, text: str, dna_profile: str) -> str:
        """
        Adapt motivational framing and tone based on Financial DNA profile
        - Planners: Emphasize structure, steps, control
        - Spontaneous: Emphasize flexibility, opportunities
        - Cautious: Emphasize safety, security
        - Builders: Emphasize progress, achievement
        """
        adaptation = self.personality_adaptations.get(dna_profile, self.personality_adaptations['Balanced'])
        
        # Add personality-specific motivational framing at key points
        # This is algorithmic transformation, not pre-written variants
        
        if 'Planner' in dna_profile:
            # Add structure-oriented framing
            if 'habit' in text.lower() or 'plan' in text.lower():
                text += " Having a clear system gives you confidence and control."
        
        elif 'Spontaneous' in dna_profile:
            # Add flexibility-oriented framing
            if 'goal' in text.lower() or 'save' in text.lower():
                text += " This keeps your options open for opportunities ahead."
        
        elif 'Cautious' in dna_profile:
            # Add safety-oriented framing
            if 'save' in text.lower() or 'protect' in text.lower():
                text += " This builds your safety net and peace of mind."
        
        elif 'Builder' in dna_profile:
            # Add achievement-oriented framing
            if 'goal' in text.lower() or 'grow' in text.lower():
                text += " Each step forward is progress toward your financial goals."
        
        return text
    
    def _add_goal_connections(self, text: str, goals: List[str], age_band: str) -> str:
        """
        Add goal-relevant context when appropriate
        Makes abstract lessons feel more personally relevant
        """
        if not goals:
            return text
        
        # Define goal-to-concept mappings
        goal_connections = {
            'save_for_purchase': 'saving',
            'learn_money_basics': 'money',
            'build_wealth': 'grow',
            'pay_off_debt': 'debt',
            'buy_home': 'save',
            'retirement': 'future',
            'start_business': 'earn'
        }
        
        # Check if lesson content relates to user's goals
        for goal in goals:
            if goal in goal_connections:
                concept = goal_connections[goal]
                if concept in text.lower():
                    # Add a brief personalized connection
                    goal_names = {
                        'save_for_purchase': 'saving for something you want',
                        'build_wealth': 'building long-term wealth',
                        'pay_off_debt': 'becoming debt-free',
                        'buy_home': 'buying a home',
                        'retirement': 'planning for retirement'
                    }
                    goal_name = goal_names.get(goal, 'your financial goals')
                    
                    # Add at the end as a connection point
                    text += f" This directly helps with {goal_name}."
                    break  # Only add one goal connection per lesson
        
        return text
    
    def transform_ppi_question(self, question_text: str, age: int, experience: str) -> str:
        """
        Transform a PPI question to be age and experience appropriate
        
        Args:
            question_text: The baseline PPI question text
            age: User's age
            experience: User's financial experience level ('beginner', 'intermediate', 'advanced')
        
        Returns:
            Transformed question text
        """
        age_band = self._get_age_band(age)
        
        # Apply age-based adjustments
        transformed = self._adjust_for_age(question_text, age_band)
        
        # Apply experience-based adjustments
        transformed = self._adjust_for_experience(transformed, experience)
        
        return transformed
    
    def transform_chapter(self, chapter_data: Dict, user_profile: Dict[str, Any]) -> Dict:
        """
        Transform an entire chapter's lessons
        
        Args:
            chapter_data: Chapter dict from content_data.LPI_CHAPTERS
            user_profile: User profile dict
        
        Returns:
            Transformed chapter with personalized lesson text
        """
        transformed_chapter = chapter_data.copy()
        transformed_lessons = []
        
        for lesson in chapter_data.get('lessons', []):
            transformed_lesson = lesson.copy()
            # Transform the main lesson text
            transformed_lesson['text'] = self.transform_lesson(
                lesson['text'],
                user_profile
            )
            # Transform the takeaway
            if 'takeaway' in lesson:
                transformed_lesson['takeaway'] = self.transform_lesson(
                    lesson['takeaway'],
                    user_profile
                )
            transformed_lessons.append(transformed_lesson)
        
        transformed_chapter['lessons'] = transformed_lessons
        return transformed_chapter


# Singleton instance
_transformer = None

def get_content_transformer() -> ContentTransformer:
    """Get or create the content transformer singleton"""
    global _transformer
    if _transformer is None:
        _transformer = ContentTransformer()
    return _transformer
