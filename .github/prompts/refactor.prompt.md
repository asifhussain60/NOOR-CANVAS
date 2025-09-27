---
mode: agent
---

# /refactor — Structural Integrity Agent (v2.2.0, Optimized)

Performs holistic refactors of `{key}` to reduce duplication, remove unused code, improve maintainability, and align with industry standards — while ensuring analyzers, lints, test suites, and functional tests remain completely clean.  

Refactors must **not change existing functionality** under any circumstances.  
Original files must be backed up before modification for traceability.

## Parameters
- **key:** identifier for this work stream (e.g., `vault`).  
  - If not provided, Copilot must infer the key by scanning the current conversation thread and using the **most recently referenced key**.  
  - This assumed key must be logged in the outputs for clarity.
- **notes:** freeform description of the refactor task (areas to target, files/modules, rationale)
- **auditMode:** `full` or `compact`. Default is `compact` (short summary). Use `full` for detailed reports.

## Inputs (read)
- `.github/instructions/SelfAwareness.instructions.md`
- Current codebase and existing test coverage
- Code and tests under `Workspaces/Copilot/prompts.keys/{key}/`
- Requirements and self-review files for `{key}`
- `#getTerminalOutput` for evidence

## Launch Policy
- **Never** use `dotnet run`
- Launch only via:
  - `./Workspaces/Global/nc.ps1`
  - `./Workspaces/Global/ncb.ps1`
- If stopping/restarting the app, log attribution:  
  `[DEBUG-WORKITEM:{key}:lifecycle:{RUN_ID}] agent_initiated_shutdown=true reason=<text> ;CLEANUP_OK`

## Analyzer & Linter Enforcement
- Refactor cannot be marked complete until analyzers, lints, and tests are green.  
- **All warnings must be eliminated** — final build must succeed with **zero errors and zero warnings**.  
- Use marker: `[DEBUG-WORKITEM:{key}:refactor:{RUN_ID}] message ;CLEANUP_OK`

## Refactor Protocol
1. **Scope Confirmation (conditional)**  
   - If refactor touches >5 files, summarize planned changes (affected files, deletions/creations, tests).  
   - Present this scope for approval before execution.  
   - For smaller refactors, skip this step and proceed.

2. **Backup Originals**  
   - Back up each **modified** file into `Workspaces/temp/{key}/` with the same name.  
   - Maintain a reference map of original → refactored files.  
   - Backups may be auto-cleaned after 30 days.  
   - If the user requests *“check original code”*, compare against these backups.

3. **Survey & TODO Checklist**  
   - Identify duplicate, dead, or bloated code.  
   - Extract a **TODO Functionalities Checklist** at the **public API / key feature level** only (not every helper).  
   - Include TODO list in outputs before refactoring.

4. **Systematic Updates**  
   Apply refactorizations with efficiency in mind:
   - Deduplication, dead code removal, encapsulation, separation of concerns  
   - StyleCop + ESLint naming conventions  
   - Prettier for Playwright, StyleCop for .NET  
   - Flag major performance inefficiencies (>O(n²), repeated DB calls) but don’t optimize micro-patterns without approval  
   - File names must be professional and production-ready (no `-fixed`, `-new`, etc.)  
   - Delete obsolete source files once migration is complete  
   - Insert brief rationale comment at top of new files (reason for split, preserved functionality, tests)

5. **Test Safeguards**  
   - Reuse existing tests wherever possible.  
   - Only generate **missing Playwright tests** for uncovered TODO checklist items.  
   - Run Playwright tests **before and after** refactor to confirm no functionality was broken.  
   - Fix issues until suite passes.

6. **Validation Pass**  
   - Run analyzers, lints, and test suite in parallel if possible.  
   - Confirm build completes with **0 errors and 0 warnings**.  
   - Verify TODO checklist items are preserved.  
   - Ensure backups and reference map are updated.

7. **Iterative Refinement**  
   - Work incrementally: checkpoint after deduplication, file splits, and test validation.  
   - If a clean state cannot be achieved after 3 iterations, restore backups and stop.  
   - Require all Playwright and functional tests to pass before proceeding.

## Outputs
- Planned scope (if >5 files touched)  
- TODO Functionalities Checklist  
- Analyzer, linter, and test outcomes  
- Playwright test outcomes confirming functionality preserved  
- Audit report including:  
  - Files deleted, renamed, created  
  - Backup reference map  
  - Terminal evidence tail  
- Explicit statement: **build completed with 0 errors and 0 warnings**  
- In `auditMode=compact`, output a short 10–15 line summary; in `auditMode=full`, provide detailed breakdown.

## Approval Workflow
- Do not mark refactor complete until analyzers, lints, Playwright tests, and build are green and warning-free.  
- Present results and request user confirmation before closing task.

## Guardrails
- Do not remove or alter requirement files unless explicitly instructed  
- Do not touch `appsettings.*.json` or secrets  
- Keep all `{key}`-scoped files in their directories  
- No new roots outside `Workspaces/Copilot/` (except `.github/`)  
- **Obsolete file removal**: delete unused files after migration  
- **Functional safety**: refactor must never change functionality  
- **Backups**: store modified files in `Workspaces/temp/{key}/` for comparison or recovery  

## Database Guardrails
- Never use LocalDB for any database operations  
- Always use the specified SQL Server instance:  
  `Data Source=AHHOME;Initial Catalog=KSESSIONS_DEV;User Id=sa;Password=adf4961glo;Connection Timeout=3600;MultipleActiveResultSets=true;TrustServerCertificate=true;Encrypt=false`  
- Follow port management protocols (nc.ps1/ncb.ps1) for all launches
