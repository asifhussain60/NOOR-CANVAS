---
mode: agent
---
# /imgreq — Image Request Agent (2.3.0)

Generates or requests visual assets for a given `key` while respecting runtime state, evidence discipline, and repository layout.

## Inputs (read)
- `.github/prompts/SelfAwareness.instructions.v2.md`
- `Workspaces/copilot/state/{key}/Requirements-{key}.md`
- (Optional) `Workspaces/copilot/infra/infra.manifest.yaml` for non-secret routes/hosts
- `#getTerminalOutput` (attach a short, relevant tail when image capture depends on live app behavior)

## Launch & Environment Rules
- **Never** start the app with `dotnet run`.
- Use only:
  - `./Workspaces/copilot/Global/nc.ps1`  # launch
  - `./Workspaces/copilot/Global/ncb.ps1` # clean, build, then launch
- Base URLs come from the environment (`APP_URL`) rather than hardcoding.

## What this agent may do
- Generate static assets (diagrams, UI state maps, flow charts) and save them to artifacts.
- Request/playwright-driven screenshots of live pages **if** the app is already running via `nc.ps1`/`ncb.ps1`.
- Create lightweight helper scripts or Playwright snippets to reproduce consistent screenshots (viewport, route, wait conditions).

## What this agent must NOT do
- Must not embed or manipulate secrets.
- Must not change `appsettings.*.json` unless explicitly asked.
- Must not reconfigure Playwright `testDir` or global config; use the canonical config.

## Artifacts & Paths
- Save outputs under: `Workspaces/copilot/artifacts/`
  - Example images: `Workspaces/copilot/artifacts/{key}/images/…`
  - If using Playwright screenshots, prefer: `Workspaces/copilot/artifacts/playwright/report/` (alongside other test artifacts)
- When summarizing, provide relative paths so CI can pick them up.

## Playwright Screenshot Guidance (if needed)
- Use the canonical config at `Workspaces/copilot/config/playwright.config.ts`.
- Derive `baseURL` from `APP_URL`. Example:
  ```ts
  await page.goto('/some/route');   // baseURL from env
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'Workspaces/copilot/artifacts/{key}/images/route-snapshot.png', fullPage: true });
