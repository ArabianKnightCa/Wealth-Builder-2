# Compatibility Guarantees (v1.1.1) — 2025-11-04 04:22

- Contracts are **stable**: `MCC_EVT_ONBOARDING_COMPLETE`, `PPI_EVT_SUBMITTED`, `AE_FN_COMPOSE_PPI`, `AE_FN_GENERATE_PLAN`.
- Aliases (`AE.PrePPI`/`AE.PostPPI`) will **remain supported** through Beta 3 with deprecation notice only after Commercial v1.0.
- Payload schemas are **additive**: new fields will never break existing; unknown fields must be ignored by clients.
- Determinism: AE selection uses `user_id` as seed; the same user always sees the same PPI set until rules version changes.
- Locale fallback: if a requested locale is not available, fall back to `en-US` → `en`.
- Timeouts set (compose=1500ms, generate=2000ms) with **no retry** in POC to avoid duplicate writes. Beta may add backoff policy.
- ID formats are pinned for POC/Beta/Live via `ae_rules_poc_v1_1.json:id_format`.
