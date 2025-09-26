---
title: SelfAwareness — Global Operating Guardrails
version: 2.1.0
appliesTo: **
key: 
updated: 2025-09-26
---
# SelfAwareness — Global Operating Guardrails (2.1.0)

> Source of truth for agent behavior. Keep **.github/prompts** as the canonical location.
> All other files under **Workspaces/copilot/** reference these paths and rules.

## Scope
Governs: `/workitem`, `/retrosync`, `/cleanup`, `/pwtest`, `/imgreq`, `/continue`.

## Absolute Rules
- **Do not** launch with `dotnet run` or variants.
- Launch only via:
  - `./Workspaces/copilot/Global/nc.ps1`  (launch)
  - `./Workspaces/copilot/Global/ncb.ps1` (clean, build, launch)
- Always consult terminal logs using `#getTerminalOutput` and include a short evidence tail in summaries.
- If the agent stops/restarts the app, log self-attribution:
  - `[DEBUG-WORKITEM:{key}:lifecycle] agent_initiated_shutdown=true reason=<text> ;CLEANUP_OK`

## Playwright Canon
- `Workspaces/copilot/config/playwright.config.ts` must set `testDir: "Workspaces/copilot/Tests/Playwright"`.
- Tests live under `Workspaces/copilot/Tests/Playwright/{key}/` (e.g., `hostcanvas`).

## Iterative Accumulation Policy (Global)
- Make one change → run its test.
- Add the second change → run test1 + test2.
- Continue accumulating until **all** identified tests for the scope are green.
- Do **not** ask for approval until all created tests are green.
- After a fully green run, ask the user to perform a manual run once, then request approval to mark complete.

## Debug Logging & Cleanup
- Temporary debug lines include **`;CLEANUP_OK`** for surgical removal by `/cleanup`.
- Use structured tags: `[DEBUG-WORKITEM:{key}:{layer}]`

## Terminal Evidence
- Summaries include a **Terminal Evidence** block with the last 10–20 lines relevant to the change.

## Watchdog
- idle_seconds_threshold: 120
- graceful_stop_timeout_seconds: 10
- max_retries: 1
