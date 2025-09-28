---
mode: agent
---

# /cleanup — Cleanup Agent (v3.0.0)

Removes unused files, simplifies duplicate code, normalizes formatting, and validates results with analyzers/linters/tests.

**Core Mandate:** Follow `.github/instructions/SelfAwareness.instructions.md` for all operating guardrails.

## Parameters
- **key:** Work stream identifier (e.g., `vault`) - auto-inferred if not provided
- **notes:** Cleanup task description (scope, files, edge cases)

## Context & Inputs
- **MANDATORY:** `.github/instructions/SelfAwareness.instructions.md` (operating guardrails)
- **MANDATORY:** `.github/instructions/SystemStructureSummary.md` (architectural mappings and structural orientation)
- **Architecture:** `.github/instructions/NOOR-CANVAS_ARCHITECTURE.MD`
- Current codebase and file organization
- `Workspaces/Copilot/prompts.keys/{key}/` work stream files
- `#getTerminalOutput` for execution evidence

## Operating Protocols
**Reference:** SelfAwareness.instructions.md for complete launch, database, analyzer, and linter rules.

### Quality Gates
- **Completion Criteria:** Quality gates complete only when: analyzers green, linters clean, tests passing
- Debug marker: `[DEBUG-WORKITEM:{key}:cleanup:{RUN_ID}] message ;CLEANUP_OK`
- Logging modes: `none`, `simple`, `trace`

## Execution Protocol
1. **File Cleanup:** Remove unused files, obsolete artifacts, redundant snapshots
2. **Code Simplification:** Eliminate duplicate/unreferenced code
3. **Format Normalization:** Apply project standards (Prettier/Playwright, StyleCop/C#)
4. **Iterative Validation:** Repeat analyzer → linter → test cycles until clean
5. **Evidence Capture:** Include 10-20 lines from `#getTerminalOutput` in completion summary

## Completion Criteria
- Zero analyzer warnings
- Zero linter errors  
- All tests passing
- Clean git status (if applicable)
- Include in summary

## Outputs
Summaries must include:
- Analyzer/linter results after cleanup
- Test suite results (pass/fail counts)
- Terminal Evidence tail

## Approval Workflow
- Do not declare cleanup complete until analyzers, lints, and tests are green
- After green run, request confirmation from user
- Then finalize cleanup task

## Guardrails
- Never remove requirement or test files unless explicitly orphaned and confirmed
- Never modify `appsettings.*.json` or secrets
- Keep all `{key}`-scoped files in their directories
- Never create new roots outside `Workspaces/Copilot/` (except `.github/`)

---

## Variable Cleanup
- Remove unused variables and their references entirely
- Never silence warnings by adding underscores

## TypeScript Cleanup
- Replace all implicit or explicit `any` types with proper TypeScript types
- Prefer Node.js and Playwright native types (e.g., IncomingMessage, Page)

## Import Rules
- Enforce ES6 import/export syntax only
- Remove all CommonJS `require()` usage

## Cleanup Progress Tracking
- Track cleanup in structured phases (warnings → errors → formatting → validation)
- Report progress with counts of fixed vs remaining issues

---

## File Relocation Rules

You are responsible for cleaning the repository of stray or misplaced files to keep the root and solution folders organized.

### Objectives
- Maintain a clean root directory (only solution files, configs, and top-level project folders should live here)
- Relocate stray Markdown, text, log, and Playwright test files into their dedicated locations
- Ensure idempotency: do not re-move files already in their correct target
- Never remove critical solution or config files

### Database Guardrails
**See SelfAwareness.instructions.md for complete database connectivity and port management protocols.**

### File Relocation Rules (YAML)
```yaml
rules:
  - match: "**/*.md"
    exclude:
      - "README.md"
    action: move
    target: "Workspaces/Copilot/_DOCS/analysis"
  - match: "**/*.txt"
    action: move
    target: "Workspaces/Copilot/_DOCS/analysis"
  - match: "**/*.log"
    action: move
    target: "Workspaces/Copilot/_DOCS/summaries"
  - match: "**/*.spec.ts"
    action: move
    target: "PlayWright/tests"
  - match: "**/*.test.ts"
    action: move
    target: "PlayWright/tests"
```

---

_Note: This file depends on the central `SystemStructureSummary.md`. If structural changes are made, update that summary._


---

## API Contract Validation Integration

- When tasks involve **API contracts** or DTOs, ensure `API-Contract-Validation.md` is updated.  
- `API-Contract-Validation.md` contains the authoritative validation rules for APIs and must always be kept in sync.  
- Alongside this, update `SystemStructureSummary.md` (snapshot) and `NOOR-CANVAS_ARCHITECTURE.MD` (detailed design).  

---

_Important: When suggesting or implementing changes, you must **only commit** after the implementation is complete **and explicit approval is received from the User**._

---

### Approval Checklist (required before commit)
- [ ] User has reviewed the proposed changes
- [ ] User has explicitly approved the commit
- [ ] All instructions in SystemStructureSummary.md are respected
- [ ] No conflicts remain with other prompts or instruction files

_Do not commit until all items are checked and explicit approval is confirmed._
