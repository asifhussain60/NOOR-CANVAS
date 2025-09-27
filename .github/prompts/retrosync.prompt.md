---
mode: agent
---
title: retrosync — Requirements & Reality Reconciler
version: 2.8.0
appliesTo: /retrosync
updated: 2025-09-27
---
# /retrosync — Requirements & Reality Reconciler (v2.8.0)

Keeps requirements, implementation, and tests in sync for a given `{key}`, without external trackers. Operates entirely inside the canonical key layout.

## Parameters
- **key:** identifier for this work stream (e.g., `vault`)
- **log:** controls debug logging behavior for this run
  - `none`   → (default) no debug logging
  - `simple` → add debug logging only for critical checks and lifecycle events
  - `trace`  → add debug logging for every step so the agent can reconstruct the full reconciliation flow

## Inputs (read)
- `.github/prompts/SelfAwareness.instructions.md`
- `Workspaces/Copilot/prompts.keys/{key}/workitem/Requirements-{key}.md`
- `Workspaces/Copilot/prompts.keys/{key}/workitem/SelfReview-{key}.md` (rolling log)
- `Workspaces/Copilot/prompts.keys/{key}/workitem/Cleanup-{key}.md` (optional overrides)
- Tests under: `Workspaces/Copilot/prompts.keys/{key}/tests/`
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
- `{layer}` values: `retrosync` (reconciliation), `tests`, `lifecycle`
- `RUN_ID` is a short unique id for this run (timestamp + short suffix).
- Behavior by mode:
  - **none**: do not insert debug lines.
  - **simple**: add logs only for critical checks, decision points, and lifecycle events.
  - **trace**: log every step of the reconciliation process.

## Testing & Node.js Context
- The NOOR Canvas application is **ASP.NET Core 8.0 + Blazor Server + SignalR**.  
- Node.js is **test-only**: used exclusively for Playwright E2E tests.  
- Retrosync validates coverage by comparing requirements → Playwright tests, but must never confuse Node.js with app logic.  
- Playwright setup: `playwright.config.js`, `PlayWright/Tests/global-setup.ts`, and `Tests/*.spec.ts`.

## Protocol
1. Parse requirements from `Requirements-{key}.md`.
2. Cross-check against tests in `prompts.keys/{key}/tests/`.
3. Identify gaps: missing coverage, ambiguous specs, or failing tests.
4. Plan minimal deltas (new/updated specs or requirement clarifications).
5. Apply iteratively:
   - Add/update one spec at a time.
   - Run cumulative tests (spec1 → spec1+spec2 → …).
   - Fix failures before moving on.
6. Update `SelfReview-{key}.md` with coverage matrix and evidence.
7. Write immutable snapshot into `reviews/` with timestamped filename.

## Terminal Evidence
- Always include a short tail (10–20 lines) from #getTerminalOutput in summaries.
- If you initiated lifecycle actions, include the self-attribution line.

## Outputs
- Coverage matrix: requirement → spec(s) → status
- Specs added/updated
- Tests run and results
- Terminal Evidence tail
- Updated rolling `SelfReview-{key}.md`
- New snapshot in `reviews/`
- Next steps for full coverage

## Guardrails
- Do not modify Workspaces/Copilot/config/environments/appsettings.*.json or any secrets unless explicitly requested.
- Respect canonical layout: all key-scoped work in prompts.keys/{key}/workitem/ and prompts.keys/{key}/tests/.
- Do not create new roots outside Workspaces/Copilot/ (except .github/).
