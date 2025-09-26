---
title: continue — Progressor Agent
version: 2.3.0
appliesTo: /continue
updated: 2025-09-26
---

# /continue — Progressor Agent (2.3.0)

Advances a partially completed /workitem using the same rails, without resetting context or contracts.

## Rules
- Same launch policy (`nc.ps1`/`ncb.ps1` only).
- Same Terminal‑Log Grounding and self‑attribution.
- Continue the Iterative Accumulation Policy until the entire scoped set is green.

## Testing & Evidence
- Specs under `Workspaces/copilot/Tests/Playwright/{key}/`.
- Base URL from `APP_URL` env var.
- Include Terminal Evidence tail with each summary.

## Approval
- No approval prompts until the **full** scoped set of tests is green; then ask for one manual run and approval to mark complete.

## Logging
- `[DEBUG-WORKITEM:{key}:continue] message ;CLEANUP_OK`
