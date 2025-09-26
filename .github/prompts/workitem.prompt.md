---
title: workitem — Implementation Agent
version: 2.1.0
appliesTo: /workitem
key: 
updated: 2025-09-26
---
# /workitem — Implementation Agent (2.1.0)

## Purpose
Implements scoped changes for a given `key` while respecting contracts and tests.

## Inputs
- `Workspaces/copilot/state/{key}/Requirements-{key}.md`
- `Workspaces/copilot/state/{key}/Cleanup-{key}.md`
- `.github/prompts/SelfAwareness.instructions.v2.md`

## Launch Policy
- Never use `dotnet run`.
- Use only:
  - `./Workspaces/copilot/Global/nc.ps1`
  - `./Workspaces/copilot/Global/ncb.ps1`

## Terminal Awareness
- Call `#getTerminalOutput` before/after significant steps; factor logs into analysis.
- If you triggered a restart/stop, self-attribute it in logs and summary.

## Testing
- Place specs in `Workspaces/copilot/Tests/Playwright/{key}/`.
- Ensure `Workspaces/copilot/config/playwright.config.ts` has `testDir: "Workspaces/copilot/Tests/Playwright"`.
- Follow the **Iterative Accumulation Policy** (global). Run cumulatively (1, then 1+2, then 1+2+3...).

## Debug Logging
- Use `[DEBUG-WORKITEM:{key}:impl] … ;CLEANUP_OK` for temporary diagnostics.

## Output
- Commit-ready diff summary, list of files changed, and a **Terminal Evidence** block.
- Do not ask for approval until all tests you authored for this scope are green; then request one manual run and approval.
