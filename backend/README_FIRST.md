# README FIRST — Wealth Builder POC (Stable Contract v1.1.1)

This package is **forward-compatible** with Beta 1–3 and Commercial v1.0 under the guarantees in COMPATIBILITY_GUARANTEES.md.

## Wire these stable triggers/functions
1) Trigger: MCC_EVT_ONBOARDING_COMPLETE → Call AE_FN_COMPOSE_PPI
2) Trigger: PPI_EVT_SUBMITTED → Call AE_FN_GENERATE_PLAN

## Determinism & Fallbacks
- PPI selection is deterministic by user_id seed.
- Locale fallback: en-US → en.
- No static fallback allowed; raise ERR-AE-101 if compose is skipped.

## Validation
- Validate `ae_rules_poc_v1_1.json` with `schemas_ae_rules.json`
- Validate `ae_contracts_stable_v1_1.json` with `schemas_ae_contracts.json`

Prepared: 2025-11-04 04:22
