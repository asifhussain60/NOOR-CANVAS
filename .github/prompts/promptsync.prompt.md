---
mode: agent
---

# /promptsync — Instruction & Prompt Synchronizer (v3.0.0)

Synchronizes all instruction and prompt files within `.github` folder, reconciles overlaps, removes contradictions, and optimizes for efficiency.

**Core Mandate:** Follow `.github/instructions/SelfAwareness.instructions.md` for all operating guardrails.

## Parameters
- **scope:** Target scope (`instructions`, `prompts`, `all`) - default: `all`
- **notes:** Sync goals, conflicts, or constraints to resolve

## Context & Inputs
- **MANDATORY:** `.github/instructions/SelfAwareness.instructions.md` (operating guardrails)
- **MANDATORY:** `.github/instructions/SystemStructureSummary.md` (architectural mappings and structural orientation)
- All `.github/**/*.instructions.md` and `.github/**/*.prompt.md` files
- Repository structure for `.github` folder
- `#getTerminalOutput` for validation evidence

## Operating Protocols
**Reference:** SelfAwareness.instructions.md for complete launch, database, analyzer, and linter rules.

## Synchronization Protocol
1. **File Consistency:** Align priority hierarchies, remove obsolete directives
2. **Structural Alignment:** Ensure accurate folder references, resolve cross-prompt conflicts
3. **Optimization:** Reduce redundancy, improve fault tolerance
4. **Validation:** Verify synchronization via terminal evidence
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


---

_Note: This file depends on the central `SystemStructureSummary.md`. If structural changes are made, update that summary._

---

_Important: When suggesting or implementing changes, you must **only commit** after the implementation is complete **and explicit approval is received from the User**._

---

### Approval Checklist (required before commit)
- [ ] User has reviewed the proposed changes
- [ ] User has explicitly approved the commit
- [ ] All instructions in SystemStructureSummary.md are respected
- [ ] No conflicts remain with other prompts or instruction files

_Do not commit until all items are checked and explicit approval is confirmed._
