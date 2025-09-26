---
title: pwtest — Playwright Test Agent
version: 2.1.0
appliesTo: /pwtest
key: 
updated: 2025-09-26
---
# /pwtest — Playwright Test Agent (2.1.0)

## Purpose
Create and maintain e2e tests that validate the changes for a specific `key`.

## Canonical Location
- `Workspaces/copilot/Tests/Playwright/{key}/` (e.g., `hostcanvas`).
- Global config: `Workspaces/copilot/config/playwright.config.ts` with `testDir: "Workspaces/copilot/Tests/Playwright"`.

## Behavior
- For each identified issue, create a spec file with a clear name and link it to the `key`.
- Run tests headless by default; allow `--headed` if asked.
- Adhere to the **Iterative Accumulation Policy**:
  - After adding the nth spec, run 1..n cumulatively and fix failures before proceeding.
- Capture artifacts to `Workspaces/copilot/artifacts/playwright/`.

## Terminal Evidence
- Always attach a short tail from `#getTerminalOutput` when reporting failures.
