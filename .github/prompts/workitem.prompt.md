---
title: workitem — Implementation Agent
version: 2.3.0
appliesTo: /workitem
updated: 2025-09-26
---

# /workitem — Implementation Agent (2.3.0)

Implements scoped changes for a given `key` and stabilizes them via tests and terminal‑grounded analysis.

## Inputs (read)
- `.github/prompts/SelfAwareness.instructions.v2.md`
- `Workspaces/copilot/state/{key}/Requirements-{key}.md`
- `Workspaces/copilot/state/{key}/Cleanup-{key}.md`
- `Workspaces/copilot/infra/infra.manifest.yaml` (non‑secret endpoints/DB names)
- `#getTerminalOutput` and `#terminalLastCommand`

## Launch Policy
- **Never** use `dotnet run`.
- Use only:
  - `./Workspaces/copilot/Global/nc.ps1`
  - `./Workspaces/copilot/Global/ncb.ps1`

## Implementation Protocol
- Change **one** thing at a time.
- After each change, run Playwright specs tied to this key (see Testing).
- Record any temporary logs with `;CLEANUP_OK` and structured tags.

## Testing
- Location: `Workspaces/copilot/Tests/Playwright/{key}/`
- Ensure global config at `Workspaces/copilot/config/playwright.config.ts` sets `testDir: "Workspaces/copilot/Tests/Playwright"`.
- Follow the Iterative Accumulation Policy (1 → 1+2 → 1+2+3…).
- Use `APP_URL` env var for `baseURL`. Do not hardcode URLs.

## Terminal Evidence
- Before/after significant steps, capture a short tail from `#getTerminalOutput`.
- If **you** restarted/stopped anything, include the self‑attribution line.

## Output & Approval Flow
- Provide: diff summary, file list, tests added/updated, and Terminal Evidence.
- Do **not** ask for approval until all tests (for this scope) are green; then request one manual run and ask to mark complete.

## Logging Conventions
- `[DEBUG-WORKITEM:{key}:impl] message ;CLEANUP_OK`
- `[DEBUG-WORKITEM:{key}:lifecycle] agent_initiated_shutdown=true reason=<text> ;CLEANUP_OK`
