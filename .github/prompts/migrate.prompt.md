---
mode: agent
---

# /migrate — Repository Migration Agent (v3.0.0)

Performs selective repository reorganization to complete `Workspaces/Copilot/` structure while preserving working systems.

**Core Mandate:** Follow `.github/instructions/SelfAwareness.instructions.md` for all operating guardrails.

## Parameters
- **key:** Migration scope identifier (optional)
- **log:** Debug verbosity (`none`, `simple`, `trace`)
- **notes:** Migration task description (folders, paths, constraints)

## Context & Assessment
- **MANDATORY:** `.github/instructions/SelfAwareness.instructions.md` (operating guardrails)
- **MANDATORY:** `.github/instructions/Ref/SystemStructureSummary.md` (architectural mappings and structural orientation)
- **Architecture:** `.github/instructions/Ref/NOOR-CANVAS_ARCHITECTURE.MD`
- Current repository structure and scattered files
- `#getTerminalOutput` for runtime validation

### Migration Status
- ✅ `config/testing/` structure operational
- ✅ `Workspaces/Global/` commands functional  
- ✅ `Workspaces/Copilot/_DOCS/` hierarchy established
- 🔄 **Focus:** Documentation organization and cleanup

## Operating Protocols
**Reference:** SelfAwareness.instructions.md for complete launch, database, analyzer, and linter rules.

### Quality Gates
- Migration complete only when: analyzers green, linters clean, tests passing
- Debug marker: `[DEBUG-WORKITEM:{key}:migrate:{RUN_ID}] message ;CLEANUP_OK`

## Execution Protocol
1. **Documentation Organization:** Consolidate scattered files into `Workspaces/Copilot/_DOCS/`
   - Analysis files → `/analysis/`
   - Summary files → `/summaries/`  
   - Config docs → `/configs/`
   - Migration reports → `/migrations/`
2. **Organize scoped prompts**:
   - Move key-specific prompts → `Workspaces/Copilot/prompts.keys/{key}/`
   - Keep canonical prompts in `.github/prompts/` (already correct)
3. **Clean up obsolete files**:
   - Remove duplicate or outdated documentation
   - Remove temporary files from root or inappropriate locations
4. **Update path references** (where necessary):
   - Fix inconsistent prompt file references
   - Update documentation that references old paths
5. **Preserve working systems**:
   - Keep `Workspaces/Global/` commands in place (PATH integration)
   - Keep `config/testing/` structure (already migrated and working)
   - Keep working GitHub workflows and npm scripts
6. Run analyzers, lints, and tests to confirm nothing broken

## Iterative Validation
- Run analyzers and lints after each stage
- Run Playwright cumulative suite against migrated structure
- Repeat until all results are green

## Terminal Evidence
- Capture 10–20 lines from `#getTerminalOutput` showing analyzers/lints/tests succeeding
- Include in migration summary

## Outputs
Summaries must include:
- Files/folders moved
- References updated
- Analyzer/linter results
- Test results
- Terminal Evidence tail

## Approval Workflow
- Do not declare migration complete until analyzers, lints, and tests are all green
- After green run, present migration summary
- Request confirmation to finalize

## Guardrails
- **Do not move working systems**:
  - Keep `Workspaces/Global/` commands (PATH integration dependency)
  - Keep `config/testing/` structure (already migrated and working)
  - Keep working npm scripts and GitHub workflows
- **Do not touch**:
  - Secrets (`appsettings.*.json`)
  - Test files or requirements
  - PowerShell profile integration files
- **Safe to move**:
  - Documentation files (analysis, summaries)
  - Orphaned or duplicate files
  - Files in inappropriate locations (root clutter)
- **Target structure**: Only move files into `Workspaces/Copilot/_DOCS/` hierarchy
- **No new roots** outside `Workspaces/Copilot/` (except `.github/`)

## Database Guardrails
**See SelfAwareness.instructions.md for complete database connectivity and port management protocols.**

---

_Note: This file depends on the central `Ref/SystemStructureSummary.md`. If structural changes are made, update that summary._

---

_Important: When suggesting or implementing changes, you must **only commit** after the implementation is complete **and explicit approval is received from the User**._

---

### Approval Checklist (required before commit)
- [ ] User has reviewed the proposed changes
- [ ] User has explicitly approved the commit
- [ ] All instructions in Ref/SystemStructureSummary.md are respected
- [ ] No conflicts remain with other prompts or instruction files

_Do not commit until all items are checked and explicit approval is confirmed._
