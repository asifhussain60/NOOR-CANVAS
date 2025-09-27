---
mode: agent
---
title: cleanup — Cleanup Agent
version: 2.7.0
appliesTo: /cleanup
updated: 2025-09-27
---

# /cleanup — Cleanup Agent (v2.7.0)


## Parameters
- **key:** identifier for this work stream (e.g., `vault`)

## Inputs (read)
- `.github/prompts/SelfAwareness.instructions.md`
- `Workspaces/Copilot/prompts.keys/{key}/workitem/Cleanup-{key}.md` (if exists)
- Requirements, self-review, and test files for `{key}`
- `#getTerminalOutput` and `#terminalLastCommand`

## Launch Policy
- **Never** use `dotnet run`
- Only launch via:
  - `./Workspaces/Copilot/Global/nc.ps1`
  - `./Workspaces/Copilot/Global/ncb.ps1`
  [DEBUG-WORKITEM:{key}:lifecycle:{RUN_ID}] agent_initiated_shutdown=true reason=<text> ;CLEANUP_OK

## Analyzer & Linter Enforcement
Cleanup cannot complete until analyzers and lints are clean:
- Run `dotnet build --no-restore --warnaserror` → must succeed with 0 warnings
- Run `npm run lint` → must pass with 0 warnings
- Run `npm run format:check` → must pass with 0 formatting issues

- Use marker: [DEBUG-WORKITEM:{key}:cleanup:{RUN_ID}] message ;CLEANUP_OK
- `RUN_ID`: short unique id (timestamp + suffix)
- Respect `none`, `simple`, `trace` modes

## Cleanup Protocol
2. Remove unused files, obsolete artifacts, and redundant snapshots
3. Simplify duplicate/unreferenced code
4. Normalize formatting to project standards (Prettier for Playwright, StyleCop for C#)
5. Validate results with analyzers and lints
6. Run cumulative test suite for `{key}` to ensure no regressions

## Iterative Validation
- After each cleanup pass:
  - Run analyzers
  - Run lints
  - Run tests
- Repeat until no warnings, lints, or failures remain

## Terminal Evidence
- Capture 10–20 lines from `#getTerminalOutput` showing analyzer/linter/test status
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
- Do not remove requirement or test files unless explicitly orphaned and confirmed
- Do not modify `appsettings.*.json` or secrets
- Keep all `{key}`-scoped files in their directories
- Do not create new roots outside `Workspaces/Copilot/` (except `.github/`)

# Variable Cleanup
- Remove unused variables and their references entirely.
- Do not silence warnings by adding underscores.


# TypeScript Cleanup
- Replace all implicit or explicit `any` types with proper TypeScript types.
- Prefer Node.js and Playwright native types (e.g., IncomingMessage, Page).


# Import Rules
- Enforce ES6 import/export syntax only.
- Remove all CommonJS `require()` usage.


# Cleanup Progress Tracking
- Track cleanup in structured phases (warnings → errors → formatting → validation).
- Report progress with counts of fixed vs remaining issues.
