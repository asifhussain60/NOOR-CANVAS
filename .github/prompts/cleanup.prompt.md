---
title: cleanup — Log/Artifact Janitor + Structure Verifier
version: 2.3.0
appliesTo: /cleanup
updated: 2025-09-26
---

# /cleanup — Log/Artifact Janitor **plus** Structure Verifier & Optional Auto‑Migrate (2.3.0)

## Purpose
1) Clean temporary logs/artifacts using `;CLEANUP_OK` and retention rules.  
2) Verify that the repository matches the canonical structure.  
3) Optionally perform an idempotent auto‑migration to fix drift.

## Root Path
`D:\PROJECTS\NOOR CANVAS`

## Modes
- `mode: clean` (default) — Delete only `;CLEANUP_OK` temp logs or aged artifacts.
- `mode: verify` — No changes; produce a drift report.
- `mode: migrate_fix` — Perform recommended moves to restore the canonical structure.

## Canonical Structure
- `.github/prompts/` at repo root (source of truth).
- Everything else under `Workspaces/copilot/`:
  - `Global/nc.ps1`, `Global/ncb.ps1`
  - `config/playwright.config.ts` (must set `testDir: "Workspaces/copilot/Tests/Playwright"`)
  - `Tests/Playwright/{key}/`
  - `state/{key}/(Requirements-*.md, Cleanup-*.md, SelfReview-*.md, reviews/)`
  - `logs/(app|copilot|terminal)/`
  - `artifacts/(playwright|coverage|build)/`
  - `ops/(scripts|tasks)/`
  - `docs/(architecture.md|decisions|runbooks)/`
  - `infra/` (manifests, IaC)
  - `src/` (application code)

## Cleanup Rules
- **Markers**: Only delete content with `;CLEANUP_OK`.
- **Targets**:
  - `Workspaces/copilot/logs/copilot/` (temp agent logs)
  - `Workspaces/copilot/logs/terminal/` (tailed outputs)
  - `Workspaces/copilot/artifacts/playwright/` (old reports/traces/videos)
- **Retention**: Default 7 days; may be overridden in `state/{key}/Cleanup-{key}.md`.
- **Do not touch**: `infra/` and `config/environments/`.

## Structure Verification (Drift Detection)
Report if any of the following are true:
- Folders at repo root other than `.github/`.
- Canonical directories found outside `Workspaces/copilot/`.
- Missing Playwright config or incorrect `testDir`.
- Missing `state/{key}` assets (Requirements, Cleanup, SelfReview, reviews/).
- Missing `Global/nc.ps1` or `Global/ncb.ps1`.

## Auto‑Migrate (when `mode: migrate_fix`)
- Create `Workspaces/copilot/` if missing.
- Move stray `src/`, `Tests/Playwright/`, `config/`, `docs/`, `logs/`, `artifacts/`, `ops/`, `infra/` into `Workspaces/copilot/`.
- Move `Requirements-*`, `Cleanup-*`, `SelfReview-*` into `state/{key}/`.
- Rewrite `playwright.config.ts` `testDir` to canonical value if needed.
- Remove empty original folders; leave `.github/` untouched.

## Terminal Evidence & Honesty
- Read `#getTerminalOutput` before disruptive actions; pause if an active run is detected.
- If the agent stops/restarts anything, log:
  `[DEBUG-WORKITEM:{key}:cleanup] agent_initiated_shutdown=true reason=<text> ;CLEANUP_OK`

## Output
- `clean` → Deleted items with reasons + bytes reclaimed.
- `verify` → Drift report + recommended fixes.
- `migrate_fix` → Actions taken + final verify summary.
