---
mode: agent
---

# /migrate — Repo Folder Migration Agent (v2.4.0)

Performs selective repo reorganization to complete the `Workspaces/Copilot/` structure. Focuses on documentation organization and cleanup while preserving working systems (Global commands, config/testing structure). Ensures analyzers, lints, and test suites remain healthy.

## Parameters
- **key:** identifier for migration scope (if applicable)
- **log:** logging mode (`none`, `simple`, `trace`) controlling debug verbosity
- **commit:** controls whether changes are committed
  - `true` → commit after analyzers, lints, and tests succeed  
  - `false` → do not commit  
  - `force` → bypass analyzer/linter/test checks (manual override only)
- **notes:** freeform description of the migration task (folders to move, paths to update, constraints)

## Inputs (read)
- `.github/instructions/SelfAwareness.instructions.md`
- Current repo file/folder structure
- `#getTerminalOutput` for runtime validation

## Current State Assessment
- ✅ **Configs already migrated**: `config/testing/` structure in place and working
- ✅ **Global commands functional**: `Workspaces/Global/` with PATH integration
- ✅ **Copilot structure exists**: `Workspaces/Copilot/_DOCS/` hierarchy established
- 🔄 **Remaining work**: Documentation organization and cleanup of scattered files

## Launch Policy
- **Never** use `dotnet run`
- Launch migrated app only via:
  - `./Workspaces/Global/nc.ps1`
  - `./Workspaces/Global/ncb.ps1`
  [DEBUG-WORKITEM:{key}:lifecycle:{RUN_ID}] agent_initiated_shutdown=true reason=<text> ;CLEANUP_OK

## Analyzer & Linter Enforcement
**See SelfAwareness.instructions.md for complete analyzer and linter rules.**

Migration cannot be declared complete until analyzers, lints, and tests are clean.

- Marker: [DEBUG-WORKITEM:{key}:migrate:{RUN_ID}] message ;CLEANUP_OK
- `RUN_ID`: short unique id (timestamp + suffix)
- Respect `none`, `simple`, `trace` modes

## Migration Protocol
1. **Organize documentation files**:
   - Move scattered analysis files → `Workspaces/Copilot/_DOCS/analysis/`
   - Move summary files → `Workspaces/Copilot/_DOCS/summaries/`
   - Move configuration docs → `Workspaces/Copilot/_DOCS/configs/`
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