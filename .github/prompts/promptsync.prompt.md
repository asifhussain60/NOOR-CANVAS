---
mode: agent
---
title: promptsync — Instruction & Prompt Synchronizer
version: 1.1.0
appliesTo: /promptsync
---

# /promptsync — Instruction & Prompt Synchronizer

Ensures all instruction files and prompt files within the `.github` folder are fully aligned and synchronized.  
The agent reconciles overlaps, removes contradictions, enforces folder-structure consistency, and optimizes instructions for efficiency and fault reduction.

---

## Parameters
- **scope:** target scope (default: `all`)  
  - Options: `instructions`, `prompts`, or `all`  
- **notes:** freeform description of specific sync goals, conflicts, or constraints to resolve

---

## Inputs (read)
- `.github/**/*.instructions.md`
- `.github/**/*.prompt.md`
- Repository file/folder structure for `.github`
- `#getTerminalOutput` for validation of sync effects

---

## Launch Policy
- **Never** run application builds directly from `dotnet run`
- Use only the approved global launch scripts:
  - `./Workspaces/Copilot/Global/nc.ps1`
  - `./Workspaces/Copilot/Global/ncb.ps1`

---

## Synchronization Rules

### File Consistency
- Align all `.instructions.md` and `.prompt.md` files with the same **priority hierarchy**.
- Remove obsolete or conflicting directives (favor latest and most stable).
- Ensure file naming matches intended folder structure (`Workspaces/Copilot/prompts.keys/{key}/...` where relevant).

### Structural Alignment
- Folder references must be accurate and non-redundant.
- Cross-prompt references must not conflict (e.g., cleanup agent vs. migrate agent).

### Optimization & Fault Reduction
- Deduplicate overlapping guidance.
- Normalize repeated rules into consistent patterns.
- Ensure terminal commands reference only global PowerShell scripts (`nc.ps1`, `ncb.ps1`).
- Guarantee analyzer, linter, and test suite enforcement rules are harmonized.

---

## Conflict Resolution Policy

- If **no conflicts** are detected, proceed with synchronization automatically.  
- If **conflicts are detected**:
  1. **Pause immediately** and notify the user of the conflict type (file content, priority hierarchy, or folder structure).  
  2. **Ask one clear, focused question** about how to resolve the conflict.  
  3. **Wait for user input** before taking any action.  
  4. **Apply the chosen resolution** and confirm the change back to the user.  
  5. **Move to the next conflict** and repeat until all conflicts are addressed.  

This structured Q&A flow ensures Copilot never makes unilateral decisions.

---

## Analyzer & Validation Enforcement
After synchronization:
- Run `dotnet build --no-incremental` for structural validation
- Run `dotnet test` and Playwright tests to confirm no regressions
- Verify analyzers/lints (StyleCop, ESLint, Prettier) for consistent compliance

---

## Completion Policy
When sync completes:
- Summarize changes (resolved conflicts, merged priorities, normalized structures)
- If conflicts were resolved interactively, include a log of each Q&A exchange
- Emit a `SYNC_COMPLETED` status line with timestamp and details of adjustments
