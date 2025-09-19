---
mode: agent
---
name: cleanup
description: >
  Comprehensive repo cleanup. Enforces industry-standard file names, consolidat8) **Commit & Push**
   - Stage all changes.
   - Commit with a comprehensive message (template below).
   - Push to the current branch's `origin`.
   - Verify "working tree clean" (`git status --porcelain` empty). Git Extensions should show 0 uncommitted files.

## Success Metrics & Validation (NOOR Canvas Example)

### Cleanup Success Indicators
- **File Reduction**: Successfully removed 916+ files while preserving functionality
- **Line Reduction**: Eliminated 118K+ lines of outdated/redundant content
- **Test Organization**: Centralized 121 tests in 29 files under PlayWright/ structure
- **Functional Validation**: All tests remain discoverable and executable after reorganization
- **Build Success**: Project builds successfully with `dotnet build` after cleanup
- **Historical Preservation**: Valuable debugging insights archived in IssueTracker/COMPLETED/
- **Issue Tracker Synchronization**: 100% consistency between tracker file and folder structure:
  - All tracker entries have corresponding issue files in correct status folders
  - All issue files are properly referenced in main tracker with accurate status icons
  - No orphaned files or missing references detected
  - File path links match actual locations after cleanup reorganization

### Post-Cleanup Validation
1. **Test Discovery**: Verify all tests are discoverable: `npx playwright test --list`
2. **Build Verification**: Confirm clean build: `dotnet build`
3. **Configuration Integrity**: Validate config file redirections work correctly
4. **Documentation Links**: Check that all cross-references and links remain functional
5. **Issue Tracker Consistency**: Validate bi-directional sync between tracker file and folders:
   - All tracker issue entries have corresponding files in correct status folders
   - All issue files in folders are referenced in main tracker
   - Status icons match folder locations (❌→NOT STARTED, ⚡→IN PROGRESS, ⏳→AWAITING_CONFIRMATION, ✅→COMPLETED)
   - File path links in tracker point to actual file locations
   - No orphaned files or missing references
6. **Git Status**: Ensure working tree is clean with no uncommitted artifacts

### Lessons Learned
- **Centralized Test Infrastructure**: Single PlayWright/ directory improves maintainability over scattered test locations
- **Script Organization**: Dedicated Scripts/ directory with logical subdirectories improves team collaboration  
- **Content Preservation**: Archive valuable debugging content in issue tracker rather than deleting outright
- **Incremental Validation**: Test functionality after each major reorganization phase to catch issues early
- **Clear Communication**: Detailed commit messages and documentation updates help team understand changesd optimizes
  instructional Markdown, removes duplicates and TEMP clutter, runs linters/formatters,
  builds the project, and pushes a clean commit so Git history and Git Extensions show 0 uncommitted files.
parameters:
  - name: scope
    description: Optional subfolder to limit work (default is project root).
---

## Goals
- Enforce clean structure and **industry-standard filenames**.
- Review/merge **instructional .MD** files into a single canonical guide to avoid confusion.
- Remove duplicates / poorly named files (ban placeholders like “clean/cleaned/fixed/new/final_v2”).
- Purge nonessential items from **TEMP**.
- Run **linters/formatters**; ensure syntax integrity.
- **Build** successfully.
- Commit with a **clear, comprehensive message** and **push**; working tree must be pristine (0 uncommitted files).

## Project Structure Patterns (NOOR Canvas)

### Established Directory Structure
- **PlayWright/**: Centralized test infrastructure
  - `config/`: Test configuration files
  - `tests/`: All test files organized by feature
  - `reports/`: Test execution reports
  - `results/`: Test result artifacts
  - `artifacts/`: Screenshots, videos, and test data
- **Scripts/**: Organized build and validation scripts
  - `Validation/`: Issue validation scripts
  - Root-level convenience scripts (build-with-iiskill.ps1, run-with-iiskill.ps1)
- **IssueTracker/**: Issue management with proper status directories
  - `COMPLETED/`: Archived completed issues with technical insights
  - `IN PROGRESS/`: Active work items
  - `NOT STARTED/`: Planned work
- **Documentation/**: Technical documentation separate from root-level files

### Root-Level File Organization
- Keep only essential files in root: README.md, .sln, package.json, configuration files
- Archive or relocate lengthy analysis files to appropriate subdirectories
- Maintain single source of truth for each type of documentation

## Constraints & Principles
- Prefer **conventional, well-known names**:
  - `README.md` (canonical instruction/usage guide – the ONE).
  - `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `LICENSE`, `CHANGELOG.md` (only if applicable).
  - For docs site: keep under `docs/` with `docs/index.md` but keep **one** top-level instructional entry point in `README.md`.
- No placeholder names: `clean`, `cleaned`, `fixed`, `final`, `new`, `copy`, `backup`, `old`, `tmp`, `test`, `junk`, dates/timestamps in names (unless changelog).
- Preserve history by **renaming/moving** instead of deleting where content is canonical; delete only redundant/outdated.
- Keep the repo **language-agnostic**: detect stack and choose appropriate tools.

## Issue Tracker Synchronization Principles
- **MASTER TRACKER FILE**: `IssueTracker/ncIssueTracker.MD` serves as single source of truth for issue status
- **FOLDER STRUCTURE CONSISTENCY**: Each issue mentioned in tracker must have corresponding `.md` file in appropriate status folder:
  - `IssueTracker/NOT STARTED/` - Issues that haven't been worked on (❌ icon)
  - `IssueTracker/IN PROGRESS/` - Issues currently being developed (⚡ icon)  
  - `IssueTracker/AWAITING_CONFIRMATION/` - Issues pending validation or testing (⏳ icon)
  - `IssueTracker/COMPLETED/` - Fully resolved issues with implementation details (✅ icon)
- **BI-DIRECTIONAL SYNC**: Every file in status folders should be referenced in main tracker file
- **STATUS ACCURACY**: Issue files must be in folders matching their current status in tracker
- **ICON-STATUS MAPPING**: Status icons in tracker must match folder locations:
  - ❌ (NOT STARTED) → `NOT STARTED/` folder
  - ⚡ (IN PROGRESS) → `IN PROGRESS/` folder
  - ⏳ (AWAITING CONFIRMATION) → `AWAITING_CONFIRMATION/` folder
  - ✅ (RESOLVED/COMPLETED) → `COMPLETED/` folder
- **TODO INTEGRATION**: All TODOs mentioned in tracker must have corresponding detail files
- **ORPHAN DETECTION**: Identify and integrate files that exist in folders but aren't referenced in tracker
- **HISTORICAL PRESERVATION**: Archive analysis documents and audit reports in COMPLETED folder with proper references
- **LINK ACCURACY**: File path links in tracker must match actual file locations after folder moves

## Test File Organization Principles
- **CENTRALIZED PLAYWRIGHT STRUCTURE**: All Playwright tests should be organized under `PlayWright/` directory with subdirectories:
  - `PlayWright/tests/` - All .spec.ts/.spec.js test files (centralized from Tests/UI/)
  - `PlayWright/reports/` - HTML test reports 
  - `PlayWright/results/` - JSON test results
  - `PlayWright/artifacts/` - Screenshots, videos, traces
  - `PlayWright/config/` - Configuration files
- **DO NOT MOVE SUCCESSFUL TESTS TO TEMP**: Test files that represent successful issue resolution should be preserved in dedicated testing workspaces.
- **Issue-Specific Test Organization**: 
  - Tests for specific issues should remain in centralized `PlayWright/tests/` with issue naming (e.g., `issue-119-playwright-reorganization-validation.spec.ts`)
  - Create `Workspaces/Testing/Issue-###-Description/` only for complex multi-file test scenarios
- **Two-Way Linking**: Maintain bidirectional references between test files and issue tracker entries.
- **Documentation Requirements**: Each test directory must include README.md with:
  - Links back to source issue in tracker
  - Description of test purpose and validation results  
  - Cross-references to related components and files
- **Preservation Standards**: Test files represent reference implementations and should be maintained as permanent documentation.

## High-Level Plan (Copilot Execution Order)
1) **Detect Project Stack & Tooling**
   - If `package.json` → Node/TS/JS; use `eslint` + `prettier`.
   - If `pyproject.toml`/`requirements.txt` → Python; use `ruff` (lint) + `black` (format).
   - If `go.mod` → Go; use `go fmt` + `go vet`.
   - If `.csproj`/`sln` → .NET; use `dotnet format` + `dotnet build`.
   - If `pom.xml`/`gradle.*` → Java; use `mvn -q -DskipTests=false verify` or `gradle build`.
   - If multiple stacks, run each stack’s linter/build for touched files.

2) **Inventory Instructional Markdown**
   - Find likely instruction files:
     - `README*.md`, `ReadMe.md`, `readme.md`, `HOWTO*.md`, `GUIDE*.md`, `INSTRUCTIONS*.md`,
       `USAGE*.md`, `SETUP*.md`, `Onboarding*.md`, `docs/**/*.md`.
   - Identify duplicates/near-duplicates by:
     - Similar titles/first H1, high line overlap, or identical sections.
   - Choose the **canonical** doc:
     - Prefer root `README.md`. If missing, create it and consolidate content there.
     - Keep **one** “instructional hub”: usage, setup, build/run, test, troubleshooting, structure overview, links to deep docs.
   - **Merge** relevant content from others into `README.md` with clean headings. Remove contradicting/outdated parts.
   - For specialized policies already standard-named (e.g., `CONTRIBUTING.md`), keep them and link from `README.md`.

3) **Enforce Naming Standards**
   - Rename mis-cased/variant `README` to `README.md`.
   - Normalize other standard files to exact casing above.
   - Consolidate “feature guides” into `README.md` sections or `docs/feature-name.md` with kebab-case.
   - Delete/replace poorly named files (e.g., `setup_new.md`, `instructions_final.md`) once merged.

4) **Duplicate & Orphan Cleanup & Test File Organization**
   - Detect file dupes (hash match or >90% similarity). Keep the newest **valid** content.
   - Remove unused screenshots/assets if no references remain (grep for paths).
   - Ensure there is **one** of each standard file (e.g., one `LICENSE`, one `README.md`).
   - **CENTRALIZE PLAYWRIGHT TESTS**: Consolidate all test files under `PlayWright/tests/` directory:
     - Move .spec.ts/.spec.js files from `Tests/UI/` to `PlayWright/tests/`
     - Organize test artifacts under `PlayWright/` subdirectories (reports, results, artifacts)
     - Update configuration to reference centralized structure
     - Remove old test artifact directories after successful migration
   - **ORGANIZE SCRIPTS**: Create `Scripts/` directory with logical subdirectories:
     - `Scripts/Validation/` for issue validation files (validate-issue-*.*)
     - `Scripts/` root for build/deployment scripts (build-with-*.ps1, run-with-*.ps1)
   - **ARCHIVE OUTDATED DOCUMENTATION**: Move historical analysis to issue tracker:
     - Preserve valuable debugging insights in `IssueTracker/COMPLETED/Historical-*.md`
     - Remove outdated root-level documentation files after content preservation
   - **DO NOT MOVE SUCCESSFUL TESTS TO TEMP**: Test files are reference implementations, not temporary artifacts.
   - **SYNCHRONIZE ISSUE TRACKER**: Ensure IssueTracker structure is consistent and up-to-date:
     - **Parse Tracker File**: Extract all issue references from `IssueTracker/ncIssueTracker.MD` with their status icons (❌⚡⏳✅)
     - **Validate File Existence**: Verify each tracker entry has corresponding `.md` file in appropriate status folder
     - **Detect Status Mismatches**: Compare issue icons in tracker with actual folder locations:
       - ❌ issues must be in `NOT STARTED/` folder
       - ⚡ issues must be in `IN PROGRESS/` folder  
       - ⏳ issues must be in `AWAITING_CONFIRMATION/` folder
       - ✅ issues must be in `COMPLETED/` folder
     - **Move Misplaced Files**: Relocate issue files to folders matching their tracker status
     - **Update File Links**: Correct file path references in tracker after moving files
     - **Orphan Integration**: Scan all status folders for files not referenced in tracker and add entries
     - **Missing File Creation**: Create skeleton `.md` files for tracker entries without corresponding files
     - **TODO Validation**: Ensure all TODOs mentioned in tracker have corresponding detail files in appropriate folders
     - **Status Icon Correction**: Update tracker icons to match actual implementation progress and folder locations
     - **Historical Analysis**: Archive completed analysis documents with proper status folder placement and tracker references

5) **Build Artifacts & Cache Cleanup**
   - Remove .NET build artifacts: `bin/`, `obj/` directories from all projects
   - Clear application logs: `logs/*.txt` files from SPA directories  
   - Clean test cache: `.test-cache/` contents
   - Remove temporary build files: `.cache`, `*.tmp`, `*.bak` files
   - Clear TEMP directories of test artifacts that have been centralized under PlayWright/
   - Add/update `.gitignore` to prevent reappearance (e.g., `temp/`, `*.log`, coverage artifacts, build outputs).

6) **Lint & Format (Touched Files)**
   - Install missing dev dependencies when safe (e.g., `eslint`, `prettier`, `ruff`, `black`).
   - Run formatters first, then linters with `--fix` where supported.
   - Fail the process if any fatal lint or syntax error remains.

7) **Build & Sanity Checks**
   - Run the project’s build (auto-detect from scripts/config).
   - Optionally run smoke tests (`npm test -w 1 -i`, `pytest -q -k smoke`, etc.) if present and quick.

8) **Commit & Push**
   - Stage all changes.
   - Commit with a comprehensive message (template below).
   - Push to the current branch’s `origin`.
   - Verify “working tree clean” (`git status --porcelain` empty). Git Extensions should show 0 uncommitted files.

## Command Playbook (Cross-Platform)
Use the variant that matches the user shell; prefer Bash in VSCode integrated terminal, with PowerShell alternatives.

**Issue Tracker Synchronization (PowerShell)**
```powershell
# Extract issue references and status icons from tracker file
rg -o 'Issue-\d+.*?[❌⚡⏳✅]' IssueTracker/ncIssueTracker.MD > .tracker_issues.txt

# Find all issue files in status folders
Get-ChildItem "IssueTracker\*\Issue-*.md" -Recurse | ForEach-Object { "$($_.Directory.Name)\$($_.Name)" } > .folder_issues.txt

# Compare tracker references with actual files to find mismatches
# Use file comparison to identify orphaned files and missing references

# Verify TODO files existence  
rg -o 'TODO-\d+.*?[❌⚡⏳✅]' IssueTracker/ncIssueTracker.MD > .tracker_todos.txt
Get-ChildItem "IssueTracker\*\TODO-*.md" -Recurse | ForEach-Object { "$($_.Directory.Name)\$($_.Name)" } > .folder_todos.txt

# Issue Status Validation and Auto-Fix
function Sync-IssueTracker {
    # Parse tracker for issue status mappings
    $trackerIssues = @{}
    rg '### \*\*Issue-(\d+).*?\*\* ([❌⚡⏳✅])' IssueTracker/ncIssueTracker.MD | ForEach-Object {
        if ($_ -match 'Issue-(\d+).*?([❌⚡⏳✅])') {
            $issueNum = $matches[1]
            $icon = $matches[2]
            $expectedFolder = switch ($icon) {
                '❌' { 'NOT STARTED' }
                '⚡' { 'IN PROGRESS' } 
                '⏳' { 'AWAITING_CONFIRMATION' }
                '✅' { 'COMPLETED' }
            }
            $trackerIssues[$issueNum] = $expectedFolder
        }
    }
    
    # Check actual file locations and move if needed
    Get-ChildItem "IssueTracker\*\Issue-*.md" -Recurse | ForEach-Object {
        if ($_.Name -match 'Issue-(\d+)') {
            $issueNum = $matches[1]
            $currentFolder = $_.Directory.Name
            $expectedFolder = $trackerIssues[$issueNum]
            
            if ($expectedFolder -and $currentFolder -ne $expectedFolder) {
                Write-Host "Moving Issue-$issueNum from $currentFolder to $expectedFolder"
                Move-Item $_.FullName "IssueTracker\$expectedFolder\$($_.Name)" -Force
            }
        }
    }
}
```

**Inventory & Similarity (Bash)**
```bash
# From {{scope || project root}}
rg -n --hidden --glob '!node_modules' --glob '!*dist*' -i '^(# |## )' -g '*.{md,MD}' > .cleanup_headings.txt
fdupes -r . > .cleanup_dupes.txt || true  # if available; otherwise use 'rdfind' or hash script
