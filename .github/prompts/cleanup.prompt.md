---
mode: agent
name: cleanup
alias: /cleanup
description: >
  HIGH-PERFORMANCE disciplined repo cleanup with optimized .gitignore enhancement,
  bulk file operations, and efficient pattern matching. Focus on comprehensive
  .gitignore patterns FIRST to prevent future accumulation of uncommitted files.
  Prioritize speed and efficiency while preserving history and canonical structure.
  Always align with NOOR-CANVAS-DESIGN, ncImplementationTracker, and INFRASTRUCTURE-FIXES-REPORT.

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
  - name: aggressive
    required: false
    description: >
      If true, use bulk operations and skip individual file validation for speed.
      Use for large cleanups (>100 files). Default: false.

# ─────────────────────────────────────────────
# 📖 Usage Examples
# ─────────────────────────────────────────────
# /cleanup
# /cleanup scope:"PlayWright/"
# /cleanup scope:"src/Web/**"
# /cleanup dry_run:false

# ─────────────────────────────────────────────
# 🚀 HIGH-PERFORMANCE GOALS (Optimized Sept 24, 2025)
# ─────────────────────────────────────────────
# • FIRST PRIORITY: Comprehensive .gitignore enhancement to prevent future accumulation
# • BULK OPERATIONS: Use git clean -fdx and Remove-Item -Recurse for speed
# • COUNT-DRIVEN: Use git ls-files --others to quantify scope before action
# • PATTERN VALIDATION: Test .gitignore patterns with git check-ignore before commit
# • ATOMIC COMMITS: Group related changes for clean git history
# • ZERO-DIFF TARGET: Achieve clean working tree with maximum efficiency

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
# ⚡ OPTIMIZED EXECUTION PLAN (Sept 24, 2025 Lessons)
# ─────────────────────────────────────────────
steps:
  - title: "📊 SCOPE ASSESSMENT (Performance First)"
    run: >
      • git ls-files --others --exclude-standard | Measure-Object -Line
      • Count uncommitted files to determine strategy (>100 = aggressive mode)
      • git status --porcelain to identify patterns quickly
      
  - title: "🛡️ .gitignore ENHANCEMENT (Priority #1)"
    run: >
      • IMMEDIATE: Add comprehensive patterns for detected file types
      • Test patterns with git check-ignore before committing
      • Focus on: **/bin/, **/obj/, **/*.log, **/logs/, test-results/, Tests/
      • Add both root-level and SPA-level .gitignore patterns
      • Commit .gitignore changes FIRST before cleanup
      
  - title: "🚀 BULK CLEANUP (High Performance)"
    run: >
      • Use git clean -fdx (if aggressive=true) or selective removal
      • Remove-Item -Recurse -Force for large directories
      • Avoid individual file operations for >50 files
      • Handle permission errors with -ErrorAction SilentlyContinue
      
  - title: "🔍 PATTERN VALIDATION (Quality Gate)"
    run: >
      • Create test files to verify .gitignore patterns work
      • Ensure build/log regeneration doesn't show as uncommitted
      • Fix any pattern gaps immediately
      
  - title: "📁 SELECTIVE CANONICALIZATION (Efficiency Focus)"
    run: >
      • Only move files that are truly misplaced (skip if already organized)
      • Use batch operations for similar file types
      • Skip documentation consolidation if already in Workspaces/Documentation/
      
  - title: "✅ ATOMIC COMMIT & VERIFICATION"
    run: >
      • Single commit for all cleanup changes
      • git status verification (should be empty)
      • No build/format steps unless explicitly requested

# ─────────────────────────────────────────────
# ⚡ PERFORMANCE COMMANDS (Sept 24, 2025 Optimization)
# ─────────────────────────────────────────────
high_performance_commands:
  assessment:
    count_uncommitted: "git ls-files --others --exclude-standard | Measure-Object -Line"
    quick_status: "git status --porcelain"
    test_patterns: "git check-ignore -v 'path/to/test/file'"
    
  bulk_operations:
    aggressive_clean: "git clean -fdx"  # Use for >100 files
    selective_clean: "git clean -fd"    # Use for <100 files  
    bulk_remove: "Remove-Item 'path/**' -Recurse -Force -ErrorAction SilentlyContinue"
    
  gitignore_patterns:
    essential_root: |
      **/bin/
      **/obj/
      **/*.log
      **/*.dll
      **/*.exe
      **/*.pdb
      **/logs/
      test-results/
      /Tests/
    essential_spa: |
      logs/
      logs/**
      **/*noor-canvas-dev-*.txt
      *.log
      
  verification:
    final_check: "git status"
    pattern_test: "git check-ignore 'SPA/NoorCanvas/logs/test.log'"

# ─────────────────────────────────────────────
# 📊 RETROSPECTIVE INTEGRATION (Sept 22-24, 2025)
# ─────────────────────────────────────────────
context_first_protocol:
  - title: "Read Self-Awareness Instructions First"  
    details: |
      • ALWAYS read .github/instructions/SelfAwareness.instructions.md before starting
      • Review recent conversation history for context and cleanup patterns
      • Check ncImplementationTracker.MD for repository organization lessons
      • Maintain awareness of current development state and active work

efficiency_patterns:
  - title: "⚡ High-Performance Operations (Sept 24 Optimizations)"
    details: |
      • MEASURE FIRST: Count files with git ls-files --others | Measure-Object
      • BULK OPERATIONS: Use git clean -fdx for >100 files, selective for <100
      • PATTERN-FIRST: Fix .gitignore BEFORE cleanup to prevent regeneration
      • AVOID LOOPS: Use PowerShell bulk operations instead of individual file handling
      • TEST FAST: Use git check-ignore to validate patterns without file creation
      • COMMIT ATOMIC: Single commit for all cleanup to maintain clean history

  - title: "🎯 Targeted Efficiency (Lessons Learned)"
    details: |
      • SKIP if organized: Don't move files already in correct locations
      • DUAL .gitignore: Update both root and SPA-level .gitignore files
      • HANDLE PERMISSIONS: Use -ErrorAction SilentlyContinue for bulk operations
      • AVOID INTERACTIVE: Never use interactive git commands in automation
      • COUNT VERIFY: Use Measure-Object to confirm file counts before/after

# ─────────────────────────────────────────────
# �🛡️ Regression Guards
# ─────────────────────────────────────────────
guardrails:
  - [performance] Count files first: >100 uncommitted = use aggressive bulk operations
  - [patterns] Test .gitignore with git check-ignore before committing changes
  - [atomicity] Single commit for cleanup, don't mix with feature changes
  - [dual-ignore] Update both root .gitignore AND SPA/NoorCanvas/.gitignore
  - [bulk-safety] Use -ErrorAction SilentlyContinue for permission-sensitive operations
  - [playwright] Never commit artifacts (reports/results/artifacts)
  - [docs] Only root README.md at root; others in Workspaces/Documentation
  - [temp] TEMP must be purged unless files are explicitly referenced
  - [interactive] Avoid git clean interactive prompts in automation
  - [verification] Always end with git status verification (empty = success)

# ─────────────────────────────────────────────
# � PERFORMANCE OUTPUT (Optimized Reporting)
# ─────────────────────────────────────────────
output:
  - Performance metrics: Files processed, time saved, operations used
  - Before/After count: "git ls-files --others | Measure-Object" comparison
  - .gitignore enhancements: Patterns added, coverage achieved
  - Bulk operations summary: Directories removed, files cleaned
  - git status confirmation: "working tree clean" = SUCCESS
  - Pattern validation: git check-ignore test results
  
# ─────────────────────────────────────────────
# 🏆 SUCCESS CRITERIA (Sept 24 Standards)
# ─────────────────────────────────────────────
success_metrics:
  - Zero uncommitted files: git status --porcelain returns empty
  - Pattern coverage: .gitignore handles all detected file types
  - Performance target: >100 files cleaned in <5 operations
  - No regeneration: Build/run doesn't create new uncommitted files
  - Atomic history: Single cleanup commit with comprehensive message
