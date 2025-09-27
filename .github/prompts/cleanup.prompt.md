---
mode: agent
---
---
title: cleanup — Log/Artifact Janitor + Structure Verifier & Migrator
version: 2.7.0
appliesTo: /cleanup
updated: 2025-09-27
---
# /cleanup — Log/Artifact Janitor + Structure Verifier & Migrator (v2.7.0)

## Parameters
- **mode:** 
  - `clean` (default) → remove logs/artifacts marked with ;CLEANUP_OK or older than retention.
  - `verify` → no changes, produce a drift report.
  - `migrate_fix` → fix drift by moving Copilot-owned dirs and stragglers into canonical layout.
- **commit:** 
  - `false` (default) → debug logs may remain in files; agent may commit with them intact.
  - `true` → scrub all debug logs from uncommitted files before commit. Ensures only clean code goes into GitHub.

## Root Path
D:\PROJECTS\NOOR CANVAS

## Canonical Structure
- `.github/prompts/` at repo root (source of truth).
- Root-level exceptions (valid, never flagged as drift):  
  `DocFX/`, `Scripts/`, `PlayWright/`, `Tools/`, `SPA/`
- All Copilot-owned work must live under `Workspaces/Copilot/`:
  - `Global/`
  - `config/`
  - `infra/`
  - `src/`
  - `ops/`
  - `docs/`
  - `logs/`
  - `artifacts/`
  - `prompts.keys/{key}/workitem/`
  - `prompts.keys/{key}/tests/`

## Cleanup Sources
- Global defaults:
  - retention_days: 7
  - marker: `;CLEANUP_OK`
- Per-key overrides:
  - Read `Workspaces/Copilot/prompts.keys/{key}/workitem/Cleanup-{key}.md`
  - If present, override defaults (retention, exclusions).

## Debug Log Handling
- Debug lines must always follow:
  [DEBUG-WORKITEM:{key}:{layer}:{RUN_ID}] message ;CLEANUP_OK
- When `commit=false`:
  - These lines may remain in code, safe for local debug commits.
- When `commit=true`:
  - Identify **uncommitted files** (via git status).
  - Strip lines matching:
    ^\[DEBUG-WORKITEM:.*\]\s.*;CLEANUP_OK$
  - Ensure no debug logs remain before commit.
  - Artifacts/logs under `logs/` and `artifacts/` still follow retention rules.

## Structure Verification
Report drift only when:
- Non-exempt folders exist at repo root.
- Copilot-owned directories live outside `Workspaces/Copilot/`.
- Missing `Global/nc.ps1` or `Global/ncb.ps1`.
- Playwright config points outside canonical tests.
- Required per-key docs missing (Requirements-{key}.md, SelfReview-{key}.md).

## Auto-Migrate (mode: migrate_fix)
- Move **stragglers from previous structures** into canonical paths:
  - `state/{key}/` → `Workspaces/Copilot/prompts.keys/{key}/workitem/`
  - `Tests/Playwright/{key}/` → `Workspaces/Copilot/prompts.keys/{key}/tests/`
  - `Workspaces/Copilot/state/{key}/…` → folded into `prompts.keys/{key}/workitem/`
- If conflicts occur, skip or merge without overwrite unless explicitly allowed.
- Rewrite `playwright.config.ts` if its `testDir` points to legacy paths.
- Consolidate per-key artifacts into `prompts.keys/{key}/`.
- Never touch `infra/`, `config/environments/`, or root-level exceptions.

## Launch Policy
- **Never** use `dotnet run` or `cd "…NoorCanvas" && dotnet run`.
- Only use:
  - `./Workspaces/Copilot/Global/nc.ps1`  # launch
  - `./Workspaces/Copilot/Global/ncb.ps1` # clean, build, then launch
- If you stop or restart the app, self-attribute it:
  [DEBUG-WORKITEM:{key}:cleanup:{RUN_ID}] agent_initiated_shutdown=true reason=<text> ;CLEANUP_OK

## Terminal Evidence & Honesty
- Always capture a short tail from #getTerminalOutput before destructive actions.
- Include attribution log lines when lifecycle changes are initiated.

## Outputs
- `clean` → Deleted items with reasons + bytes reclaimed.
- `verify` → Drift report + recommended actions.
- `migrate_fix` → Actions taken, stragglers migrated, + final verify summary.
- When commit=true → Confirmation that all uncommitted files were scrubbed of debug logs before commit.
