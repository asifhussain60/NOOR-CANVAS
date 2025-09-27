---
mode: agent
---
---
title: workitem — Implementation Agent
version: 2.8.0
appliesTo: /workitem
updated: 2025-09-27
---
# /workitem — Implementation Agent (v2.8.0)

Implements scoped changes for a given `{key}` and stabilizes them with cumulative Playwright tests, structured debug logs, and terminal-grounded evidence.

## Parameters
- **key:** identifier for this work stream (e.g., `vault`)
- **log:** controls debug logging behavior for this run
  - `none`   → (default) no debug logging
  - `simple` → add debug logging only for critical checks and lifecycle events
  - `trace`  → add debug logging for every step so the agent can reconstruct the full flow

## Inputs (read)
- `.github/prompts/SelfAwareness.instructions.md`
- `Workspaces/Copilot/prompts.keys/{key}/workitem/Requirements-{key}.md`
- `Workspaces/Copilot/prompts.keys/{key}/workitem/SelfReview-{key}.md`
- `Workspaces/Copilot/prompts.keys/{key}/workitem/Cleanup-{key}.md` (optional overrides)
- (Optional, read-only) `Workspaces/Copilot/infra/infra.manifest.yaml` for non-secret endpoints/DB names
- `#getTerminalOutput` and `#terminalLastCommand` for runtime evidence

## Launch Policy
- **Never** use `dotnet run` or `cd "…NoorCanvas" && dotnet run`.
- Only use:
  - `./Workspaces/Copilot/Global/nc.ps1`  # launch
  - `./Workspaces/Copilot/Global/ncb.ps1` # clean, build, then launch
- If you stop or restart the app, self-attribute it:
  [DEBUG-WORKITEM:{key}:lifecycle:{RUN_ID}] agent_initiated_shutdown=true reason=<text> ;CLEANUP_OK

## Debug Logging Rules
- All debug lines must use the consistent marker:
  [DEBUG-WORKITEM:{key}:{layer}:{RUN_ID}] message ;CLEANUP_OK
- `{layer}` values: `impl` (implementation), `tests` (test execution), `lifecycle` (start/stop events)
- `RUN_ID` is a short unique id for this run (timestamp + random suffix).
- Behavior by mode:
  - **none**: do not insert debug lines.
  - **simple**: add logs only for critical checks, decision points, and lifecycle events.
  - **trace**: log every step of the flow, including intermediate calculations, branching decisions, and results.

## Testing & Node.js Context
- The NOOR Canvas application is **ASP.NET Core 8.0 + Blazor Server + SignalR**.  
- Node.js is **test-only**: used exclusively for Playwright E2E tests.  
- Tests run against the running .NET app at `https://localhost:9091`.  
- Playwright configuration is defined in `playwright.config.js`, with setup in `PlayWright/Tests/global-setup.ts`, and test files in `Tests/*.spec.ts`.  
- Node.js is never part of the production stack.

## Implementation Protocol
- Make one change at a time; commit the smallest viable increment.
- After each change, run the relevant Playwright specs tied to this `{key}`.
- Insert only temporary diagnostics marked with ;CLEANUP_OK (safe for cleanup).
- Debug logging must respect the chosen `log` mode.

## Iterative Testing
- Specs must live under:
  Workspaces/Copilot/prompts.keys/{key}/tests/
- Global config: Workspaces/Copilot/config/playwright.config.ts must set:
  - testDir: "Workspaces/Copilot/prompts.keys/{key}/tests"
  - baseURL from APP_URL (never hardcode URLs)
  - HTML report to Workspaces/Copilot/artifacts/playwright/report
- Follow Iterative Accumulation:
  1. Implement change + spec; run spec1
  2. Add second change + spec; run spec1+spec2
  3. Add third change + spec; run spec1+spec2+spec3
  … continue until all are green.

## Terminal Evidence (mandatory)
- Before/after significant steps, capture a short tail (10–20 lines) from #getTerminalOutput and include it in the summary’s Terminal Evidence section.
- Do not claim shutdowns without proof. If you initiated it, show the self-attribution line.

## Output & Approval Flow
- Summaries must include:
  - What changed and why
  - Files changed
  - Tests added/updated and their current pass/fail state
  - Terminal Evidence tail
- Do not ask the user for approval until all identified tests for this key are green.
- After a fully green run, prompt the user for one manual run, then request approval to mark complete.

## Guardrails
- Do not modify Workspaces/Copilot/config/environments/appsettings.*.json or any secrets unless explicitly requested.
- Respect canonical layout: all key-scoped work in prompts.keys/{key}/workitem/ and prompts.keys/{key}/tests/.
- Do not create new roots outside Workspaces/Copilot/ (except .github/).
