---
mode: agent
---
name: cleanup
description: >
  Comprehensive repo cleanup. Accepts an optional 'scope' (folder or file glob). If provided, cleanup
  is limited to that scope (with necessary root-level updates like .gitignore). If omitted, runs on the
  project root. Enforces standard file names, consolidates docs, removes TEMP/artefacts, optimizes .gitignore,
  runs linters/formatters, builds, and commits. Finishes with 0 uncommitted files.
parameters:
  - name: scope
    description: Optional path or glob to limit work (e.g., 'PlayWright/', 'src/Web/**'). Defaults to repo root.
---

## Operating Mode
- **Effective scope**: set to `{{scope}}` if provided, otherwise the **repo root**.
- All scans/moves/deletions/renames operate within the effective scope **except**:
  - Root-level **`.gitignore` audit** (always global).
  - Cross-scope link/rename fixes **only** when they point into/out of the effective scope.

## Goals
- Enforce clean structure and standard filenames within effective scope.
- Merge/normalize instructional Markdown (keep one canonical README).
- Remove duplicates, poorly named files, TEMP clutter.
- **Analyze & optimize `.gitignore`** so backups/caches/build outputs and Playwright artefacts are ignored, while Playwright **tests & config are committed**.
- Run formatters/linters (for touched files).
- Build successfully.
- **Commit all intended changes**, purge ignored artefacts, and **end with 0 uncommitted files**.

## Structure Patterns
- **PlayWright/**
  - `config/`, `tests/` → **tracked**
  - `reports/`, `results/`, `artifacts/` → **ignored, not tracked**
- **Scripts/** (plus `Scripts/Validation/`)
- **IssueTracker/** with status folders: NOT STARTED, IN PROGRESS, AWAITING_CONFIRMATION, COMPLETED
- **Documentation/** for deep docs; root README.md stays canonical

## Constraints & Principles
- Conventional names only (`README.md`, `CONTRIBUTING.md`, etc.).
- No placeholder names (clean/final/new/tmp/junk, etc.).
- Prefer **rename/move** over delete when preserving history.
- **Scope discipline**: do not touch outside effective scope unless:
  - Updating `.gitignore` patterns,
  - Fixing broken references that cross into/out of scope,
  - Removing tracked artefacts that should have been ignored.

## High-Level Plan (Copilot Execution Order)
0) **Resolve Effective Scope**
   - `SCOPE = {{scope}}` if provided, else `.`

1) **.gitignore Audit & Optimization (GLOBAL)**
   - Create or update root `.gitignore` with idempotent rules:
     - OS/editor: `.DS_Store`, `Thumbs.db`, `desktop.ini`, `.idea/`, `.vscode/` (allow explicit checked-in settings via exception rules if already tracked)
     - Backups/temp: `*.bak`, `*.tmp`, `*.temp`, `*.old`, `*.orig`, `*.rej`, `.cache/`, `cache/`, `tmp/`, `temp/`
     - Logs/coverage: `*.log`, `logs/`, `coverage/`, `.nyc_output/`
     - Build outputs: `bin/`, `obj/`, `dist/`, `build/`, `out/`, `.next/`, `.turbo/`
     - Dependencies: `node_modules/`, `.venv/`, `venv/`, `.pytest_cache/`, `.mypy_cache/`
     - **Playwright (not tracked)**: `PlayWright/reports/`, `PlayWright/results/`, `PlayWright/artifacts/`
     - **Playwright (tracked)**: ensure **no** rule masks `PlayWright/config/**` or `PlayWright/tests/**`
   - Output a short diff-style preview of proposed changes.

2) **Inventory & Consolidate Instructional Markdown (Scoped)**
   - Within `SCOPE`, find likely instruction files and consolidate into `README.md` (root README if SCOPE includes root, else a local README that links to root).
   - Remove contradictions/outdated copies.

3) **Enforce Naming Standards (Scoped)**
   - Normalize case, standard files.
   - Rename outliers; update links/refs (including cross-scope if necessary).

4) **Duplicate/Orphan Cleanup & Playwright Organization (Scoped)**
   - Detect duplicates by hash/similarity; keep canonical.
   - Remove unused screenshots/assets if unreferenced.
   - Centralize Playwright tests under `PlayWright/tests/` (if they sit under SCOPE); update configs accordingly.
   - Prune old Playwright artefact paths under SCOPE.

5) **Artefacts & Cache Cleanup (Scoped)**
   - Remove build outputs, caches, logs, TEMP, and backup files **inside SCOPE**:
     - `bin/`, `obj/`, `dist/`, `.cache/`, `.test-cache/`, `*.tmp`, `*.bak`, `*.log`
   - If any such paths are **tracked**, run `git rm -r --cached` to untrack them (respecting `.gitignore`).

6) **Lint & Format (Touched Files Only)**
   - Detect stack(s) under SCOPE and run appropriate formatters/linters.
   - Fail the run if fatal syntax/lint errors remain.

7) **Build & Sanity Checks (If SCOPE affects buildable code)**
   - Build the project (or sub-projects touched by SCOPE).
   - Optionally run quick smoke tests if available and fast.

8) **Zero-Diff Finisher (Always End Clean)**
   - **Stage & commit all intended changes**:
     - If SCOPE provided: `git add -A -- <SCOPE>` **plus** any root-level changes made by this prompt (e.g., `.gitignore`, moved references).
     - If SCOPE not provided: `git add -A`
   - **Untrack anything that should be ignored**:
     - `git rm -r --cached` for any paths now covered by `.gitignore` but still tracked.
   - **Purge ignored junk from working tree** (safe): `git clean -fdX`
     - This removes **ignored** files/dirs (reports, results, artifacts, caches) but leaves unignored work intact.
   - **Re-verify**: if `git status --porcelain` still shows untracked **non-ignored** junk that matches backup/temp patterns,
     - Either add to `.gitignore` and repeat, or delete if clearly disposable under those patterns.
   - Commit message (see template).
   - Push to current branch’s `origin`.
   - Final assert: **`git status --porcelain` is empty**.

## Post-Run Validation
- **Git cleanliness**: 0 uncommitted changes.
- **Playwright**: tests & config tracked; reports/results/artifacts not tracked.
- **Build**: succeeds if SCOPE includes buildable code.
- **Docs**: single canonical README in scope; links valid.

## Commit Message Template
