---
mode: agent
---

---
title: migrate — Repo Folder Migration Agent
version: 2.1.0
appliesTo: /migrate
updated: 2025-09-26
---
# /migrate — Repo Folder Migration Agent

## Purpose
Perform a one-time cleanup and reorganization of the Noor Canvas repository, moving all assets into the unified `Workspaces/copilot/` hierarchy while keeping `.github/prompts/` as the root source of truth.

## Root Path
`D:\PROJECTS\NOOR CANVAS`

## Migration Tasks
1. **Preserve .github**
   - Leave `.github/prompts/` and `.github/workflows/` untouched at the repo root.
   - These remain the single source of truth for prompts and instruction files.

2. **Move Everything Else Under Workspaces/copilot/**
   - If not already present, create:
     ```
     D:\PROJECTS\NOOR CANVAS\Workspaces\copilot\
     ```
   - Relocate existing directories (`src/`, `Tests/`, `config/`, `docs/`, `logs/`, `artifacts/`, `ops/`, `state/`) beneath it.
   - Normalize paths as follows:
     - `src/` → `Workspaces/copilot/src/`
     - `Tests/Playwright/` → `Workspaces/copilot/Tests/Playwright/`
     - `config/` → `Workspaces/copilot/config/`
     - `docs/` → `Workspaces/copilot/docs/`
     - `logs/` → `Workspaces/copilot/logs/`
     - `artifacts/` → `Workspaces/copilot/artifacts/`
     - `ops/` → `Workspaces/copilot/ops/`
     - Any `Requirements-*.md`, `Cleanup-*.md`, or `SelfReview-*.md` → `Workspaces/copilot/state/{key}/`

3. **Templates**
   - Place operational copies of templates under:
     ```
     Workspaces/copilot/Global/templates/
     ```
   - Canonical versions stay in:
     ```
     .github/prompts/templates/
     ```

4. **PowerShell Launchers**
   - Ensure these exist in:
     ```
     Workspaces/copilot/Global/nc.ps1
     Workspaces/copilot/Global/ncb.ps1
     ```

5. **Playwright Config**
   - Ensure config lives at:
     ```
     Workspaces/copilot/config/playwright.config.ts
     ```
   - Inside config, enforce:
     ```ts
     testDir: 'Workspaces/copilot/Tests/Playwright'
     ```

6. **Cleanup Old Roots**
   - After moving, delete empty original folders from repo root **except** `.github/`.
   - Any temporary debug logs must end with `;CLEANUP_OK` so `/cleanup` can safely purge them.

## Post-Migration Verification
- Run `Workspaces/copilot/ops/tasks/verify-structure.ps1` to confirm:
  - `nc.ps1` and `ncb.ps1` exist and are executable.
  - `playwright.config.ts` points to the correct `testDir`.
  - Each `{key}` in `state/` has `Requirements-`, `Cleanup-`, and `SelfReview-` files.
  - Logs, artifacts, and reviews directories exist.

## Summary Output
- Provide a final summary including:
  - List of files moved and their new paths.
  - Removed empty folders.
  - Verification result (PASS/FAIL).
