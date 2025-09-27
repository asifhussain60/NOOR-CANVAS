---
mode: agent
---
---
title: imgreq — Image Request Agent
version: 2.8.0
appliesTo: /imgreq
updated: 2025-09-27
---
# /imgreq — Image Request Agent (v2.8.0)

Generates or captures visual artifacts (diagrams, screenshots, flows) for a given `{key}`, with structured debug logging and terminal-grounded evidence.

## Parameters
- **key:** identifier for this work stream (e.g., `vault`)
- **log:** controls debug logging behavior for this run
  - `none`   → (default) no debug logging
  - `simple` → add debug logging for critical capture points and lifecycle events
  - `trace`  → add debug logging for every capture step (navigation, waits, saves)

## Inputs (read)
- `.github/prompts/SelfAwareness.instructions.md`
- `Workspaces/Copilot/prompts.keys/{key}/workitem/Requirements-{key}.md`
- (Optional, read-only) `Workspaces/Copilot/infra/infra.manifest.yaml` for non-secret routes/hosts
- `#getTerminalOutput` and `#terminalLastCommand` for runtime evidence

## Launch Policy
- **Never** use `dotnet run` or `cd "…NoorCanvas" && dotnet run`.
- Only use:
  - `./Workspaces/Copilot/Global/nc.ps1`  # launch
  - `./Workspaces/Copilot/Global/ncb.ps1` # clean, build, then launch
- If you stop or restart the app, self-attribute it:
  [DEBUG-WORKITEM:{key}:imgreq:{RUN_ID}] agent_initiated_shutdown=true reason=<text> ;CLEANUP_OK

## Debug Logging Rules
- All debug lines must use the consistent marker:
  [DEBUG-WORKITEM:{key}:{layer}:{RUN_ID}] message ;CLEANUP_OK
- `{layer}` values: `imgreq` (image/screenshot generation), `lifecycle`
- `RUN_ID` is a short unique id for this run (timestamp + random suffix).
- Behavior by mode:
  - **none**: do not insert debug lines.
  - **simple**: add logs for capture start/end and errors.
  - **trace**: log every navigation, wait, and screenshot event.

## Artifact Rules
- Generated images must be saved under:
  Workspaces/Copilot/artifacts/{key}/images/
- Playwright screenshots (if used) must save into:
  Workspaces/Copilot/artifacts/playwright/report/
- Always report relative paths in summaries.

## Node.js & Testing Context
- Node.js is **test-only**: used exclusively for Playwright E2E tests.  
- Imgreq may invoke Playwright for screenshots, but must never assume Node.js is part of the app.  
- The production stack remains **ASP.NET Core 8.0 + Blazor Server + SignalR**.

## Playwright Screenshot Guidance
- Config: Workspaces/Copilot/config/playwright.config.ts
  - baseURL from APP_URL (never hardcode URLs)
- Example pattern:
  ```ts
  await page.goto('/route'); 
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'Workspaces/Copilot/artifacts/{key}/images/route.png', fullPage: true });
