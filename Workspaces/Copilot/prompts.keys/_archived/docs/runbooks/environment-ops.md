# Environments & Databases — Runbook

This repo keeps **non-secret** infra identifiers in `Workspaces/copilot/infra/infra.manifest.yaml`.
App settings use `${VAR}` placeholders and resolve from env vars loaded by `ops/tasks/set-env.ps1`.

## Databases
- Default app DB: `NoorCanvas_*` (per env)
- **KSessionsDb** (content): name `KSESSIONS_*` (per env), server from manifest/env

## Connection Strings
`appsettings.*.json` contains:
- `ConnectionStrings:DefaultConnection` (primary app DB)
- `ConnectionStrings:KSessionsDb` (content DB — from your snippet)

**Your provided XML (for reference only):**
```
<add name="KSessionsDb" connectionString="Data Source=AHHOME;Initial Catalog=KSESSIONS_DEV;User Id=sa;Password={PWD};Connection Timeout=3600;MultipleActiveResultSets=true" providerName="System.Data.SqlClient" />
```
Equivalent env-driven JSON is already applied.

## Playwright
- Config: `Workspaces/copilot/config/playwright.config.ts`
- `testDir`: `Workspaces/copilot/Tests/Playwright`
- Artifacts: `Workspaces/copilot/artifacts/playwright/report`
- Base URL from `APP_URL` env var; override with `APP_URL=http://host:port`.
- Tag tests with `@{key}` (e.g., `@hostcanvas`) and filter via `PW_GREP='@hostcanvas'`.

## Launchers
- `Workspaces/copilot/Global/nc.ps1` — launch only
- `Workspaces/copilot/Global/ncb.ps1` — clean, build, then launch
