---
title: cleanup — Log/Artifact Janitor + Structure Verifier
version: 2.2.0
appliesTo: /cleanup
updated: 2025-09-26
---
# /cleanup — Log/Artifact Janitor **plus** Structure Verifier & Optional Auto-Migrate (2.2.0)

## Purpose
1) **Clean** temporary logs/artifacts safely using the `;CLEANUP_OK` marker.
2) **Verify** the repo structure matches the canonical layout under `Workspaces/copilot/`.
3) **Optionally auto-migrate** strays back into place (idempotent).

## Root Path
`D:\PROJECTS\NOOR CANVAS`

## Modes
- `mode: clean` (default) — remove only temp logs/artifacts that carry the cleanup marker or are older than retention policy.
- `mode: verify` — do not modify files; report all structural drift and recommended moves.
- `mode: migrate_fix` — perform the recommended moves to restore the canonical structure (safe and idempotent).

## Canonical Structure (high level)
- `.github/prompts/` (source of truth for prompts/instructions/templates)
- `Workspaces/copilot/` is the root for everything else:
  - `Global/nc.ps1`, `Global/ncb.ps1`
  - `config/playwright.config.ts` (must set `testDir: "Workspaces/copilot/Tests/Playwright"`)
  - `Tests/Playwright/{key}/...`
  - `state/{key}/(Requirements-*.md, Cleanup-*.md, SelfReview-*.md, reviews/)`
  - `logs/(app|copilot|terminal)/`
  - `artifacts/(playwright|coverage|build)/`
  - `ops/(scripts|tasks)/`
  - `docs/(architecture.md|decisions|runbooks)/`
  - `src/...` (application code)

## Cleanup Rules
- **Markers:** Only delete lines/files with explicit `;CLEANUP_OK` or dated artifacts older than the retention setting.
- **Targets:**
  - `Workspaces/copilot/logs/copilot/` (temp agent logs)
  - `Workspaces/copilot/logs/terminal/` (tailed outputs)
  - `Workspaces/copilot/artifacts/playwright/` (old reports, traces, videos)
- **Retention:** Default 7 days unless specified in `Workspaces/copilot/state/{key}/Cleanup-{key}.md`.

## Structure Verification (Drift Detection)
Report any of the following:
- Folders present at repo root **other than** `.github/`.
- `Tests/`, `config/`, `docs/`, `logs/`, `artifacts/`, `ops/`, `src/`, or `state/` found **outside** `Workspaces/copilot/`.
- Playwright config missing, or `testDir` not equal to `Workspaces/copilot/Tests/Playwright`.
- Key assets missing under `Workspaces/copilot/state/{key}/`: `Requirements-`, `Cleanup-`, `SelfReview-`, `reviews/`.
- PowerShell launchers missing under `Workspaces/copilot/Global/`.

## Auto-Migrate (when `mode: migrate_fix`)
- Create `Workspaces/copilot/` if missing.
- Move these if found at root or elsewhere:
  - `src/` → `Workspaces/copilot/src/`
  - `Tests/Playwright/` → `Workspaces/copilot/Tests/Playwright/`
  - `config/` → `Workspaces/copilot/config/`
  - `docs/` → `Workspaces/copilot/docs/`
  - `logs/` → `Workspaces/copilot/logs/`
  - `artifacts/` → `Workspaces/copilot/artifacts/`
  - `ops/` → `Workspaces/copilot/ops/`
  - Any `Requirements-*.md`, `Cleanup-*.md`, `SelfReview-*.md` → `Workspaces/copilot/state/{key}/`
- Re-check `playwright.config.ts` and **rewrite** `testDir` to `Workspaces/copilot/Tests/Playwright` if needed.
- Remove empty original folders after moves (leave `.github/` untouched).

## Terminal Evidence & Honesty
- Before deleting or moving, read `#getTerminalOutput` for context if the app is running; pause actions that would interrupt a live run.
- If the agent stops/restarts anything to proceed, log:
  `[DEBUG-WORKITEM:{key}:cleanup] agent_initiated_shutdown=true reason=<text> ;CLEANUP_OK`

## Output
- **mode: clean** → list of deletions with reasons (marker/age), and bytes reclaimed.
- **mode: verify** → drift report with recommended actions.
- **mode: migrate_fix** → actions performed, files moved, config rewrites, and a final `verify` summary.

## Safety Notes
- Never touch `.github/` beyond reading prompts/templates.
- Never delete files lacking `;CLEANUP_OK` unless they match age-based retention in artifacts folders.
- All moves are relative to `D:\PROJECTS\NOOR CANVAS` and are idempotent (re-running finds nothing to change).
