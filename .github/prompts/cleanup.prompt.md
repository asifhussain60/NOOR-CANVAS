---
mode: agent
---
name: cleanup
description: >
  Comprehensive repo cleanup. Enforces industry-standard file names, consolidates and optimizes
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

## Constraints & Principles
- Prefer **conventional, well-known names**:
  - `README.md` (canonical instruction/usage guide – the ONE).
  - `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `LICENSE`, `CHANGELOG.md` (only if applicable).
  - For docs site: keep under `docs/` with `docs/index.md` but keep **one** top-level instructional entry point in `README.md`.
- No placeholder names: `clean`, `cleaned`, `fixed`, `final`, `new`, `copy`, `backup`, `old`, `tmp`, `test`, `junk`, dates/timestamps in names (unless changelog).
- Preserve history by **renaming/moving** instead of deleting where content is canonical; delete only redundant/outdated.
- Keep the repo **language-agnostic**: detect stack and choose appropriate tools.

## Test File Organization Principles
- **DO NOT MOVE SUCCESSFUL TESTS TO TEMP**: Test files that represent successful issue resolution should be preserved in dedicated testing workspaces.
- **Organize by Issue Resolution**: Create structured directories under `Workspaces/Testing/` organized by resolved issue numbers.
- **Two-Way Linking**: Maintain bidirectional references between test files and issue tracker entries.
- **Dedicated Test Locations**: 
  - `Workspaces/Testing/Issue-###-Description/` for issue-specific test files
  - `Workspaces/Testing/Category/` for general testing by category (e.g., Host-Authentication, API-Validation)
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
   - **ORGANIZE SUCCESSFUL TEST FILES**: Move test files that represent successful issue resolution to dedicated testing workspaces:
     - Create `Workspaces/Testing/Issue-###-Description/` directories for issue-specific tests
     - Create `Workspaces/Testing/Category/` directories for general testing categories
     - Add README.md documentation with two-way links to issue tracker
     - Update issue tracker with references to test file locations
   - **DO NOT MOVE SUCCESSFUL TESTS TO TEMP**: Test files are reference implementations, not temporary artifacts.

5) **TEMP Hygiene**
   - Clear irrelevant items in `/TEMP`, `/temp`, `/tmp`, `.cache`, and common tool temp dirs **that are not tracked by VCS**.
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

**Inventory & Similarity (Bash)**
```bash
# From {{scope || project root}}
rg -n --hidden --glob '!node_modules' --glob '!*dist*' -i '^(# |## )' -g '*.{md,MD}' > .cleanup_headings.txt
fdupes -r . > .cleanup_dupes.txt || true  # if available; otherwise use 'rdfind' or hash script
