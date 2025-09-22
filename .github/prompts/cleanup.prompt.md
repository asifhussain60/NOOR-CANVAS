---
mode: agent
name: cleanup
alias: /cleanup
description: >
  Perform a disciplined repo cleanup within a defined scope while preserving history,
  consolidating documentation, organizing Playwright assets, enforcing canonical structure,
  and ensuring the working tree is clean. 
  Always align with NOOR-CANVAS-DESIGN, ncImplementationTracker, and INFRASTRUCTURE-FIXES-REPORT.
  Any non-canonical files should be moved into Workspaces/TEMP, which is purged at the end
  unless files are explicitly referenced.

parameters:
  - name: scope
    required: false
    description: >
      Optional path or glob to limit cleanup (e.g., "PlayWright/", "src/Web/**").
      Defaults to repo root (".").
  - name: dry_run
    required: false
    description: >
      If true (default), only preview moves/deletes in a diff-style plan.

# ─────────────────────────────────────────────
# 📖 Usage Examples
# ─────────────────────────────────────────────
# /cleanup
# /cleanup scope:"PlayWright/"
# /cleanup scope:"src/Web/**"
# /cleanup dry_run:false

# ─────────────────────────────────────────────
# 🧭 Goals
# ─────────────────────────────────────────────
# • Enforce clean canonical repo structure.
# • Move stray configs, SQL, PS1, and evidence files into appropriate folders or Workspaces/TEMP.
# • Consolidate documentation into Workspaces/Documentation with an INDEX.md.
# • Ensure Playwright artifacts are ignored, not committed.
# • Purge Workspaces/TEMP of all unreferenced files.
# • End with zero uncommitted files in the working tree.

# ─────────────────────────────────────────────
# 📁 Root Canonicalization
# ─────────────────────────────────────────────
whitelist_root:
  - README.md
  - LICENSE
  - .gitignore
  - package.json
  - package-lock.json
  - NoorCanvas.sln
  - playwright.config.ts
  - playwright.config.js
  - tsconfig.json
  - .editorconfig
  - .gitattributes
  - .github/**

root_cleanup_rules:
  playwright_configs:
    canonical: ["playwright.config.ts", "playwright.config.js"]
    move_non_canonical: "Workspaces/TEMP/playwright/"
  sql_scripts:
    migrations: "Database/Migrations/"
    scripts: "Database/Scripts/"
    temp: "Workspaces/TEMP/sql/"
  powershell:
    validation: "Scripts/Validation/"
    temp: "Workspaces/TEMP/scripts/"
  evidence:
    docs: "Workspaces/Documentation/assets/"
    temp: "Workspaces/TEMP/evidence/"
  configs:
    tsconfig: "tsconfig.json"
    temp: "Workspaces/TEMP/config/"

# ─────────────────────────────────────────────
# 📂 Documentation Consolidation
# ─────────────────────────────────────────────
docs_consolidation:
  - Move all *.md under Workspaces/Documentation
  - Keep only root README.md canonical
  - Exclude `.github/**`, LICENSE, SECURITY.md, CODE_OF_CONDUCT.md
  - Generate Workspaces/Documentation/INDEX.md with table of contents
  - Merge/normalize duplicates; provide stubs linking to canonical versions

# ─────────────────────────────────────────────
# 🧹 TEMP Folder Policy
# ─────────────────────────────────────────────
temp_policy:
  - TEMP is a staging area for stray files.
  - At cleanup end, scan Workspaces/TEMP recursively:
      - If a file is referenced elsewhere (via grep), keep and warn.
      - Otherwise, delete permanently.
  - Remove empty subfolders.
  - Default outcome: TEMP is empty.
  - Ensure .gitignore contains:
      Workspaces/TEMP/**

# ─────────────────────────────────────────────
# ⚖️ Constraints
# ─────────────────────────────────────────────
constraints:
  - Prefer rename/move over delete (preserve history).
  - Only delete if duplicate by hash or unreferenced.
  - Never alter issue trackers or statuses.
  - Only touch outside scope for .gitignore or link fixes.

# ─────────────────────────────────────────────
# 📋 Execution Plan
# ─────────────────────────────────────────────
steps:
  - title: Resolve Effective Scope
    run: Determine scope (default ".").
  - title: .gitignore Audit
    run: >
      Ensure Playwright artifacts and TEMP ignored.
      Add rules for OS/editor junk, caches, logs, tmp/bak files.
  - title: Docs Consolidation
    run: >
      Move scattered .md files into Workspaces/Documentation, update links, 
      generate INDEX.md, merge duplicates.
  - title: Root Canonicalization
    run: >
      Normalize Playwright configs, SQL scripts, PS1 helpers, evidence, and configs
      according to rules; move non-canonicals into TEMP.
  - title: Naming & Link Fixes
    run: Normalize file/folder names; update references across repo.
  - title: TEMP Sweep
    run: >
      Delete all unreferenced files under Workspaces/TEMP; remove empty subfolders.
      Warn if any TEMP files remain due to references.
  - title: Artefact & Cache Cleanup
    run: >
      Purge bin/, obj/, dist/, .cache/, *.tmp, *.bak, *.log. 
      Untrack via git rm if committed accidentally.
  - title: Lint & Format
    run: dotnet format (C#) + prettier (JS/TS/MD).
  - title: Build & Sanity Check
    run: Build app; require 0 errors, ≤2 warnings.
  - title: Zero-Diff Finisher
    run: >
      Stage + commit moves/deletes.
      git clean -fdX.
      Verify working tree is clean (git status empty).

# ─────────────────────────────────────────────
# 🛡️ Regression Guards
# ─────────────────────────────────────────────
guardrails:
  - [playwright] Never commit artifacts (reports/results/artifacts).
  - [docs] Only root README.md at root; others in Workspaces/Documentation.
  - [temp] TEMP must be purged unless files are explicitly referenced.
  - [naming] Enforce kebab-case for test files, PascalCase for C#/Razor.
  - [duplication] Detect duplicates; keep canonical copy only.
  - [tracker] Never touch issue trackers.

# ─────────────────────────────────────────────
# 📤 Output
# ─────────────────────────────────────────────
output:
  - Table: PATH → ACTION (move/delete/keep) → DEST
  - Docs INDEX summary
  - TEMP purge report: deleted N, kept M (with reasons)
  - git status confirmation (empty working tree)
