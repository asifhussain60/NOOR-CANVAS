---
mode: agent
---
# /cleanup — Log/Artifact Janitor **plus** Structure Verifier & Optional Auto-Migrate (2.3.1)

## Purpose
1) Clean temporary logs/artifacts using `;CLEANUP_OK` and retention rules.  
2) Verify that the repository matches the canonical structure.  
3) Optionally perform an idempotent auto-migration to fix drift.

## Root Path
`D:\PROJECTS\NOOR CANVAS`

## Modes
- `mode: clean` (default) — Delete only `;CLEANUP_OK` temp logs or aged artifacts.
- `mode: verify` — No changes; produce a drift report.
- `mode: migrate_fix` — Perform recommended moves to restore the canonical structure.

## Canonical Structure (with explicit root exceptions)
- `.github/prompts/` at repo root (source of truth).
- The following **root-level exceptions are valid and MUST NOT be touched** (no drift reported, no moves performed):
  - `DocFX/`                         # documentation system stays at root
  - `Scripts/`                       # legacy scripts stay at root
  - `PlayWright/`                    # legacy E2E/test assets stay at root
  - `Tools/`                         # tooling stays at root
  - `SPA/`                           # front-end root stays at root
- Everything else **for Copilot** lives under `Workspaces/copilot/`:
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
- **Do not touch**:
  - `infra/` and `config/environments/` (configs & infra data)
  - **Any** of the root-level exceptions (`DocFX/`, `Scripts/`, `PlayWright/`, `Tools/`, `SPA/`)

## Structure Verification (Drift Detection)
Report drift **only** when:
- Folders at repo root are present **other than**: `.github/`, `DocFX/`, `Scripts/`, `PlayWright/`, `Tools/`, `SPA/`.
- Canonical Copilot directories are found **outside** `Workspaces/copilot/`.
- Playwright config missing, or `testDir` ≠ `Workspaces/copilot/Tests/Playwright`.
- Missing `state/{key}` assets (Requirements, Cleanup, SelfReview, reviews/).
- Missing `Global/nc.ps1` or `Global/ncb.ps1`.

## Auto-Migrate (when `mode: migrate_fix`)
- Create `Workspaces/copilot/` if missing.
- Move stray **Copilot-owned** directories into `Workspaces/copilot/`:
  - `src/`, `Tests/Playwright/`, `config/`, `docs/`, `logs/`, `artifacts/`, `ops/`, `infra/`
- Move `Requirements-*`, `Cleanup-*`, `SelfReview-*` into `state/{key}/`.
- Rewrite `playwright.config.ts` `testDir` to canonical value if needed.
- Remove empty original folders; leave `.github/` and all **root exceptions** untouched.

## Terminal Evidence & Honesty
- Read `#getTerminalOutput` before disruptive actions; pause if an active run is detected.
- If the agent stops/restarts anything, log:
  `[DEBUG-WORKITEM:{key}:cleanup] agent_initiated_shutdown=true reason=<text> ;CLEANUP_OK`

## Output
- `clean` → Deleted items with reasons + bytes reclaimed.
- `verify` → Drift report + recommendations.
- `migrate_fix` → Actions taken + final verify summary.
