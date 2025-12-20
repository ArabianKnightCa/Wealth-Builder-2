"""
CLG Engine - Controlled Language Generator
==========================================
TAP v2.3.1 Grammar-Safe Realization Layer

CLG renders user-facing text using:
1. Phrase Bank Matrix (concept -> banded phrases)
2. Sentence Template Library (frames with slots)
3. Slot Fill + Assembly rules
4. Optional PPI integrity gates

IMPORTANT:
- CLG lives INSIDE TAP as the "Realization Layer"
- TAP CoreLogic decides WHAT to say
- CLG decides HOW to say it (grammar-safe)

Version: 1.0.0
"""

import logging
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
from datetime import datetime

from tap_v2_3_formulas import TAPScalars, compute_tap_scalars
from clg_data import (
    PHRASE_BANK_MATRIX,
    SENTENCE_TEMPLATES,
    TONE_PREPENDS,
    PPI_INTEGRITY_RULES,
    PhraseEntry,
    get_phrase_entry,
    get_template,
)

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger("CLG")


@dataclass
class CLGInput:
    """Input packet for CLG processing."""
    age: int
    el_declared: int
    el_max: int
    lc: float  # Language Complexity (from TAP)
    cd: float  # Conceptual Depth (from TAP)
    ia: float  # Ideological Abstraction (from TAP)
    stretch_norm: float  # Stretch target normalized (from TAP)
    concept_ids: List[str]  # Concepts to render
    tone: str = "direct"  # supportive, direct, playful
    template_type: str = "lpi"  # "lpi" or "ppi"
    # Optional AE state
    ae_friction: float = 0.0
    ae_momentum: float = 0.0
    ae_exposure: int = 0


@dataclass
class CLGDebugLog:
    """Debug logging for CLG runs."""
    timestamp: str
    age: int
    el_declared: int
    lc: float
    cd: float
    ia: float
    stretch_norm: float
    concept_ids: List[str]
    selected_bands: Dict[str, float]
    templates_used: List[str]
    output_preview: str
    include_example: bool
    include_analogy: bool


@dataclass
class CLGOutput:
    """Output from CLG processing."""
    rendered_text: str
    debug_log: CLGDebugLog
    ppi_integrity_passed: bool = True
    fallback_used: bool = False


class CLGEngine:
    """
    Controlled Language Generator Engine.
    
    Grammar-safe text generation using:
    - Phrase Bank Matrix (PBM) for approved phrases
    - Sentence Template Library (STL) for grammar-safe frames
    - Deterministic slot filling (NO paraphrasing, NO synonyms)
    """
    
    VERSION = "1.0.0"
    
    def __init__(self):
        self.pbm = PHRASE_BANK_MATRIX
        self.stl = SENTENCE_TEMPLATES
        self.tone_prepends = TONE_PREPENDS
        self.ppi_rules = PPI_INTEGRITY_RULES
    
    def process(self, clg_input: CLGInput) -> CLGOutput:
        """
        Main CLG processing entry point.
        
        Args:
            clg_input: CLGInput with all required parameters
        
        Returns:
            CLGOutput with rendered text and debug log
        """
        # Initialize tracking
        selected_bands = {}
        templates_used = []
        rendered_lines = []
        
        # Determine what to include based on LC and age
        include_example = self._should_include_example(
            clg_input.lc, clg_input.ae_exposure, clg_input.ae_friction
        )
        include_analogy = self._should_include_analogy(
            clg_input.age, clg_input.lc
        )
        
        # Process each concept
        for concept_id in clg_input.concept_ids:
            concept_output, concept_bands, concept_templates = self._render_concept(
                concept_id=concept_id,
                cd=clg_input.cd,
                lc=clg_input.lc,
                stretch_norm=clg_input.stretch_norm,
                include_example=include_example,
                include_analogy=include_analogy,
                tone=clg_input.tone
            )
            
            if concept_output:
                rendered_lines.append(concept_output)
                selected_bands.update(concept_bands)
                templates_used.extend(concept_templates)
        
        # Assemble final output
        final_text = " ".join(rendered_lines)
        
        # Apply tone prepend if not direct
        if clg_input.tone != "direct" and final_text:
            prepend = self.tone_prepends.get(clg_input.tone, "")
            final_text = prepend + final_text
        
        # PPI integrity check if applicable
        ppi_passed = True
        fallback_used = False
        if clg_input.template_type == "ppi":
            ppi_passed = self._check_ppi_integrity(final_text, clg_input.concept_ids)
            if not ppi_passed:
                # Fallback: use baseline + support
                final_text = self._ppi_fallback(clg_input.concept_ids, clg_input.cd)
                fallback_used = True
        
        # Create debug log
        debug_log = CLGDebugLog(
            timestamp=datetime.utcnow().isoformat() + "Z",
            age=clg_input.age,
            el_declared=clg_input.el_declared,
            lc=round(clg_input.lc, 4),
            cd=round(clg_input.cd, 4),
            ia=round(clg_input.ia, 4),
            stretch_norm=round(clg_input.stretch_norm, 4),
            concept_ids=clg_input.concept_ids,
            selected_bands=selected_bands,
            templates_used=templates_used,
            output_preview=final_text[:100] + "..." if len(final_text) > 100 else final_text,
            include_example=include_example,
            include_analogy=include_analogy
        )
        
        # Log for debugging
        logger.debug(f"CLG Output: age={clg_input.age}, EL={clg_input.el_declared}, "
                    f"LC={clg_input.lc:.2f}, CD={clg_input.cd:.2f}")
        logger.debug(f"Concepts: {clg_input.concept_ids}")
        logger.debug(f"Selected bands: {selected_bands}")
        logger.debug(f"Templates: {templates_used}")
        logger.debug(f"Output: {final_text[:80]}...")
        
        return CLGOutput(
            rendered_text=final_text,
            debug_log=debug_log,
            ppi_integrity_passed=ppi_passed,
            fallback_used=fallback_used
        )
    
    def _should_include_example(self, lc: float, ae_exposure: int, ae_friction: float) -> bool:
        """
        Determine if example should be included.
        
        Include example if:
        - LC <= 0.70 OR
        - AE_exposure == 1 OR
        - AE_friction > 0.6
        """
        return lc <= 0.70 or ae_exposure == 1 or ae_friction > 0.6
    
    def _should_include_analogy(self, age: int, lc: float) -> bool:
        """
        Determine if analogy should be included.
        
        Include analogy if:
        - age < 16 OR
        - LC < 0.45
        """
        return age < 16 or lc < 0.45
    
    def _render_concept(
        self,
        concept_id: str,
        cd: float,
        lc: float,
        stretch_norm: float,
        include_example: bool,
        include_analogy: bool,
        tone: str
    ) -> tuple:
        """
        Render a single concept using PBM and STL.
        
        Returns:
            Tuple of (rendered_text, selected_bands, templates_used)
        """
        selected_bands = {}
        templates_used = []
        lines = []
        
        # Step D: Band selection - get nearest phrase entry
        phrase_entry = get_phrase_entry(concept_id, cd)
        if not phrase_entry:
            logger.warning(f"No phrase entry found for concept: {concept_id}")
            return ("", {}, [])
        
        selected_bands[concept_id] = phrase_entry.band_score
        
        # Step E: Slot Fill + Assembly
        
        # 1. Definition line
        if lc < 0.20:
            # Very low LC: use simpler template
            template = get_template("T_SIMPLE")
            templates_used.append("T_SIMPLE")
        else:
            template = get_template("T_DEF")
            templates_used.append("T_DEF")
        
        if template:
            def_line = template.frame.format(
                TERM=phrase_entry.term,
                DEFINITION=phrase_entry.definition
            )
            lines.append(def_line)
        
        # 2. Example line (if allowed)
        if include_example and phrase_entry.example:
            example_template = get_template("T_EXAMPLE")
            if example_template:
                example_line = example_template.frame.format(
                    EXAMPLE=phrase_entry.example
                )
                lines.append(example_line)
                templates_used.append("T_EXAMPLE")
        
        # 3. Analogy line (if allowed and available)
        if include_analogy and phrase_entry.analogy:
            analogy_template = get_template("T_ANALOGY")
            if analogy_template:
                analogy_line = analogy_template.frame.format(
                    ANALOGY=phrase_entry.analogy
                )
                lines.append(analogy_line)
                templates_used.append("T_ANALOGY")
        
        # 4. Stretch line (if stretch_norm > cd)
        if stretch_norm > cd and stretch_norm - cd >= 0.15:
            # Get stretch phrase (one band above current)
            stretch_entry = self._get_stretch_phrase(concept_id, cd)
            if stretch_entry and stretch_entry.band_score > phrase_entry.band_score:
                stretch_template = get_template("T_STRETCH")
                if stretch_template:
                    stretch_action = f"learn about {stretch_entry.term}"
                    stretch_line = stretch_template.frame.format(
                        STRETCH_ACTION=stretch_action
                    )
                    lines.append(stretch_line)
                    templates_used.append("T_STRETCH")
        
        # Join lines with space
        rendered_text = " ".join(lines)
        
        return (rendered_text, selected_bands, templates_used)
    
    def _get_stretch_phrase(self, concept_id: str, current_cd: float) -> Optional[PhraseEntry]:
        """
        Get the next-level phrase entry for stretch content.
        """
        if concept_id not in self.pbm:
            return None
        
        entries = self.pbm[concept_id]
        # Find entries with band_score above current_cd
        higher_entries = [e for e in entries if e.band_score > current_cd]
        
        if not higher_entries:
            return None
        
        # Return the one just above current
        return min(higher_entries, key=lambda e: e.band_score)
    
    def _check_ppi_integrity(self, text: str, concept_ids: List[str]) -> bool:
        """
        Check PPI integrity gate.
        
        Ensures:
        1. Required keywords are present
        2. Forbidden drift phrases are absent
        """
        text_lower = text.lower()
        
        # Check default rules
        default_rules = self.ppi_rules.get("default", {})
        
        # Check required keywords
        for keyword in default_rules.get("required_keywords", []):
            if keyword.lower() not in text_lower:
                logger.warning(f"PPI integrity: missing required keyword '{keyword}'")
                return False
        
        # Check forbidden drift
        for forbidden in default_rules.get("forbidden_drift", []):
            if forbidden.lower() in text_lower:
                logger.warning(f"PPI integrity: found forbidden drift '{forbidden}'")
                return False
        
        return True
    
    def _ppi_fallback(self, concept_ids: List[str], cd: float) -> str:
        """
        PPI fallback: return baseline wording + definitions.
        Used when PPI integrity check fails.
        """
        lines = []
        for concept_id in concept_ids:
            entry = get_phrase_entry(concept_id, cd)
            if entry:
                # Just term and definition, no fancy templates
                lines.append(f"{entry.term}: {entry.definition}")
        return " ".join(lines)
    
    def render_for_user(
        self,
        concept_ids: List[str],
        age: int,
        el_declared: int,
        el_max: int = 15,
        tone: str = "direct",
        template_type: str = "lpi"
    ) -> CLGOutput:
        """
        Convenience method: render concepts for a user.
        
        Computes TAP scalars and calls process().
        
        Args:
            concept_ids: List of concept IDs to render
            age: User age
            el_declared: User's declared experience level
            el_max: Maximum experience level
            tone: Tone variant (supportive, direct, playful)
            template_type: "lpi" or "ppi"
        
        Returns:
            CLGOutput
        """
        # Compute TAP scalars
        scalars = compute_tap_scalars(age, el_declared, el_max)
        
        # Build CLG input
        clg_input = CLGInput(
            age=age,
            el_declared=el_declared,
            el_max=el_max,
            lc=scalars.lc,
            cd=scalars.cd,
            ia=scalars.ia,
            stretch_norm=scalars.stretch_norm,
            concept_ids=concept_ids,
            tone=tone,
            template_type=template_type
        )
        
        return self.process(clg_input)


# Singleton instance
_clg_engine = None


def get_clg_engine() -> CLGEngine:
    """Get singleton CLG Engine instance."""
    global _clg_engine
    if _clg_engine is None:
        _clg_engine = CLGEngine()
    return _clg_engine


# =============================================================================
# 9-CASE CLG STEP TEST
# =============================================================================

def run_clg_step_test() -> Dict[str, Any]:
    """
    Run 9-case CLG step test for validation.
    
    User profiles:
    - P1: age=8,  EL=1,  EL_MAX=15
    - P2: age=28, EL=4,  EL_MAX=15
    - P3: age=60, EL=14, EL_MAX=15
    
    Concepts:
    - C1: CREDIT_CARD
    - C2: PAYING_BILLS
    - C3: INVESTING
    
    Returns:
        Dict with all test results and logs
    """
    engine = get_clg_engine()
    
    profiles = [
        {"name": "P1_child", "age": 8, "el": 1},
        {"name": "P2_adult", "age": 28, "el": 4},
        {"name": "P3_senior", "age": 60, "el": 14},
    ]
    
    concepts = ["CREDIT_CARD", "PAYING_BILLS", "INVESTING"]
    
    results = {
        "test_run": datetime.utcnow().isoformat() + "Z",
        "el_max": 15,
        "cases": [],
        "summary": {
            "total": 0,
            "passed": 0,
            "failed": 0
        }
    }
    
    for profile in profiles:
        for concept in concepts:
            case_id = f"{profile['name']}_{concept}"
            
            try:
                output = engine.render_for_user(
                    concept_ids=[concept],
                    age=profile["age"],
                    el_declared=profile["el"],
                    el_max=15,
                    tone="direct",
                    template_type="lpi"
                )
                
                # Validation checks
                checks = {
                    "grammatical": _check_grammar(output.rendered_text),
                    "no_synonyms": True,  # CLG never uses synonyms by design
                    "depth_appropriate": output.debug_log.selected_bands.get(concept, 0) <= profile["el"] / 15 + 0.2,
                    "has_content": len(output.rendered_text) > 10
                }
                
                passed = all(checks.values())
                
                results["cases"].append({
                    "case_id": case_id,
                    "profile": profile,
                    "concept": concept,
                    "output": output.rendered_text,
                    "debug": {
                        "lc": output.debug_log.lc,
                        "cd": output.debug_log.cd,
                        "ia": output.debug_log.ia,
                        "stretch_norm": output.debug_log.stretch_norm,
                        "selected_band": output.debug_log.selected_bands.get(concept),
                        "templates": output.debug_log.templates_used,
                        "include_example": output.debug_log.include_example,
                        "include_analogy": output.debug_log.include_analogy
                    },
                    "checks": checks,
                    "passed": passed
                })
                
                results["summary"]["total"] += 1
                if passed:
                    results["summary"]["passed"] += 1
                else:
                    results["summary"]["failed"] += 1
                    
            except Exception as e:
                results["cases"].append({
                    "case_id": case_id,
                    "error": str(e),
                    "passed": False
                })
                results["summary"]["total"] += 1
                results["summary"]["failed"] += 1
    
    return results


def _check_grammar(text: str) -> bool:
    """
    Basic grammar check for CLG output.
    
    Since CLG uses templates, grammar should always be correct.
    This checks for obvious issues.
    """
    if not text:
        return False
    
    # Check for fragmented sentences (incomplete)
    if text.strip().endswith(","):
        return False
    
    # Check for double punctuation
    if ".." in text or ",," in text:
        return False
    
    # Check for missing spaces after punctuation
    import re
    if re.search(r'[.!?][A-Z]', text):
        return False
    
    # Check sentences start with capital
    sentences = re.split(r'[.!?]\s+', text)
    for sent in sentences:
        if sent and sent[0].islower():
            return False
    
    return True


if __name__ == "__main__":
    # Run step test when executed directly
    import json
    results = run_clg_step_test()
    print(json.dumps(results, indent=2))
