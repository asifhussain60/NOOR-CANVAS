---
mode: agent
---
---
title: pwtest — Playwright Test Agent
version: 2.8.0
appliesTo: /pwtest
updated: 2025-09-27
---
# /pwtest — Playwright Test Agent (v2.8.0)

Creates and maintains Playwright tests for a given `{key}`. Tests validate implementation changes iteratively with cumulative runs, structured debug logging, and terminal-grounded evidence.

## Parameters
- **key:** identifier for this work stream (e.g., `vault`)
- **log:** controls debug logging behavior for this run
  - `none`   → (default) no debug logging
  - `simple` → add debug logging only for critical checks and lifecycle events
  - `trace`  → add debug logging for every test step so failures can be reconstructed fully

## Inputs (read)
- `.github/prompts/SelfAwareness.instructions.md`
- `Workspaces/Copilot/prompts.keys/{key}/workitem/Requirements-{key}.md`
- `Workspaces/Copilot/prompts.keys/{key}/workitem/SelfReview-{key}.md`
- Tests under: `Workspaces/Copilot/prompts.keys/{key}/tests/`
- `#getTerminalOutput` and `#terminalLastCommand` for runtime evidence

## Node.js Usage in NOOR Canvas
- Node.js is used **exclusively** for Playwright testing.  
- The core NOOR Canvas application is **not Node.js-based** — it’s ASP.NET Core 8.0 with Blazor Server + SignalR.  
- Node.js provides:
  - Playwright framework (configured in `playwright.config.js`)
  - Global setup in `PlayWright/Tests/global-setup.ts`
  - TypeScript test files under `Tests/`
  - Dependencies managed in `package.json`
- Node.js is a **development dependency only**; production stack is entirely .NET.

## Playwright Configuration Summary
- **Main Config:** `./playwright.config.js`
  - TestDir: `Tests`
  - BaseURL: `https://localhost:9091`
  - Browsers: Chromium, Firefox, WebKit
  - Parallel execution with HTML reporter
  - Retries: 2 (CI), 0 (local)
- **Global Setup:** `./PlayWright/Tests/global-setup.ts`
  - Validates https://localhost:9091/api/healthcheck
  - Retries: 5 attempts, 2s delays
- **Package Config:** `./package.json`
  - Playwright v1.40.0
  - Scripts: `test`, `test:headed`, `test:debug`, `report`
- **Test Files:** `Tests/*.spec.ts`
  - Example: `host-experience.spec.ts`
  - Purpose: E2E validation of Blazor Server UI across browsers.

## Launch Policy
- **Never** use `dotnet run` or `cd "…NoorCanvas" && dotnet run`.
- Only use:
  - `./Workspaces/Copilot/Global/nc.ps1`  # launch
  - `./Workspaces/Copilot/Global/ncb.ps1` # clean, build, then launch
- If you stop or restart the app, self-attribute it:
  [DEBUG-WORKITEM:{key}:pwtest:{RUN_ID}] agent_initiated_shutdown=true reason=<text> ;CLEANUP_OK

## Debug Logging Rules
- All debug lines must use the consistent marker:
  [DEBUG-WORKITEM:{key}:{layer}:{RUN_ID}] message ;CLEANUP_OK
- `{layer}` values: `pwtest` (test execution), `lifecycle`
- `RUN_ID` is a short unique id for this run (timestamp + random suffix).
- Behavior by mode:
  - **none**: do not insert debug lines.
  - **simple**: add logs for major test milestones (start, pass/fail, teardown).
  - **trace**: log each navigation, selector wait, assertion, and artifact save.

## Test Authoring Rules
- Specs must live under:
  Workspaces/Copilot/prompts.keys/{key}/tests/
- Global config: Workspaces/Copilot/config/playwright.config.ts must set:
  - testDir: "Workspaces/Copilot/prompts.keys/{key}/tests"
  - baseURL from APP_URL (never hardcode URLs)
  - HTML report to Workspaces/Copilot/artifacts/playwright/report
- Each spec:
  - Focus on one concern per file
  - Use top-level describe with `@{key}` tag for filtering
  - Add secondary tags if needed for filtering subsets

## Iterative Accumulation
- Add one spec at a time.
- Run the new spec → then run all prior + new cumulatively (spec1 → spec1+spec2 → …).
- Fix failures before moving to the next test.

## Terminal Evidence (mandatory)
- Always include a short tail (10–20 lines) from #getTerminalOutput relevant to the test run.
- Show self-attribution line if lifecycle events were triggered.

## Outputs
- Specs created/updated
- Test run results
- Artifacts (HTML report, traces, screenshots)
- Debug logs (mode-dependent)
- Terminal Evidence tail

## Guardrails
- Do not modify Workspaces/Copilot/config/environments/appsettings.*.json or any secrets unless explicitly requested.
- Respect canonical layout: all key-scoped work in prompts.keys/{key}/workitem/ and prompts.keys/{key}/tests/.
- Do not create new roots outside Workspaces/Copilot/ (except .github/).
