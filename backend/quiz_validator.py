"""
Quiz Answer Validation & Auto-Correction System
Combines Option 1 (single source of truth) with Option 3 (validation layer)

Purpose:
- Primary source: quiz questions with embedded "correct" answers
- Answer key: validation checkpoint and backup reference
- On startup: validates and optionally auto-corrects mismatches
- Runtime: always uses quiz.correct (never answer key)
"""

import logging
from typing import Dict, List, Tuple
from datetime import datetime

logger = logging.getLogger(__name__)


class QuizValidator:
    """
    Validates quiz answers and maintains data integrity
    Includes correctness validation (Feature 2)
    """
    
    def __init__(self, lpi_chapters: List[Dict], answer_key: Dict[str, str]):
        self.chapters = lpi_chapters
        self.answer_key = answer_key
        self.validation_report = {
            "timestamp": datetime.utcnow().isoformat(),
            "total_questions": 0,
            "validated": 0,
            "mismatches": [],
            "missing_in_key": [],
            "missing_in_quiz": [],
            "warnings": [],
            "correctness_issues": []  # Feature 2: Correctness validation
        }
    
    def validate_all(self, auto_correct: bool = False, check_correctness: bool = True) -> Dict:
        """
        Validates all quiz answers against answer key
        
        Args:
            auto_correct: If True, updates answer_key to match quiz.correct
            check_correctness: If True, runs Feature 2 correctness validation
        
        Returns:
            Validation report with all findings
        """
        logger.info("🔍 Starting quiz validation...")
        
        # Build quiz answer map from chapters
        quiz_answers = self._extract_quiz_answers()
        
        # Compare with answer key
        self._compare_answers(quiz_answers, auto_correct)
        
        # Check for missing entries
        self._check_missing_entries(quiz_answers)
        
        # Feature 2: Correctness Validation
        if check_correctness:
            logger.info("🔍 Running correctness validation (Feature 2)...")
            self._validate_correctness()
        
        # Generate summary
        self._generate_summary()
        
        return self.validation_report
    
    def _extract_quiz_answers(self) -> Dict[str, str]:
        """Extract all correct answers from quiz questions"""
        quiz_answers = {}
        
        for chapter in self.chapters:
            chapter_id = chapter.get('id')
            quiz = chapter.get('quiz', [])
            
            for question in quiz:
                q_id = question.get('id')
                correct = question.get('correct')
                
                if not q_id:
                    self.validation_report['warnings'].append(
                        f"⚠️ Question in {chapter_id} missing 'id' field"
                    )
                    continue
                
                if not correct:
                    self.validation_report['warnings'].append(
                        f"⚠️ {q_id}: Missing 'correct' field in quiz"
                    )
                    continue
                
                quiz_answers[q_id] = correct
                self.validation_report['total_questions'] += 1
        
        return quiz_answers
    
    def _compare_answers(self, quiz_answers: Dict[str, str], auto_correct: bool):
        """Compare quiz answers with answer key"""
        
        for q_id, quiz_answer in quiz_answers.items():
            key_answer = self.answer_key.get(q_id)
            
            if key_answer is None:
                # Question exists in quiz but not in answer key
                self.validation_report['missing_in_key'].append({
                    "question_id": q_id,
                    "quiz_answer": quiz_answer,
                    "action": "auto_added" if auto_correct else "needs_review"
                })
                
                if auto_correct:
                    self.answer_key[q_id] = quiz_answer
                    logger.info(f"✅ Auto-added {q_id}={quiz_answer} to answer key")
                
                continue
            
            if quiz_answer != key_answer:
                # MISMATCH DETECTED
                mismatch = {
                    "question_id": q_id,
                    "quiz_correct": quiz_answer,
                    "key_answer": key_answer,
                    "severity": "HIGH",
                    "action": "auto_corrected" if auto_correct else "needs_manual_review"
                }
                
                self.validation_report['mismatches'].append(mismatch)
                
                if auto_correct:
                    # Trust quiz, update key
                    self.answer_key[q_id] = quiz_answer
                    logger.warning(
                        f"🔧 Auto-corrected {q_id}: key {key_answer} → {quiz_answer}"
                    )
                else:
                    logger.error(
                        f"❌ MISMATCH {q_id}: quiz={quiz_answer}, key={key_answer}"
                    )
            else:
                # Match - all good
                self.validation_report['validated'] += 1
    
    def _check_missing_entries(self, quiz_answers: Dict[str, str]):
        """Check for answer key entries that don't exist in quizzes"""
        
        for q_id, key_answer in self.answer_key.items():
            if q_id not in quiz_answers:
                self.validation_report['missing_in_quiz'].append({
                    "question_id": q_id,
                    "key_answer": key_answer,
                    "warning": "Answer key entry has no corresponding quiz question"
                })
    
    def _validate_correctness(self):
        """
        Feature 2: Correctness Validation
        Validates logical correctness of quiz questions
        """
        for chapter in self.chapters:
            chapter_id = chapter.get('id')
            quiz = chapter.get('quiz', [])
            
            for question in quiz:
                q_id = question.get('id')
                correct = question.get('correct')
                text = question.get('text', '')
                options = question.get('options', {})
                rationale = question.get('rationale', '')
                
                # Skip if missing critical data
                if not q_id or not correct or not options:
                    continue
                
                issues = []
                
                # Check 1: Correct answer exists in options
                if correct not in options:
                    issues.append({
                        "type": "CRITICAL",
                        "check": "correct_option_exists",
                        "message": f"Correct answer '{correct}' not found in options: {list(options.keys())}",
                        "requires_human_review": True
                    })
                
                # Check 2: All options (A, B, C, D) present
                expected_options = ['A', 'B', 'C', 'D']
                missing_options = [opt for opt in expected_options if opt not in options]
                if missing_options:
                    issues.append({
                        "type": "WARNING",
                        "check": "complete_options",
                        "message": f"Missing options: {missing_options}",
                        "requires_human_review": False
                    })
                
                # Check 3: No empty or suspiciously short options
                for opt_key, opt_value in options.items():
                    if not opt_value or len(opt_value.strip()) < 2:
                        issues.append({
                            "type": "WARNING",
                            "check": "empty_option",
                            "message": f"Option {opt_key} is empty or too short: '{opt_value}'",
                            "requires_human_review": True
                        })
                
                # Check 4: Duplicate options (semantic similarity)
                option_values = [v.strip().lower() for v in options.values()]
                if len(option_values) != len(set(option_values)):
                    duplicates = [v for v in option_values if option_values.count(v) > 1]
                    issues.append({
                        "type": "WARNING",
                        "check": "duplicate_options",
                        "message": f"Duplicate or very similar options detected: {set(duplicates)}",
                        "requires_human_review": True
                    })
                
                # Check 5: Question text has content
                if not text or len(text.strip()) < 10:
                    issues.append({
                        "type": "CRITICAL",
                        "check": "question_text",
                        "message": "Question text is missing or too short",
                        "requires_human_review": True
                    })
                
                # Check 6: Rationale exists for incorrect answers
                if not rationale or len(rationale.strip()) < 10:
                    issues.append({
                        "type": "INFO",
                        "check": "rationale_missing",
                        "message": "No rationale provided for incorrect answers",
                        "requires_human_review": False
                    })
                
                # Check 7: Logic-based patterns (basic)
                # Check if question contains "NOT" or "EXCEPT" but answer seems positive
                if any(word in text.upper() for word in ['NOT', 'EXCEPT', 'NEVER', 'NONE']):
                    issues.append({
                        "type": "INFO",
                        "check": "negative_question",
                        "message": "Question contains negation (NOT/EXCEPT) - verify correct answer logic",
                        "requires_human_review": True
                    })
                
                # Check 8: Math question validation
                if any(symbol in text for symbol in ['+', '-', '×', '÷', '=', '%', '$']):
                    issues.append({
                        "type": "INFO",
                        "check": "math_question",
                        "message": "Question appears to contain math - verify numerical correctness",
                        "requires_human_review": True
                    })
                
                # Record issues if any found
                if issues:
                    self.validation_report['correctness_issues'].append({
                        "question_id": q_id,
                        "chapter_id": chapter_id,
                        "issues": issues,
                        "question_text": text[:100] + "..." if len(text) > 100 else text
                    })
    
    def _generate_summary(self):
        """Generate human-readable summary"""
        report = self.validation_report
        total = report['total_questions']
        validated = report['validated']
        mismatches = len(report['mismatches'])
        missing_key = len(report['missing_in_key'])
        missing_quiz = len(report['missing_in_quiz'])
        correctness_issues = len(report['correctness_issues'])
        
        # Count critical correctness issues
        critical_issues = sum(
            1 for item in report['correctness_issues']
            for issue in item['issues']
            if issue['type'] == 'CRITICAL'
        )
        
        if mismatches == 0 and missing_key == 0 and missing_quiz == 0 and critical_issues == 0:
            logger.info(f"✅ VALIDATION PASSED: All {total} questions validated successfully")
            report['status'] = "PASS"
        else:
            logger.error(
                f"❌ VALIDATION FAILED: {mismatches} mismatches, "
                f"{missing_key} missing in key, {missing_quiz} orphaned in key, "
                f"{critical_issues} critical correctness issues"
            )
            report['status'] = "FAIL"
        
        report['summary'] = {
            "total_questions": total,
            "validated_ok": validated,
            "mismatches_found": mismatches,
            "missing_in_key": missing_key,
            "orphaned_in_key": missing_quiz,
            "correctness_issues": correctness_issues,
            "critical_issues": critical_issues,
            "pass_rate": f"{(validated/total*100):.1f}%" if total > 0 else "0%"
        }
    
    def get_correct_answer(self, question_id: str) -> str:
        """
        Get correct answer for a question
        Always uses quiz.correct (not answer key) as source of truth
        
        Args:
            question_id: Question ID like "CH01_Q03"
        
        Returns:
            Correct answer letter (A, B, C, or D)
        """
        for chapter in self.chapters:
            for question in chapter.get('quiz', []):
                if question.get('id') == question_id:
                    return question.get('correct')
        
        # Fallback to answer key if quiz not found (shouldn't happen)
        logger.warning(f"⚠️ {question_id} not found in quiz, using answer key fallback")
        return self.answer_key.get(question_id)
    
    def print_report(self):
        """Print detailed validation report"""
        report = self.validation_report
        
        print("\n" + "="*70)
        print("📋 QUIZ VALIDATION REPORT")
        print("="*70)
        print(f"Timestamp: {report['timestamp']}")
        print(f"Status: {report['status']}")
        print(f"\nSummary:")
        for key, value in report['summary'].items():
            print(f"  {key}: {value}")
        
        if report['mismatches']:
            print(f"\n❌ MISMATCHES FOUND ({len(report['mismatches'])}):")
            for m in report['mismatches']:
                print(f"  {m['question_id']}: quiz={m['quiz_correct']}, key={m['key_answer']} [{m['action']}]")
        
        if report['missing_in_key']:
            print(f"\n⚠️ MISSING IN ANSWER KEY ({len(report['missing_in_key'])}):")
            for m in report['missing_in_key']:
                print(f"  {m['question_id']}: {m['quiz_answer']} [{m['action']}]")
        
        if report['missing_in_quiz']:
            print(f"\n⚠️ ORPHANED IN ANSWER KEY ({len(report['missing_in_quiz'])}):")
            for m in report['missing_in_quiz']:
                print(f"  {m['question_id']}: {m['key_answer']}")
        
        if report['warnings']:
            print(f"\n⚠️ WARNINGS ({len(report['warnings'])}):")
            for w in report['warnings']:
                print(f"  {w}")
        
        print("="*70 + "\n")


def validate_quiz_integrity(lpi_chapters, answer_key, auto_correct=True, fail_on_error=False):
    """
    Convenience function to validate quiz integrity on startup
    
    Args:
        lpi_chapters: LPI chapter data with quiz questions
        answer_key: Answer key dictionary
        auto_correct: If True, auto-corrects answer key to match quiz
        fail_on_error: If True, raises exception on validation failure
    
    Returns:
        Validation report
    """
    validator = QuizValidator(lpi_chapters, answer_key)
    report = validator.validate_all(auto_correct=auto_correct)
    validator.print_report()
    
    if fail_on_error and report['status'] == 'FAIL' and not auto_correct:
        raise ValueError(
            f"Quiz validation failed! {len(report['mismatches'])} mismatches found. "
            "Fix content_data.py or enable auto_correct=True"
        )
    
    return report, validator
